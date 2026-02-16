
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectAnomalies } from '../../supabase/functions/_shared/logic/anomalies';

describe('Shared Anomaly Logic Performance', () => {
  const mockCtx = {
    fetchRecentTransactions: vi.fn(),
    fetchRecentAutopsies: vi.fn(),
    invokeLLM: vi.fn(),
    saveAnomalies: vi.fn(),
    logAudit: vi.fn(),
  };

  const user = { id: 'user_shared_123' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call fetchRecentAutopsies multiple times (inefficiently)', async () => {
    // Generate data for 5 weeks with alternating drops
    const transactions = [];

    // Week 1: 1000
    // Week 2: 500 (-50%) -> trigger check
    // Week 3: 200 (-60%) -> trigger check
    // Week 4: 100 (-50%) -> trigger check
    // Week 5: 10 (-90%) -> trigger check

    const dates = [
      '2024-01-01', // W1
      '2024-01-08', // W2
      '2024-01-15', // W3
      '2024-01-22', // W4
      '2024-01-29', // W5
    ];

    const amounts = [1000, 500, 200, 100, 10];

    dates.forEach((date, i) => {
      transactions.push({
        transaction_date: date,
        amount: amounts[i],
        platform: 'TestPlatform'
      });
    });

    // Add padding transactions to pass "insufficient data" check (>10 txs)
    for(let i=0; i<10; i++) {
        transactions.push({
            transaction_date: '2023-01-01',
            amount: 10,
            platform: 'TestPlatform'
        });
    }

    mockCtx.fetchRecentTransactions.mockResolvedValue(transactions);
    mockCtx.fetchRecentAutopsies.mockResolvedValue([]); // No autopsies
    mockCtx.invokeLLM.mockResolvedValue({}); // Dummy LLM response

    await detectAnomalies(mockCtx, user);

    // Week 1->2: -50% (>15%) -> call 1
    // Week 2->3: -60% (>15%) -> call 2
    // Week 3->4: -50% (>15%) -> call 3
    // Week 4->5: -90% (>15%) -> call 4

    // Total weeks: 5 (W1, W2, W3, W4, W5). Loop from i=1 to 4.
    // Each iteration checks change.

    // Currently, it is INSIDE the loop. So expected 4 calls.
    expect(mockCtx.fetchRecentAutopsies).toHaveBeenCalledTimes(1);
  });
});
