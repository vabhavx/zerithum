import { useMemo } from "react";
import { startOfMonth, endOfMonth, subMonths, subDays } from "date-fns";

export function useDashboardMetrics(transactions = [], reconciliations = []) {
  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);

    // Current month
    const currentMonthTxns = transactions.filter((t) => {
      const date = new Date(t.transaction_date);
      return date >= currentMonthStart && date <= currentMonthEnd;
    });

    // Previous month
    const prevMonthStart = startOfMonth(subMonths(now, 1));
    const prevMonthEnd = endOfMonth(subMonths(now, 1));
    const prevMonthTxns = transactions.filter((t) => {
      const date = new Date(t.transaction_date);
      return date >= prevMonthStart && date <= prevMonthEnd;
    });

    // Total revenue
    const totalRevenue = currentMonthTxns.reduce(
      (sum, t) => sum + (t.amount || 0),
      0
    );
    const prevRevenue = prevMonthTxns.reduce(
      (sum, t) => sum + (t.amount || 0),
      0
    );

    // Revenue change
    let revenueTrend = "neutral";
    let revenueChange = "No prior data";
    if (prevRevenue > 0) {
      const pct = ((totalRevenue - prevRevenue) / prevRevenue) * 100;
      revenueTrend = pct > 0 ? "up" : pct < 0 ? "down" : "neutral";
      revenueChange = `${pct > 0 ? "+" : ""}${pct.toFixed(1)}% vs last month`;
    }

    // Platform breakdown (current + previous month)
    const currentPlatformMap = {};
    currentMonthTxns.forEach((t) => {
      currentPlatformMap[t.platform] =
        (currentPlatformMap[t.platform] || 0) + (t.amount || 0);
    });

    const prevPlatformMap = {};
    prevMonthTxns.forEach((t) => {
      prevPlatformMap[t.platform] =
        (prevPlatformMap[t.platform] || 0) + (t.amount || 0);
    });

    // Merge platforms
    const allPlatforms = new Set([
      ...Object.keys(currentPlatformMap),
      ...Object.keys(prevPlatformMap),
    ]);
    const platformData = Array.from(allPlatforms).map((platform) => ({
      platform,
      currentMonth: currentPlatformMap[platform] || 0,
      lastMonth: prevPlatformMap[platform] || 0,
    }));

    // Concentration risk (last 90 days for more accuracy)
    const ninetyDaysAgo = subDays(now, 90);
    const recentTxns = transactions.filter(
      (t) => new Date(t.transaction_date) >= ninetyDaysAgo
    );
    const recentPlatformMap = {};
    recentTxns.forEach((t) => {
      recentPlatformMap[t.platform] =
        (recentPlatformMap[t.platform] || 0) + (t.amount || 0);
    });
    const recentTotal = Object.values(recentPlatformMap).reduce(
      (sum, v) => sum + v,
      0
    );

    let concentrationRisk = null;
    if (recentTotal > 0) {
      const sorted = Object.entries(recentPlatformMap).sort(
        (a, b) => b[1] - a[1]
      );
      if (sorted.length > 0) {
        const topPlatform = sorted[0][0];
        const topPct = (sorted[0][1] / recentTotal) * 100;
        concentrationRisk = {
          platform: topPlatform,
          percentage: topPct,
          level:
            topPct >= 70 ? "high" : topPct >= 50 ? "moderate" : "diversified",
        };
      }
    }

    // Reconciliation status
    const reconciledAmount = reconciliations
      .filter((r) => r.status === "matched" || r.status === "reconciled")
      .reduce((sum, r) => sum + (r.amount || 0), 0);
    const unreconciledCount = reconciliations.filter(
      (r) => r.status === "pending" || r.status === "unmatched"
    ).length;
    const unreconciledAmount = reconciliations
      .filter((r) => r.status === "pending" || r.status === "unmatched")
      .reduce((sum, r) => sum + (r.amount || 0), 0);

    // Count unique platforms with data
    const activePlatformCount = Object.keys(currentPlatformMap).length;

    return {
      totalRevenue,
      prevRevenue,
      revenueTrend,
      revenueChange,
      activePlatformCount,
      platformData,
      concentrationRisk,
      reconciledAmount,
      unreconciledAmount,
      unreconciledCount,
    };
  }, [transactions, reconciliations]);

  return metrics;
}
