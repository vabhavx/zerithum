import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { logAudit } from './utils/audit.ts';

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

    const { receiptUrl } = body;

    if (!receiptUrl) {
      return Response.json({ error: 'Receipt URL required' }, { status: 400 });
    }

    // Extract data from receipt using AI
    const prompt = `Extract expense details from this receipt image. Be precise with the information.

Extract:
- Merchant/vendor name
- Total amount (just the number)
- Date (in YYYY-MM-DD format)
- Description/items purchased
- Payment method if visible

If you cannot determine something, use null.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [receiptUrl],
      response_json_schema: {
        type: "object",
        properties: {
          merchant: { type: "string" },
          amount: { type: "number" },
          date: { type: "string" },
          description: { type: "string" },
          payment_method: { type: "string" }
        }
      }
    });

    // Auto-categorize based on extracted data
    const categorizationResult = await base44.functions.invoke('categorizeExpense', {
      description: result.description,
      merchant: result.merchant,
      amount: result.amount,
      receiptUrl
    });

    await logAudit(base44, {
        action: 'process_receipt',
        actor_id: user.id,
        status: 'success',
        details: {
            receiptUrl,
            merchant: result.merchant,
            amount: result.amount
        }
    });

    return Response.json({
      success: true,
      extracted: result,
      categorization: categorizationResult.data
    });

  } catch (error) {
    console.error('Receipt processing error:', error);

    await logAudit(base44, {
        action: 'process_receipt_failed',
        actor_id: user?.id,
        status: 'failure',
        details: {
            error: error.message,
            receiptUrl: body?.receiptUrl
        }
    });

    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
