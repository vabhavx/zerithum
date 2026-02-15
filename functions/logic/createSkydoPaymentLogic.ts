import { getPlanDetails } from './paymentLogic.ts';

export interface SkydoPaymentContext {
  envGet: (key: string) => string | undefined;
  fetch: (url: string, init?: any) => Promise<Response>;
  logError: (msg: string, ...args: any[]) => void;
  auditLogCreate: (data: any) => Promise<any>;
}

export interface SkydoUser {
  id: string;
  email: string;
  full_name?: string;
}

export interface ServiceResponse {
  status: number;
  body: any;
}

export async function createSkydoPayment(
  ctx: SkydoPaymentContext,
  user: SkydoUser,
  planName: string,
  billingPeriod: string
): Promise<ServiceResponse> {
    if (!planName || !billingPeriod) {
      return { status: 400, body: { error: 'Missing required fields: planName, billingPeriod' } };
    }

    // 🛡️ Sentinel: Server-side pricing validation
    // Prevent price manipulation by ignoring client-provided amount
    let priceDetails;
    try {
      priceDetails = getPlanDetails(planName, billingPeriod);
    } catch (e: any) {
      return { status: 400, body: { error: e.message } };
    }

    const { price: amount, currency } = priceDetails;

    // Create Skydo payment link
    const skydoApiKey = ctx.envGet('SKYDO_API_KEY');
    if (!skydoApiKey) {
      return { status: 500, body: { error: 'Skydo API key not configured' } };
    }

    const appUrl = ctx.envGet('APP_URL') || 'https://zerithum-copy-36d43903.base44.app';

    // Skydo payment link creation
    const skydoResponse = await ctx.fetch('https://api.skydo.com/v1/payment-links', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${skydoApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amount,
        currency: currency,
        description: `${planName} - ${billingPeriod} subscription`,
        customer: {
          email: user.email,
          name: user.full_name || user.email
        },
        metadata: {
          user_id: user.id,
          plan: planName,
          billing_period: billingPeriod
        },
        success_url: `${appUrl}/pricing?payment=success`,
        cancel_url: `${appUrl}/pricing?payment=cancelled`
      })
    });

    if (!skydoResponse.ok) {
      const errorData = await skydoResponse.json();
      ctx.logError('Skydo API error:', errorData);
      return {
        status: skydoResponse.status,
        body: {
            error: 'Failed to create payment link',
            details: errorData
        }
      };
    }

    const paymentData = await skydoResponse.json();

    // Log the payment attempt
    await ctx.auditLogCreate({
      user_id: user.id,
      action: 'payment_initiated',
      resource_type: 'subscription',
      data: {
        plan: planName,
        amount,
        currency,
        billing_period: billingPeriod,
        payment_id: paymentData.id
      }
    });

    return {
      status: 200,
      body: {
        success: true,
        payment_url: paymentData.payment_url || paymentData.url,
        payment_id: paymentData.id
      }
    };
}
