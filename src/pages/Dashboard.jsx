import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { RefreshCw, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

import RevenueOverviewCard from "@/components/dashboard/RevenueOverviewCard";
import PlatformBreakdownChart from "@/components/dashboard/PlatformBreakdownChart";
import RevenueTrendChart from "@/components/dashboard/RevenueTrendChart";
import TopTransactionsList from "@/components/dashboard/TopTransactionsList";
import ConcentrationRiskAlert from "@/components/dashboard/ConcentrationRiskAlert";
import LendingSignalsCard from "@/components/dashboard/LendingSignalsCard";
import InsightsPanel from "@/components/dashboard/InsightsPanel";

export default function Dashboard() {
  const [showRiskAlert, setShowRiskAlert] = useState(true);
  const [generatingInsights, setGeneratingInsights] = useState(false);

  const { data: transactions = [], isLoading, refetch } = useQuery({
    queryKey: ["revenueTransactions"],
    queryFn: () => base44.entities.RevenueTransaction.list("-transaction_date", 100),
  });

  const queryClient = useQueryClient();

  const { data: insights = [] } = useQuery({
    queryKey: ["insights"],
    queryFn: () => base44.entities.Insight.list("-created_date", 10),
  });

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const handleGenerateInsights = async () => {
    setGeneratingInsights(true);
    try {
      await base44.functions.invoke('generateInsights');
      await queryClient.invalidateQueries(['insights']);
    } catch (error) {
      console.error('Failed to generate insights:', error);
    } finally {
      setGeneratingInsights(false);
    }
  };

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
    const _prevMRR = prevMonthTxns.reduce((sum, t) => sum + (t.amount || 0), 0);
    
    // MRR change
    let mrrTrend = "neutral";
    let mrrChange = "0%";
    if (_prevMRR > 0) {
      const changePercent = ((totalMRR - _prevMRR) / _prevMRR) * 100;
      mrrTrend = changePercent > 0 ? "up" : changePercent < 0 ? "down" : "neutral";
      mrrChange = `${changePercent > 0 ? "+" : ""}${changePercent.toFixed(1)}%`;
    }

    // Platform breakdown
    const platformMap = {};
    currentMonthTxns.forEach(t => {
      if (!platformMap[t.platform]) {
        platformMap[t.platform] = 0;
      }
      platformMap[t.platform] += t.amount || 0;
    });
    
    const platformBreakdown = Object.entries(platformMap).map(([platform, amount]) => ({
      platform,
      amount
    }));

    // Concentration risk
    let concentrationRisk = null;
    const totalPlatformRevenue = platformBreakdown.reduce((sum, p) => sum + p.amount, 0);
    if (totalPlatformRevenue > 0) {
      platformBreakdown.forEach(({ platform, amount }) => {
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
        month: format(monthStart, "MMM"),
        revenue: monthTotal
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
      topTransactions,
      prevMRR: _prevMRR
    };
  }, [transactions]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-white/40 mt-1 text-sm">Your revenue at a glance</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleGenerateInsights}
            disabled={generatingInsights}
            className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 hover:from-indigo-600 hover:to-purple-700 text-sm h-9"
          >
            {generatingInsights ? (
              <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 mr-2" />
            )}
            Generate Insights
          </Button>
          <Button
            onClick={() => refetch()}
            disabled={isLoading}
            className="rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all text-sm h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Concentration Risk Alert */}
      <AnimatePresence>
        {showRiskAlert && metrics.concentrationRisk && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ConcentrationRiskAlert
              platform={metrics.concentrationRisk.platform}
              percentage={metrics.concentrationRisk.percentage}
              onDismiss={() => setShowRiskAlert(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Revenue Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <RevenueOverviewCard
          title="Total Revenue"
          amount={metrics.totalMRR}
          change={metrics.prevMRR > 0 ? metrics.totalMRR - metrics.prevMRR : 0}
          changePercent={metrics.prevMRR > 0 ? ((metrics.totalMRR - metrics.prevMRR) / metrics.prevMRR) * 100 : 0}
        />
        <RevenueOverviewCard
          title="Total Transactions"
          amount={metrics.topTransactions.length}
          change={0}
          changePercent={0}
        />
        <RevenueOverviewCard
          title="Avg Transaction"
          amount={metrics.topTransactions.length > 0 ? metrics.totalMRR / metrics.topTransactions.length : 0}
          change={0}
          changePercent={0}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <PlatformBreakdownChart 
          data={metrics.platformBreakdown}
        />
        <RevenueTrendChart data={metrics.trendData} />
      </div>

      {/* Insights & Lending Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <InsightsPanel 
            insights={insights.filter(i => i.insight_type !== 'cashflow_forecast')} 
          />
        </div>
        <div>
          <LendingSignalsCard 
            insight={insights.find(i => i.insight_type === 'cashflow_forecast')} 
          />
        </div>
      </div>

      {/* Top Transactions */}
      <TopTransactionsList transactions={metrics.topTransactions} />
    </div>
  );
}