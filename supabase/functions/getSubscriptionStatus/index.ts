/**
 * Get Subscription Status
 * Auth required — returns subscription details, entitlements, and platform usage
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/utils/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
    const corsHeaders = getCorsHeaders(req);

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
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
            return Response.json({ error: 'Unauthorized', details: authError?.message || 'No user' }, { status: 401, headers: corsHeaders });
        }

        const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get latest subscription
        const { data: subscription } = await serviceSupabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        // Auto-expiration logic: If the period has ended, ensure entitlements are 0
        if (subscription && subscription.current_period_end) {
            const now = new Date();
            const periodEnd = new Date(subscription.current_period_end);
            if (periodEnd < now && (subscription.status === 'ACTIVE' || subscription.status === 'CANCELLED')) {
                // If it was ACTIVE but date passed, it might be a missed webhook or real expiration.
                // If it was CANCELLED, it's definitely time to stop access.
                const newStatus = subscription.status === 'ACTIVE' ? 'PAST_DUE' : 'EXPIRED';

                await serviceSupabase.from('subscriptions')
                    .update({ status: newStatus, updated_at: now.toISOString() })
                    .eq('id', subscription.id);

                await serviceSupabase.from('entitlements')
                    .upsert({ user_id: user.id, max_platforms: 0, updated_at: now.toISOString() }, { onConflict: 'user_id' });

                // Refresh local object for response
                subscription.status = newStatus;
            }
        }

        // Get entitlements
        const { data: entitlement } = await serviceSupabase
            .from('entitlements')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

        // Count connected platforms
        const { count: platformsUsed } = await serviceSupabase
            .from('connected_platforms')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        return Response.json(
            {
                subscription: subscription
                    ? {
                        id: subscription.id,
                        plan: subscription.plan,
                        status: subscription.status,
                        paypal_subscription_id: subscription.paypal_subscription_id,
                        current_period_end: subscription.current_period_end,
                        created_at: subscription.created_at,
                    }
                    : null,
                entitlements: {
                    max_platforms: entitlement?.max_platforms ?? 0,
                },
                platforms_used: platformsUsed ?? 0,
            },
            { headers: corsHeaders },
        );
    } catch (error: any) {
        console.error('Get subscription status error:', error);
        return Response.json(
            { error: error.message || 'Internal error' },
            { status: 500, headers: getCorsHeaders(req) },
        );
    }
});
