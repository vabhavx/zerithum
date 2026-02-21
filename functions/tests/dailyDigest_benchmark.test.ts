
import { describe, it, vi, expect } from 'vitest';
import { sendDailyDigestLogic, DailyDigestContext } from '../logic/dailyDigest';

describe('Daily Digest Pagination Benchmark (Optimized)', () => {
  it('should demonstrate the paginated fetch behavior', async () => {
    // Create 150 mock users
    const allUsers = Array.from({ length: 150 }, (_, i) => ({
      id: `user-${i}`,
      email: `user${i}@example.com`
    }));

    // Mock getUsers to return pages of 100
    const getUsers = vi.fn().mockImplementation(async (limit, offset) => {
        return allUsers.slice(offset, offset + limit);
    });

    const getTransactionsForUsers = vi.fn().mockResolvedValue(
        allUsers.map(u => ({ user_id: u.id, amount: 10, platform: 'Test', transaction_date: '2023-01-01' }))
    );
    const getAlertsForUsers = vi.fn().mockResolvedValue([]);
    const sendEmail = vi.fn().mockResolvedValue(undefined);

    const ctx: DailyDigestContext = {
      getUsers,
      getTransactions: vi.fn(),
      getTransactionsForUsers,
      getAlerts: vi.fn(),
      getAlertsForUsers,
      sendEmail,
    } as any;

    const result = await sendDailyDigestLogic(ctx);

    expect(result.success).toBe(true);
    expect(result.users_notified).toBe(150);

    // getUsers should be called twice for data + once for empty check if it reached limit exactly,
    // or just twice if the last page was smaller than limit.
    // Our PAGE_SIZE is 100. For 150 users:
    // Call 1: offset 0, returns 100.
    // Call 2: offset 100, returns 50.
    // Total 2 calls.
    expect(getUsers).toHaveBeenCalledTimes(2);
    expect(getUsers).toHaveBeenNthCalledWith(1, 100, 0);
    expect(getUsers).toHaveBeenNthCalledWith(2, 100, 100);

    console.log('Optimized: 150 users fetched in 2 pages (100 and 50).');
  });
});
