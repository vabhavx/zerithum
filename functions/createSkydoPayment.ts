import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { getPlanDetails } from './logic/paymentLogic.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    /** @type {any} */
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planName, billingPeriod } = await req.json();

    if (!planName || !billingPeriod) {
      return Response.json({ error: 'Missing required fields: planName, billingPeriod' }, { status: 400 });
    }

    // Get trusted price details from server-side logic
    let planDetails;
    try {
      planDetails = getPlanDetails(planName, billingPeriod);
    } catch (e) {
      return Response.json({ error: e.message }, { status: 400 });
    }

    const { amount, currency, description } = planDetails;

    // Create Skydo payment link
    const skydoApiKey = Deno.env.get('SKYDO_API_KEY');
    if (!skydoApiKey) {
      console.error('Skydo API key not configured');
      return Response.json({ error: 'Internal server error' }, { status: 500 });
    }

    // Skydo payment link creation
    const appUrl = Deno.env.get('APP_URL') || 'https://zerithum-copy-36d43903.base44.app';
    const skydoResponse = await fetch('https://api.skydo.com/v1/payment-links', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${skydoApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amount,
        currency: currency,
        description: description,
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
      console.error('Skydo API error:', errorData);
      // Do not leak details to client
      return Response.json({ 
        error: 'Failed to create payment link'
      }, { status: 500 });
    }

    const paymentData = await skydoResponse.json();

    // Log the payment attempt
    await base44.asServiceRole.entities.AuditLog.create({
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

    return Response.json({
      success: true,
      payment_url: paymentData.payment_url || paymentData.url,
      payment_id: paymentData.id
    });

  } catch (error: any) {
    console.error('Payment creation error:', error);
    // Generic error message for security
    return Response.json({ 
      error: 'Internal server error'
    }, { status: 500 });
  }
});
