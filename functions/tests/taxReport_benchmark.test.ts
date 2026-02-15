import { describe, it, vi, expect } from 'vitest';
import { sendQuarterlyTaxReportLogic, TaxReportContext, User, RevenueTransaction, Expense } from '../logic/taxReport';

describe('sendQuarterlyTaxReportLogic Benchmark', () => {
  it('should process users efficiently using batching', async () => {
    const userCount = 1000;
    const batchSize = 50;
    const users: User[] = Array.from({ length: userCount }, (_, i) => ({
      id: `user-${i}`,
      email: `user${i}@example.com`,
      full_name: `User ${i}`
    }));

    const transactions: RevenueTransaction[] = [
      { user_id: 'user-0', platform: 'Platform A', amount: 100 },
      { user_id: 'user-0', platform: 'Platform B', amount: 200 },
    ];

    const expenses: Expense[] = [
      { user_id: 'user-0', amount: 50 },
    ];

    const getUsers = vi.fn().mockResolvedValue(users);
    const getTransactions = vi.fn().mockResolvedValue([]);
    const getExpenses = vi.fn().mockResolvedValue([]);
    const getTransactionsForUsers = vi.fn().mockImplementation(async (userIds) => {
        // Return transactions for user-0 if present in userIds
        if (userIds.includes('user-0')) {
            return transactions;
        }
        return [];
    });
    const getExpensesForUsers = vi.fn().mockImplementation(async (userIds) => {
        if (userIds.includes('user-0')) {
            return expenses;
        }
        return [];
    });
    const sendEmail = vi.fn().mockResolvedValue(undefined);

    const ctx: TaxReportContext = {
      getUsers,
      getTransactions,
      getExpenses,
      getTransactionsForUsers,
      getExpensesForUsers,
      sendEmail,
    };

    const start = performance.now();
    await sendQuarterlyTaxReportLogic(ctx);
    const end = performance.now();

    console.log(`Processed ${userCount} users in ${(end - start).toFixed(2)}ms`);

    expect(getUsers).toHaveBeenCalledTimes(1);

    // Ensure individual fetches are NOT called
    expect(getTransactions).not.toHaveBeenCalled();
    expect(getExpenses).not.toHaveBeenCalled();

    // Ensure batch fetches are called correct number of times
    const expectedBatchCalls = Math.ceil(userCount / batchSize);
    expect(getTransactionsForUsers).toHaveBeenCalledTimes(expectedBatchCalls);
    expect(getExpensesForUsers).toHaveBeenCalledTimes(expectedBatchCalls);

    expect(sendEmail).toHaveBeenCalledTimes(userCount); // All users have email
  });
});
