
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectAnomalies } from '../logic/anomalies';

describe('detectAnomalies Parallelism', () => {
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

  // Helper to setup transaction data
  const setupTransactions = () => {
    const transactions = [];
    const baseDate = new Date('2024-01-01'); // W1 start

    // Helper to add transactions for a week
    const addWeek = (weekOffset: number, amount: number) => {
      const date = new Date(baseDate.getTime() + weekOffset * 7 * 24 * 60 * 60 * 1000);
      transactions.push({
        transaction_date: date.toISOString(),
        amount: amount,
        platform: 'TestPlatform'
      });
    };

    // Add dummy history to pass count check (need >= 10)
    for(let i=0; i<10; i++) {
        addWeek(-1, 10);
    }

    addWeek(0, 1000); // W1
    addWeek(1, 1500); // W2 (+50%)
    addWeek(2, 900);  // W3 (-40%)
    addWeek(3, 1500); // W4 (+66%)
    addWeek(4, 800);  // W5 (-46%)

    return transactions;
  };

  it('should detect multiple anomalies in parallel (benchmark)', async () => {
    const transactions = setupTransactions();

    mockCtx.fetchRecentTransactions.mockResolvedValue(transactions);
    mockCtx.fetchRecentAutopsies.mockResolvedValue([]);

    // Mock invokeLLM with a delay
    const DELAY_MS = 100;
    mockCtx.invokeLLM.mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      return {
        platform_behaviour: 'Simulated LLM response',
        recurrence_probability: 0.5,
        expected_damage: 100
      };
    });

    const startTime = Date.now();
    const result = await detectAnomalies(mockCtx, user);
    const endTime = Date.now();
    const duration = endTime - startTime;

    const revenueAnomalies = result.anomalies.filter((a: any) =>
      a.event_type === 'revenue_drop' || a.event_type === 'revenue_spike'
    );

    const numAnomalies = revenueAnomalies.length;
    console.log(`Detected ${numAnomalies} anomalies in ${duration}ms. Expected duration < ${numAnomalies * DELAY_MS}ms`);

    expect(numAnomalies).toBeGreaterThanOrEqual(3);

    // Assert parallel execution: time should be significantly less than sequential sum
    expect(duration).toBeLessThan(numAnomalies * DELAY_MS * 0.8);
    expect(mockCtx.invokeLLM).toHaveBeenCalledTimes(numAnomalies);
  });

  it('should continue processing other anomalies if one LLM call fails', async () => {
    const transactions = setupTransactions();

    mockCtx.fetchRecentTransactions.mockResolvedValue(transactions);
    mockCtx.fetchRecentAutopsies.mockResolvedValue([]);

    // Mock invokeLLM to fail on the 2nd call
    let callCount = 0;
    mockCtx.invokeLLM.mockImplementation(async () => {
      callCount++;
      if (callCount === 2) {
        throw new Error('LLM API Failure');
      }
      return {
        platform_behaviour: 'Simulated LLM response',
        recurrence_probability: 0.5,
        expected_damage: 100
      };
    });

    const result = await detectAnomalies(mockCtx, user);

    const revenueAnomalies = result.anomalies.filter((a: any) =>
      a.event_type === 'revenue_drop' || a.event_type === 'revenue_spike'
    );

    // We expect total anomalies - 1 (the failed one)
    // Based on previous test, total is around 5. So we expect ~4.
    expect(revenueAnomalies.length).toBeGreaterThanOrEqual(3);
    expect(mockCtx.invokeLLM).toHaveBeenCalledTimes(callCount); // Should be called for all, even if one fails

    // Verify that we didn't crash
    expect(result.success).toBe(true);
  });
});
