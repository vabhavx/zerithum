import { describe, it, expect, vi, beforeEach } from 'vitest';
import { autoReconcile, ReconcileContext } from '../logic/reconcile';

describe('autoReconcile', () => {
  let mockCtx: ReconcileContext;
  const mockUser = { id: 'user_123' };

  beforeEach(() => {
    mockCtx = {
      fetchUnreconciledRevenue: vi.fn(),
      fetchUnreconciledBankTransactions: vi.fn(),
      createReconciliations: vi.fn().mockResolvedValue(undefined),
      logAudit: vi.fn(),
    };
  });

  it('should match exact amounts within date range', async () => {
    const revenues = [
      { id: 'rev_1', amount: 100, transaction_date: '2024-01-01', platform: 'platform_a' }
    ];
    const bankTxns = [
      { id: 'bank_1', amount: 100, transaction_date: '2024-01-02', description: 'Deposit' }
    ];

    (mockCtx.fetchUnreconciledRevenue as any).mockResolvedValue(revenues);
    (mockCtx.fetchUnreconciledBankTransactions as any).mockResolvedValue(bankTxns);

    const result = await autoReconcile(mockCtx, mockUser);

    expect(result.matchedCount).toBe(1);
    expect(mockCtx.createReconciliations).toHaveBeenCalledWith([
      expect.objectContaining({
        revenue_transaction_id: 'rev_1',
        bank_transaction_id: 'bank_1',
        match_category: 'exact_match',
        match_confidence: 1.0,
        reconciled_by: 'auto'
      })
    ]);
  });

  it('should match with fee deduction (approximate match)', async () => {
    const revenues = [
      { id: 'rev_2', amount: 100, transaction_date: '2024-01-01', platform: 'stripe' }
    ];
    // Stripe fee is roughly 2.9% + 30c = 3.20 -> 96.80
    const bankTxns = [
      { id: 'bank_2', amount: 96.80, transaction_date: '2024-01-03', description: 'Stripe Payout' }
    ];

    (mockCtx.fetchUnreconciledRevenue as any).mockResolvedValue(revenues);
    (mockCtx.fetchUnreconciledBankTransactions as any).mockResolvedValue(bankTxns);

    const result = await autoReconcile(mockCtx, mockUser);

    expect(result.matchedCount).toBe(1);
    expect(mockCtx.createReconciliations).toHaveBeenCalledWith([
      expect.objectContaining({
        revenue_transaction_id: 'rev_2',
        bank_transaction_id: 'bank_2',
        match_category: 'fee_deduction',
        match_confidence: 0.9,
        reconciled_by: 'auto'
      })
    ]);
  });

  it('should not match if date is too far apart', async () => {
    const revenues = [
      { id: 'rev_3', amount: 100, transaction_date: '2024-01-01', platform: 'platform_a' }
    ];
    const bankTxns = [
      { id: 'bank_3', amount: 100, transaction_date: '2024-02-01', description: 'Late Deposit' } // > 14 days
    ];

    (mockCtx.fetchUnreconciledRevenue as any).mockResolvedValue(revenues);
    (mockCtx.fetchUnreconciledBankTransactions as any).mockResolvedValue(bankTxns);

    const result = await autoReconcile(mockCtx, mockUser);

    expect(result.matchedCount).toBe(0);
    expect(mockCtx.createReconciliations).not.toHaveBeenCalled();
  });

  it('should pick the closest match when multiple candidates exist', async () => {
    const revenues = [
      { id: 'rev_4', amount: 100, transaction_date: '2024-01-01', platform: 'platform_a' }
    ];
    const bankTxns = [
      { id: 'bank_4a', amount: 100, transaction_date: '2024-01-10', description: 'Deposit A' },
      { id: 'bank_4b', amount: 100, transaction_date: '2024-01-02', description: 'Deposit B' } // Closer
    ];

    (mockCtx.fetchUnreconciledRevenue as any).mockResolvedValue(revenues);
    (mockCtx.fetchUnreconciledBankTransactions as any).mockResolvedValue(bankTxns);

    const result = await autoReconcile(mockCtx, mockUser);

    expect(result.matchedCount).toBe(1);
    expect(mockCtx.createReconciliations).toHaveBeenCalledWith([
      expect.objectContaining({
        revenue_transaction_id: 'rev_4',
        bank_transaction_id: 'bank_4b'
      })
    ]);
  });

  it('should handle one-to-one mapping strictly (greedy match)', async () => {
    const revenues = [
      { id: 'rev_5', amount: 100, transaction_date: '2024-01-01' },
      { id: 'rev_6', amount: 100, transaction_date: '2024-01-02' }
    ];
    const bankTxns = [
      { id: 'bank_5', amount: 100, transaction_date: '2024-01-03' }
    ];

    (mockCtx.fetchUnreconciledRevenue as any).mockResolvedValue(revenues);
    (mockCtx.fetchUnreconciledBankTransactions as any).mockResolvedValue(bankTxns);

    const result = await autoReconcile(mockCtx, mockUser);

    expect(result.matchedCount).toBe(1);
    // Should match one of them, typically the first or best fit.
    // In this case, rev_6 is closer (1 day diff) than rev_5 (2 days diff).
    // So ideally it matches rev_6.
    expect(mockCtx.createReconciliations).toHaveBeenCalledWith([
        expect.objectContaining({
            revenue_transaction_id: 'rev_6',
            bank_transaction_id: 'bank_5'
        })
    ]);
  });
});
