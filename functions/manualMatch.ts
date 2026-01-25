import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { logAudit } from './utils/audit.ts';
import { manualReconcileLogic, ReconcileContext } from './logic/reconcile.ts';

Deno.serve(async (req) => {
  let base44: any = null;

  try {
    base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { revenueId, bankId, notes } = body;

    if (!revenueId || !bankId) {
      return Response.json({ error: 'Missing revenueId or bankId' }, { status: 400 });
    }

    // Check if either is already reconciled
    const existingReconciliations = await base44.asServiceRole.entities.Reconciliation.filter({
      user_id: user.id,
      // We need to check if EITHER ID is present in any reconciliation
      // SDK might not support OR queries easily in one go depending on capabilities.
      // Assuming basic filtering, we might need two queries or a complex filter.
      // Let's try two queries for safety and clarity.
    });

    // Check Revenue
    const revRecs = await base44.asServiceRole.entities.Reconciliation.filter({
        revenue_transaction_id: revenueId
    });
    if (revRecs.length > 0) {
        return Response.json({ error: 'Revenue transaction is already reconciled' }, { status: 409 });
    }

    // Check Bank
    const bankRecs = await base44.asServiceRole.entities.Reconciliation.filter({
        bank_transaction_id: bankId
    });
    if (bankRecs.length > 0) {
        return Response.json({ error: 'Bank transaction is already reconciled' }, { status: 409 });
    }

    // Create Context (just for audit logging really, and fulfilling the signature if we use logic)
    const ctx: ReconcileContext = {
        fetchUnreconciledRevenue: async () => [], // Not needed
        fetchUnreconciledBankTransactions: async () => [], // Not needed
        createReconciliations: async (recs) => {
            await base44.asServiceRole.entities.Reconciliation.bulkCreate(recs);
        },
        logAudit: async (entry) => {
             await logAudit(base44, entry);
        }
    };

    // Use logic to generate record object
    // Note: manualReconcileLogic is async and returns an object
    const reconciliationRecord = await manualReconcileLogic(ctx, user, revenueId, bankId, notes);

    // Save
    // We can use ctx.createReconciliations or direct SDK.
    // Logic returned a single object.
    await ctx.createReconciliations([reconciliationRecord]);

    await ctx.logAudit({
        action: 'manual_reconcile',
        actor_id: user.id,
        status: 'success',
        details: {
            revenue_id: revenueId,
            bank_id: bankId,
            notes
        }
    });

    return Response.json({ success: true, message: 'Successfully matched transactions' });

  } catch (error: any) {
    console.error('Manual match error:', error);

    if (base44) {
        try {
            await logAudit(base44, {
                action: 'manual_reconcile_failed',
                status: 'failure',
                details: { error: error.message }
            });
        } catch {}
    }

    return Response.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
});
