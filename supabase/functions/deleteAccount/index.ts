import { createClient } from 'npm:@supabase/supabase-js@2';
import { logAudit } from '../_shared/utils/audit.ts';
import {
    checkRateLimit,
    isValidOTPFormat,
    RATE_LIMITS,
    SECURITY_ACTIONS,
    extractClientInfo,
    sanitizeErrorMessage,
    OAUTH_PROVIDERS
} from '../_shared/logic/security.ts';
import { revokeToken } from '../_shared/logic/revokeToken.ts';
import { getCorsHeaders } from '../_shared/utils/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Tables to delete user data from (in order)
// CRITICAL: sync_history.platform_id REFERENCES connected_platforms(id) ON DELETE CASCADE
// Therefore sync_history MUST be deleted BEFORE connected_platforms
const USER_DATA_TABLES = [
    'sync_history',           // MUST be first - has FK to connected_platforms
    'reconciliations',
    'autopsy_events',
    'insights',
    'expenses',
    'bank_transactions',
    'transactions',
    'revenue_transactions',
    'tax_profiles',
    'platform_connections',   // Legacy table
    'connected_platforms',    // MUST be after sync_history
    'verification_codes',
    'audit_log',              // Anonymize instead of delete
];

Deno.serve(async (req) => {
    const corsHeaders = getCorsHeaders(req);

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    let user: any = null;
    const clientInfo = extractClientInfo(req);
    let deletionRequestId: string | null = null;

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
            confirmationText: string;
            currentPassword?: string;
            verificationCode?: string;
        };
        try {
            body = await req.json();
        } catch {
            return Response.json({ error: 'Invalid JSON body' }, { status: 400, headers: corsHeaders });
        }

        const { confirmationText, currentPassword, verificationCode } = body;

        // Validate confirmation text
        if (confirmationText !== 'DELETE') {
            return Response.json({
                error: 'Please type DELETE to confirm account deletion'
            }, { status: 400, headers: corsHeaders });
        }

        const adminClient = createClient(supabaseUrl, supabaseServiceKey);

        // Check for existing deletion request (idempotency)
        const { data: existingRequest } = await adminClient
            .from('deletion_requests')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (existingRequest) {
            if (existingRequest.status === 'deleted') {
                return Response.json({
                    ok: true,
                    message: 'Account has already been deleted'
                }, { headers: corsHeaders });
            }
            if (existingRequest.status === 'processing') {
                // Check if it's been processing for more than 5 minutes (stale)
                const updatedAt = new Date(existingRequest.updated_at || existingRequest.created_at);
                const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
                if (updatedAt > fiveMinutesAgo) {
                    return Response.json({
                        error: 'Account deletion is already in progress'
                    }, { status: 409, headers: corsHeaders });
                }
                // Stale processing request - treat as failed and allow retry
                console.log('Found stale processing request, allowing retry:', existingRequest.id);
                await adminClient
                    .from('deletion_requests')
                    .update({ status: 'failed', last_error: 'Stale processing request - auto-recovered' })
                    .eq('id', existingRequest.id);
            }
            // If failed (or was stale), allow retry
            deletionRequestId = existingRequest.id;
        }

        // Rate limiting
        const rateLimitKey = `delete_account:${user.id}`;
        const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.DELETE_ACCOUNT);

        if (!rateLimitResult.allowed) {
            await logAudit(null, {
                action: SECURITY_ACTIONS.RATE_LIMIT_EXCEEDED,
                actor_id: user.id,
                status: 'warning',
                details: { action_type: 'delete_account', ...clientInfo }
            });

            return Response.json({
                error: 'Too many deletion attempts. Please wait before trying again.',
                retryAfter: Math.ceil((rateLimitResult.resetAt.getTime() - Date.now()) / 1000)
            }, { status: 429, headers: corsHeaders });
        }

        // Determine auth method and verify re-authentication
        // Check if user has password-based auth (email) vs OAuth (google, github, etc.)
        const userProvider = user.app_metadata?.provider || '';
        const userProviders = user.app_metadata?.providers || [];

        // User has password ONLY if they signed up with email AND are not using OAuth
        const hasPassword = (userProvider === 'email' || userProviders.includes('email')) &&
            !OAUTH_PROVIDERS.includes(userProvider);

        console.log('deleteAccount: User auth method:', {
            userId: user.id,
            provider: userProvider,
            providers: userProviders,
            hasPassword,
            hasCurrentPassword: !!currentPassword,
            hasVerificationCode: !!verificationCode
        });

        if (hasPassword && currentPassword) {
            // Verify via password
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email!,
                password: currentPassword
            });

            if (signInError) {
                console.error('Password verification failed:', signInError);
                await logAudit(null, {
                    action: SECURITY_ACTIONS.ACCOUNT_DELETE_FAILED,
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
                console.error('Invalid OTP format:', verificationCode);
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
                .eq('purpose', 'delete_account')
                .is('used_at', null)
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (codeError || !codeData) {
                console.error('OTP verification failed:', { codeError, hasCode: !!codeData });
                await logAudit(null, {
                    action: SECURITY_ACTIONS.ACCOUNT_DELETE_FAILED,
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
            console.log('No auth provided, requesting reauth. hasPassword:', hasPassword);
            return Response.json({
                error: 'Re-authentication required. Please provide current password or verification code.',
                requiresReauth: true,
                authMethod: hasPassword ? 'password' : 'otp'
            }, { status: 401, headers: corsHeaders });
        }

        // Audit: deletion requested
        await logAudit(null, {
            action: SECURITY_ACTIONS.ACCOUNT_DELETE_REQUESTED,
            actor_id: user.id,
            status: 'success',
            details: clientInfo
        });

        // Create or update deletion request
        const stepsCompleted: string[] = [];

        if (!deletionRequestId) {
            const { data: newRequest, error: createError } = await adminClient
                .from('deletion_requests')
                .insert({
                    user_id: user.id,
                    status: 'processing'
                })
                .select()
                .single();

            if (createError) {
                throw new Error('Failed to create deletion request');
            }
            deletionRequestId = newRequest.id;
        } else {
            await adminClient
                .from('deletion_requests')
                .update({ status: 'processing', last_error: null })
                .eq('id', deletionRequestId);
        }

        try {
            // Step 1: Revoke all sessions
            try {
                await adminClient.auth.admin.signOut(user.id, 'global');
                stepsCompleted.push('sessions_revoked');
            } catch (e) {
                console.error('Failed to revoke sessions:', e);
                // Continue anyway
            }

            // Step 2: Delete OAuth tokens from connected_platforms
            // (tokens are stored in oauth_token column)
            const { data: platforms } = await adminClient
                .from('connected_platforms')
                .select('platform, oauth_token, refresh_token, shop_name')
                .eq('user_id', user.id);

            if (platforms && platforms.length > 0) {
                const revokeCtx = {
                    envGet: (key: string) => Deno.env.get(key),
                    fetch: fetch,
                    logger: console
                };

                for (const p of platforms) {
                    if (!p.oauth_token) continue;
                    try {
                        console.log(`Revoking token for ${p.platform}`);
                        await revokeToken(revokeCtx, p.platform, p.oauth_token, p.refresh_token, p.shop_name);
                    } catch (e) {
                        console.error(`Error revoking token for ${p.platform}:`, e);
                    }
                }
                stepsCompleted.push('oauth_tokens_revoked');
            }

            // Step 3: Delete user data from all tables
            for (const table of USER_DATA_TABLES) {
                try {
                    if (table === 'audit_log') {
                        // Delete audit logs as requested (hard delete)
                        const { error } = await adminClient
                            .from(table)
                            .delete()
                            .eq('user_id', user.id);

                        if (error) {
                            console.error(`Failed to delete from ${table}:`, error);
                        } else {
                            stepsCompleted.push(`${table}_deleted`);
                        }
                    } else {
                        const { error } = await adminClient
                            .from(table)
                            .delete()
                            .eq('user_id', user.id);

                        if (error) {
                            console.error(`Failed to delete from ${table}:`, error);
                            // Critical tables failure should potentially stop the process
                            if (table === 'platform_connections' || table === 'connected_platforms') {
                                throw new Error(`Critical failure: Could not delete from ${table}: ${error.message}`);
                            }
                            stepsCompleted.push(`${table}_failed`);
                        } else {
                            stepsCompleted.push(`${table}_deleted`);
                        }
                    }
                } catch (e: any) {
                    console.error(`Error processing table ${table}:`, e);
                    if (table === 'platform_connections' || table === 'connected_platforms') {
                        throw e;
                    }
                }
            }

            // Step 4: Delete profile
            try {
                await adminClient
                    .from('profiles')
                    .delete()
                    .eq('id', user.id);
                stepsCompleted.push('profile_deleted');
            } catch (e) {
                console.error('Failed to delete profile:', e);
            }

            // Step 5: Delete user from auth.users
            const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(user.id);

            if (deleteUserError) {
                throw new Error('Failed to delete user account');
            }
            stepsCompleted.push('auth_user_deleted');

            // Mark deletion as complete
            await adminClient
                .from('deletion_requests')
                .update({
                    status: 'deleted',
                    completed_at: new Date().toISOString(),
                    steps_completed: stepsCompleted
                })
                .eq('id', deletionRequestId);

            // Final audit log (anonymized)
            await logAudit(null, {
                action: SECURITY_ACTIONS.ACCOUNT_DELETED,
                actor_id: null, // Anonymized
                status: 'success',
                details: {
                    deletion_request_id: deletionRequestId,
                    steps_completed: stepsCompleted,
                    ...clientInfo
                }
            });

            return Response.json({
                ok: true,
                message: 'Your account has been permanently deleted'
            }, { headers: corsHeaders });

        } catch (deletionError: any) {
            // Mark deletion as failed
            await adminClient
                .from('deletion_requests')
                .update({
                    status: 'failed',
                    last_error: sanitizeErrorMessage(deletionError),
                    steps_completed: stepsCompleted
                })
                .eq('id', deletionRequestId);

            throw deletionError;
        }

    } catch (error: any) {
        console.error('deleteAccount error:', error);

        await logAudit(null, {
            action: SECURITY_ACTIONS.ACCOUNT_DELETE_FAILED,
            actor_id: user?.id,
            status: 'failure',
            details: {
                error: sanitizeErrorMessage(error),
                deletion_request_id: deletionRequestId,
                ...clientInfo
            }
        });

        return Response.json({
            error: sanitizeErrorMessage(error)
        }, { status: 500, headers: corsHeaders });
    }
});
