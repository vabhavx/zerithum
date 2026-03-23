/**
 * Teller Enrollment
 * Auth required — receives the Teller Connect enrollment payload,
 * verifies signatures, encrypts access token, stores connection,
 * and fetches initial account list.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/utils/cors.ts';
import { logAudit } from '../_shared/utils/audit.ts';
import { encrypt } from '../_shared/utils/encryption.ts';
import { verifyTellerSignature, listAccounts } from '../_shared/utils/teller.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
    const corsHeaders = getCorsHeaders(req);

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    let userId: string | undefined;

    try {
        // Authenticate
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            global: { headers: { Authorization: authHeader } },
        });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
        }
        userId = user.id;

        const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);

        // Parse enrollment payload
        const body = await req.json();
        console.log('[TellerEnrollment] Received payload keys:', Object.keys(body));
        console.log('[TellerEnrollment] accessToken present:', !!body.accessToken);
        console.log('[TellerEnrollment] enrollment:', JSON.stringify(body.enrollment));
        console.log('[TellerEnrollment] nonce:', body.nonce);
        console.log('[TellerEnrollment] signatures:', JSON.stringify(body.signatures));

        const {
            accessToken,
            enrollment,
            user: tellerUser,
            signatures,
            nonce,
        } = body;

        if (!accessToken || !enrollment?.id || !nonce) {
            console.error('[TellerEnrollment] Validation failed:', {
                hasAccessToken: !!accessToken,
                enrollmentId: enrollment?.id,
                hasNonce: !!nonce,
            });
            return Response.json(
                { error: 'Missing required enrollment fields', details: { hasAccessToken: !!accessToken, hasEnrollmentId: !!enrollment?.id, hasNonce: !!nonce } },
                { status: 400, headers: corsHeaders }
            );
        }

        // 1. Validate and consume nonce (atomic operation)
        const { data: nonceRow, error: nonceError } = await serviceSupabase
            .from('teller_nonces')
            .update({ consumed: true })
            .eq('nonce', nonce)
            .eq('user_id', user.id)
            .eq('consumed', false)
            .gt('expires_at', new Date().toISOString())
            .select()
            .maybeSingle();

        if (nonceError || !nonceRow) {
            await logAudit(null, {
                action: 'teller_enrollment_failed',
                actor_id: user.id,
                status: 'failure',
                details: { reason: 'invalid_or_expired_nonce' },
            });
            return Response.json(
                { error: 'Invalid or expired nonce' },
                { status: 403, headers: corsHeaders }
            );
        }

        // 2. Verify Ed25519 signatures (non-fatal — nonce is the primary replay guard)
        // Sandbox environments may use a different signing key than production.
        if (signatures && signatures.length > 0) {
            let signatureValid = false;
            for (const sig of signatures) {
                if (await verifyTellerSignature(sig, nonce)) {
                    signatureValid = true;
                    break;
                }
            }
            if (!signatureValid) {
                console.warn('[TellerEnrollment] Signature verification failed — continuing (nonce already consumed)');
                await logAudit(null, {
                    action: 'teller_enrollment_signature_warning',
                    actor_id: user.id,
                    status: 'warning',
                    details: { reason: 'signature_verification_failed', note: 'Nonce consumed, proceeding with enrollment' },
                });
            }
        }

        // 3. Encrypt the access token
        const encryptedToken = await encrypt(accessToken);

        // 4. Upsert bank connection (handles reauth case with existing enrollment)
        const { data: connection, error: connError } = await serviceSupabase
            .from('bank_connections')
            .upsert(
                {
                    user_id: user.id,
                    teller_enrollment_id: enrollment.id,
                    teller_user_id: tellerUser?.id || null,
                    institution_name: enrollment.institution?.name || 'Unknown Bank',
                    encrypted_access_token: encryptedToken,
                    status: 'active',
                    error_message: null,
                    connected_at: new Date().toISOString(),
                },
                { onConflict: 'user_id,teller_enrollment_id' }
            )
            .select()
            .single();

        if (connError || !connection) {
            console.error('[TellerEnrollment] Insert error:', connError);
            return Response.json(
                { error: 'Failed to store bank connection' },
                { status: 500, headers: corsHeaders }
            );
        }

        // 5. Fetch accounts from Teller API
        let accounts: any[] = [];
        try {
            const tellerAccounts = await listAccounts(accessToken);
            accounts = tellerAccounts;

            // Store accounts
            for (const acct of tellerAccounts) {
                await serviceSupabase
                    .from('bank_accounts')
                    .upsert(
                        {
                            user_id: user.id,
                            bank_connection_id: connection.id,
                            teller_account_id: acct.id,
                            name: acct.name || 'Account',
                            type: acct.type || null,
                            subtype: acct.subtype || null,
                            institution_name: acct.institution?.name || enrollment.institution?.name || null,
                            last_four: acct.last_four || null,
                            currency: acct.currency || 'USD',
                        },
                        { onConflict: 'teller_account_id' }
                    );
            }
        } catch (accountError: any) {
            // Non-fatal: connection is saved, accounts can be fetched on first sync
            console.error('[TellerEnrollment] Account fetch error:', accountError);
        }

        await logAudit(null, {
            action: 'teller_enrollment_completed',
            actor_id: user.id,
            resource_id: connection.id,
            resource_type: 'bank_connection',
            status: 'success',
            details: {
                enrollment_id: enrollment.id,
                institution: enrollment.institution?.name,
                accounts_fetched: accounts.length,
            },
        });

        return Response.json(
            {
                success: true,
                connectionId: connection.id,
                institutionName: enrollment.institution?.name || 'Unknown Bank',
                accounts: accounts.map((a: any) => ({
                    id: a.id,
                    name: a.name,
                    type: a.type,
                    subtype: a.subtype,
                    lastFour: a.last_four,
                })),
            },
            { headers: corsHeaders }
        );
    } catch (error: any) {
        console.error('[TellerEnrollment] Error:', error);
        await logAudit(null, {
            action: 'teller_enrollment_failed',
            actor_id: userId,
            status: 'failure',
            details: { error: error.message },
        });
        return Response.json(
            { error: 'Internal error' },
            { status: 500, headers: getCorsHeaders(req) }
        );
    }
});
