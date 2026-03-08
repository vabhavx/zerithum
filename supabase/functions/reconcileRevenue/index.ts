/**
 * Reconcile Revenue
 * Auth required — matches revenue transactions against bank transactions,
 * creates reconciliations with confidence scores, and triggers auto-approval workflow.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/utils/cors.ts';
import { logAudit } from '../_shared/utils/audit.ts';
import { autoReconcile } from '../_shared/logic/reconcile.ts';

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

        // Fetch reconciled revenue IDs to exclude from matching
        const { data: reconciledRecs } = await serviceSupabase
            .from('reconciliations')
            .select('revenue_transaction_id')
            .eq('user_id', user.id);
        const reconciledRevenueIds = new Set((reconciledRecs || []).map(r => r.revenue_transaction_id));

        // Context for reconciliation logic
        const ctx = {
            fetchUnreconciledRevenue: async (userId: string) => {
                const { data, error } = await serviceSupabase
                    .from('revenue_transactions')
                    .select('*')
                    .eq('user_id', userId)
                    .order('transaction_date', { ascending: false });

                if (error) {
                    console.error('[ReconcileRevenue] Error fetching revenue:', error);
                    return [];
                }

                // Filter out already reconciled
                return (data || []).filter(r => !reconciledRevenueIds.has(r.id));
            },

            fetchUnreconciledBankTransactions: async (userId: string, startDate: string) => {
                const { data, error } = await serviceSupabase
                    .from('bank_transactions')
                    .select('*')
                    .eq('user_id', userId)
                    .gte('transaction_date', startDate)
                    .eq('is_reconciled', false)
                    .order('transaction_date', { ascending: false });

                if (error) {
                    console.error('[ReconcileRevenue] Error fetching unreconciled bank txns:', error);
                    return [];
                }
                return data || [];
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
            },

            logAudit: async (entry: any) => {
                try {
                    await logAudit(null, entry);
                } catch (err) {
                    console.error('[ReconcileRevenue] Audit log error:', err);
                }
            },
        };

        // Run reconciliation
        const result = await autoReconcile(ctx, user);

        return Response.json(result, { headers: corsHeaders });
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
            { status: 500, headers: getCorsHeaders(req) }
        );
    }
});
