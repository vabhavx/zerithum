
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectAnomalies } from '../logic/anomalies'; // Import from local logic first

describe('Anomaly Detection Correctness', () => {
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

  it('should correctly separate weeks across months (Jan 1 vs Feb 1)', async () => {
    // Jan 1 2024 is Monday. Week 1.
    // Feb 1 2024 is Thursday. Week 5.

    const transactions = [
      { transaction_date: '2024-01-01', amount: 100, platform: 'Test' },
      { transaction_date: '2024-02-01', amount: 50, platform: 'Test' } // -50% drop if compared
    ];

    // Add padding to pass "insufficient data" check (>10 txs)
    for(let i=0; i<10; i++) {
        transactions.push({
            transaction_date: '2023-01-01', // Old data, sorted first
            amount: 10,
            platform: 'Test'
        });
    }

    mockCtx.fetchRecentTransactions.mockResolvedValue(transactions);
    mockCtx.fetchRecentAutopsies.mockResolvedValue([]);
    mockCtx.invokeLLM.mockResolvedValue({});

    const result = await detectAnomalies(mockCtx, user);

    // If grouped together (bug), weeks length is small, no comparison between Jan 1 and Feb 1.
    // If separated (correct), Jan 1 is one week, Feb 1 is another.
    // Sorted weeks: [OldData...], Jan 1, Feb 1.
    // Comparing Jan 1 (100) vs Feb 1 (50) -> -50% drop -> Anomaly.

    expect(result.anomalies_detected).toBeGreaterThan(0);
    expect(result.anomalies.some(a => a.event_type === 'revenue_drop')).toBe(true);
  });
});
