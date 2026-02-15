import { autoReconcile, ReconcileContext } from '../logic/reconcile';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('autoReconcile Correctness', () => {
    let ctx: ReconcileContext;
    let createReconciliationsMock: any;
    let logAuditMock: any;

    beforeEach(() => {
        createReconciliationsMock = vi.fn().mockResolvedValue(undefined);
        logAuditMock = vi.fn().mockResolvedValue(undefined);
        ctx = {
            fetchUnreconciledRevenue: vi.fn(),
            fetchUnreconciledBankTransactions: vi.fn(),
            createReconciliations: createReconciliationsMock,
            logAudit: logAuditMock,
        };
    });

    it('should match exact amount on same day', async () => {
        const rev = { id: 'r1', transaction_date: '2023-01-01T10:00:00Z', amount: 100 };
        const bank = { id: 'b1', transaction_date: '2023-01-01T12:00:00Z', amount: 100 };

        (ctx.fetchUnreconciledRevenue as any).mockResolvedValue([rev]);
        (ctx.fetchUnreconciledBankTransactions as any).mockResolvedValue([bank]);

        await autoReconcile(ctx, { id: 'u1' });

        expect(createReconciliationsMock).toHaveBeenCalledWith([
            expect.objectContaining({
                revenue_transaction_id: 'r1',
                bank_transaction_id: 'b1',
                match_category: 'exact_match',
                match_confidence: 1.0,
            })
        ]);
    });

    it('should match exact amount within 14 days', async () => {
        const rev = { id: 'r1', transaction_date: '2023-01-01T10:00:00Z', amount: 100 };
        const bank = { id: 'b1', transaction_date: '2023-01-14T10:00:00Z', amount: 100 }; // 13 days later

        (ctx.fetchUnreconciledRevenue as any).mockResolvedValue([rev]);
        (ctx.fetchUnreconciledBankTransactions as any).mockResolvedValue([bank]);

        await autoReconcile(ctx, { id: 'u1' });

        expect(createReconciliationsMock).toHaveBeenCalledWith([
            expect.objectContaining({
                revenue_transaction_id: 'r1',
                bank_transaction_id: 'b1',
                match_category: 'hold_period',
            })
        ]);
    });

    it('should NOT match if > 14 days', async () => {
        const rev = { id: 'r1', transaction_date: '2023-01-01T10:00:00Z', amount: 100 };
        const bank = { id: 'b1', transaction_date: '2023-01-16T10:00:00Z', amount: 100 }; // 15 days later

        (ctx.fetchUnreconciledRevenue as any).mockResolvedValue([rev]);
        (ctx.fetchUnreconciledBankTransactions as any).mockResolvedValue([bank]);

        const result = await autoReconcile(ctx, { id: 'u1' });

        expect(createReconciliationsMock).not.toHaveBeenCalled();
        expect(result.matchedCount).toBe(0);
    });

    it('should NOT match if bank is before revenue', async () => {
        const rev = { id: 'r1', transaction_date: '2023-01-02T10:00:00Z', amount: 100 };
        const bank = { id: 'b1', transaction_date: '2023-01-01T10:00:00Z', amount: 100 };

        (ctx.fetchUnreconciledRevenue as any).mockResolvedValue([rev]);
        (ctx.fetchUnreconciledBankTransactions as any).mockResolvedValue([bank]);

        const result = await autoReconcile(ctx, { id: 'u1' });
        expect(result.matchedCount).toBe(0);
    });

    it('should match fee deduction', async () => {
        const rev = { id: 'r1', transaction_date: '2023-01-01T10:00:00Z', amount: 100 };
        const bank = { id: 'b1', transaction_date: '2023-01-01T12:00:00Z', amount: 98 }; // 98%

        (ctx.fetchUnreconciledRevenue as any).mockResolvedValue([rev]);
        (ctx.fetchUnreconciledBankTransactions as any).mockResolvedValue([bank]);

        await autoReconcile(ctx, { id: 'u1' });

        expect(createReconciliationsMock).toHaveBeenCalledWith([
            expect.objectContaining({
                revenue_transaction_id: 'r1',
                bank_transaction_id: 'b1',
                match_category: 'fee_deduction',
                match_confidence: 0.9,
            })
        ]);
    });

    it('should pick best match when multiple candidates exist', async () => {
        // Revenue: 100
        // Bank 1: 100 (10 days later) -> Score 600 - 10 = 590 (Hold period)
        // Bank 2: 100 (1 day later) -> Score 1000 - 1 = 999 (Exact match)

        const rev = { id: 'r1', transaction_date: '2023-01-01T10:00:00Z', amount: 100 };
        const bank1 = { id: 'b1', transaction_date: '2023-01-11T10:00:00Z', amount: 100 };
        const bank2 = { id: 'b2', transaction_date: '2023-01-02T10:00:00Z', amount: 100 };

        (ctx.fetchUnreconciledRevenue as any).mockResolvedValue([rev]);
        (ctx.fetchUnreconciledBankTransactions as any).mockResolvedValue([bank1, bank2]);

        await autoReconcile(ctx, { id: 'u1' });

        expect(createReconciliationsMock).toHaveBeenCalledWith([
            expect.objectContaining({
                revenue_transaction_id: 'r1',
                bank_transaction_id: 'b2', // Should pick b2
            })
        ]);
    });
});
