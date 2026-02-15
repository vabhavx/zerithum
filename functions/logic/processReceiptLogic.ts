import { AuditLogEntry } from '../utils/audit.ts';

export interface ProcessReceiptContext {
  invokeLLM: (params: any) => Promise<any>;
  categorizeExpense: (params: any) => Promise<any>;
  logAudit: (entry: AuditLogEntry) => Promise<void>;
  logError: (msg: string, ...args: any[]) => void;
}

export interface User {
  id: string;
  [key: string]: any;
}

export interface ServiceResponse {
  status: number;
  body: any;
}

export async function processReceipt(
  ctx: ProcessReceiptContext,
  user: User,
  receiptUrl: string
): Promise<ServiceResponse> {
  if (!receiptUrl) {
    return { status: 400, body: { error: 'Receipt URL required' } };
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

    const result = await ctx.invokeLLM({
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
    const categorizationResult = await ctx.categorizeExpense({
      description: result.description,
      merchant: result.merchant,
      amount: result.amount,
      receiptUrl
    });

    await ctx.logAudit({
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
    ctx.logError('Receipt processing error:', error);

    await ctx.logAudit({
        action: 'process_receipt_failed',
        actor_id: user.id,
        status: 'failure',
        details: {
            error: error.message || String(error),
            receiptUrl
        }
    });

    return { status: 500, body: { error: 'Internal Server Error' } };
  }
}
