import { escapeCsv } from '../utils/csv.ts';

export interface TaxProfile {
  estimated_deductions?: number;
  effective_income_tax_rate?: number;
  q1_paid?: number;
  q2_paid?: number;
  q3_paid?: number;
  q4_paid?: number;
}

export interface RevenueTransaction {
  transaction_date: string;
  amount?: number;
  platform_fee?: number;
  platform: string;
  category: string;
  description?: string;
}

export interface User {
  full_name?: string;
  email?: string;
}

export function generateTaxReportCsv(
  transactions: RevenueTransaction[],
  taxProfile: TaxProfile | null,
  user: User,
  year: number
): string {
    const yearTransactions = transactions.filter(t => {
      const txDate = new Date(t.transaction_date);
      return txDate.getFullYear() === year;
    });

    // Group by platform and category
    const platformSummary: Record<string, { revenue: number; fees: number; count: number }> = {};
    const categorySummary: Record<string, { revenue: number; count: number }> = {};
    let totalRevenue = 0;
    let totalFees = 0;

    yearTransactions.forEach(t => {
      const amount = t.amount || 0;
      const fee = t.platform_fee || 0;

      totalRevenue += amount;
      totalFees += fee;

      // Platform summary
      if (!platformSummary[t.platform]) {
        platformSummary[t.platform] = { revenue: 0, fees: 0, count: 0 };
      }
      platformSummary[t.platform].revenue += amount;
      platformSummary[t.platform].fees += fee;
      platformSummary[t.platform].count += 1;

      // Category summary
      if (!categorySummary[t.category]) {
        categorySummary[t.category] = { revenue: 0, count: 0 };
      }
      categorySummary[t.category].revenue += amount;
      categorySummary[t.category].count += 1;
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
          `${t.transaction_date},${escapeCsv(t.platform)},${escapeCsv(t.category)},${escapeCsv(t.description || '')},$${amount.toFixed(2)},$${fee.toFixed(2)},$${(amount - fee).toFixed(2)}`
        );
      });

    return csvLines.join('\n');
}
