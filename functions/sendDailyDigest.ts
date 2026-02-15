import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { sendDailyDigestLogic, DailyDigestContext } from './logic/dailyDigest.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const ctx: DailyDigestContext = {
      getUsers: async () => {
        return await base44.asServiceRole.entities.User.list();
      },
      getTransactions: async (userId, date) => {
        return await base44.asServiceRole.entities.RevenueTransaction.filter({
          user_id: userId,
          transaction_date: date
        });
      },
      getTransactionsForUsers: async (userIds, date) => {
        // @ts-ignore: SDK supports $in operator
        return await base44.asServiceRole.entities.RevenueTransaction.filter({
          user_id: { $in: userIds },
          transaction_date: date
        });
      },
      getAlerts: async (userId) => {
        return await base44.asServiceRole.entities.AutopsyEvent.filter({
          user_id: userId,
          status: 'pending_review'
        });
      },
      getAlertsForUsers: async (userIds) => {
        // @ts-ignore: SDK supports $in operator
        return await base44.asServiceRole.entities.AutopsyEvent.filter({
          user_id: { $in: userIds },
          status: 'pending_review'
        });
      },
      sendEmail: async (to, subject, body) => {
        await base44.asServiceRole.integrations.Core.SendEmail({
          from_name: 'Zerithum',
          to,
          subject,
          body
        });
      }
    };
    
    const result = await sendDailyDigestLogic(ctx);
    
    return Response.json(result);
  } catch (error: any) {
    console.error('Daily digest error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
