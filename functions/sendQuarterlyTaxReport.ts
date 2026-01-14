import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { sendQuarterlyTaxReportLogic, TaxReportContext } from './logic/taxReport.ts';

Deno.serve(async (req) => {
  // 1. Authorization Check
  const authHeader = req.headers.get('Authorization');
  const cronSecret = Deno.env.get('CRON_SECRET');

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const base44 = createClientFromRequest(req);
    
    // 2. Create Context
    const ctx: TaxReportContext = {
      getUsers: async () => {
        return await base44.asServiceRole.entities.User.list();
      },
      getTransactions: async (userId, start, end) => {
        return await base44.asServiceRole.entities.RevenueTransaction.filter({
          user_id: userId,
          transaction_date: { $gte: start, $lte: end }
        });
      },
      getExpenses: async (userId, start, end) => {
        return await base44.asServiceRole.entities.Expense.filter({
          user_id: userId,
          expense_date: { $gte: start, $lte: end }
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

    // 3. Execute Logic
    const result = await sendQuarterlyTaxReportLogic(ctx);
    
    return Response.json(result);
  } catch (error: any) {
    // 4. Secure Error Handling
    console.error('Quarterly report email error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
