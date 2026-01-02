import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

import MRRCard from "@/components/dashboard/MRRCard";
import RevenueBreakdownChart from "@/components/dashboard/RevenueBreakdownChart";
import MRRTrendChart from "@/components/dashboard/MRRTrendChart";
import TopTransactionsList from "@/components/dashboard/TopTransactionsList";
import ConcentrationRiskAlert from "@/components/dashboard/ConcentrationRiskAlert";

export default function Dashboard() {
  const [showRiskAlert, setShowRiskAlert] = useState(true);

  const { data: transactions = [], isLoading, refetch } = useQuery({
    queryKey: ["revenueTransactions"],
    queryFn: () => base44.entities.RevenueTransaction.list("-transaction_date", 100),
  });

  const { data: insights = [] } = useQuery({
    queryKey: ["insights"],
    queryFn: () => base44.entities.Insight.filter({ insight_type: "concentration_risk" }, "-created_date", 1),
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    
    // Current month transactions
    const currentMonthTxns = transactions.filter(t => {
      const date = new Date(t.transaction_date);
      return date >= currentMonthStart && date <= currentMonthEnd;
    });

    // Previous month for comparison
    const prevMonthStart = startOfMonth(subMonths(now, 1));
    const prevMonthEnd = endOfMonth(subMonths(now, 1));
    const prevMonthTxns = transactions.filter(t => {
      const date = new Date(t.transaction_date);
      return date >= prevMonthStart && date <= prevMonthEnd;
    });

    // Total MRR
    const totalMRR = currentMonthTxns.reduce((sum, t) => sum + (t.amount || 0), 0);
    const prevMRR = prevMonthTxns.reduce((sum, t) => sum + (t.amount || 0), 0);
    
    // MRR change
    let mrrTrend = "neutral";
    let mrrChange = "0%";
    if (prevMRR > 0) {
      const changePercent = ((totalMRR - prevMRR) / prevMRR) * 100;
      mrrTrend = changePercent > 0 ? "up" : changePercent < 0 ? "down" : "neutral";
      mrrChange = `${changePercent > 0 ? "+" : ""}${changePercent.toFixed(1)}%`;
    }

    // Platform breakdown
    const platformBreakdown = { youtube: 0, patreon: 0, stripe: 0, gumroad: 0 };
    currentMonthTxns.forEach(t => {
      if (platformBreakdown.hasOwnProperty(t.platform)) {
        platformBreakdown[t.platform] += t.amount || 0;
      }
    });

    // Concentration risk
    let concentrationRisk = null;
    const totalPlatformRevenue = Object.values(platformBreakdown).reduce((a, b) => a + b, 0);
    if (totalPlatformRevenue > 0) {
      Object.entries(platformBreakdown).forEach(([platform, amount]) => {
        const percentage = (amount / totalPlatformRevenue) * 100;
        if (percentage >= 70) {
          concentrationRisk = { platform, percentage };
        }
      });
    }

    // 3-month trend
    const trendData = [];
    for (let i = 2; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = endOfMonth(subMonths(now, i));
      const monthTxns = transactions.filter(t => {
        const date = new Date(t.transaction_date);
        return date >= monthStart && date <= monthEnd;
      });
      const monthTotal = monthTxns.reduce((sum, t) => sum + (t.amount || 0), 0);
      trendData.push({
        month: format(monthStart, "MMM yyyy"),
        amount: monthTotal
      });
    }

    // Top transactions this month
    const topTransactions = [...currentMonthTxns]
      .sort((a, b) => (b.amount || 0) - (a.amount || 0))
      .slice(0, 5);

    return {
      totalMRR,
      mrrTrend,
      mrrChange,
      platformBreakdown,
      concentrationRisk,
      trendData,
      topTransactions
    };
  }, [transactions]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 mt-1">Your revenue at a glance</p>
        </div>
        <Button
          onClick={() => refetch()}
          disabled={isLoading}
          className="clay-sm hover:clay rounded-xl bg-white text-slate-700 border-0 shadow-none hover:shadow-none"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Concentration Risk Alert */}
      {showRiskAlert && metrics.concentrationRisk && (
        <div className="mb-6">
          <ConcentrationRiskAlert
            platform={metrics.concentrationRisk.platform}
            percentage={metrics.concentrationRisk.percentage}
            onDismiss={() => setShowRiskAlert(false)}
          />
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Total MRR */}
        <div className="lg:col-span-1">
          <MRRCard
            title="Total MRR"
            amount={metrics.totalMRR}
            trend={metrics.mrrTrend}
            trendValue={metrics.mrrChange}
          />
        </div>

        {/* Quick Stats */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <div className="clay rounded-2xl p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Transactions</p>
            <p className="text-2xl font-bold text-slate-800">{metrics.topTransactions.length}</p>
            <p className="text-xs text-slate-400 mt-1">This month</p>
          </div>
          <div className="clay rounded-2xl p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Platforms</p>
            <p className="text-2xl font-bold text-slate-800">
              {Object.values(metrics.platformBreakdown).filter(v => v > 0).length}
            </p>
            <p className="text-xs text-slate-400 mt-1">Active</p>
          </div>
          <div className="clay rounded-2xl p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Avg Transaction</p>
            <p className="text-2xl font-bold text-slate-800">
              ${metrics.topTransactions.length > 0 
                ? (metrics.totalMRR / metrics.topTransactions.length).toFixed(0)
                : "0"}
            </p>
            <p className="text-xs text-slate-400 mt-1">This month</p>
          </div>
          <div className="clay rounded-2xl p-5 flex items-center justify-center">
            <div className="text-center">
              <Sparkles className="w-6 h-6 text-violet-500 mx-auto mb-2" />
              <p className="text-xs text-slate-500">AI Insights</p>
              <p className="text-lg font-semibold text-violet-600">{insights.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RevenueBreakdownChart 
          data={metrics.platformBreakdown}
          concentrationRisk={metrics.concentrationRisk}
        />
        <MRRTrendChart data={metrics.trendData} />
      </div>

      {/* Top Transactions */}
      <TopTransactionsList transactions={metrics.topTransactions} />
    </div>
  );
}