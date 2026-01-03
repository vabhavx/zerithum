import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

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
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-white/40 mt-1 text-sm">Your revenue at a glance</p>
        </div>
        <Button
          onClick={() => refetch()}
          disabled={isLoading}
          className="rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all text-sm h-9"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
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
        <div className="lg:col-span-2 grid grid-cols-2 gap-3">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="card-modern rounded-xl p-4"
          >
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.15em] mb-2">Transactions</p>
            <p className="text-2xl font-bold text-white">{metrics.topTransactions.length}</p>
            <p className="text-[10px] text-white/30 mt-1">This month</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="card-modern rounded-xl p-4"
          >
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.15em] mb-2">Platforms</p>
            <p className="text-2xl font-bold text-white">
              {Object.values(metrics.platformBreakdown).filter(v => v > 0).length}
            </p>
            <p className="text-[10px] text-white/30 mt-1">Active</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="card-modern rounded-xl p-4"
          >
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.15em] mb-2">Avg Transaction</p>
            <p className="text-2xl font-bold text-white">
              ${metrics.topTransactions.length > 0 
                ? (metrics.totalMRR / metrics.topTransactions.length).toFixed(0)
                : "0"}
            </p>
            <p className="text-[10px] text-white/30 mt-1">This month</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
            className="card-modern rounded-xl p-4 flex items-center justify-center"
          >
            <div className="text-center">
              <Sparkles className="w-5 h-5 text-indigo-400 mx-auto mb-2" />
              <p className="text-[10px] text-white/40 uppercase tracking-wider">AI Insights</p>
              <p className="text-xl font-bold text-indigo-400 mt-1">{insights.length}</p>
            </div>
          </motion.div>
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