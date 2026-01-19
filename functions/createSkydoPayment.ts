import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planName, amount, currency = 'USD', billingPeriod } = await req.json();

    if (!planName || !amount) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create Skydo payment link
    const skydoApiKey = Deno.env.get('SKYDO_API_KEY');
    if (!skydoApiKey) {
      return Response.json({ error: 'Skydo API key not configured' }, { status: 500 });
    }

    // Skydo payment link creation
    const skydoResponse = await fetch('https://api.skydo.com/v1/payment-links', {
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
        success_url: `${Deno.env.get('APP_URL') || 'https://zerithum-copy-36d43903.base44.app'}/pricing?payment=success`,
        cancel_url: `${Deno.env.get('APP_URL') || 'https://zerithum-copy-36d43903.base44.app'}/pricing?payment=cancelled`
      })
    });

    if (!skydoResponse.ok) {
      const errorData = await skydoResponse.json();
      console.error('Skydo API error:', errorData);
      return Response.json({ 
        error: 'Failed to create payment link',
        details: errorData 
      }, { status: skydoResponse.status });
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

  } catch (error) {
    console.error('Payment creation error:', error);
    return Response.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
});