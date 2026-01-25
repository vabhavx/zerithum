import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { handlePaymentCreation, PaymentContext } from './logic/paymentLogic.ts';

Deno.serve(async (req) => {
  let body = {};
  try {
    body = await req.json();
  } catch (_e) {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Create context
  // Note: we create client here. If it fails, it throws.
  // Ideally we wrap this too, but base44 sdk usually handles creation fine.
  // However, for consistency, let's wrap strictly.

  let base44;
  try {
    base44 = createClientFromRequest(req);
  } catch (e) {
    console.error('Failed to create base44 client:', e);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }

  const ctx: PaymentContext = {
    base44,
    fetch: fetch,
    envGet: (key) => Deno.env.get(key),
    logger: {
      error: console.error,
      info: console.info
    }
  };

  const result = await handlePaymentCreation(ctx, body);

  return Response.json(result.body, { status: result.statusCode });
});
