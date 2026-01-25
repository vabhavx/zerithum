import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

/**
 * Calculates dashboard metrics from a list of transactions in a single pass.
 * @param {Array} transactions - List of transaction objects.
 * @param {Date} [now=new Date()] - The reference date (defaults to current time).
 * @returns {Object} Calculated metrics.
 */
export function calculateDashboardMetrics(transactions = [], now = new Date()) {
  const currentStart = startOfMonth(now);
  const currentEnd = endOfMonth(now);

  const prevDate = subMonths(now, 1);
  const prevStart = startOfMonth(prevDate);
  const prevEnd = endOfMonth(prevDate);

  const twoMonthsAgoDate = subMonths(now, 2);
  const twoMonthsAgoStart = startOfMonth(twoMonthsAgoDate);
  const twoMonthsAgoEnd = endOfMonth(twoMonthsAgoDate);

  let currentMRR = 0;
  let prevMRR = 0;
  let twoMonthsAgoMRR = 0;

  const currentMonthTxns = [];
  const platformMap = {};

  // Single pass O(N)
  for (const t of transactions) {
    const date = new Date(t.transaction_date);
    const amount = t.amount || 0;

    // Check Current Month
    if (date >= currentStart && date <= currentEnd) {
      currentMRR += amount;
      currentMonthTxns.push(t);

      // Platform breakdown (only for current month)
      if (!platformMap[t.platform]) {
        platformMap[t.platform] = 0;
      }
      platformMap[t.platform] += amount;
    }
    // Check Previous Month
    else if (date >= prevStart && date <= prevEnd) {
      prevMRR += amount;
    }
    // Check 2 Months Ago
    else if (date >= twoMonthsAgoStart && date <= twoMonthsAgoEnd) {
      twoMonthsAgoMRR += amount;
    }
  }

  // MRR Trend & Change
  let mrrTrend = "neutral";
  let mrrChange = "0%";
  if (prevMRR > 0) {
    const changePercent = ((currentMRR - prevMRR) / prevMRR) * 100;
    mrrTrend = changePercent > 0 ? "up" : changePercent < 0 ? "down" : "neutral";
    mrrChange = `${changePercent > 0 ? "+" : ""}${changePercent.toFixed(1)}%`;
  }

  // Platform Breakdown Array
  const platformBreakdown = Object.entries(platformMap).map(([platform, amount]) => ({
    platform,
    amount
  }));

  // Concentration Risk
  let concentrationRisk = null;
  if (currentMRR > 0) {
    platformBreakdown.forEach(({ platform, amount }) => {
      const percentage = (amount / currentMRR) * 100;
      if (percentage >= 70) {
        concentrationRisk = { platform, percentage };
      }
    });
  }

  // 3-Month Trend Data
  // Order: 2 months ago, Prev month, Current month
  const trendData = [
    {
      month: format(twoMonthsAgoStart, "MMM"),
      revenue: twoMonthsAgoMRR
    },
    {
      month: format(prevStart, "MMM"),
      revenue: prevMRR
    },
    {
      month: format(currentStart, "MMM"),
      revenue: currentMRR
    }
  ];

  // Top Transactions (requires sort of current month subset)
  const topTransactions = [...currentMonthTxns]
    .sort((a, b) => (b.amount || 0) - (a.amount || 0))
    .slice(0, 5);

  return {
    totalMRR: currentMRR,
    mrrTrend,
    mrrChange,
    platformBreakdown,
    concentrationRisk,
    trendData,
    topTransactions,
    prevMRR
  };
}
