import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { getPlanDetails } from './logic/paymentLogic.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planName, billingPeriod } = await req.json();

    if (!planName) {
      return Response.json({ error: 'Missing planName' }, { status: 400 });
    }

    // 🛡️ Sentinel: Security Fix - Parameter Tampering
    // Use authoritative source for price, ignoring client provided amount
    let planDetails;
    try {
      planDetails = getPlanDetails(planName, billingPeriod);
    } catch (e: any) {
      return Response.json({ error: e.message }, { status: 400 });
    }

    // Create Skydo payment link
    const skydoApiKey = Deno.env.get('SKYDO_API_KEY');
    if (!skydoApiKey) {
      console.error('Skydo API key not configured');
      return Response.json({ error: 'Internal server error' }, { status: 500 });
    }

    // Skydo payment link creation
    const skydoResponse = await fetch('https://api.skydo.com/v1/payment-links', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${skydoApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: planDetails.price,
        currency: planDetails.currency,
        description: `${planDetails.name} - ${billingPeriod || 'monthly'} subscription`,
        customer: {
          email: user.email,
          name: user.full_name || user.email
        },
        metadata: {
          user_id: user.id,
          plan: planDetails.name,
          billing_period: billingPeriod || 'monthly'
        },
        success_url: `${Deno.env.get('APP_URL') || 'https://zerithum-copy-36d43903.base44.app'}/pricing?payment=success`,
        cancel_url: `${Deno.env.get('APP_URL') || 'https://zerithum-copy-36d43903.base44.app'}/pricing?payment=cancelled`
      })
    });

    if (!skydoResponse.ok) {
      const errorData = await skydoResponse.json();
      console.error('Skydo API error:', errorData);
      // 🛡️ Sentinel: Security Fix - Secure Error Messages
      // Do not leak details: errorData
      return Response.json({ 
        error: 'Failed to create payment link'
      }, { status: skydoResponse.status });
    }

    const paymentData = await skydoResponse.json();

    // Log the payment attempt
    await base44.asServiceRole.entities.AuditLog.create({
      user_id: user.id,
      action: 'payment_initiated',
      resource_type: 'subscription',
      data: {
        plan: planDetails.name,
        amount: planDetails.price,
        currency: planDetails.currency,
        billing_period: billingPeriod || 'monthly',
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
    // 🛡️ Sentinel: Security Fix - Secure Error Messages
    // Do not leak message: error.message
    return Response.json({ 
      error: 'Internal server error'
    }, { status: 500 });
  }
});
