import { describe, it, vi, expect } from 'vitest';
import { exportTaxReportLogic, ExportTaxReportContext, User, RevenueTransaction } from '../logic/exportTaxReportLogic';

describe('exportTaxReportLogic', () => {
  it('should filter transactions by date range at the database level', async () => {
    // Setup
    const user: User = { id: 'user-1', email: 'test@example.com', full_name: 'Test User' };
    const year = 2023;

    // Generate large dataset
    const transactions: RevenueTransaction[] = [];
    // We populate this just to ensure the mock logic returns something valid
    transactions.push({
        transaction_date: `2023-06-15T12:00:00Z`,
        amount: 100,
        platform_fee: 5,
        platform: 'Platform A',
        category: 'Sales',
        description: `Sale 1`
    });

    // Mock listTransactions
    const listTransactions = vi.fn().mockImplementation(async (filter: any) => {
        // Return filtered transactions
        if (filter.transaction_date && filter.transaction_date.$gte && filter.transaction_date.$lte) {
             const start = new Date(filter.transaction_date.$gte).getTime();
             const end = new Date(filter.transaction_date.$lte).getTime();
             return transactions.filter(t => {
                 const d = new Date(t.transaction_date).getTime();
                 return d >= start && d <= end;
             });
        }
        return [];
    });

    const listTaxProfiles = vi.fn().mockResolvedValue([]);

    const ctx: ExportTaxReportContext = {
      listTransactions,
      listTaxProfiles
    };

    const csv = await exportTaxReportLogic(ctx, user, year);

    // Verify output contains correct year data
    expect(csv).toContain(`TAX REPORT FOR ${year}`);

    // Verify that the database filter was used correctly
    const expectedStartDate = `${year}-01-01T00:00:00.000Z`;
    const expectedEndDate = `${year}-12-31T23:59:59.999Z`;

    expect(listTransactions).toHaveBeenCalledTimes(1);
    expect(listTransactions).toHaveBeenCalledWith(expect.objectContaining({
        user_id: user.id,
        transaction_date: {
            $gte: expectedStartDate,
            $lte: expectedEndDate
        }
    }));
  });
});
