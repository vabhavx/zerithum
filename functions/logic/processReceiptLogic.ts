import { AuditLogEntry } from '../utils/audit.ts';
import { validateReceiptUrl } from '../utils/security.ts';

export interface ProcessReceiptContext {
  base44: any;
  logAudit: (base44: any, entry: AuditLogEntry) => Promise<void>;
}

export interface ServiceResponse {
  status: number;
  body: any;
}

export async function processReceiptLogic(
  ctx: ProcessReceiptContext,
  user: any,
  body: any
): Promise<ServiceResponse> {
  const { receiptUrl } = body;

  if (!receiptUrl) {
    return { status: 400, body: { error: 'Receipt URL required' } };
  }

  if (!validateReceiptUrl(receiptUrl)) {
    return { status: 400, body: { error: 'Invalid Receipt URL' } };
  }

  try {
    // Extract data from receipt using AI
    const prompt = `Extract expense details from this receipt image. Be precise with the information.

Extract:
- Merchant/vendor name
- Total amount (just the number)
- Date (in YYYY-MM-DD format)
- Description/items purchased
- Payment method if visible

If you cannot determine something, use null.`;

    const result = await ctx.base44.integrations.Core.InvokeLLM({
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
    const categorizationResult = await ctx.base44.functions.invoke('categorizeExpense', {
      description: result.description,
      merchant: result.merchant,
      amount: result.amount,
      receiptUrl
    });

    await ctx.logAudit(ctx.base44, {
      action: 'process_receipt',
      actor_id: user.id,
      status: 'success',
      details: {
        receiptUrl,
        merchant: result.merchant,
        amount: result.amount
      }
    });

    return {
      status: 200,
      body: {
        success: true,
        extracted: result,
        categorization: categorizationResult.data
      }
    };

  } catch (error: any) {
    console.error('Receipt processing error:', error);

    await ctx.logAudit(ctx.base44, {
      action: 'process_receipt_failed',
      actor_id: user?.id,
      status: 'failure',
      details: {
        error: error.message,
        receiptUrl: body?.receiptUrl
      }
    });

    return { status: 500, body: { error: 'Internal Server Error' } };
  }
}
