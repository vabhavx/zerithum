import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { logAudit } from './utils/audit.ts';
import { detectAnomalies, AnomalyContext } from './logic/anomalies.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ctx: AnomalyContext = {
      fetchRecentTransactions: async (userId: string, limit: number) => {
        return await base44.asServiceRole.entities.RevenueTransaction.filter(
          { user_id: userId },
          '-transaction_date',
          limit
        );
      },
      fetchRecentAutopsies: async (userId: string, since: Date) => {
        return await base44.asServiceRole.entities.AutopsyEvent.filter({
          user_id: userId,
          detected_at: { $gte: since.toISOString() }
        });
      },
      invokeLLM: async (prompt: string, schema: any) => {
        return await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: schema
        });
      },
      saveAnomalies: async (anomalies: any[]) => {
        await base44.asServiceRole.entities.AutopsyEvent.bulkCreate(anomalies);
      },
      logAudit: (entry: any) => logAudit(base44, entry)
    };

    const result = await detectAnomalies(ctx, user);

    return Response.json(result);

  } catch (error: any) {
    console.error('Anomaly detection error:', error);
    // Secure error response
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
