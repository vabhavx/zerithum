
export interface PaymentContext {
  envGet: (key: string) => string | undefined;
  fetch: (url: string, init?: any) => Promise<any>;
  base44: any;
  logger: {
    error: (msg: string, ...args: any[]) => void;
    info: (msg: string, ...args: any[]) => void;
  };
}

export interface PaymentResult {
  statusCode: number;
  body: any;
}

export async function handlePaymentCreation(
  ctx: PaymentContext,
  inputBody: any
): Promise<PaymentResult> {
  try {
    const user = await ctx.base44.auth.me();

    if (!user) {
      return { statusCode: 401, body: { error: 'Unauthorized' } };
    }

    const { planName, amount, currency = 'USD', billingPeriod } = inputBody;

    // 🛡️ Sentinel: Input Validation
    if (!planName || !amount) {
      return { statusCode: 400, body: { error: 'Missing required fields' } };
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return { statusCode: 400, body: { error: 'Invalid amount' } };
    }

    if (typeof currency !== 'string' || currency.length !== 3) {
      return { statusCode: 400, body: { error: 'Invalid currency' } };
    }

    const skydoApiKey = ctx.envGet('SKYDO_API_KEY');
    if (!skydoApiKey) {
      ctx.logger.error('Configuration Error: Skydo API key not configured');
      return { statusCode: 500, body: { error: 'Payment service unavailable' } };
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
      // 🛡️ Sentinel: Secure Error Handling
      // Do NOT leak the upstream error body to the client
      let errorData;
      try {
        errorData = await skydoResponse.json();
      } catch (e) {
        errorData = await skydoResponse.text();
      }

      ctx.logger.error('Skydo API error:', errorData);

      return {
        statusCode: 502, // Bad Gateway is appropriate for upstream failure, or 500
        body: { error: 'Failed to create payment link' }
      };
    }

    const paymentData = await skydoResponse.json();

    // Log the payment attempt
    try {
      await ctx.base44.asServiceRole.entities.AuditLog.create({
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
    } catch (auditError) {
      // Non-blocking audit log failure
      ctx.logger.error('Failed to create audit log:', auditError);
    }

    return {
      statusCode: 200,
      body: {
        success: true,
        payment_url: paymentData.payment_url || paymentData.url,
        payment_id: paymentData.id
      }
    };

  } catch (error: any) {
    // 🛡️ Sentinel: Generic Error Message
    ctx.logger.error('Payment creation error:', error);
    return { statusCode: 500, body: { error: 'Internal server error' } };
  }
}
