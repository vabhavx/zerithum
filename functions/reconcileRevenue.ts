import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { logAudit } from './utils/audit.ts';
import { autoReconcile, ReconcileContext } from './logic/reconcile.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ctx: ReconcileContext = {
      fetchUnreconciledRevenue: async (userId: string) => {
        // Fetch last 90 days of revenue
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
        const revenue = await base44.asServiceRole.entities.RevenueTransaction.filter({
            user_id: userId,
            transaction_date: { $gte: ninetyDaysAgo }
        });

        // Fetch existing reconciliations to filter
        const reconciliations = await base44.asServiceRole.entities.Reconciliation.filter({
            user_id: userId,
            reconciled_at: { $gte: ninetyDaysAgo }
        });
        const reconciledRevenueIds = new Set(reconciliations.map((r: any) => r.revenue_transaction_id));

        return revenue.filter((r: any) => !reconciledRevenueIds.has(r.id));
      },

      fetchUnreconciledBankTransactions: async (userId: string, startDate: string) => {
        // Fetch bank txns from startDate (which is derived from earliest revenue date in logic)
        // We might want to go a bit further back or forward? Logic handles forward look.
        // But logic passes "minRevenueDate". We need bank txns starting from that date.
        const bankTxns = await base44.asServiceRole.entities.BankTransaction.filter({
            user_id: userId,
            transaction_date: { $gte: startDate }
        });

        // Also filter out reconciled bank txns
        const reconciliations = await base44.asServiceRole.entities.Reconciliation.filter({
            user_id: userId,
            reconciled_at: { $gte: startDate } // Approximate
        });
        const reconciledBankIds = new Set(reconciliations.map((r: any) => r.bank_transaction_id));

        return bankTxns.filter((b: any) => !reconciledBankIds.has(b.id));
      },

      createReconciliations: async (reconciliations: any[]) => {
        await base44.asServiceRole.entities.Reconciliation.bulkCreate(reconciliations);
      },

      logAudit: async (entry: any) => {
        // Persist to database
        try {
          await base44.asServiceRole.entities.AuditLog.create(entry);
        } catch (dbError) {
          console.error('Failed to persist audit log to DB:', dbError);
        }
        // Log to stdout
        logAudit(entry);
      }
    };

    const result = await autoReconcile(ctx, user);

    return Response.json(result);

  } catch (error: any) {
    console.error('Reconciliation error:', error);

    // Logic already logged the failure audit in most cases, but if it failed before calling logic:
    // We should ensure an audit log is written if possible, but context might not be created.
    // For now, we rely on the logic catching its own errors and using ctx.logAudit.

    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
