
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
      // Week A: Jan 31, 2024 (Wednesday). Math.ceil(31/7) = 5. Key: 2024-W5
      { transaction_date: '2024-01-31', amount: 100, platform: 'P1' },
      // Week B: Feb 1, 2024 (Thursday). Math.ceil(1/7) = 1. Key: 2024-W1
      { transaction_date: '2024-02-01', amount: 200, platform: 'P1' }
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

    // Current Logic Prediction:
    // Keys: 2024-W5 (100), 2024-W1 (200).
    // Sorted: 2024-W1, 2024-W5.
    // Sequence: Feb 1 (200) -> Jan 31 (100).
    // Change: (100 - 200)/200 = -50%.
    // Anomaly: Drop.

    // Correct Logic Prediction:
    // Jan 31 (100) -> Feb 1 (200).
    // Change: (200 - 100)/100 = +100%.
    // Anomaly: Spike.

    // We check what anomalies were saved.
    // If bug exists, we expect 'revenue_drop'.
    // If fixed, we expect 'revenue_spike'.

    const saveCall = mockCtx.saveAnomalies.mock.calls[0];
    if (saveCall) {
        const anomalies = saveCall[0];
        // We are looking for the anomaly corresponding to these large transactions
        // The padding transactions are small (10) and old (2023).
        // The sorted array will include 2023 transactions first.
        // 2023-W1...
        // Then 2024-W1 (Feb), Then 2024-W5 (Jan) [With Bug]

        // Find anomaly with impact_amount = -100 (Drop from 200 to 100) or +100 (Spike 100 to 200)
        const relevantAnomaly = anomalies.find((a: any) => Math.abs(a.impact_amount) === 100);

        // This assertion verifies the CURRENT BROKEN BEHAVIOR (Baseline).
        // We expect it to FAIL once we fix it. Or we can assert the BROKEN behavior to confirm reproduction.
        // Let's assert the BROKEN behavior first to prove the bug.
        // expect(relevantAnomaly?.event_type).toBe('revenue_drop');

        // Actually, let's write the test to expect Correct behavior, so it fails now.
        expect(relevantAnomaly).toBeDefined();
        expect(relevantAnomaly?.event_type).toBe('revenue_spike');
    } else {
        // If no anomalies, something else is wrong (maybe threshold not met?)
        // 100 -> 200 is 100% change > 15%. Should trigger.
        throw new Error('No anomalies detected');
    }
  });

  it('should not merge weeks from different months with same week number', async () => {
     const transactions = [
      // Jan 1, 2024. W1.
      { transaction_date: '2024-01-01', amount: 100, platform: 'P1' },
      // Feb 1, 2024. W1.
      { transaction_date: '2024-02-01', amount: 100, platform: 'P1' }
    ];
     // Add padding
    for(let i=0; i<10; i++) {
        transactions.push({
            transaction_date: '2023-01-01', // 2023-W1
            amount: 10,
            platform: 'P1'
        });
    }

    mockCtx.fetchRecentTransactions.mockResolvedValue(transactions);
    mockCtx.fetchRecentAutopsies.mockResolvedValue([]);
    mockCtx.invokeLLM.mockResolvedValue({});

    await detectAnomalies(mockCtx, user);

    // Current Logic:
    // 2024-W1 accumulates Jan 1 (100) + Feb 1 (100) = 200.
    // 2023-W1 accumulates padding (10*10 = 100).

    // We expect separate entries for Jan 1 and Feb 1.

    // There is no direct way to inspect `weeklyRevenue` map from outside.
    // But we can infer from anomalies if they were sequential.
    // Jan 1 (100) -> Feb 1 (100). 0% change. No anomaly.

    // If merged: 2024-W1 has 200.
    // Comparison: 2023-W1 (100) -> 2024-W1 (200).
    // Change: +100%. Spike.

    // So if bug exists -> Revenue Spike detected.
    // If fixed -> No anomaly (between Jan and Feb), or separate weeks.

    const saveCall = mockCtx.saveAnomalies.mock.calls[0];
    let anomalies = [];
    if(saveCall) anomalies = saveCall[0];

    // We expect NO anomaly between Jan 1 and Feb 1 if they are identical amounts and separated properly.
    // However, between 2023 padding and Jan 1?
    // 2023 padding is 100 total? No, padding transactions have same date 2023-01-01. So 2023-W1 = 100.

    // If separate:
    // 2023-W1: 100
    // ...
    // 2024-Jan-W1: 100
    // 2024-Feb-W1: 100

    // 2023-W1 -> 2024-Jan-W1: 0% change.
    // 2024-Jan-W1 -> 2024-Feb-W1: 0% change.
    // No anomalies.

    // If merged:
    // 2023-W1: 100
    // 2024-W1: 200
    // Change: +100%. Spike.

    const spike = anomalies.find((a: any) => a.impact_amount === 100 && a.event_type === 'revenue_spike');
    expect(spike).toBeUndefined();
  });
});
