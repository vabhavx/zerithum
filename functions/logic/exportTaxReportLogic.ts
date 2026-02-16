import { escapeCsv } from '../utils/csv.ts';

// Interfaces for dependencies
export interface RevenueTransaction {
  transaction_date: string;
  amount?: number;
  platform_fee?: number;
  platform?: string;
  category?: string;
  description?: string;
  [key: string]: any; // Allow other properties
}

export interface TaxProfile {
  estimated_deductions?: number;
  effective_income_tax_rate?: number;
  q1_paid?: number;
  q2_paid?: number;
  q3_paid?: number;
  q4_paid?: number;
  [key: string]: any;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  [key: string]: any;
}

export interface ExportTaxReportContext {
  listTransactions: (filter: any) => Promise<RevenueTransaction[]>;
  listTaxProfiles: (filter: any) => Promise<TaxProfile[]>;
}

export async function exportTaxReportLogic(
  ctx: ExportTaxReportContext,
  user: User,
  year: number
): Promise<string> {
    // Fetch transactions for the tax year
    // Optimized: Filter by date range at the database level
    const startDate = `${year}-01-01T00:00:00.000Z`;
    const endDate = `${year}-12-31T23:59:59.999Z`;

    const transactions = await ctx.listTransactions({
      user_id: user.id,
      transaction_date: {
        $gte: startDate,
        $lte: endDate
      }
    });

    // Transactions are already filtered by the database
    const yearTransactions = transactions;

    // Fetch tax profile
    const taxProfiles = await ctx.listTaxProfiles({
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

    return csvLines.join('\n');
}
