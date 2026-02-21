import { createClient } from 'npm:@supabase/supabase-js@2';
import { logAudit } from './utils/audit.ts';
import { getCorsHeaders } from './utils/cors.ts';
import {
    checkRateLimit,
    isValidOTPFormat,
    RATE_LIMITS,
    SECURITY_ACTIONS,
    extractClientInfo,
    sanitizeErrorMessage
} from './logic/security.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
    const corsHeaders = getCorsHeaders(req);

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
        let body: { currentPassword?: string; verificationCode?: string };
        try {
            body = await req.json();
        } catch {
            body = {};
        }

        const { currentPassword, verificationCode } = body;

        // Determine auth method and verify re-authentication
        const hasPassword = user.app_metadata?.provider === 'email' ||
            user.app_metadata?.providers?.includes('email');

        const adminClient = createClient(supabaseUrl, supabaseServiceKey);

        if (hasPassword && currentPassword) {
            // Verify via password - try to sign in with email/password
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email!,
                password: currentPassword
            });

            if (signInError) {
                await logAudit(null, {
                    action: SECURITY_ACTIONS.SESSIONS_REVOKE_FAILED,
                    actor_id: user.id,
                    status: 'failure',
                    details: { reason: 'invalid_password', ...clientInfo }
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

            // Rate limit OTP verification attempts
            const rateLimitKey = `otp_verify:${user.id}`;
            const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.VERIFY_OTP);

            if (!rateLimitResult.allowed) {
                return Response.json({
                    error: 'Too many verification attempts. Please request a new code.',
                    retryAfter: Math.ceil((rateLimitResult.resetAt.getTime() - Date.now()) / 1000)
                }, { status: 429, headers: corsHeaders });
            }

            // Check verification code
            const { data: codeData, error: codeError } = await adminClient
                .from('verification_codes')
                .select('*')
                .eq('user_id', user.id)
                .eq('code', verificationCode)
                .eq('purpose', 'revoke_sessions')
                .is('used_at', null)
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (codeError || !codeData) {
                await logAudit(null, {
                    action: SECURITY_ACTIONS.OTP_VERIFICATION_FAILED,
                    actor_id: user.id,
                    status: 'failure',
                    details: { reason: 'invalid_or_expired_code', ...clientInfo }
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

            await logAudit(null, {
                action: SECURITY_ACTIONS.OTP_VERIFIED,
                actor_id: user.id,
                status: 'success',
                details: { purpose: 'revoke_sessions', ...clientInfo }
            });
        } else {
            // No re-authentication provided
            return Response.json({
                error: 'Re-authentication required. Please provide current password or verification code.',
                requiresReauth: true,
                authMethod: hasPassword ? 'password' : 'otp'
            }, { status: 401, headers: corsHeaders });
        }

        // Perform session revocation using admin client
        // Sign out all sessions for the user
        const { error: signOutError } = await adminClient.auth.admin.signOut(
            user.id,
            'global' // This revokes all sessions globally
        );

        if (signOutError) {
            console.error('Failed to revoke sessions:', signOutError);

            await logAudit(null, {
                action: SECURITY_ACTIONS.SESSIONS_REVOKE_FAILED,
                actor_id: user.id,
                status: 'failure',
                details: {
                    error: sanitizeErrorMessage(signOutError),
                    ...clientInfo
                }
            });

            throw new Error('Failed to revoke sessions');
        }

        // Audit log success
        await logAudit(null, {
            action: SECURITY_ACTIONS.SESSIONS_REVOKED,
            actor_id: user.id,
            status: 'success',
            details: clientInfo
        });

        return Response.json({
            ok: true,
            message: 'All sessions have been revoked successfully'
        }, { headers: corsHeaders });

    } catch (error: any) {
        console.error('revokeAllSessions error:', error);

        await logAudit(null, {
            action: SECURITY_ACTIONS.SESSIONS_REVOKE_FAILED,
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
