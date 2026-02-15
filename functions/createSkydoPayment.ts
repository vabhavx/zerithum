import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createSkydoPayment } from './logic/createSkydoPaymentLogic.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planName, billingPeriod } = await req.json();

    const result = await createSkydoPayment(
      {
        envGet: (key) => Deno.env.get(key),
        fetch: fetch,
        logError: console.error,
        auditLogCreate: (data) => base44.asServiceRole.entities.AuditLog.create(data)
      },
      user,
      planName,
      billingPeriod
    );

    return Response.json(result.body, { status: result.status });

  } catch (error) {
    console.error('Payment creation error:', error);
    return Response.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
});
