import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { logAudit } from './utils/audit.ts';
import { processReceiptLogic } from './logic/processReceiptLogic.ts';

Deno.serve(async (req) => {
  let user = null;
  let body: any = {};
  let base44: any = null;

  try {
    base44 = createClientFromRequest(req);
    user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      body = await req.json();
    } catch(e) {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const result = await processReceiptLogic(
      { base44, logAudit },
      user,
      body
    );

    return Response.json(result.body, { status: result.status });

  } catch (error: any) {
    console.error('Receipt processing error:', error);

    if (base44) {
        await logAudit(base44, {
            action: 'process_receipt_failed',
            actor_id: user?.id,
            status: 'failure',
            details: {
                error: error.message,
                receiptUrl: body?.receiptUrl
            }
        });
    }

    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
