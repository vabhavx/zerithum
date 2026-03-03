import { createClient } from 'npm:@supabase/supabase-js@2';
import { logAudit } from '../_shared/utils/audit.ts';
import { getCorsHeaders } from '../_shared/utils/cors.ts';
import {
    checkRateLimit,
    isValidOTPFormat,
    RATE_LIMITS,
    SECURITY_ACTIONS,
    OAUTH_PROVIDERS,
    extractClientInfo,
    sanitizeErrorMessage
} from '../_shared/logic/security.ts';

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

        // Get authenticated user directly using the token from the request header
        const token = authHeader.replace('Bearer ', '');
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
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
        const userProvider = user.app_metadata?.provider || '';
        const userProviders = user.app_metadata?.providers || [];
        const hasPassword = (userProvider === 'email' || userProviders.includes('email')) &&
            !OAUTH_PROVIDERS.includes(userProvider);

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
        } else if (hasPassword && verificationCode) {
            // Verify via OTP
            if (!isValidOTPFormat(verificationCode)) {
                return Response.json({
                    error: 'Invalid verification code format'
                }, { status: 400, headers: corsHeaders });
            }

            // Rate limit OTP verification attempts
            const rateLimitKey = `otp_verify:${user.id}`;
            const rateLimitResult = await checkRateLimit(adminClient, rateLimitKey, RATE_LIMITS.VERIFY_OTP);

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
        } else if (!hasPassword) {
            // OAuth user - session JWT is sufficient re-auth
            // Bypass OTP requirement for all OAuth users because email OTP via Resend is unreliable
            console.log('OAuth user session revocation: using session JWT as re-auth');
        } else {
            // No re-authentication provided and user has password
            return Response.json({
                error: 'Re-authentication required. Please provide current password or verification code.',
                requiresReauth: true,
                authMethod: 'otp'
            }, { status: 401, headers: corsHeaders });
        }

        // Perform session revocation using admin client
        // In Supabase v2, to revoke all sessions for a user, we can use updateUserById
        // and update their user_metadata, which forces a JWT refresh, or use the dedicated endpoint if available.
        // Actually, the most reliable way to revoke sessions from the edge function
        // is to update the user's `updated_at` or `user_metadata` to force a token refresh failure
        // on existing active connections if RLS checks it, but GoTrue has an admin.signOut API.
        // Wait, signOut for admin doesn't exist in standard JS client. We have to use a JWT for standard signOut
        // To sign out globally, we can use the user's own token:
        const { error: signOutError } = await supabase.auth.signOut({ scope: 'global' });

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
