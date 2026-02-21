
export interface User {
  id: string;
  email: string;
}

export interface RevenueTransaction {
  user_id: string;
  transaction_date: string;
  amount: number;
  platform: string;
}

export interface AutopsyEvent {
  user_id: string;
  status: string;
}

export interface DailyDigestContext {
  getUsers: (limit: number, offset: number) => Promise<User[]>;
  getTransactions: (userId: string, date: string) => Promise<RevenueTransaction[]>;
  getTransactionsForUsers: (userIds: string[], date: string) => Promise<RevenueTransaction[]>;
  getAlerts: (userId: string) => Promise<AutopsyEvent[]>;
  getAlertsForUsers: (userIds: string[]) => Promise<AutopsyEvent[]>;
  sendEmail: (to: string, subject: string, body: string) => Promise<void>;
  pageSize?: number;
}

export async function sendDailyDigestLogic(ctx: DailyDigestContext) {
  let notifiedCount = 0;

  // Calculate yesterday's date once
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const formattedDate = new Date(yesterday).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const PAGE_SIZE = ctx.pageSize || 100;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    // Get users in pages to avoid loading everyone into memory
    const users = await ctx.getUsers(PAGE_SIZE, offset);

    if (users.length === 0) {
      hasMore = false;
      break;
    }

    // Existing batch size for processing transactions/alerts
    const BATCH_SIZE = 50;

    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batchUsers = users.slice(i, i + BATCH_SIZE);
      const userIds = batchUsers.map(u => u.id);

      // Batch fetch transactions and alerts
      const [transactionsBatch, alertsBatch] = await Promise.all([
        ctx.getTransactionsForUsers(userIds, yesterdayStr),
        ctx.getAlertsForUsers(userIds)
      ]);

      // Group transactions by user
      const transactionsByUser = transactionsBatch.reduce((acc, t) => {
        const uid = t.user_id;
        if (!acc[uid]) acc[uid] = [];
        acc[uid].push(t);
        return acc;
      }, {} as Record<string, RevenueTransaction[]>);

      // Group alerts by user
      const alertsByUser = alertsBatch.reduce((acc, a) => {
        const uid = a.user_id;
        if (!acc[uid]) acc[uid] = [];
        acc[uid].push(a);
        return acc;
      }, {} as Record<string, AutopsyEvent[]>);

      // Process each user in the batch
      await Promise.all(batchUsers.map(async (user) => {
        const transactions = transactionsByUser[user.id] || [];

        if (transactions.length === 0) return;

        const total = transactions.reduce((sum, t) => sum + t.amount, 0);

        // Group by platform
        const byPlatform = transactions.reduce((acc, t) => {
          acc[t.platform] = (acc[t.platform] || 0) + t.amount;
          return acc;
        }, {} as Record<string, number>);

        // Get autopsy alerts
        const alerts = alertsByUser[user.id] || [];

        const platformRows = Object.entries(byPlatform)
          .map(([platform, amount]) => `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${platform}</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">$${amount.toFixed(2)}</td>
            </tr>
          `).join('');

        const emailBody = `
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0; }
  .header h1 { color: white; margin: 0; font-size: 24px; }
  .content { background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
  .total-box { background: #f0fdf4; border: 2px solid #10b981; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
  .total-box .amount { font-size: 36px; font-weight: bold; color: #10b981; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 15px 0; }
  .cta-button { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>📊 Your Daily Earnings Report</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">${formattedDate}</p>
  </div>
  <div class="content">
    <div class="total-box">
      <p style="margin: 0; color: #666; font-size: 14px;">TOTAL YESTERDAY</p>
      <div class="amount">$${total.toFixed(2)}</div>
    </div>

    <h3 style="color: #111; margin-top: 30px;">Platform Breakdown</h3>
    <table>
      ${platformRows}
    </table>

    ${alerts.length > 0 ? `
      <div class="alert-box">
        <strong>⚠️ ${alerts.length} Alert${alerts.length > 1 ? 's' : ''} Require Your Attention</strong><br/>
        <span style="font-size: 14px;">Revenue anomalies detected. Review now to understand impact.</span>
      </div>
    ` : ''}

    <a href="https://zerithum-copy-36d43903.base44.app/Dashboard" class="cta-button">View Full Dashboard →</a>

    <p style="color: #666; font-size: 13px; margin-top: 30px;">
      You're receiving this because you opted in to daily digests.
      <a href="#" style="color: #6366f1;">Manage preferences</a>
    </p>
  </div>
</div>
</body>
</html>
        `;

        await ctx.sendEmail(user.email, `Your earnings digest: $${total.toFixed(2)}`, emailBody);
        notifiedCount++;
      }));
    }

    if (users.length < PAGE_SIZE) {
      hasMore = false;
    } else {
      offset += PAGE_SIZE;
    }
  }

  return { success: true, users_notified: notifiedCount };
}
