import { autoReconcile, ReconcileContext } from '../logic/reconcile';
import { describe, it, expect, vi } from 'vitest';

describe('autoReconcile Benchmark', () => {
    it('should be performant with large datasets', async () => {
        const itemCount = 5000;
        const revenueTxns: any[] = [];
        const bankTxns: any[] = [];

        // Generate synthetic data
        const startDate = new Date('2023-01-01T00:00:00Z').getTime();
        for (let i = 0; i < itemCount; i++) {
            // Random date within 30 days
            const time = startDate + Math.random() * 30 * 24 * 3600 * 1000;
            const dateStr = new Date(time).toISOString();
            const amount = Math.floor(Math.random() * 1000) + 10;

            revenueTxns.push({
                id: `rev-${i}`,
                transaction_date: dateStr,
                amount: amount,
                // Add some extra properties to simulate real objects
                currency: 'USD',
                description: `Revenue item ${i}`,
                customer_id: `cust-${i % 100}`,
                status: 'completed'
            });

            // 80% chance of a match
            if (Math.random() < 0.8) {
                const matchType = Math.random();
                let bankAmount = amount;
                let bankTime = time;

                if (matchType < 0.5) {
                    // Exact match
                    bankTime += Math.random() * 24 * 3600 * 1000; // Within 1 day
                } else if (matchType < 0.8) {
                    // Hold period (within 14 days)
                    bankTime += (2 + Math.random() * 10) * 24 * 3600 * 1000;
                } else {
                    // Fee deduction
                    bankAmount = amount * 0.98;
                    bankTime += Math.random() * 24 * 3600 * 1000;
                }

                bankTxns.push({
                    id: `bank-${i}`,
                    transaction_date: new Date(bankTime).toISOString(),
                    amount: bankAmount,
                    description: `Bank deposit ${i}`,
                    currency: 'USD'
                });
            }
        }

        // Add noise bank transactions
        for (let i = 0; i < itemCount / 2; i++) {
             const time = startDate + Math.random() * 45 * 24 * 3600 * 1000;
             bankTxns.push({
                id: `bank-noise-${i}`,
                transaction_date: new Date(time).toISOString(),
                amount: Math.floor(Math.random() * 1000) + 10,
                description: `Bank noise ${i}`,
                currency: 'USD'
             });
        }

        const ctx: ReconcileContext = {
            fetchUnreconciledRevenue: vi.fn().mockResolvedValue(revenueTxns),
            fetchUnreconciledBankTransactions: vi.fn().mockResolvedValue(bankTxns),
            createReconciliations: vi.fn().mockResolvedValue(undefined),
            logAudit: vi.fn().mockResolvedValue(undefined),
        };

        const start = performance.now();
        await autoReconcile(ctx, { id: 'u1' });
        const end = performance.now();

        console.log(`Benchmark: Processed ${revenueTxns.length} revenue and ${bankTxns.length} bank txns in ${(end - start).toFixed(2)}ms`);
    });
});
