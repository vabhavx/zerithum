
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectAnomalies } from '../logic/anomalies';

describe('detectAnomalies Logic', () => {
  const mockCtx = {
    fetchRecentTransactions: vi.fn(),
    fetchRecentAutopsies: vi.fn(),
    invokeLLM: vi.fn(),
    saveAnomalies: vi.fn(),
    logAudit: vi.fn(),
  };

  const user = { id: 'user_123' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return early if insufficient data', async () => {
    mockCtx.fetchRecentTransactions.mockResolvedValue([]);

    const result = await detectAnomalies(mockCtx, user);

    expect(result.success).toBe(true);
    expect(result.message).toBe('Insufficient data for anomaly detection');
    expect(mockCtx.fetchRecentAutopsies).not.toHaveBeenCalled();
  });

  it('should not detect revenue anomalies if changes are small', async () => {
    const transactions = [];
    // Generate stable data
    for (let i = 0; i < 20; i++) {
      transactions.push({
        transaction_date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        amount: 1000, // No change
        platform: 'TestPlatform'
      });
    }
    mockCtx.fetchRecentTransactions.mockResolvedValue(transactions);
    mockCtx.fetchRecentAutopsies.mockResolvedValue([]);

    const result = await detectAnomalies(mockCtx, user);

    // It might detect concentration risk, but not revenue anomalies
    const revenueAnomalies = result.anomalies.filter((a: any) =>
      a.event_type === 'revenue_drop' || a.event_type === 'revenue_spike'
    );
    expect(revenueAnomalies.length).toBe(0);

    // fetchRecentAutopsies is now hoisted, so it is called once
    expect(mockCtx.fetchRecentAutopsies).toHaveBeenCalledTimes(1);
  });

  it('should skip LLM if recent autopsy exists', async () => {
    // 2 weeks of data with big drop
    const transactions = [
      { transaction_date: '2024-01-01', amount: 1000, platform: 'P1' },
      { transaction_date: '2024-02-01', amount: 100, platform: 'P1' } // -90% drop
    ];
    // Need > 10 txs total to pass check
    for(let i=0; i<10; i++) transactions.push({ transaction_date: '2023-01-01', amount: 10, platform: 'P1' });

    mockCtx.fetchRecentTransactions.mockResolvedValue(transactions);

    // Simulate existing autopsy
    mockCtx.fetchRecentAutopsies.mockResolvedValue([{ id: 'autopsy_1' }]);

    const result = await detectAnomalies(mockCtx, user);

    expect(mockCtx.fetchRecentAutopsies).toHaveBeenCalled();
    expect(mockCtx.invokeLLM).not.toHaveBeenCalled();

    // Check that we didn't add a NEW revenue anomaly requiring LLM
    // The code logic:
    // if (recentAutopsies.length === 0) { ... anomalies.push(...) }
    // So if autopsy exists, it does NOT push to anomalies.

    const revenueAnomalies = result.anomalies.filter((a: any) =>
      a.event_type === 'revenue_drop' || a.event_type === 'revenue_spike'
    );
    expect(revenueAnomalies.length).toBe(0);
  });

  it('should detect anomaly and call LLM if no recent autopsy', async () => {
    // 2 weeks of data with big drop
    const transactions = [
      { transaction_date: '2024-01-01', amount: 1000, platform: 'P1' },
      { transaction_date: '2024-02-01', amount: 100, platform: 'P1' } // -90% drop
    ];
    // Need > 10 txs total to pass check
    for(let i=0; i<10; i++) transactions.push({ transaction_date: '2023-01-01', amount: 10, platform: 'P1' });

    mockCtx.fetchRecentTransactions.mockResolvedValue(transactions);
    mockCtx.fetchRecentAutopsies.mockResolvedValue([]); // No recent autopsy
    mockCtx.invokeLLM.mockResolvedValue({
      platform_behaviour: 'Issue',
      recurrence_probability: 0.8,
      expected_damage: 500
    });

    const result = await detectAnomalies(mockCtx, user);

    expect(mockCtx.fetchRecentAutopsies).toHaveBeenCalled();
    expect(mockCtx.invokeLLM).toHaveBeenCalled();

    const revenueAnomalies = result.anomalies.filter((a: any) =>
      a.event_type === 'revenue_drop' || a.event_type === 'revenue_spike'
    );
    expect(revenueAnomalies.length).toBeGreaterThan(0);
    expect(mockCtx.saveAnomalies).toHaveBeenCalled();
  });
});
