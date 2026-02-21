
import { describe, it, vi, expect } from 'vitest';
import { sendDailyDigestLogic, DailyDigestContext, User, RevenueTransaction, AutopsyEvent } from '../logic/dailyDigest';

describe('sendDailyDigestLogic', () => {
  it('should process users and send emails correctly with pagination', async () => {
    const usersPage1: User[] = [
      { id: 'user-1', email: 'user1@example.com' }
    ];
    const usersPage2: User[] = [
      { id: 'user-2', email: 'user2@example.com' }
    ];

    const getUsers = vi.fn()
      .mockResolvedValueOnce(usersPage1)
      .mockResolvedValueOnce(usersPage2)
      .mockResolvedValueOnce([]); // End of pages

    // Individual fetches should not be called
    const getTransactions = vi.fn();
    const getAlerts = vi.fn();

    // Batch fetches
    const getTransactionsForUsers = vi.fn().mockImplementation(async (userIds: string[], date: string) => {
      const transactions: RevenueTransaction[] = [];
      if (userIds.includes('user-1')) {
        transactions.push({ user_id: 'user-1', platform: 'Platform A', amount: 100, transaction_date: date });
      }
      if (userIds.includes('user-2')) {
        transactions.push({ user_id: 'user-2', platform: 'Platform B', amount: 200, transaction_date: date });
      }
      return transactions;
    });

    const getAlertsForUsers = vi.fn().mockImplementation(async (userIds: string[]) => {
      const alerts: AutopsyEvent[] = [];
      if (userIds.includes('user-1')) {
        alerts.push({ user_id: 'user-1', status: 'pending_review' });
      }
      return alerts;
    });

    const sendEmail = vi.fn().mockResolvedValue(undefined);

    const ctx: DailyDigestContext = {
      getUsers,
      getTransactions,
      getTransactionsForUsers,
      getAlerts,
      getAlertsForUsers,
      sendEmail,
      pageSize: 1 // Set small page size for testing pagination loop
    };

    const result = await sendDailyDigestLogic(ctx);

    expect(result.success).toBe(true);
    expect(result.users_notified).toBe(2); // Both users have transactions

    // getUsers should be called 3 times (Page 1, Page 2, and an empty page to signal end)
    expect(getUsers).toHaveBeenCalledTimes(3);
    expect(getUsers).toHaveBeenNthCalledWith(1, 1, 0);
    expect(getUsers).toHaveBeenNthCalledWith(2, 1, 1);
    expect(getUsers).toHaveBeenNthCalledWith(3, 1, 2);

    expect(getTransactions).not.toHaveBeenCalled();
    expect(getAlerts).not.toHaveBeenCalled();

    expect(getTransactionsForUsers).toHaveBeenCalledTimes(2);
    expect(getAlertsForUsers).toHaveBeenCalledTimes(2);

    expect(sendEmail).toHaveBeenCalledTimes(2);
    expect(sendEmail).toHaveBeenCalledWith(
      'user1@example.com',
      expect.stringContaining('$100.00'),
      expect.stringContaining('Platform A')
    );
    expect(sendEmail).toHaveBeenCalledWith(
      'user2@example.com',
      expect.stringContaining('$200.00'),
      expect.stringContaining('Platform B')
    );
  });
});
