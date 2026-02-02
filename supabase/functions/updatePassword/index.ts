import { createClient } from 'npm:@supabase/supabase-js@2';
import { logAudit } from '../_shared/utils/audit.ts';
import {
    validatePassword,
    checkRateLimit,
    isValidOTPFormat,
    RATE_LIMITS,
    SECURITY_ACTIONS,
    extractClientInfo,
    sanitizeErrorMessage
} from '../_shared/logic/security.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    let user: any = null;
    const clientInfo = extractClientInfo(req);

    try {
        // Create client with user's token for auth
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            global: { headers: { Authorization: authHeader } }
        });

        // Get authenticated user
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser) {
            return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
        }
        user = authUser;

        // Parse request body
        let body: {
            currentPassword?: string;
            newPassword: string;
            verificationCode?: string;
        };
        try {
            body = await req.json();
        } catch {
            return Response.json({ error: 'Invalid JSON body' }, { status: 400, headers: corsHeaders });
        }

        const { currentPassword, newPassword, verificationCode } = body;

        // Validate new password
        if (!newPassword) {
            return Response.json({ error: 'New password is required' }, { status: 400, headers: corsHeaders });
        }

        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.valid) {
            return Response.json({
                error: passwordValidation.errors[0],
                errors: passwordValidation.errors,
                strength: passwordValidation.strength
            }, { status: 400, headers: corsHeaders });
        }

        // Rate limiting
        const rateLimitKey = `password_change:${user.id}`;
        const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.PASSWORD_CHANGE);

        if (!rateLimitResult.allowed) {
            await logAudit(null, {
                action: SECURITY_ACTIONS.RATE_LIMIT_EXCEEDED,
                actor_id: user.id,
                status: 'warning',
                details: { action_type: 'password_change', ...clientInfo }
            });

            return Response.json({
                error: 'Too many password change attempts. Please wait before trying again.',
                retryAfter: Math.ceil((rateLimitResult.resetAt.getTime() - Date.now()) / 1000)
            }, { status: 429, headers: corsHeaders });
        }

        // Audit: attempt started
        await logAudit(null, {
            action: SECURITY_ACTIONS.PASSWORD_CHANGE_ATTEMPT,
            actor_id: user.id,
            status: 'success',
            details: clientInfo
        });

        // Determine auth method and verify re-authentication
        const hasPassword = user.app_metadata?.provider === 'email' ||
            user.app_metadata?.providers?.includes('email');

        const adminClient = createClient(supabaseUrl, supabaseServiceKey);

        if (hasPassword && currentPassword) {
            // Verify via password
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email!,
                password: currentPassword
            });

            if (signInError) {
                await logAudit(null, {
                    action: SECURITY_ACTIONS.PASSWORD_CHANGE_FAILED,
                    actor_id: user.id,
                    status: 'failure',
                    details: { reason: 'invalid_current_password', ...clientInfo }
                });

                return Response.json({
                    error: 'Current password is incorrect'
                }, { status: 401, headers: corsHeaders });
            }
        } else if (verificationCode) {
            // Verify via OTP
            if (!isValidOTPFormat(verificationCode)) {
                return Response.json({
                    error: 'Invalid verification code format'
                }, { status: 400, headers: corsHeaders });
            }

            // Check verification code
            const { data: codeData, error: codeError } = await adminClient
                .from('verification_codes')
                .select('*')
                .eq('user_id', user.id)
                .eq('code', verificationCode)
                .eq('purpose', 'password_change')
                .is('used_at', null)
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (codeError || !codeData) {
                await logAudit(null, {
                    action: SECURITY_ACTIONS.PASSWORD_CHANGE_FAILED,
                    actor_id: user.id,
                    status: 'failure',
                    details: { reason: 'invalid_verification_code', ...clientInfo }
                });

                return Response.json({
                    error: 'Invalid or expired verification code'
                }, { status: 401, headers: corsHeaders });
            }

            // Mark code as used
            await adminClient
                .from('verification_codes')
                .update({ used_at: new Date().toISOString() })
                .eq('id', codeData.id);
        } else {
            // No re-authentication provided
            return Response.json({
                error: 'Re-authentication required. Please provide current password or verification code.',
                requiresReauth: true,
                authMethod: hasPassword ? 'password' : 'otp'
            }, { status: 401, headers: corsHeaders });
        }

        // Update password using admin client
        const { error: updateError } = await adminClient.auth.admin.updateUserById(
            user.id,
            { password: newPassword }
        );

        if (updateError) {
            console.error('Failed to update password:', updateError);

            await logAudit(null, {
                action: SECURITY_ACTIONS.PASSWORD_CHANGE_FAILED,
                actor_id: user.id,
                status: 'failure',
                details: {
                    reason: 'update_failed',
                    error: sanitizeErrorMessage(updateError),
                    ...clientInfo
                }
            });

            throw new Error('Failed to update password');
        }

        // Revoke all sessions after password change
        try {
            await adminClient.auth.admin.signOut(user.id, 'global');
        } catch (signOutError) {
            console.error('Failed to revoke sessions after password change:', signOutError);
            // Don't fail the request, password was already changed
        }

        // Audit log success
        await logAudit(null, {
            action: SECURITY_ACTIONS.PASSWORD_CHANGED,
            actor_id: user.id,
            status: 'success',
            details: {
                sessions_revoked: true,
                password_strength: passwordValidation.strength,
                ...clientInfo
            }
        });

        return Response.json({
            ok: true,
            message: 'Password updated successfully. You will be signed out from all devices.',
            sessionsRevoked: true
        }, { headers: corsHeaders });

    } catch (error: any) {
        console.error('updatePassword error:', error);

        await logAudit(null, {
            action: SECURITY_ACTIONS.PASSWORD_CHANGE_FAILED,
            actor_id: user?.id,
            status: 'failure',
            details: {
                error: sanitizeErrorMessage(error),
                ...clientInfo
            }
        });

        return Response.json({
            error: sanitizeErrorMessage(error)
        }, { status: 500, headers: corsHeaders });
    }
});
