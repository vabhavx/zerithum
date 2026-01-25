import { describe, it, expect, vi } from 'vitest';
import { manualReconcileLogic, ReconcileContext } from '../logic/reconcile';

describe('manualReconcileLogic', () => {
  it('should create a reconciliation record with manual metadata', async () => {
    const mockCtx: ReconcileContext = {
      fetchUnreconciledRevenue: vi.fn(),
      fetchUnreconciledBankTransactions: vi.fn(),
      createReconciliations: vi.fn(),
      logAudit: vi.fn(),
    };
    const user = { id: 'user_1' };
    const revId = 'rev_1';
    const bankId = 'bank_1';
    const notes = 'My manual match';

    const result = await manualReconcileLogic(mockCtx, user, revId, bankId, notes);

    expect(result).toMatchObject({
      user_id: 'user_1',
      revenue_transaction_id: 'rev_1',
      bank_transaction_id: 'bank_1',
      match_category: 'manual',
      match_confidence: 1.0,
      reconciled_by: 'manual',
      creator_notes: 'My manual match'
    });
    expect(result.reconciled_at).toBeDefined();
  });
});
