import { describe, it, expect } from 'vitest';
import { calculateMetrics } from './dashboardMetrics';
import { startOfMonth, subMonths } from 'date-fns';

describe('calculateMetrics', () => {
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const prevMonthStart = startOfMonth(subMonths(now, 1));
  const m2Start = startOfMonth(subMonths(now, 2));

  it('calculates metrics correctly for mixed transactions', () => {
    const transactions = [
      // Current Month
      { transaction_date: currentMonthStart.toISOString(), amount: 100, platform: 'youtube' },
      { transaction_date: currentMonthStart.toISOString(), amount: 200, platform: 'patreon' },
      // Prev Month
      { transaction_date: prevMonthStart.toISOString(), amount: 150, platform: 'youtube' },
      // 2 Months Ago
      { transaction_date: m2Start.toISOString(), amount: 120, platform: 'youtube' },
      // Old
      { transaction_date: startOfMonth(subMonths(now, 3)).toISOString(), amount: 500, platform: 'youtube' },
    ];

    const result = calculateMetrics(transactions);

    // Totals
    expect(result.totalMRR).toBe(300); // 100 + 200
    expect(result.prevMRR).toBe(150);

    // Trend
    // Change: (300 - 150) / 150 = 100% increase
    expect(result.mrrTrend).toBe('up');
    expect(result.mrrChange).toBe('+100.0%');

    // Platform Breakdown (Current Month)
    expect(result.platformBreakdown).toHaveLength(2);
    expect(result.platformBreakdown).toEqual(expect.arrayContaining([
        { platform: 'youtube', amount: 100 },
        { platform: 'patreon', amount: 200 }
    ]));

    // Trend Data
    expect(result.trendData).toHaveLength(3);
    expect(result.trendData[0].revenue).toBe(120); // m2
    expect(result.trendData[1].revenue).toBe(150); // prev
    expect(result.trendData[2].revenue).toBe(300); // current

    // Top Transactions
    expect(result.topTransactions).toHaveLength(2);
    expect(result.topTransactions[0].amount).toBe(200);
    expect(result.topTransactions[1].amount).toBe(100);
  });

  it('detects concentration risk correctly', () => {
     const transactions = [
      { transaction_date: currentMonthStart.toISOString(), amount: 800, platform: 'youtube' },
      { transaction_date: currentMonthStart.toISOString(), amount: 200, platform: 'patreon' },
    ];
    // Total 1000. YouTube 800 (80%). Risk!

    const result = calculateMetrics(transactions);
    expect(result.concentrationRisk).not.toBeNull();
    expect(result.concentrationRisk.platform).toBe('youtube');
    expect(result.concentrationRisk.percentage).toBe(80);
  });

  it('handles empty transactions', () => {
    const result = calculateMetrics([]);
    expect(result.totalMRR).toBe(0);
    expect(result.prevMRR).toBe(0);
    expect(result.mrrTrend).toBe('neutral');
    expect(result.platformBreakdown).toEqual([]);
    expect(result.topTransactions).toEqual([]);
  });
});
