
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectAnomalies } from '../../supabase/functions/_shared/logic/anomalies';

describe('Shared Anomaly Logic Correctness', () => {
  const mockCtx = {
    fetchRecentTransactions: vi.fn(),
    fetchRecentAutopsies: vi.fn(),
    invokeLLM: vi.fn(),
    saveAnomalies: vi.fn(),
    logAudit: vi.fn(),
  };

  const user = { id: 'user_correctness_123' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should correctly separate and sort weeks across month boundaries', async () => {
    const transactions = [
      // Jan 31, 2024 (Wednesday) -> 2024-01-W5 (3 days: 29, 30, 31)
      { transaction_date: '2024-01-31', amount: 300, platform: 'P1' }, // $100/day avg
      // Feb 1, 2024 (Thursday) -> 2024-02-W1 (7 days: 1-7)
      { transaction_date: '2024-02-01', amount: 1400, platform: 'P1' } // $200/day avg (+100% spike)
    ];

    // Add padding to pass check
    for(let i=0; i<10; i++) {
        transactions.push({
            transaction_date: '2023-01-01',
            amount: 10,
            platform: 'P1'
        });
    }

    mockCtx.fetchRecentTransactions.mockResolvedValue(transactions);
    mockCtx.fetchRecentAutopsies.mockResolvedValue([]);
    mockCtx.invokeLLM.mockResolvedValue({});

    await detectAnomalies(mockCtx, user);

    const saveCall = mockCtx.saveAnomalies.mock.calls[0];
    expect(saveCall).toBeDefined();
    const anomalies = saveCall[0];

    const relevantAnomaly = anomalies.find((a: any) => Math.abs(a.impact_percentage - 100) < 0.1);
    expect(relevantAnomaly).toBeDefined();
    expect(relevantAnomaly?.event_type).toBe('revenue_spike');
  });

  it('should not merge weeks from different months and should normalize across them', async () => {
     const transactions = [
      // Jan 31, 2023 (Tuesday) -> 2023-01-W5 (3 days: 29, 30, 31)
      { transaction_date: '2023-01-31', amount: 300, platform: 'P1' }, // $100/day
      // Feb 1, 2023 (Wednesday) -> 2023-02-W1 (7 days)
      { transaction_date: '2023-02-01', amount: 700, platform: 'P1' } // $100/day
    ];
     // Add padding
    for(let i=0; i<10; i++) {
        transactions.push({
            transaction_date: '2022-01-01',
            amount: 10,
            platform: 'P1'
        });
    }

    mockCtx.fetchRecentTransactions.mockResolvedValue(transactions);
    mockCtx.fetchRecentAutopsies.mockResolvedValue([]);
    mockCtx.invokeLLM.mockResolvedValue({});

    await detectAnomalies(mockCtx, user);

    const saveCall = mockCtx.saveAnomalies.mock.calls[0];
    let anomalies = [];
    if(saveCall) anomalies = saveCall[0];

    // Normalized change is 0% between Jan-W5 and Feb-W1.
    // But there might be an anomaly between the OLD padding (2022) and 2023-Jan-W5.
    // Padding: 10 transactions of $10 each in same bucket?
    // 2022-01-01 -> 2022-01-W1. Amount = 100. Days = 7. Daily Avg = 14.28
    // Jan-W5: Amount = 300. Days = 3. Daily Avg = 100.
    // Spike: (100 - 14.28) / 14.28 = ~600% spike.

    // So we should specifically check that there is NO anomaly starting at 2023-02-01 (Feb-W1)
    // with currAmount = 700.
    const febAnomaly = anomalies.find((a: any) => a.impact_amount === 400); // 700 - 300
    expect(febAnomaly).toBeUndefined();
  });
});
