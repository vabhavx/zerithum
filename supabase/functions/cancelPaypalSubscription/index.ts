/**
 * Cancel PayPal Subscription
 * Auth required — cancels the user's active subscription via PayPal API
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/utils/cors.ts';
import { getPayPalAccessToken, PAYPAL_API_BASE } from '../_shared/utils/paypal.ts';

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

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
        }

        const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);

        // Find active subscription
        const { data: subscription, error: subError } = await serviceSupabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'ACTIVE')
            .maybeSingle();

        if (!subscription || subError) {
            return Response.json(
                { error: 'No active subscription found' },
                { status: 404, headers: corsHeaders },
            );
        }

        // Cancel in PayPal
        const accessToken = await getPayPalAccessToken();
        const cancelResponse = await fetch(
            `${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscription.paypal_subscription_id}/cancel`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reason: 'Customer requested cancellation via Zerithum' }),
            },
        );

        // PayPal returns 204 No Content on success
        if (!cancelResponse.ok && cancelResponse.status !== 204) {
            const errorText = await cancelResponse.text();
            console.error('PayPal cancel failed:', cancelResponse.status, errorText);
            return Response.json(
                { error: 'Failed to cancel subscription with PayPal' },
                { status: 500, headers: corsHeaders },
            );
        }

        // Update local records
        await serviceSupabase
            .from('subscriptions')
            .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
            .eq('id', subscription.id);

        await serviceSupabase.from('entitlements').upsert(
            { user_id: user.id, max_platforms: 0, updated_at: new Date().toISOString() },
            { onConflict: 'user_id' },
        );

        return Response.json({ status: 'cancelled' }, { headers: corsHeaders });
    } catch (error: any) {
        console.error('Cancel subscription error:', error);
        return Response.json(
            { error: error.message || 'Internal error' },
            { status: 500, headers: getCorsHeaders(req) },
        );
    }
});
