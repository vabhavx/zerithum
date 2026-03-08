/**
 * Teller Sync
 * Auth required — fetches accounts and transactions from Teller API via mTLS,
 * deduplicates, and upserts into bank_transactions.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/utils/cors.ts';
import { logAudit } from '../_shared/utils/audit.ts';
import { decrypt } from '../_shared/utils/encryption.ts';
import { autoReconcile } from '../_shared/logic/reconcile.ts';
import {
    listAccounts,
    getAccountTransactions,
    TellerAuthError,
} from '../_shared/utils/teller.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
    const corsHeaders = getCorsHeaders(req);

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    let userId: string | undefined;
    let connectionId: string | undefined;

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

        // Parse request
        const body = await req.json();
        connectionId = body.connectionId;

        if (!connectionId) {
            return Response.json({ error: 'connectionId is required' }, { status: 400, headers: corsHeaders });
        }

        // Fetch connection and verify ownership
        const { data: connection, error: connError } = await serviceSupabase
            .from('bank_connections')
            .select('*')
            .eq('id', connectionId)
            .eq('user_id', user.id)
            .single();

        if (connError || !connection) {
            return Response.json({ error: 'Bank connection not found' }, { status: 404, headers: corsHeaders });
        }

        if (connection.status === 'disconnected') {
            return Response.json({ error: 'Bank connection is disconnected' }, { status: 400, headers: corsHeaders });
        }

        // Decrypt access token
        const accessToken = await decrypt(connection.encrypted_access_token);

        // Fetch accounts
        let accounts: any[];
        try {
            accounts = await listAccounts(accessToken);
        } catch (error) {
            if (error instanceof TellerAuthError) {
                await serviceSupabase
                    .from('bank_connections')
                    .update({ status: 'reauth_required', error_message: 'Bank connection needs to be renewed' })
                    .eq('id', connectionId);

                return Response.json(
                    { error: 'Bank connection needs to be renewed', reauth_required: true },
                    { status: 403, headers: corsHeaders }
                );
            }
            throw error;
        }

        // Upsert accounts
        for (const acct of accounts) {
            await serviceSupabase
                .from('bank_accounts')
                .upsert(
                    {
                        user_id: user.id,
                        bank_connection_id: connectionId,
                        teller_account_id: acct.id,
                        name: acct.name || 'Account',
                        type: acct.type || null,
                        subtype: acct.subtype || null,
                        institution_name: acct.institution?.name || connection.institution_name,
                        last_four: acct.last_four || null,
                        currency: acct.currency || 'USD',
                    },
                    { onConflict: 'teller_account_id' }
                );
        }

        // Fetch and store transactions for each account
        let totalTransactions = 0;

        for (const acct of accounts) {
            let transactions: any[];
            try {
                transactions = await getAccountTransactions(accessToken, acct.id);
            } catch (error) {
                if (error instanceof TellerAuthError) {
                    await serviceSupabase
                        .from('bank_connections')
                        .update({ status: 'reauth_required', error_message: 'Bank connection needs to be renewed' })
                        .eq('id', connectionId);

                    return Response.json(
                        { error: 'Bank connection needs to be renewed', reauth_required: true },
                        { status: 403, headers: corsHeaders }
                    );
                }
                console.error(`[TellerSync] Failed to fetch transactions for account ${acct.id}:`, error);
                continue;
            }

            // Process transactions in batches
            // Use integer cents for arithmetic to avoid floating point errors (CLAUDE.md)
            const rows = transactions.map((txn: any) => {
                // Convert to cents, round to prevent float errors, then convert back to dollars
                const amountCents = Math.round(parseFloat(txn.amount) * 100);
                const txnType = amountCents >= 0 ? 'credit' : 'debit';

                return {
                    user_id: user.id,
                    bank_connection_id: connectionId,
                    teller_transaction_id: txn.id,
                    teller_account_id: acct.id,
                    bank_name: connection.institution_name,
                    account_number: acct.last_four ? `****${acct.last_four}` : null,
                    transaction_date: txn.date,
                    posted_date: txn.date,
                    amount: Math.abs(amountCents) / 100, // Store as correct decimal value
                    description: txn.description || '',
                    category: txn.category || null,
                    transaction_type: txnType,
                    teller_status: txn.status || 'posted',
                    source: 'teller',
                    is_reconciled: false,
                };
            });

            // Upsert in batches of 50, deduplicate on teller_transaction_id
            for (let i = 0; i < rows.length; i += 50) {
                const batch = rows.slice(i, i + 50);
                const { error: upsertError } = await serviceSupabase
                    .from('bank_transactions')
                    .upsert(batch, {
                        onConflict: 'teller_transaction_id',
                        ignoreDuplicates: false,
                    });

                if (upsertError) {
                    console.error('[TellerSync] Upsert error:', upsertError);
                }
            }

            totalTransactions += rows.length;
        }

        // Update connection status
        await serviceSupabase
            .from('bank_connections')
            .update({
                last_synced_at: new Date().toISOString(),
                status: 'active',
                error_message: null,
            })
            .eq('id', connectionId);

        // Auto-trigger reconciliation if transactions were synced
        let reconcileResult = { success: true, matchedCount: 0, sentToReview: 0, message: 'No transactions to reconcile' };
        if (totalTransactions > 0) {
            try {
                const reconciledIds = (await serviceSupabase
                    .from('reconciliations')
                    .select('revenue_transaction_id')
                    .eq('user_id', user.id)).data || [];
                const reconciledSet = new Set(reconciledIds.map(r => r.revenue_transaction_id));

                const ctx = {
                    fetchUnreconciledRevenue: async (userId: string) => {
                        const { data, error } = await serviceSupabase
                            .from('revenue_transactions')
                            .select('*')
                            .eq('user_id', userId)
                            .order('transaction_date', { ascending: false });
                        if (error) return [];
                        return (data || []).filter(r => !reconciledSet.has(r.id));
                    },
                    fetchUnreconciledBankTransactions: async (userId: string, startDate: string) => {
                        const { data, error } = await serviceSupabase
                            .from('bank_transactions')
                            .select('*')
                            .eq('user_id', userId)
                            .gte('transaction_date', startDate)
                            .eq('is_reconciled', false)
                            .order('transaction_date', { ascending: false });
                        if (error) return [];
                        return data || [];
                    },
                    createReconciliations: async (reconciliations: any[]) => {
                        if (reconciliations.length === 0) return;
                        const { error } = await serviceSupabase
                            .from('reconciliations')
                            .insert(reconciliations);
                        if (error) throw error;
                    },
                    logAudit: async (entry: any) => {
                        try {
                            await logAudit(null, entry);
                        } catch (err) {
                            console.error('[TellerSync] Audit log error:', err);
                        }
                    },
                };

                reconcileResult = await autoReconcile(ctx, user);
            } catch (reconcileErr) {
                console.error('[TellerSync] Auto-reconciliation error:', reconcileErr);
                // Non-fatal: continue without blocking sync
            }
        }

        await logAudit(null, {
            action: 'teller_sync_completed',
            actor_id: user.id,
            resource_id: connectionId,
            resource_type: 'bank_connection',
            status: 'success',
            details: {
                accounts_synced: accounts.length,
                transactions_synced: totalTransactions,
                reconciliations_created: reconcileResult.matchedCount,
                reconciliations_review: reconcileResult.sentToReview,
            },
        });

        return Response.json(
            {
                success: true,
                accountsSynced: accounts.length,
                transactionCount: totalTransactions,
                reconciliationsCreated: reconcileResult.matchedCount,
                reconciliationsSentToReview: reconcileResult.sentToReview,
            },
            { headers: corsHeaders }
        );
    } catch (error: any) {
        console.error('[TellerSync] Error:', error);
        await logAudit(null, {
            action: 'teller_sync_failed',
            actor_id: userId,
            resource_id: connectionId,
            resource_type: 'bank_connection',
            status: 'failure',
            details: { error: error.message },
        });
        return Response.json(
            { error: 'Sync failed' },
            { status: 500, headers: getCorsHeaders(req) }
        );
    }
});
