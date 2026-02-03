import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { escapeCsv } from './utils/csv.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taxYear } = await req.json();
    const year = taxYear || new Date().getFullYear();

    // Fetch transactions for the tax year
    interface Transaction {
      transaction_date: string;
      amount?: number;
      platform_fee?: number;
      platform?: string;
      category?: string;
      description?: string;
    }

    const transactions = await base44.entities.RevenueTransaction.filter({
      user_id: user.id
    });

    const yearTransactions: Transaction[] = transactions.filter((t: any) => {
      const txDate = new Date(t.transaction_date);
      return txDate.getFullYear() === year;
    });

    // Fetch tax profile
    const taxProfiles = await base44.entities.TaxProfile.filter({
      user_id: user.id,
      tax_year: year
    });
    const taxProfile = taxProfiles[0] || null;

    // Group by platform and category
    interface PlatformData {
      revenue: number;
      fees: number;
      count: number;
    }
    interface CategoryData {
      revenue: number;
      count: number;
    }

    const platformSummary: Record<string, PlatformData> = {};
    const categorySummary: Record<string, CategoryData> = {};
    let totalRevenue = 0;
    let totalFees = 0;

    yearTransactions.forEach(t => {
      const amount = t.amount || 0;
      const fee = t.platform_fee || 0;

      totalRevenue += amount;
      totalFees += fee;

      // Platform summary
      const platform = t.platform || 'Unknown';
      if (!platformSummary[platform]) {
        platformSummary[platform] = { revenue: 0, fees: 0, count: 0 };
      }
      platformSummary[platform].revenue += amount;
      platformSummary[platform].fees += fee;
      platformSummary[platform].count += 1;

      // Category summary
      const category = t.category || 'Uncategorized';
      if (!categorySummary[category]) {
        categorySummary[category] = { revenue: 0, count: 0 };
      }
      categorySummary[category].revenue += amount;
      categorySummary[category].count += 1;
    });

    const netIncome = totalRevenue - totalFees;
    const deductions = taxProfile?.estimated_deductions || 0;
    const taxableIncome = Math.max(0, netIncome - deductions);

    const selfEmploymentTax = taxableIncome * 0.153;
    const incomeTaxRate = taxProfile?.effective_income_tax_rate || 0.22;
    const incomeTax = taxableIncome * incomeTaxRate;
    const totalTax = selfEmploymentTax + incomeTax;

    // Generate CSV report
    const csvLines = [
      `TAX REPORT FOR ${year}`,
      `Generated: ${new Date().toISOString()}`,
      `Taxpayer: ${user.full_name || user.email}`,
      ``,
      `INCOME SUMMARY`,
      `Gross Revenue,$${totalRevenue.toFixed(2)}`,
      `Platform Fees,-$${totalFees.toFixed(2)}`,
      `Net Income,$${netIncome.toFixed(2)}`,
      `Deductions,-$${deductions.toFixed(2)}`,
      `Taxable Income,$${taxableIncome.toFixed(2)}`,
      ``,
      `TAX CALCULATION`,
      `Self-Employment Tax (15.3%),$${selfEmploymentTax.toFixed(2)}`,
      `Income Tax (${(incomeTaxRate * 100).toFixed(1)}%),$${incomeTax.toFixed(2)}`,
      `Total Tax Liability,$${totalTax.toFixed(2)}`,
      ``,
      `QUARTERLY PAYMENTS`,
      `Q1 Paid,$${taxProfile?.q1_paid || 0}`,
      `Q2 Paid,$${taxProfile?.q2_paid || 0}`,
      `Q3 Paid,$${taxProfile?.q3_paid || 0}`,
      `Q4 Paid,$${taxProfile?.q4_paid || 0}`,
      `Total Paid,$${(taxProfile?.q1_paid || 0) + (taxProfile?.q2_paid || 0) + (taxProfile?.q3_paid || 0) + (taxProfile?.q4_paid || 0)}`,
      ``,
      `PLATFORM BREAKDOWN`,
      `Platform,Revenue,Fees,Transactions`
    ];

    Object.entries(platformSummary).forEach(([platform, data]) => {
      csvLines.push(`${escapeCsv(platform)},$${data.revenue.toFixed(2)},$${data.fees.toFixed(2)},${data.count}`);
    });

    csvLines.push(``);
    csvLines.push(`CATEGORY BREAKDOWN`);
    csvLines.push(`Category,Revenue,Transactions`);

    Object.entries(categorySummary).forEach(([category, data]) => {
      csvLines.push(`${escapeCsv(category)},$${data.revenue.toFixed(2)},${data.count}`);
    });

    csvLines.push(``);
    csvLines.push(`DETAILED TRANSACTIONS`);
    csvLines.push(`Date,Platform,Category,Description,Amount,Fee,Net`);

    yearTransactions
      .sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime())
      .forEach(t => {
        const amount = t.amount || 0;
        const fee = t.platform_fee || 0;
        csvLines.push(
          `${t.transaction_date},${escapeCsv(t.platform)},${escapeCsv(t.category)},${escapeCsv(t.description)},$${amount.toFixed(2)},$${fee.toFixed(2)},$${(amount - fee).toFixed(2)}`
        );
      });

    const csv = csvLines.join('\n');

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=tax_report_${year}.csv`
      }
    });

  } catch (error: any) {
    console.error('Tax report export error:', error);
    return Response.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
});