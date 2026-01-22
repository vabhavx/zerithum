import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectAnomalies, AnomalyContext } from '../logic/anomalies';

describe('detectAnomalies', () => {
  let mockCtx: AnomalyContext;
  const mockUser = { id: 'user_123' };

  beforeEach(() => {
    mockCtx = {
      fetchRecentTransactions: vi.fn(),
      fetchRecentAutopsies: vi.fn().mockResolvedValue([]),
      invokeLLM: vi.fn().mockResolvedValue({}),
      saveAnomalies: vi.fn().mockResolvedValue(undefined),
      logAudit: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('should return insufficient data message if transactions < 10', async () => {
    (mockCtx.fetchRecentTransactions as any).mockResolvedValue(new Array(5).fill({}));

    const result = await detectAnomalies(mockCtx, mockUser);

    expect(result.message).toBe('Insufficient data for anomaly detection');
    expect(result.anomalies).toEqual([]);
  });

  it('should detect revenue drop > 15%', async () => {
    // Mock transactions for 2 weeks
    // Week 1: 100 total
    // Week 2: 50 total (50% drop)
    const transactions = [
        // Week 1 (Day 1-7)
        { transaction_date: '2024-01-01', amount: 100, platform: 'youtube' },
        // Week 2 (Day 8-14)
        { transaction_date: '2024-01-08', amount: 50, platform: 'youtube' },
        // Add padding to reach > 10 transactions
        ...new Array(10).fill({ transaction_date: '2023-12-01', amount: 10, platform: 'youtube' })
    ];
    (mockCtx.fetchRecentTransactions as any).mockResolvedValue(transactions);

    (mockCtx.invokeLLM as any).mockResolvedValue({
        primary_cause: 'Algorithm change',
        expected_damage: 50
    });

    const result = await detectAnomalies(mockCtx, mockUser);

    expect(result.anomalies_detected).toBeGreaterThan(0);
    const dropAnomaly = result.anomalies.find(a => a.event_type === 'revenue_drop');
    expect(dropAnomaly).toBeDefined();
    expect(dropAnomaly.impact_percentage).toBe(-50);
    expect(mockCtx.saveAnomalies).toHaveBeenCalled();
    expect(mockCtx.logAudit).toHaveBeenCalledWith(expect.objectContaining({
        status: 'success',
        action: 'detect_revenue_anomalies'
    }));
  });

  it('should skip LLM if recent autopsy exists', async () => {
     const transactions = [
        { transaction_date: '2024-01-01', amount: 100, platform: 'youtube' },
        { transaction_date: '2024-01-08', amount: 50, platform: 'youtube' },
        ...new Array(10).fill({ transaction_date: '2023-12-01', amount: 10, platform: 'youtube' })
    ];
    (mockCtx.fetchRecentTransactions as any).mockResolvedValue(transactions);
    (mockCtx.fetchRecentAutopsies as any).mockResolvedValue([{ id: 'existing' }]);

    const result = await detectAnomalies(mockCtx, mockUser);

    // Concentration risk might still trigger, but revenue drop should be skipped
    const dropAnomaly = result.anomalies.find(a => a.event_type === 'revenue_drop');
    expect(dropAnomaly).toBeUndefined();
    expect(mockCtx.invokeLLM).not.toHaveBeenCalled();
  });

  it('should detect concentration risk', async () => {
      // 80% youtube, 20% stripe
      const transactions = [
          { transaction_date: '2024-01-01', amount: 800, platform: 'youtube' },
          { transaction_date: '2024-01-01', amount: 200, platform: 'stripe' },
           ...new Array(10).fill({ transaction_date: '2023-12-01', amount: 10, platform: 'youtube' })
      ];
      (mockCtx.fetchRecentTransactions as any).mockResolvedValue(transactions);

      const result = await detectAnomalies(mockCtx, mockUser);

      const risk = result.anomalies.find(a => a.event_type === 'concentration_shift');
      expect(risk).toBeDefined();
      expect(risk.affected_platforms).toContain('youtube');
  });

  it('should handle errors securely', async () => {
    (mockCtx.fetchRecentTransactions as any).mockRejectedValue(new Error('DB Error'));

    await expect(detectAnomalies(mockCtx, mockUser)).rejects.toThrow('DB Error');

    expect(mockCtx.logAudit).toHaveBeenCalledWith(expect.objectContaining({
        status: 'failure',
        action: 'detect_revenue_anomalies_failed'
    }));
  });
});
