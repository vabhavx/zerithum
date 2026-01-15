
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendQuarterlyTaxReportLogic, TaxReportContext } from '../logic/taxReport';

describe('sendQuarterlyTaxReportLogic', () => {
  const mockGetUsers = vi.fn();
  const mockGetTransactions = vi.fn();
  const mockGetExpenses = vi.fn();
  const mockSendEmail = vi.fn();

  const mockContext: TaxReportContext = {
    getUsers: mockGetUsers,
    getTransactions: mockGetTransactions,
    getExpenses: mockGetExpenses,
    sendEmail: mockSendEmail,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send emails to users with correct data', async () => {
    mockGetUsers.mockResolvedValue([
      { id: 'u1', email: 'test@example.com', full_name: 'Test User' }
    ]);
    mockGetTransactions.mockResolvedValue([
      { platform: 'YouTube', amount: 100 },
      { platform: 'Twitch', amount: 50 }
    ]);
    mockGetExpenses.mockResolvedValue([
      { amount: 30 }
    ]);

    const result = await sendQuarterlyTaxReportLogic(mockContext);

    expect(result).toEqual({ success: true, users_notified: 1 });
    expect(mockSendEmail).toHaveBeenCalledTimes(1);

    const [to, subject, body] = mockSendEmail.mock.calls[0];
    expect(to).toBe('test@example.com');
    expect(subject).toContain('tax report is ready');
    expect(body).toContain('$150.00'); // Total Revenue
    expect(body).toContain('$30.00'); // Total Expenses
    expect(body).toContain('$120.00'); // Net Income
    expect(body).toContain('YouTube');
    expect(body).toContain('Twitch');
  });

  it('should sanitize user input', async () => {
    mockGetUsers.mockResolvedValue([
      { id: 'u2', email: 'hacker@example.com', full_name: '<script>alert("xss")</script>' }
    ]);
    mockGetTransactions.mockResolvedValue([
      { platform: '<img src=x onerror=alert(1)>', amount: 100 }
    ]);
    mockGetExpenses.mockResolvedValue([]);

    await sendQuarterlyTaxReportLogic(mockContext);

    const [to, subject, body] = mockSendEmail.mock.calls[0];
    expect(body).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    expect(body).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(body).not.toContain('<script>');
    expect(body).not.toContain('<img src=x');
  });

  it('should skip users without email', async () => {
    mockGetUsers.mockResolvedValue([
      { id: 'u3', full_name: 'No Email' }
    ]);

    const result = await sendQuarterlyTaxReportLogic(mockContext);

    expect(result).toEqual({ success: true, users_notified: 0 });
    expect(mockSendEmail).not.toHaveBeenCalled();
  });
});
