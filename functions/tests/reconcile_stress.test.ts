import { describe, it, expect, vi } from 'vitest';
import { autoReconcile, ReconcileContext } from '../logic/reconcile.ts';

describe('autoReconcile Stress Test', () => {
  it('should handle large datasets efficiently', async () => {
    const numRevenue = 1000;
    const numBank = 5000;
    const userId = 'user_stress_test';

    // Generate Revenue
    const revenueTxns = [];
    const startDate = new Date('2024-01-01T00:00:00Z');
    for (let i = 0; i < numRevenue; i++) {
      const date = new Date(startDate.getTime() + i * 1000 * 60 * 60 * 2); // Every 2 hours
      revenueTxns.push({
        id: `rev_${i}`,
        amount: 100 + (i % 10),
        transaction_date: date.toISOString(),
        platform: 'stripe'
      });
    }

    // Generate Bank Txns (some matching, some not)
    const bankTxns = [];
    for (let i = 0; i < numBank; i++) {
        // Spread out over the same period + some buffer
        const date = new Date(startDate.getTime() + i * 1000 * 60 * 30); // Every 30 mins
        bankTxns.push({
            id: `bank_${i}`,
            amount: 100 + (i % 10), // Some overlap in amounts
            transaction_date: date.toISOString(),
            description: 'Deposit'
        });
    }

    const mockCtx: ReconcileContext = {
      fetchUnreconciledRevenue: vi.fn().mockResolvedValue(revenueTxns),
      fetchUnreconciledBankTransactions: vi.fn().mockResolvedValue(bankTxns),
      createReconciliations: vi.fn().mockResolvedValue(undefined),
      logAudit: vi.fn().mockResolvedValue(undefined),
    };

    const start = performance.now();
    const result = await autoReconcile(mockCtx, { id: userId });
    const end = performance.now();
    const duration = end - start;

    console.log(`AutoReconcile matched ${result.matchedCount} transactions in ${duration.toFixed(2)}ms`);
    console.log(`Dataset: ${numRevenue} revenue, ${numBank} bank`);

    expect(result.success).toBe(true);
  });
});
