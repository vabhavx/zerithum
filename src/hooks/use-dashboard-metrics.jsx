import { useMemo } from "react";
import { startOfMonth, endOfMonth, subMonths, subDays } from "date-fns";

export function useDashboardMetrics(transactions = [], reconciliations = []) {
  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);

    const prevMonthStart = startOfMonth(subMonths(now, 1));
    const prevMonthEnd = endOfMonth(subMonths(now, 1));
    const ninetyDaysAgo = subDays(now, 90);

    let totalRevenue = 0;
    let prevRevenue = 0;
    const currentPlatformMap = {};
    const prevPlatformMap = {};
    const recentPlatformMap = {};
    let recentTotal = 0;

    for (let i = 0; i < transactions.length; i++) {
      const t = transactions[i];
      const date = new Date(t.transaction_date);
      const amount = t.amount || 0;
      const platform = t.platform;

      if (date >= currentMonthStart && date <= currentMonthEnd) {
        totalRevenue += amount;
        currentPlatformMap[platform] =
          (currentPlatformMap[platform] || 0) + amount;
      } else if (date >= prevMonthStart && date <= prevMonthEnd) {
        prevRevenue += amount;
        prevPlatformMap[platform] = (prevPlatformMap[platform] || 0) + amount;
      }

      if (date >= ninetyDaysAgo) {
        recentPlatformMap[platform] =
          (recentPlatformMap[platform] || 0) + amount;
        recentTotal += amount;
      }
    }

    // Revenue change
    let revenueTrend = "neutral";
    let revenueChange = "No prior data";
    if (prevRevenue > 0) {
      const pct = ((totalRevenue - prevRevenue) / prevRevenue) * 100;
      revenueTrend = pct > 0 ? "up" : pct < 0 ? "down" : "neutral";
      revenueChange = `${pct > 0 ? "+" : ""}${pct.toFixed(1)}% vs last month`;
    }

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
    let reconciledAmount = 0;
    let unreconciledCount = 0;
    let unreconciledAmount = 0;

    for (let i = 0; i < reconciliations.length; i++) {
      const r = reconciliations[i];
      const amount = r.amount || 0;
      const status = r.status;

      if (status === "matched" || status === "reconciled") {
        reconciledAmount += amount;
      } else if (status === "pending" || status === "unmatched") {
        unreconciledCount += 1;
        unreconciledAmount += amount;
      }
    }

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
