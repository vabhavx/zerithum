/**
 * PayPal API Utilities — Shared across edge functions
 * Handles OAuth2 access tokens and webhook signature verification
 */

export const PAYPAL_API_BASE = 'https://api-m.paypal.com';

export async function getPayPalAccessToken(): Promise<string> {
    const clientId = Deno.env.get('PAYPAL_CLIENT_ID_LIVE');
    const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET_LIVE');

    if (!clientId || !clientSecret) {
        throw new Error('PayPal credentials not configured');
    }

    const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('PayPal OAuth failed:', response.status, errorText);
        throw new Error(`PayPal authentication failed: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
}

export async function verifyWebhookSignature(
    headers: Headers,
    rawBody: string,
): Promise<boolean> {
    const webhookId = Deno.env.get('PAYPAL_WEBHOOK_ID_LIVE');
    if (!webhookId) {
        console.error('PAYPAL_WEBHOOK_ID_LIVE not configured');
        return false;
    }

    try {
        const accessToken = await getPayPalAccessToken();

        const verificationPayload = {
            auth_algo: headers.get('paypal-auth-algo'),
            cert_url: headers.get('paypal-cert-url'),
            transmission_id: headers.get('paypal-transmission-id'),
            transmission_sig: headers.get('paypal-transmission-sig'),
            transmission_time: headers.get('paypal-transmission-time'),
            webhook_id: webhookId,
            webhook_event: JSON.parse(rawBody),
        };

        const response = await fetch(
            `${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(verificationPayload),
            },
        );

        if (!response.ok) {
            console.error('Webhook verification request failed:', response.status);
            return false;
        }

        const result = await response.json();
        return result.verification_status === 'SUCCESS';
    } catch (error) {
        console.error('Webhook verification error:', error);
        return false;
    }
}

export function getPlanEntitlements(planId: string): number {
    const starterPlanId = Deno.env.get('PAYPAL_PLAN_ID_STARTER_9');
    const proPlanId = Deno.env.get('PAYPAL_PLAN_ID_PRO_20');
    if (planId === starterPlanId) return 3;
    if (planId === proPlanId) return 5;
    return 0;
}

export function getPlanName(planId: string): string {
    const starterPlanId = Deno.env.get('PAYPAL_PLAN_ID_STARTER_9');
    const proPlanId = Deno.env.get('PAYPAL_PLAN_ID_PRO_20');
    if (planId === starterPlanId) return 'starter';
    if (planId === proPlanId) return 'pro';
    return 'unknown';
}
