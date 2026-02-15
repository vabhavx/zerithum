import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processReceiptLogic, ProcessReceiptContext } from '../logic/processReceiptLogic.ts';

describe('processReceiptLogic', () => {
  let mockBase44: any;
  let mockLogAudit: any;
  let ctx: ProcessReceiptContext;
  let user: any;

  beforeEach(() => {
    mockBase44 = {
      auth: {
        me: vi.fn().mockResolvedValue({ id: 'user_123' })
      },
      integrations: {
        Core: {
          InvokeLLM: vi.fn()
        }
      },
      functions: {
        invoke: vi.fn()
      }
    };

    mockLogAudit = vi.fn().mockResolvedValue(undefined);

    ctx = {
      base44: mockBase44,
      logAudit: mockLogAudit
    };

    user = { id: 'user_123' };
  });

  it('should process receipt successfully', async () => {
    const mockLLMResult = {
      merchant: 'Test Merchant',
      amount: 100,
      date: '2023-10-27',
      description: 'Test Description',
      payment_method: 'Credit Card'
    };

    const mockCategorizationResult = {
      data: {
        category: 'office_supplies',
        is_tax_deductible: true,
        deduction_percentage: 100,
        confidence: 0.95
      }
    };

    mockBase44.integrations.Core.InvokeLLM.mockResolvedValue(mockLLMResult);
    mockBase44.functions.invoke.mockResolvedValue(mockCategorizationResult);

    const body = { receiptUrl: 'https://example.com/receipt.jpg' };
    const result = await processReceiptLogic(ctx, user, body);

    expect(result.status).toBe(200);
    expect(result.body.success).toBe(true);
    expect(result.body.extracted).toEqual(mockLLMResult);
    expect(result.body.categorization).toEqual(mockCategorizationResult.data);

    expect(mockBase44.integrations.Core.InvokeLLM).toHaveBeenCalledWith(expect.objectContaining({
      file_urls: ['https://example.com/receipt.jpg']
    }));

    expect(mockBase44.functions.invoke).toHaveBeenCalledWith('categorizeExpense', expect.objectContaining({
      merchant: 'Test Merchant',
      amount: 100,
      description: 'Test Description',
      receiptUrl: 'https://example.com/receipt.jpg'
    }));

    expect(mockLogAudit).toHaveBeenCalledWith(mockBase44, expect.objectContaining({
      action: 'process_receipt',
      actor_id: 'user_123',
      status: 'success',
      details: expect.objectContaining({
        merchant: 'Test Merchant',
        amount: 100
      })
    }));
  });

  it('should return 400 if receiptUrl is missing', async () => {
    const body = {};
    const result = await processReceiptLogic(ctx, user, body);

    expect(result.status).toBe(400);
    expect(result.body.error).toBe('Receipt URL required');
    expect(mockLogAudit).not.toHaveBeenCalled();
  });

  it('should return 400 if receiptUrl is invalid (localhost)', async () => {
    const body = { receiptUrl: 'http://localhost:3000/receipt.jpg' };
    const result = await processReceiptLogic(ctx, user, body);

    expect(result.status).toBe(400);
    expect(result.body.error).toBe('Invalid Receipt URL');
    expect(mockLogAudit).not.toHaveBeenCalled();
  });

  it('should return 400 if receiptUrl is invalid (private IP)', async () => {
    const body = { receiptUrl: 'http://192.168.1.1/receipt.jpg' };
    const result = await processReceiptLogic(ctx, user, body);

    expect(result.status).toBe(400);
    expect(result.body.error).toBe('Invalid Receipt URL');
    expect(mockLogAudit).not.toHaveBeenCalled();
  });

  it('should handle LLM failure', async () => {
    mockBase44.integrations.Core.InvokeLLM.mockRejectedValue(new Error('LLM Error'));

    const body = { receiptUrl: 'https://example.com/receipt.jpg' };
    const result = await processReceiptLogic(ctx, user, body);

    expect(result.status).toBe(500);
    expect(result.body.error).toBe('Internal Server Error');

    expect(mockLogAudit).toHaveBeenCalledWith(mockBase44, expect.objectContaining({
      action: 'process_receipt_failed',
      status: 'failure',
      details: expect.objectContaining({
        error: 'LLM Error',
        receiptUrl: 'https://example.com/receipt.jpg'
      })
    }));
  });

  it('should handle categorization failure', async () => {
    const mockLLMResult = {
      merchant: 'Test Merchant',
      amount: 100
    };
    mockBase44.integrations.Core.InvokeLLM.mockResolvedValue(mockLLMResult);
    mockBase44.functions.invoke.mockRejectedValue(new Error('Categorization Error'));

    const body = { receiptUrl: 'https://example.com/receipt.jpg' };
    const result = await processReceiptLogic(ctx, user, body);

    expect(result.status).toBe(500);
    expect(result.body.error).toBe('Internal Server Error');

    expect(mockLogAudit).toHaveBeenCalledWith(mockBase44, expect.objectContaining({
      action: 'process_receipt_failed',
      status: 'failure',
      details: expect.objectContaining({
        error: 'Categorization Error'
      })
    }));
  });
});
