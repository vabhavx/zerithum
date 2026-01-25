import { describe, it, expect } from 'vitest';
import { calculateDashboardMetrics } from './dashboardMetrics';
import { subMonths, addDays } from 'date-fns';

describe('calculateDashboardMetrics', () => {
  const now = new Date('2024-05-15T12:00:00Z');

  // Helper to create date strings relative to 'now'
  const getDate = (monthsAgo, day = 15) => {
    const d = subMonths(now, monthsAgo);
    d.setDate(day);
    return d.toISOString();
  };

  it('should calculate metrics correctly for mixed months', () => {
    const transactions = [
      { transaction_date: getDate(0), amount: 100, platform: 'stripe' }, // Current: 100
      { transaction_date: getDate(0), amount: 200, platform: 'stripe' }, // Current: 300 total
      { transaction_date: getDate(1), amount: 200, platform: 'stripe' }, // Prev: 200
      { transaction_date: getDate(2), amount: 150, platform: 'stripe' }, // 2 months ago: 150
      { transaction_date: getDate(3), amount: 500, platform: 'stripe' }, // Older: ignored
    ];

    const metrics = calculateDashboardMetrics(transactions, now);

    expect(metrics.totalMRR).toBe(300);
    expect(metrics.prevMRR).toBe(200);

    // Trend calculation: (300 - 200) / 200 = 50%
    expect(metrics.mrrTrend).toBe('up');
    expect(metrics.mrrChange).toBe('+50.0%');

    expect(metrics.trendData).toHaveLength(3);
    expect(metrics.trendData[0].revenue).toBe(150); // Mar (May - 2)
    expect(metrics.trendData[1].revenue).toBe(200); // Apr (May - 1)
    expect(metrics.trendData[2].revenue).toBe(300); // May
  });

  it('should handle platform breakdown and concentration risk', () => {
    const transactions = [
      { transaction_date: getDate(0), amount: 800, platform: 'youtube' },
      { transaction_date: getDate(0), amount: 200, platform: 'patreon' },
    ];

    const metrics = calculateDashboardMetrics(transactions, now);

    expect(metrics.totalMRR).toBe(1000);
    expect(metrics.platformBreakdown).toHaveLength(2);

    // Concentration risk (YouTube is 80% > 70%)
    expect(metrics.concentrationRisk).not.toBeNull();
    expect(metrics.concentrationRisk.platform).toBe('youtube');
    expect(metrics.concentrationRisk.percentage).toBe(80);
  });

  it('should handle no concentration risk', () => {
    const transactions = [
      { transaction_date: getDate(0), amount: 500, platform: 'youtube' },
      { transaction_date: getDate(0), amount: 500, platform: 'patreon' },
    ];

    const metrics = calculateDashboardMetrics(transactions, now);
    expect(metrics.concentrationRisk).toBeNull();
  });

  it('should handle empty transactions', () => {
    const metrics = calculateDashboardMetrics([], now);

    expect(metrics.totalMRR).toBe(0);
    expect(metrics.prevMRR).toBe(0);
    expect(metrics.mrrChange).toBe('0%');
    expect(metrics.trendData).toHaveLength(3);
    expect(metrics.trendData[2].revenue).toBe(0);
  });

  it('should sort top transactions correctly', () => {
    const transactions = [
      { transaction_date: getDate(0), amount: 10, platform: 'a', id: 1 },
      { transaction_date: getDate(0), amount: 50, platform: 'b', id: 2 },
      { transaction_date: getDate(0), amount: 20, platform: 'c', id: 3 },
      { transaction_date: getDate(1), amount: 100, platform: 'd', id: 4 }, // prev month, excluded
    ];

    const metrics = calculateDashboardMetrics(transactions, now);

    expect(metrics.topTransactions).toHaveLength(3);
    expect(metrics.topTransactions[0].amount).toBe(50);
    expect(metrics.topTransactions[1].amount).toBe(20);
    expect(metrics.topTransactions[2].amount).toBe(10);
  });
});
