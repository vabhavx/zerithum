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
      logAudit: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('should match exact amounts within date range (< 2 days) as exact_match (score 1000)', async () => {
    const revenues = [
      { id: 'rev_1', amount: 100, transaction_date: '2024-01-01T10:00:00Z', platform: 'platform_a' }
    ];
    // Next day (diff < 2 days)
    const bankTxns = [
      { id: 'bank_1', amount: 100, transaction_date: '2024-01-02T10:00:00Z', description: 'Deposit' }
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
        match_confidence: 1.0
        // Score would be 1000 - 1 = 999
      })
    ]);
  });

  it('should match exact amounts with >= 2 days diff as hold_period (score 600)', async () => {
    const revenues = [
      { id: 'rev_hold', amount: 100, transaction_date: '2024-01-01T10:00:00Z', platform: 'platform_a' }
    ];
    // 3 days later
    const bankTxns = [
      { id: 'bank_hold', amount: 100, transaction_date: '2024-01-04T10:00:00Z', description: 'Delayed Deposit' }
    ];

    (mockCtx.fetchUnreconciledRevenue as any).mockResolvedValue(revenues);
    (mockCtx.fetchUnreconciledBankTransactions as any).mockResolvedValue(bankTxns);

    const result = await autoReconcile(mockCtx, mockUser);

    expect(result.matchedCount).toBe(1);
    expect(mockCtx.createReconciliations).toHaveBeenCalledWith([
      expect.objectContaining({
        revenue_transaction_id: 'rev_hold',
        bank_transaction_id: 'bank_hold',
        match_category: 'hold_period',
        match_confidence: 1.0
        // Score would be 600 - 3 = 597
      })
    ]);
  });

  it('should match with fee deduction (score 800)', async () => {
    const revenues = [
      { id: 'rev_fee', amount: 100, transaction_date: '2024-01-01T10:00:00Z', platform: 'stripe' }
    ];
    // 96.80 is > 95% of 100
    const bankTxns = [
      { id: 'bank_fee', amount: 96.80, transaction_date: '2024-01-03T10:00:00Z', description: 'Stripe Payout' }
    ];

    (mockCtx.fetchUnreconciledRevenue as any).mockResolvedValue(revenues);
    (mockCtx.fetchUnreconciledBankTransactions as any).mockResolvedValue(bankTxns);

    const result = await autoReconcile(mockCtx, mockUser);

    expect(result.matchedCount).toBe(1);
    expect(mockCtx.createReconciliations).toHaveBeenCalledWith([
      expect.objectContaining({
        revenue_transaction_id: 'rev_fee',
        bank_transaction_id: 'bank_fee',
        match_category: 'fee_deduction',
        match_confidence: 0.9
        // Score would be 800 - 2 = 798
      })
    ]);
  });

  it('should prioritize exact_match over fee_deduction', async () => {
     // This case is tricky to construct with one rev/one bank unless they overlap logic?
     // Actually, if we have one revenue and multiple bank candidates.
     const revenues = [
       { id: 'rev_mix', amount: 100, transaction_date: '2024-01-01T10:00:00Z' }
     ];
     const bankTxns = [
       { id: 'bank_fee', amount: 98, transaction_date: '2024-01-02T10:00:00Z' }, // Fee deduction, score 800 - 1 = 799
       { id: 'bank_exact', amount: 100, transaction_date: '2024-01-02T11:00:00Z' } // Exact match, score 1000 - 1.04 = ~998
     ];

     (mockCtx.fetchUnreconciledRevenue as any).mockResolvedValue(revenues);
     (mockCtx.fetchUnreconciledBankTransactions as any).mockResolvedValue(bankTxns);

     const result = await autoReconcile(mockCtx, mockUser);

     expect(result.matchedCount).toBe(1);
     expect(mockCtx.createReconciliations).toHaveBeenCalledWith([
       expect.objectContaining({
         revenue_transaction_id: 'rev_mix',
         bank_transaction_id: 'bank_exact',
         match_category: 'exact_match'
       })
     ]);
  });

  it('should prioritize fee_deduction over hold_period', async () => {
    const revenues = [
      { id: 'rev_prio', amount: 100, transaction_date: '2024-01-01T10:00:00Z' }
    ];
    const bankTxns = [
      { id: 'bank_hold', amount: 100, transaction_date: '2024-01-05T10:00:00Z' }, // Hold Period (diff 4 days), score 600 - 4 = 596
      { id: 'bank_fee', amount: 98, transaction_date: '2024-01-05T10:00:00Z' } // Fee deduction (diff 4 days), score 800 - 4 = 796
    ];

    (mockCtx.fetchUnreconciledRevenue as any).mockResolvedValue(revenues);
    (mockCtx.fetchUnreconciledBankTransactions as any).mockResolvedValue(bankTxns);

    const result = await autoReconcile(mockCtx, mockUser);

    expect(result.matchedCount).toBe(1);
    expect(mockCtx.createReconciliations).toHaveBeenCalledWith([
      expect.objectContaining({
        revenue_transaction_id: 'rev_prio',
        bank_transaction_id: 'bank_fee', // Should pick fee deduction because score 796 > 596
        match_category: 'fee_deduction'
      })
    ]);
  });
});
