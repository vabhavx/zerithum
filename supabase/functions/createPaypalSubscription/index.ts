/**
 * Create PayPal Subscription
 * Auth required — creates a subscription via PayPal API and returns approval URL
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

        const body = await req.json();
        const { plan } = body;

        if (!plan || !['starter', 'pro'].includes(plan)) {
            return Response.json(
                { error: 'Invalid plan. Must be "starter" or "pro".' },
                { status: 400, headers: corsHeaders },
            );
        }

        const planId =
            plan === 'starter'
                ? Deno.env.get('PAYPAL_PLAN_ID_STARTER_9')
                : Deno.env.get('PAYPAL_PLAN_ID_PRO_20');

        if (!planId) {
            return Response.json(
                { error: 'Plan not configured on server' },
                { status: 500, headers: corsHeaders },
            );
        }

        const appBaseUrl = Deno.env.get('APP_BASE_URL') || 'https://www.zerithum.com';
        const accessToken = await getPayPalAccessToken();

        const subscriptionPayload = {
            plan_id: planId,
            custom_id: user.id,
            application_context: {
                brand_name: 'Zerithum',
                locale: 'en-US',
                shipping_preference: 'NO_SHIPPING',
                user_action: 'SUBSCRIBE_NOW',
                return_url: `${appBaseUrl}/BillingConfirm`,
                cancel_url: `${appBaseUrl}/Billing`,
            },
        };

        const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Prefer': 'return=representation',
            },
            body: JSON.stringify(subscriptionPayload),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('PayPal subscription creation failed:', response.status, errorData);
            return Response.json(
                { error: 'Failed to create PayPal subscription' },
                { status: 500, headers: corsHeaders },
            );
        }

        const subscriptionData = await response.json();
        const approvalLink = subscriptionData.links?.find((l: any) => l.rel === 'approve');

        // Cancel any existing pending/active subscription for this user
        const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);
        await serviceSupabase
            .from('subscriptions')
            .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
            .eq('user_id', user.id)
            .in('status', ['PENDING']);

        // Store the new pending subscription
        await serviceSupabase.from('subscriptions').insert({
            user_id: user.id,
            provider: 'paypal',
            paypal_subscription_id: subscriptionData.id,
            paypal_plan_id: planId,
            plan,
            status: 'PENDING',
        });

        return Response.json(
            {
                subscriptionId: subscriptionData.id,
                approvalUrl: approvalLink?.href,
            },
            { headers: corsHeaders },
        );
    } catch (error: any) {
        console.error('Create subscription error:', error);
        return Response.json(
            { error: error.message || 'Internal error' },
            { status: 500, headers: getCorsHeaders(req) },
        );
    }
});
