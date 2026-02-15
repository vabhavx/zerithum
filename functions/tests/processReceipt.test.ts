import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processReceipt, ProcessReceiptContext, User } from '../logic/processReceiptLogic.ts';

describe('processReceipt', () => {
  let mockInvokeLLM: any;
  let mockCategorizeExpense: any;
  let mockLogAudit: any;
  let mockLogError: any;
  let ctx: ProcessReceiptContext;
  let user: User;

  beforeEach(() => {
    mockInvokeLLM = vi.fn();
    mockCategorizeExpense = vi.fn();
    mockLogAudit = vi.fn().mockResolvedValue(undefined);
    mockLogError = vi.fn();

    ctx = {
      invokeLLM: mockInvokeLLM,
      categorizeExpense: mockCategorizeExpense,
      logAudit: mockLogAudit,
      logError: mockLogError
    };

    user = {
      id: 'user_123',
      email: 'test@example.com'
    };
  });

  it('should process receipt successfully', async () => {
    const receiptUrl = 'https://example.com/receipt.jpg';
    const mockExtracted = {
      merchant: 'Test Merchant',
      amount: 100,
      date: '2023-01-01',
      description: 'Test Description',
      payment_method: 'Credit Card'
    };
    const mockCategorization = {
      category: 'Office Supplies',
      confidence: 0.95
    };

    mockInvokeLLM.mockResolvedValue(mockExtracted);
    mockCategorizeExpense.mockResolvedValue({ data: mockCategorization });

    const result = await processReceipt(ctx, user, receiptUrl);

    expect(result.status).toBe(200);
    expect(result.body.success).toBe(true);
    expect(result.body.extracted).toEqual(mockExtracted);
    expect(result.body.categorization).toEqual(mockCategorization);

    expect(mockInvokeLLM).toHaveBeenCalledWith(expect.objectContaining({
      file_urls: [receiptUrl]
    }));
    expect(mockCategorizeExpense).toHaveBeenCalledWith(expect.objectContaining({
      description: 'Test Description',
      merchant: 'Test Merchant',
      amount: 100,
      receiptUrl
    }));
    expect(mockLogAudit).toHaveBeenCalledWith(expect.objectContaining({
      action: 'process_receipt',
      actor_id: user.id,
      status: 'success'
    }));
  });

  it('should return 400 if receipt URL is missing', async () => {
    const result = await processReceipt(ctx, user, '');

    expect(result.status).toBe(400);
    expect(result.body.error).toBe('Receipt URL required');
    expect(mockInvokeLLM).not.toHaveBeenCalled();
  });

  it('should handle LLM extraction failure', async () => {
    const receiptUrl = 'https://example.com/receipt.jpg';
    const error = new Error('LLM Error');
    mockInvokeLLM.mockRejectedValue(error);

    const result = await processReceipt(ctx, user, receiptUrl);

    expect(result.status).toBe(500);
    expect(result.body.error).toBe('Internal Server Error');

    expect(mockLogError).toHaveBeenCalledWith('Receipt processing error:', error);
    expect(mockLogAudit).toHaveBeenCalledWith(expect.objectContaining({
      action: 'process_receipt_failed',
      actor_id: user.id,
      status: 'failure',
      details: expect.objectContaining({
        error: 'LLM Error',
        receiptUrl
      })
    }));
  });

  it('should handle categorization failure', async () => {
    const receiptUrl = 'https://example.com/receipt.jpg';
    const mockExtracted = {
      merchant: 'Test Merchant',
      amount: 100,
      date: '2023-01-01',
      description: 'Test Description'
    };
    mockInvokeLLM.mockResolvedValue(mockExtracted);

    const error = new Error('Categorization Error');
    mockCategorizeExpense.mockRejectedValue(error);

    const result = await processReceipt(ctx, user, receiptUrl);

    expect(result.status).toBe(500);
    expect(result.body.error).toBe('Internal Server Error');

    expect(mockLogError).toHaveBeenCalledWith('Receipt processing error:', error);
    expect(mockLogAudit).toHaveBeenCalledWith(expect.objectContaining({
      action: 'process_receipt_failed',
      status: 'failure'
    }));
  });
});
