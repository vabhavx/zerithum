/**
 * Reconcile Revenue
 * Auth required — matches revenue transactions against bank transactions,
 * creates reconciliations with confidence scores, triggers auto-approval workflow,
 * and surfaces unmatched discrepancies as autopsy_events for Revenue Autopsy.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/utils/cors.ts';
import { logAudit } from '../_shared/utils/audit.ts';
import { autoReconcile } from '../_shared/logic/reconcile.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Thresholds for surfacing discrepancies
const DISCREPANCY_AMOUNT_THRESHOLD_CENTS = 500; // $5.00 minimum to flag
const DISCREPANCY_AGE_DAYS = 7; // Only flag transactions older than 7 days (give bank time to settle)

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

        // Fetch reconciled revenue IDs to exclude from matching
        const { data: reconciledRecs } = await serviceSupabase
            .from('reconciliations')
            .select('revenue_transaction_id, bank_transaction_id')
            .eq('user_id', user.id);
        const reconciledRevenueIds = new Set((reconciledRecs || []).map(r => r.revenue_transaction_id));
        const reconciledBankIds = new Set((reconciledRecs || []).map(r => r.bank_transaction_id));

        // Track unreconciled items for discrepancy detection
        let allUnreconciledRevenue: any[] = [];
        let allUnreconciledBank: any[] = [];

        // Context for reconciliation logic
        const ctx = {
            fetchUnreconciledRevenue: async (uid: string) => {
                const { data, error } = await serviceSupabase
                    .from('revenue_transactions')
                    .select('*')
                    .eq('user_id', uid)
                    .order('transaction_date', { ascending: false });

                if (error) {
                    console.error('[ReconcileRevenue] Error fetching revenue:', error);
                    return [];
                }

                // Filter out already reconciled
                const unreconciled = (data || []).filter(r => !reconciledRevenueIds.has(r.id));
                allUnreconciledRevenue = unreconciled;
                return unreconciled;
            },

            fetchUnreconciledBankTransactions: async (uid: string, startDate: string) => {
                const { data, error } = await serviceSupabase
                    .from('bank_transactions')
                    .select('*')
                    .eq('user_id', uid)
                    .gte('transaction_date', startDate)
                    .eq('is_reconciled', false)
                    .order('transaction_date', { ascending: false });

                if (error) {
                    console.error('[ReconcileRevenue] Error fetching unreconciled bank txns:', error);
                    return [];
                }
                allUnreconciledBank = data || [];
                return allUnreconciledBank;
            },

            createReconciliations: async (reconciliations: any[]) => {
                if (reconciliations.length === 0) return;

                const { error } = await serviceSupabase
                    .from('reconciliations')
                    .insert(reconciliations);

                if (error) {
                    console.error('[ReconcileRevenue] Error creating reconciliations:', error);
                    throw error;
                }

                // Mark matched bank transactions as reconciled
                const matchedBankIds = reconciliations
                    .map(r => r.bank_transaction_id)
                    .filter(Boolean);

                if (matchedBankIds.length > 0) {
                    await serviceSupabase
                        .from('bank_transactions')
                        .update({ is_reconciled: true })
                        .in('id', matchedBankIds);
                }

                // Track newly matched IDs so discrepancy detection excludes them
                for (const r of reconciliations) {
                    reconciledRevenueIds.add(r.revenue_transaction_id);
                    reconciledBankIds.add(r.bank_transaction_id);
                }
            },

            logAudit: async (entry: any) => {
                try {
                    await logAudit(serviceSupabase, entry);
                } catch (err) {
                    console.error('[ReconcileRevenue] Audit log error:', err);
                }
            },
        };

        // Run reconciliation
        const result = await autoReconcile(ctx, user);

        // ─── DISCREPANCY DETECTION ───────────────────────────────────────
        // After reconciliation, surface remaining unmatched items as autopsy events.
        // This is the bridge between Reconciliation and Revenue Autopsy.
        const discrepancyEvents: any[] = [];
        const cutoffDate = new Date(Date.now() - DISCREPANCY_AGE_DAYS * 24 * 60 * 60 * 1000);

        // 1. Unmatched revenue (platform says money, no bank deposit found)
        //    → Possible: payout delay, platform holding funds, fee miscalculation, fraud
        const stillUnmatchedRevenue = allUnreconciledRevenue.filter(r => !reconciledRevenueIds.has(r.id));

        for (const rev of stillUnmatchedRevenue) {
            const txDate = new Date(rev.transaction_date);
            const amountCents = Math.round(Math.abs(rev.amount || 0) * 100);

            // Only flag if old enough and above threshold
            if (txDate <= cutoffDate && amountCents >= DISCREPANCY_AMOUNT_THRESHOLD_CENTS) {
                const daysSinceRevenue = Math.floor((Date.now() - txDate.getTime()) / (1000 * 3600 * 24));

                discrepancyEvents.push({
                    user_id: user.id,
                    event_type: 'unusual_activity',
                    title: `Unmatched ${rev.platform} revenue — $${(amountCents / 100).toFixed(2)} not found in bank`,
                    description: `${rev.platform} reported $${(amountCents / 100).toFixed(2)} on ${rev.transaction_date} but no corresponding bank deposit was found after ${daysSinceRevenue} days. This may indicate a payout delay, held funds, or a discrepancy requiring investigation.`,
                    severity: amountCents >= 10000 ? 'critical' : amountCents >= 2500 ? 'warning' : 'info',
                    status: 'pending_review',
                    affected_amount: amountCents / 100,
                    platform: rev.platform,
                    detected_at: new Date().toISOString(),
                    metadata: {
                        discrepancy_type: 'missing_bank_deposit',
                        revenue_transaction_id: rev.id,
                        platform_transaction_id: rev.platform_transaction_id,
                        transaction_date: rev.transaction_date,
                        gross_amount: rev.amount,
                        net_amount: rev.net_amount,
                        fee: rev.fee,
                        days_since_revenue: daysSinceRevenue
                    }
                });
            }
        }

        // 2. Unmatched bank deposits (bank shows deposit, no platform revenue claim)
        //    → Possible: manual income, missing platform connection, sync gap, refund reversal
        const stillUnmatchedBank = allUnreconciledBank.filter(b => !reconciledBankIds.has(b.id));

        for (const bank of stillUnmatchedBank) {
            const txDate = new Date(bank.transaction_date);
            const amountCents = Math.round(Math.abs(bank.amount || 0) * 100);
            const isCredit = (bank.transaction_type === 'credit') || (bank.amount > 0);

            // Only flag credit (incoming) deposits that are old enough and above threshold
            if (isCredit && txDate <= cutoffDate && amountCents >= DISCREPANCY_AMOUNT_THRESHOLD_CENTS) {
                const daysSinceDeposit = Math.floor((Date.now() - txDate.getTime()) / (1000 * 3600 * 24));

                discrepancyEvents.push({
                    user_id: user.id,
                    event_type: 'unusual_activity',
                    title: `Unidentified bank deposit — $${(amountCents / 100).toFixed(2)} with no platform match`,
                    description: `A bank deposit of $${(amountCents / 100).toFixed(2)} on ${bank.transaction_date} has no matching platform revenue after ${daysSinceDeposit} days. This may be income from an unconnected platform, a manual transfer, or requires investigation.`,
                    severity: amountCents >= 10000 ? 'critical' : amountCents >= 2500 ? 'warning' : 'info',
                    status: 'pending_review',
                    affected_amount: amountCents / 100,
                    platform: null,
                    detected_at: new Date().toISOString(),
                    metadata: {
                        discrepancy_type: 'unidentified_bank_deposit',
                        bank_transaction_id: bank.id,
                        bank_description: bank.description,
                        transaction_date: bank.transaction_date,
                        amount: bank.amount,
                        days_since_deposit: daysSinceDeposit
                    }
                });
            }
        }

        // Deduplicate: don't create autopsy events for discrepancies already flagged
        let newDiscrepancies = 0;
        if (discrepancyEvents.length > 0) {
            // Check existing autopsy events for this user to avoid duplicates
            const { data: existingEvents } = await serviceSupabase
                .from('autopsy_events')
                .select('metadata')
                .eq('user_id', user.id)
                .eq('event_type', 'unusual_activity')
                .in('status', ['pending_review', 'reviewed']);

            const existingTxIds = new Set<string>();
            for (const evt of (existingEvents || [])) {
                const meta = evt.metadata || {};
                if (meta.revenue_transaction_id) existingTxIds.add(meta.revenue_transaction_id);
                if (meta.bank_transaction_id) existingTxIds.add(meta.bank_transaction_id);
            }

            const deduped = discrepancyEvents.filter(evt => {
                const meta = evt.metadata || {};
                const txId = meta.revenue_transaction_id || meta.bank_transaction_id;
                return txId && !existingTxIds.has(txId);
            });

            if (deduped.length > 0) {
                const { error: insertError } = await serviceSupabase
                    .from('autopsy_events')
                    .insert(deduped);

                if (insertError) {
                    console.error('[ReconcileRevenue] Error creating discrepancy events:', insertError);
                    // Non-fatal — reconciliation itself succeeded
                } else {
                    newDiscrepancies = deduped.length;
                }
            }
        }

        return Response.json({
            ...result,
            discrepancies: {
                unmatched_revenue: stillUnmatchedRevenue.length,
                unmatched_bank_deposits: stillUnmatchedBank.filter(b =>
                    (b.transaction_type === 'credit' || b.amount > 0)
                ).length,
                new_autopsy_events: newDiscrepancies
            }
        }, { headers: corsHeaders });

    } catch (error: any) {
        console.error('[ReconcileRevenue] Error:', error);
        await logAudit(null, {
            action: 'reconcile_revenue_failed',
            actor_id: userId,
            status: 'failure',
            details: { error: error.message },
        });
        return Response.json(
            { error: 'Reconciliation failed', success: false },
            { status: 500, headers: corsHeaders }
        );
    }
});
