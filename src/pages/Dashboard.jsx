import React, { useMemo } from "react";
import { base44 } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  subDays,
  isSameDay,
  addDays,
  startOfDay,
  isAfter
} from "date-fns";
import { RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Components
import RevenueSummaryCard from "@/components/dashboard/RevenueSummaryCard";
import ReconciliationCard from "@/components/dashboard/ReconciliationCard";
import ConcentrationRiskCard from "@/components/dashboard/ConcentrationRiskAlert";
import NextPayoutCard from "@/components/dashboard/NextPayoutCard";
import InteractivePlatformChart from "@/components/dashboard/InteractivePlatformChart";
import ActionItemsPanel from "@/components/dashboard/ActionItemsPanel";
import PlatformBreakdownTable from "@/components/dashboard/PlatformBreakdownTable";

export default function Dashboard() {
  const { data: transactions = [], isLoading: isLoadingTxns, refetch: refetchTxns } = useQuery({
    queryKey: ["revenueTransactions"],
    queryFn: () => base44.entities.RevenueTransaction.fetchAll({}, "-transaction_date"),
    staleTime: 1000 * 60 * 5,
  });

  const { data: reconciliations = [], isLoading: isLoadingRecs } = useQuery({
    queryKey: ["reconciliations"],
    queryFn: () => base44.entities.Reconciliation.fetchAll(),
    staleTime: 1000 * 60 * 5,
  });

  const { data: connectedPlatforms = [], isLoading: isLoadingPlatforms } = useQuery({
    queryKey: ["connectedPlatforms"],
    queryFn: () => base44.entities.ConnectedPlatform.fetchAll(),
    staleTime: 1000 * 60 * 5,
  });

  // --- Metrics Calculation ---

  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const prevMonthStart = startOfMonth(subMonths(now, 1));
    const prevMonthEnd = endOfMonth(subMonths(now, 1));

    // 1. Revenue Summary
    const currentMonthTxns = transactions.filter(t => {
      const d = new Date(t.transaction_date);
      return d >= currentMonthStart && d <= currentMonthEnd;
    });
    const prevMonthTxns = transactions.filter(t => {
      const d = new Date(t.transaction_date);
      return d >= prevMonthStart && d <= prevMonthEnd;
    });

    const totalRevenue = currentMonthTxns.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const prevRevenue = prevMonthTxns.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    // 2. Reconciliation Status
    // Unreconciled = Transactions NOT in reconciliations table
    const reconciledTxnIds = new Set(reconciliations.map(r => r.revenue_transaction_id));
    const reconciledTxns = transactions.filter(t => reconciledTxnIds.has(t.id));
    const unreconciledTxns = transactions.filter(t => !reconciledTxnIds.has(t.id));

    const reconciledAmount = reconciledTxns.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const unreconciledAmount = unreconciledTxns.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const unreconciledCount = unreconciledTxns.length;

    // 3. Concentration Risk (Based on Last 90 Days for better accuracy)
    const l90dStart = subDays(now, 90);
    const l90dTxns = transactions.filter(t => new Date(t.transaction_date) >= l90dStart);

    const platformRevenueMap = {};
    l90dTxns.forEach(t => {
      const p = t.platform || 'Unknown';
      platformRevenueMap[p] = (platformRevenueMap[p] || 0) + (Number(t.amount) || 0);
    });

    const totalL90dRevenue = Object.values(platformRevenueMap).reduce((a, b) => a + b, 0);
    let concentrationRisk = { platform: null, percentage: 0 };

    Object.entries(platformRevenueMap).forEach(([platform, amount]) => {
      const pct = totalL90dRevenue > 0 ? (amount / totalL90dRevenue) * 100 : 0;
      if (pct > concentrationRisk.percentage) {
        concentrationRisk = { platform, percentage: pct };
      }
    });

    // 4. Next Payout Estimation
    // Simple heuristic for demo purposes if no real payout data
    let nextPayout = null;
    const today = startOfDay(now);

    const payouts = connectedPlatforms.map(p => {
      let date = null;
      let amount = 0; // Estimate based on unreconciled balance?
      let confidence = 0;

      if (p.platform === 'stripe') {
        // Stripe usually daily/weekly. Assume 2 days from now.
        date = addDays(today, 2);
        confidence = 95;
      } else if (p.platform === 'youtube') {
        // 21st of current month
        const d = new Date(now.getFullYear(), now.getMonth(), 21);
        date = isAfter(d, today) ? d : new Date(now.getFullYear(), now.getMonth() + 1, 21);
        confidence = 90;
      } else if (p.platform === 'patreon') {
        // 5th of month
        const d = new Date(now.getFullYear(), now.getMonth(), 5);
        date = isAfter(d, today) ? d : new Date(now.getFullYear(), now.getMonth() + 1, 5);
        confidence = 85;
      }

      // Estimate amount: Avg daily revenue * days since last payout?
      // Simplified: Just take sum of unreconciled txns for this platform
      const platformUnreconciled = unreconciledTxns
        .filter(t => t.platform === p.platform)
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      amount = platformUnreconciled || 150; // Fallback to avoid $0 if no data

      return { platform: p.platform, date, amount, confidence };
    }).filter(x => x.date);

    // Sort by soonest
    payouts.sort((a, b) => a.date - b.date);
    nextPayout = payouts[0] || null;

    // 5. Chart Data (Daily Revenue)
    const chartDataMap = {};
    // Init last 90 days with 0
    for (let i = 0; i < 90; i++) {
      const d = subDays(today, i);
      const key = format(d, 'yyyy-MM-dd');
      chartDataMap[key] = 0;
    }

    l90dTxns.forEach(t => {
      const key = format(new Date(t.transaction_date), 'yyyy-MM-dd');
      if (chartDataMap[key] !== undefined) {
        chartDataMap[key] += (Number(t.amount) || 0);
      }
    });

    const chartData = Object.entries(chartDataMap)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .map(([date, revenue], index, array) => {
        // Calculate 7-day moving average
        let ma7 = 0;
        if (index >= 6) {
          const slice = array.slice(index - 6, index + 1);
          const sum = slice.reduce((s, item) => s + item[1], 0);
          ma7 = sum / 7;
        }
        return { date, revenue, ma7: ma7 > 0 ? Number(ma7.toFixed(2)) : null };
      });

    // 6. Platform Breakdown Data
    const platformBreakdownData = {}; // { platformId: { current, previous } }
    // Using platform NAME as key since ID might not match txn platform string easily
    // We'll map connectedPlatforms to this data

    // Map platform names to IDs
    const platformNameToId = {};
    connectedPlatforms.forEach(p => platformNameToId[p.platform] = p.id);

    currentMonthTxns.forEach(t => {
      const pid = platformNameToId[t.platform];
      if (pid) {
        if (!platformBreakdownData[pid]) platformBreakdownData[pid] = { current: 0, previous: 0 };
        platformBreakdownData[pid].current += (Number(t.amount) || 0);
      }
    });

    prevMonthTxns.forEach(t => {
      const pid = platformNameToId[t.platform];
      if (pid) {
        if (!platformBreakdownData[pid]) platformBreakdownData[pid] = { current: 0, previous: 0 };
        platformBreakdownData[pid].previous += (Number(t.amount) || 0);
      }
    });

    // 7. Action Items
    const actionItems = [];
    if (unreconciledCount > 0) {
      actionItems.push({
        id: 'unreconciled',
        title: `${unreconciledCount} Transactions Pending`,
        description: 'Review and reconcile your latest revenue.',
        type: 'warning',
        link: '/reconciliation'
      });
    }

    connectedPlatforms.forEach(p => {
      if (p.sync_status === 'error') {
        actionItems.push({
          id: `sync-${p.id}`,
          title: `${p.platform} Connection Failed`,
          description: 'Reconnect to resume data syncing.',
          type: 'critical',
          link: '/settings/connected-apps'
        });
      }
    });

    if (actionItems.length === 0) {
      // Add a positive empty state item if really empty?
      // No, ActionItemsPanel handles empty state.
    }

    return {
      totalRevenue,
      prevRevenue,
      platformCount: connectedPlatforms.length,
      reconciledAmount,
      unreconciledAmount,
      unreconciledCount,
      concentrationRisk,
      nextPayout,
      chartData,
      platformBreakdownData,
      actionItems,
      lastSynced: connectedPlatforms.length > 0 ? formatDistanceToNow(new Date(connectedPlatforms[0].last_synced_at || new Date()), { addSuffix: true }) : null
    };
  }, [transactions, reconciliations, connectedPlatforms]);

  const handleRefresh = () => {
    refetchTxns();
    // Refetch others
  };

  if (isLoadingTxns || isLoadingRecs || isLoadingPlatforms) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8 pt-6 max-w-[1600px] mx-auto bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-serif text-foreground">Dashboard</h2>
          <p className="text-muted-foreground">
            Financial overview and reconciliation status.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleRefresh} variant="outline" size="sm" className="h-8 gap-1 bg-background">
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Refresh Data
            </span>
          </Button>
        </div>
      </div>

      {/* Top Cards Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <RevenueSummaryCard
          totalRevenue={metrics.totalRevenue}
          previousRevenue={metrics.prevRevenue}
          platformCount={metrics.platformCount}
          lastSynced={metrics.lastSynced}
        />
        <ReconciliationCard
          reconciledAmount={metrics.reconciledAmount}
          unreconciledAmount={metrics.unreconciledAmount}
          unreconciledCount={metrics.unreconciledCount}
        />
        <ConcentrationRiskCard
          platform={metrics.concentrationRisk.platform}
          percentage={metrics.concentrationRisk.percentage}
        />
        <NextPayoutCard
          platformName={metrics.nextPayout?.platform}
          payoutDate={metrics.nextPayout?.date}
          estimatedAmount={metrics.nextPayout?.amount || 0}
          confidence={metrics.nextPayout?.confidence}
        />
      </div>

      {/* Chart & Actions Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
           <InteractivePlatformChart
             data={metrics.chartData}
             isLoading={isLoadingTxns}
           />
        </div>
        <div className="col-span-3">
          <ActionItemsPanel actionItems={metrics.actionItems} />
        </div>
      </div>

      {/* Platform Breakdown Row */}
      <div className="grid gap-4 md:grid-cols-1">
        <PlatformBreakdownTable
          platforms={connectedPlatforms}
          revenueData={metrics.platformBreakdownData}
        />
      </div>
    </div>
  );
}
