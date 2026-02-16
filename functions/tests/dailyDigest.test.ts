
import { describe, it, vi, expect } from 'vitest';
import { sendDailyDigestLogic, DailyDigestContext, User, RevenueTransaction, AutopsyEvent } from '../logic/dailyDigest';

describe('sendDailyDigestLogic', () => {
  it('should process users and send emails correctly', async () => {
    const users: User[] = [
      { id: 'user-1', email: 'user1@example.com' },
      { id: 'user-2', email: 'user2@example.com' }
    ];

    const getUsers = vi.fn().mockResolvedValue(users);

    // Individual fetches should not be called
    const getTransactions = vi.fn();
    const getAlerts = vi.fn();

    // Batch fetches
    const getTransactionsForUsers = vi.fn().mockImplementation(async (userIds: string[], date: string) => {
      const transactions: RevenueTransaction[] = [];
      if (userIds.includes('user-1')) {
        transactions.push({ user_id: 'user-1', platform: 'Platform A', amount: 100, transaction_date: date });
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
    };

    const result = await sendDailyDigestLogic(ctx);

    expect(result.success).toBe(true);
    expect(result.users_notified).toBe(1); // Only user-1 has transactions

    expect(getUsers).toHaveBeenCalledTimes(1);
    expect(getTransactions).not.toHaveBeenCalled();
    expect(getAlerts).not.toHaveBeenCalled();

    expect(getTransactionsForUsers).toHaveBeenCalledTimes(1);
    expect(getAlertsForUsers).toHaveBeenCalledTimes(1);

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith(
      'user1@example.com',
      expect.stringContaining('$100.00'),
      expect.stringContaining('Platform A')
    );
  });
});
