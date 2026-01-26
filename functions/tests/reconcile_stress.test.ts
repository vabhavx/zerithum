import { describe, it, expect, vi, beforeEach } from 'vitest';
import { autoReconcile, ReconcileContext } from '../logic/reconcile';

describe('autoReconcile Stress Test', () => {
  let mockCtx: ReconcileContext;
  const mockUser = { id: 'user_stress' };

  beforeEach(() => {
    mockCtx = {
      fetchUnreconciledRevenue: vi.fn(),
      fetchUnreconciledBankTransactions: vi.fn(),
      createReconciliations: vi.fn().mockResolvedValue(undefined),
      logAudit: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('should handle large datasets (1000 revenue, 5000 bank txns) efficiently', async () => {
    const revenueCount = 1000;
    const bankCount = 5000;
    const revenues = [];
    const bankTxns = [];

    const startDate = new Date('2024-01-01T00:00:00Z');

    // Generate Revenue
    // Distribute randomly over 100 days, but unsorted to test sorting requirement if we add it
    for (let i = 0; i < revenueCount; i++) {
        const randomDays = Math.floor(Math.random() * 100);
        const date = new Date(startDate.getTime() + randomDays * 24 * 60 * 60 * 1000);
        revenues.push({
            id: `rev_${i}`,
            amount: 100 + (i % 50), // distinct amounts
            transaction_date: date.toISOString(),
            platform: 'platform_a'
        });
    }

    // Generate Bank Txns
    for (let i = 0; i < bankCount; i++) {
        const randomDays = Math.floor(Math.random() * 110);
        const date = new Date(startDate.getTime() + randomDays * 24 * 60 * 60 * 1000);

        bankTxns.push({
            id: `bank_${i}`,
            amount: 100 + (i % 50), // matches revenue amounts
            transaction_date: date.toISOString(),
            description: 'Deposit'
        });
    }

    (mockCtx.fetchUnreconciledRevenue as any).mockResolvedValue(revenues);
    (mockCtx.fetchUnreconciledBankTransactions as any).mockResolvedValue(bankTxns);

    const start = performance.now();
    const result = await autoReconcile(mockCtx, mockUser);
    const end = performance.now();

    console.log(`Stress test duration: ${(end - start).toFixed(2)}ms`);
    console.log(`Matched: ${result.matchedCount}`);

    expect(result.success).toBe(true);
    expect(result.matchedCount).toBeGreaterThan(0);
  });
});
