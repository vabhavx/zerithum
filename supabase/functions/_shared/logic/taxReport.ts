import { escapeHtml } from '../utils/html.ts';

export interface User {
  id: string;
  email: string;
  full_name?: string;
}

export interface RevenueTransaction {
  platform: string;
  amount: number;
}

export interface Expense {
  amount: number;
}

export interface TaxReportContext {
  getUsers: () => Promise<User[]>;
  getTransactions: (userId: string, start: string, end: string) => Promise<RevenueTransaction[]>;
  getExpenses: (userId: string, start: string, end: string) => Promise<Expense[]>;
  sendEmail: (to: string, subject: string, body: string) => Promise<void>;
}

export async function sendQuarterlyTaxReportLogic(ctx: TaxReportContext) {
  const users = await ctx.getUsers();

  // Determine quarter
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3) + 1;
  const year = now.getFullYear();

  const notifiedUsers = [];

  for (const user of users) {
    if (!user.email) continue;

    // Get transactions for the quarter
    const quarterStart = new Date(year, (quarter - 1) * 3, 1);
    const quarterEnd = new Date(year, quarter * 3, 0);

    const startStr = quarterStart.toISOString().split('T')[0];
    const endStr = quarterEnd.toISOString().split('T')[0];

    const transactions = await ctx.getTransactions(user.id, startStr, endStr);
    const expenses = await ctx.getExpenses(user.id, startStr, endStr);

    const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const netIncome = totalRevenue - totalExpenses;

    // Group by platform
    const byPlatform: Record<string, number> = transactions.reduce((acc, t) => {
      const platformName = t.platform || 'Unknown';
      acc[platformName] = (acc[platformName] || 0) + (t.amount || 0);
      return acc;
    }, {});

    const platformRows = Object.entries(byPlatform)
      .map(([platform, amount]) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${escapeHtml(platform)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">$${amount.toFixed(2)}</td>
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
    .summary-box { background: #f0fdf4; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.1); }
    .summary-row:last-child { border-bottom: none; font-weight: bold; font-size: 18px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 10px 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Q${quarter} ${year} Tax Report Ready</h1>
    </div>
    <div class="content">
      <p>Hi ${escapeHtml(user.full_name || 'there')},</p>

      <p>Your quarterly tax report is ready for review and export.</p>

      <div class="summary-box">
        <div class="summary-row">
          <span>Total Revenue</span>
          <span style="color: #10b981;">$${totalRevenue.toFixed(2)}</span>
        </div>
        <div class="summary-row">
          <span>Total Expenses</span>
          <span style="color: #ef4444;">$${totalExpenses.toFixed(2)}</span>
        </div>
        <div class="summary-row">
          <span>Net Income</span>
          <span style="color: #6366f1;">$${netIncome.toFixed(2)}</span>
        </div>
      </div>

      <h3 style="color: #111;">Platform Breakdown</h3>
      <table>
        ${platformRows}
      </table>

      <p><strong>Next steps:</strong></p>
      <ul>
        <li>Review your full report in Zerithum</li>
        <li>Export to CSV for your accountant</li>
        <li>File your quarterly taxes before the deadline</li>
      </ul>

      <div style="text-align: center;">
        <a href="https://zerithum-copy-36d43903.base44.app/TaxEstimator" class="cta-button">View Full Report →</a>
      </div>

      <p style="color: #666; font-size: 13px; margin-top: 30px;">
        <strong>Tax filing deadline:</strong> ${quarter === 1 ? 'April 30' : quarter === 2 ? 'July 31' : quarter === 3 ? 'October 31' : 'January 31'}
      </p>
    </div>
  </div>
</body>
</html>
    `;

    await ctx.sendEmail(user.email, `Your Q${quarter} ${year} tax report is ready`, emailBody);
    notifiedUsers.push(user.id);
  }

  return { success: true, users_notified: notifiedUsers.length };
}
