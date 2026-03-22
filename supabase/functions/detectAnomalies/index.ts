/**
 * Detect Revenue Anomalies
 * Auth required — analyzes revenue transaction patterns, detects anomalies
 * (drops, spikes, concentration risk), and creates autopsy_events for review.
 *
 * Called after reconciliation or manually from the Revenue Autopsy page.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/utils/cors.ts';
import { logAudit } from '../_shared/utils/audit.ts';
import { detectAnomalies, AnomalyContext } from '../_shared/logic/anomalies.ts';

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

        // Build context for anomaly detection
        const ctx: AnomalyContext = {
            fetchRecentTransactions: async (uid: string, limit: number) => {
                const { data, error } = await serviceSupabase
                    .from('revenue_transactions')
                    .select('*')
                    .eq('user_id', uid)
                    .order('transaction_date', { ascending: false })
                    .limit(limit);

                if (error) {
                    console.error('[DetectAnomalies] Error fetching transactions:', error);
                    return [];
                }
                return data || [];
            },

            fetchRecentAutopsies: async (uid: string, since: Date) => {
                const { data, error } = await serviceSupabase
                    .from('autopsy_events')
                    .select('id, event_type, detected_at')
                    .eq('user_id', uid)
                    .gte('detected_at', since.toISOString());

                if (error) {
                    console.error('[DetectAnomalies] Error fetching recent autopsies:', error);
                    return [];
                }
                return data || [];
            },

            invokeLLM: async (_prompt: string, _schema: any) => {
                // LLM integration placeholder — returns rule-based analysis
                // until Anthropic API key is configured.
                // When ready: call Claude API with structured output here.
                return {
                    platform_behaviour: 'Analysis requires AI configuration',
                    creator_behaviour: 'Review transaction patterns manually',
                    external_timing: 'Check for seasonal or market factors',
                    historical_analogues: 'Compare with prior months',
                    primary_cause: 'Automated detection — manual review recommended',
                    recurrence_probability: 0.5,
                    expected_damage: 0
                };
            },

            saveAnomalies: async (anomalies: any[]) => {
                if (anomalies.length === 0) return;

                // Map anomaly objects to autopsy_events schema
                const rows = anomalies.map(a => ({
                    user_id: a.user_id,
                    event_type: a.event_type,
                    title: a.event_type === 'revenue_drop'
                        ? `Revenue dropped ${Math.abs(a.impact_percentage).toFixed(0)}%`
                        : a.event_type === 'revenue_spike'
                            ? `Revenue spiked ${Math.abs(a.impact_percentage).toFixed(0)}%`
                            : `High concentration on ${(a.affected_platforms || []).join(', ')}`,
                    description: a.causal_reconstruction?.primary_cause || 'Anomaly detected — review recommended',
                    severity: a.severity,
                    status: 'pending_review',
                    affected_amount: Math.abs(a.impact_amount || 0),
                    platform: (a.affected_platforms || [])[0] || null,
                    detected_at: a.detected_at,
                    metadata: {
                        impact_percentage: a.impact_percentage,
                        impact_amount: a.impact_amount,
                        affected_platforms: a.affected_platforms,
                        causal_reconstruction: a.causal_reconstruction,
                        exposure_score: a.exposure_score
                    }
                }));

                const { error } = await serviceSupabase
                    .from('autopsy_events')
                    .insert(rows);

                if (error) {
                    console.error('[DetectAnomalies] Error saving anomalies:', error);
                    throw error;
                }
            },

            logAudit: (entry: any) => {
                logAudit(serviceSupabase, entry).catch(err =>
                    console.error('[DetectAnomalies] Audit log error:', err)
                );
            }
        };

        const result = await detectAnomalies(ctx, user);

        return Response.json(result, { headers: corsHeaders });

    } catch (error: any) {
        console.error('[DetectAnomalies] Error:', error);
        await logAudit(null, {
            action: 'detect_anomalies_failed',
            actor_id: userId,
            status: 'failure',
            details: { error: error.message },
        });
        return Response.json(
            { error: 'Anomaly detection failed', success: false },
            { status: 500, headers: corsHeaders }
        );
    }
});
