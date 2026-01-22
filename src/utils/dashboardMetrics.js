import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

/**
 * Calculates dashboard metrics from a list of transactions in a single pass.
 * @param {Array} transactions - List of transactions, sorted or unsorted.
 * @returns {Object} Metrics object used by Dashboard.
 */
export function calculateMetrics(transactions) {
  const now = new Date();

  // Define time ranges
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);

  const prevMonthStart = startOfMonth(subMonths(now, 1));
  const prevMonthEnd = endOfMonth(subMonths(now, 1));

  const m2Start = startOfMonth(subMonths(now, 2));
  const m2End = endOfMonth(subMonths(now, 2));

  // Convert to timestamps for efficient comparison
  const t_current_start = currentMonthStart.getTime();
  const t_current_end = currentMonthEnd.getTime();

  const t_prev_start = prevMonthStart.getTime();
  const t_prev_end = prevMonthEnd.getTime();

  const t_m2_start = m2Start.getTime();
  const t_m2_end = m2End.getTime();

  // Accumulators
  let currentMRR = 0;
  let prevMRR = 0;
  let m2MRR = 0;

  const currentMonthTxns = [];
  const platformMap = {};

  // Single pass O(N)
  for (const t of transactions) {
    const amount = t.amount || 0;
    // Parse date once
    const tDate = new Date(t.transaction_date).getTime();

    // Check current month
    if (tDate >= t_current_start && tDate <= t_current_end) {
      currentMRR += amount;
      currentMonthTxns.push(t);
      if (!platformMap[t.platform]) {
        platformMap[t.platform] = 0;
      }
      platformMap[t.platform] += amount;
    }

    // Check prev month
    if (tDate >= t_prev_start && tDate <= t_prev_end) {
      prevMRR += amount;
    }

    // Check m2 (2 months ago)
    if (tDate >= t_m2_start && tDate <= t_m2_end) {
      m2MRR += amount;
    }
  }

  // Calculate derivatives

  // Trend
  let mrrTrend = "neutral";
  let mrrChange = "0%";
  if (prevMRR > 0) {
    const changePercent = ((currentMRR - prevMRR) / prevMRR) * 100;
    mrrTrend = changePercent > 0 ? "up" : changePercent < 0 ? "down" : "neutral";
    mrrChange = `${changePercent > 0 ? "+" : ""}${changePercent.toFixed(1)}%`;
  }

  // Platform breakdown
  const platformBreakdown = Object.entries(platformMap).map(([platform, amount]) => ({
    platform,
    amount
  }));

  // Concentration risk
  let concentrationRisk = null;
  const totalPlatformRevenue = currentMRR; // Total for current month
  if (totalPlatformRevenue > 0) {
    for (const { platform, amount } of platformBreakdown) {
       const percentage = (amount / totalPlatformRevenue) * 100;
       if (percentage >= 70) {
         concentrationRisk = { platform, percentage };
         break;
       }
    }
  }

  // Trend Data (3 months) - Order: m2, prev, current
  const trendData = [
    { month: format(m2Start, "MMM"), revenue: m2MRR },
    { month: format(prevMonthStart, "MMM"), revenue: prevMRR },
    { month: format(currentMonthStart, "MMM"), revenue: currentMRR }
  ];

  // Top transactions (sort only current month subset)
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
