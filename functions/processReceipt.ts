import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { logAudit } from './utils/audit.ts';
import { processReceipt } from './logic/processReceiptLogic.ts';

Deno.serve(async (req) => {
  let user = null;
  let body: any = {};
  let base44;

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

    const { receiptUrl } = body;

    const result = await processReceipt(
      {
        invokeLLM: (params) => base44.integrations.Core.InvokeLLM(params),
        categorizeExpense: (params) => base44.functions.invoke('categorizeExpense', params),
        logAudit: (entry) => logAudit(base44, entry),
        logError: console.error
      },
      user,
      receiptUrl
    );

    return Response.json(result.body, { status: result.status });

  } catch (error) {
    console.error('Receipt processing error:', error);

    // Attempt to log audit failure if we have a user and client
    if (base44 && user) {
        logAudit(base44, {
            action: 'process_receipt_failed',
            actor_id: user.id,
            status: 'failure',
            details: {
                error: error.message || String(error),
                receiptUrl: body?.receiptUrl
            }
        }).catch(console.error);
    }

    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
