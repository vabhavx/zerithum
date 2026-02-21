import { createClient, User } from 'npm:@supabase/supabase-js@2';
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
import { revokeToken, RevokeContext } from './logic/revokeToken.ts';
import { getCorsHeaders } from '../_shared/utils/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Tables to delete user data from (in order of dependency)
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
    'audit_log',
];

Deno.serve(async (req) => {
    const corsHeaders = getCorsHeaders(req);

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    // Helper for SSE encoding
    const encoder = new TextEncoder();
    const formatEvent = (type: string, data: any) => {
        return encoder.encode(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    let user: User | null = null;
    const clientInfo = extractClientInfo(req);
    let deletionRequestId: string | null = null;

    // 1. Initial Verification Phase (Pre-Stream)
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            global: { headers: { Authorization: authHeader } }
        });

        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser) {
            return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
        }
        user = authUser;

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

        if (confirmationText !== 'DELETE') {
            return Response.json({
                error: 'Please type DELETE to confirm account deletion'
            }, { status: 400, headers: corsHeaders });
        }

        const adminClient = createClient(supabaseUrl, supabaseServiceKey);

        // Check existing request
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
                const requestedAt = new Date(existingRequest.requested_at).getTime();
                if (Date.now() - requestedAt < 3600000) { // 1 hour
                    return Response.json({
                        error: 'Account deletion is already in progress'
                    }, { status: 409, headers: corsHeaders });
                }
            }
            deletionRequestId = existingRequest.id;
        }

        // Rate limiting
        const rateLimitKey = `delete_account:${user.id}`;
        const rateLimitResult = await checkRateLimit(adminClient, rateLimitKey, RATE_LIMITS.DELETE_ACCOUNT);

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

        // Re-authentication
        // Check if user has password-based auth (email) vs OAuth (google, github, etc.)
        const userProvider = user.app_metadata?.provider || '';
        const userProviders = user.app_metadata?.providers || [];

        // User has password ONLY if they signed up with email AND are not using OAuth
        const hasPassword = (userProvider === 'email' || userProviders.includes('email')) &&
            !OAUTH_PROVIDERS.includes(userProvider);

        if (hasPassword && currentPassword) {
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
                return Response.json({ error: 'Current password is incorrect' }, { status: 401, headers: corsHeaders });
            }
        } else if (verificationCode) {
            if (!isValidOTPFormat(verificationCode)) {
                console.error('Invalid OTP format:', verificationCode);
                return Response.json({ error: 'Invalid verification code format' }, { status: 400, headers: corsHeaders });
            }
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
                return Response.json({ error: 'Invalid or expired verification code' }, { status: 401, headers: corsHeaders });
            }
            await adminClient.from('verification_codes').update({ used_at: new Date().toISOString() }).eq('id', codeData.id);
        } else {
            return Response.json({
                error: 'Re-authentication required.',
                requiresReauth: true,
                authMethod: hasPassword ? 'password' : 'otp'
            }, { status: 401, headers: corsHeaders });
        }

        // 2. Start Streaming Response
        const bodyStream = new ReadableStream({
            async start(controller) {
                const stepsCompleted: string[] = [];

                const emit = (type: string, data: any) => {
                    try {
                        controller.enqueue(formatEvent(type, data));
                    } catch (e) {
                        console.error('Stream enqueue failed:', e);
                    }
                };

                try {
                    // Audit: deletion requested
                    await logAudit(null, {
                        action: SECURITY_ACTIONS.ACCOUNT_DELETE_REQUESTED,
                        actor_id: user.id,
                        status: 'success',
                        details: clientInfo
                    });

                    emit('progress', { step: 'init', message: 'Initializing deletion process...' });

                    // Create/Update deletion request
                    if (!deletionRequestId) {
                        const { data: newRequest, error: createError } = await adminClient
                            .from('deletion_requests')
                            .insert({ user_id: user.id, status: 'processing' })
                            .select()
                            .single();

                        if (createError) throw new Error('Failed to create deletion request record');
                        deletionRequestId = newRequest.id;
                    } else {
                        await adminClient
                            .from('deletion_requests')
                            .update({ status: 'processing', last_error: null })
                            .eq('id', deletionRequestId);
                    }

                    // Step 1: Revoke Sessions
                    emit('progress', { step: 'revoke_sessions', message: 'Revoking active sessions...' });
                    try {
                        await adminClient.auth.admin.signOut(user.id, 'global');
                        stepsCompleted.push('sessions_revoked');
                    } catch (e) {
                        console.error('Session revocation error:', e);
                    }

                    // Step 2: Revoke OAuth Tokens
                    emit('progress', { step: 'revoke_tokens', message: 'Revoking connected platform tokens...' });
                    const { data: platforms } = await adminClient
                        .from('connected_platforms')
                        .select('platform, oauth_token, refresh_token')
                        .eq('user_id', user.id);

                    if (platforms && platforms.length > 0) {
                        const revokeCtx: RevokeContext = {
                            envGet: (key) => Deno.env.get(key),
                            fetch: fetch,
                            logger: console
                        };

                        const revokePromises = platforms.map(async (p) => {
                            emit('progress', {
                                step: 'revoke_tokens',
                                message: `Revoking ${p.platform}...`,
                                platform: p.platform
                            });
                            return revokeToken(revokeCtx, p.platform, p.oauth_token, p.refresh_token);
                        });
                        await Promise.all(revokePromises);
                        stepsCompleted.push('oauth_tokens_revoked');
                    }

                    // Step 3: Delete Data Tables
                    emit('progress', { step: 'delete_data', message: 'Removing user data...' });
                    for (const table of USER_DATA_TABLES) {
                        emit('progress', { step: 'delete_data', message: `Cleaning up ${table.replace('_', ' ')}...`, table });

                        try {
                            if (table === 'audit_log') {
                                await adminClient
                                    .from(table)
                                    .update({
                                        user_id: null,
                                        details_json: { anonymized: true, original_user_deleted: true }
                                    })
                                    .eq('user_id', user.id);
                                stepsCompleted.push(`${table}_anonymized`);
                            } else {
                                const { error } = await adminClient
                                    .from(table)
                                    .delete()
                                    .eq('user_id', user.id);

                                if (error) {
                                    console.error(`Error deleting ${table}:`, error);
                                    if (table === 'platform_connections' || table === 'connected_platforms') {
                                        throw new Error(`Critical failure: Could not delete from ${table}: ${error.message}`);
                                    }
                                    stepsCompleted.push(`${table}_failed`);
                                } else {
                                    stepsCompleted.push(`${table}_deleted`);
                                }
                            }
                        } catch (tableError: any) {
                            console.error(`Error processing table ${table}:`, tableError);
                            if (table === 'platform_connections' || table === 'connected_platforms') {
                                throw tableError;
                            }
                        }
                    }

                    // Step 4: Delete Profile
                    emit('progress', { step: 'delete_profile', message: 'Deleting user profile...' });
                    await adminClient.from('profiles').delete().eq('id', user.id);
                    stepsCompleted.push('profile_deleted');

                    // Step 5: Delete Auth User
                    emit('progress', { step: 'delete_auth', message: 'Finalizing account deletion...' });
                    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(user.id);
                    if (deleteUserError) throw new Error('Failed to delete auth user');
                    stepsCompleted.push('auth_user_deleted');

                    // Mark complete
                    await adminClient
                        .from('deletion_requests')
                        .update({
                            status: 'deleted',
                            completed_at: new Date().toISOString(),
                            steps_completed: stepsCompleted
                        })
                        .eq('id', deletionRequestId);

                    await logAudit(null, {
                        action: SECURITY_ACTIONS.ACCOUNT_DELETED,
                        actor_id: null,
                        status: 'success',
                        details: { deletion_request_id: deletionRequestId, steps_completed: stepsCompleted, ...clientInfo }
                    });

                    emit('complete', { message: 'Your account has been permanently deleted' });

                } catch (deletionError: any) {
                    console.error('Deletion error:', deletionError);

                    if (deletionRequestId) {
                        await adminClient
                            .from('deletion_requests')
                            .update({
                                status: 'failed',
                                last_error: sanitizeErrorMessage(deletionError),
                                steps_completed: stepsCompleted
                            })
                            .eq('id', deletionRequestId);
                    }

                    emit('error', { error: sanitizeErrorMessage(deletionError) });

                    await logAudit(null, {
                        action: SECURITY_ACTIONS.ACCOUNT_DELETE_FAILED,
                        actor_id: user?.id,
                        status: 'failure',
                        details: { error: sanitizeErrorMessage(deletionError), deletion_request_id: deletionRequestId, ...clientInfo }
                    });
                } finally {
                    controller.close();
                }
            }
        });

        return new Response(bodyStream, {
            headers: {
                ...corsHeaders,
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            }
        });

    } catch (error: any) {
        console.error('deleteAccount top-level error:', error);
        return Response.json({
            error: sanitizeErrorMessage(error)
        }, { status: 500, headers: corsHeaders });
    }
});
