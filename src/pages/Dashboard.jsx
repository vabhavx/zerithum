import React, { useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Sparkles, Loader2, TrendingUp, FileText, CircleDollarSign, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { calculateDashboardMetrics } from "@/utils/dashboardMetrics";

import ConcentrationRiskAlert from "@/components/dashboard/ConcentrationRiskAlert";
import LendingSignalsCard from "@/components/dashboard/LendingSignalsCard";
import InsightsPanel from "@/components/dashboard/InsightsPanel";
import AlertBanner from "@/components/dashboard/AlertBanner";

// Lazy load chart components for better performance
const RevenueForecasting = React.lazy(() => import("@/components/dashboard/RevenueForecasting"));
const InteractivePlatformChart = React.lazy(() => import("@/components/dashboard/InteractivePlatformChart"));

export default function Dashboard() {
  const [showRiskAlert, setShowRiskAlert] = useState(true);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [alerts, setAlerts] = useState([]);

  const { data: transactions = [], isLoading, refetch } = useQuery({
    queryKey: ["revenueTransactions"],
    queryFn: () => base44.entities.RevenueTransaction.list("-transaction_date", 500),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const queryClient = useQueryClient();

  const { data: insights = [] } = useQuery({
    queryKey: ["insights"],
    queryFn: () => base44.entities.Insight.list("-created_date", 10),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: autopsyEvents = [] } = useQuery({
    queryKey: ["autopsyEvents"],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.AutopsyEvent.filter({ user_id: user.id, status: 'pending_review' }, "-detected_at", 5);
    },
  });

  const { data: connectedPlatforms = [] } = useQuery({
    queryKey: ["connectedPlatforms"],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.ConnectedPlatform.filter({ user_id: user.id });
    },
  });

  useEffect(() => {
    const newAlerts = [];

    // Autopsy alerts
    if (autopsyEvents.length > 0) {
      newAlerts.push({
        id: 'autopsy',
        type: 'error',
        title: `⚠️ ${autopsyEvents.length} Revenue Anomal${autopsyEvents.length > 1 ? 'ies' : 'y'} Detected`,
        description: 'Critical events require your decision. Review now to understand impact.',
        dismissible: false
      });
    }

    // Sync alerts
    const failedSyncs = connectedPlatforms.filter(p => p.sync_status === 'error');
    if (failedSyncs.length > 0) {
      newAlerts.push({
        id: 'sync',
        type: 'sync',
        title: `⏰ ${failedSyncs.length} Platform${failedSyncs.length > 1 ? 's' : ''} Failed to Sync`,
        description: 'Go to Connected Platforms to reconnect.',
        dismissible: true
      });
    }

    // AI insights available
    if (insights.length > 3) {
      newAlerts.push({
        id: 'insights',
        type: 'info',
        title: '✨ New AI Insights Available',
        description: `${insights.length} insights ready for review.`,
        dismissible: true
      });
    }

    setAlerts(newAlerts);
  }, [autopsyEvents, connectedPlatforms, insights]);

  const handleGenerateInsights = async () => {
    setGeneratingInsights(true);
    try {
      await base44.functions.invoke('generateInsights');
      await queryClient.invalidateQueries({ queryKey: ['insights'] });
    } catch (error) {
      console.error('Failed to generate insights:', error);
    } finally {
      setGeneratingInsights(false);
    }
  };

  const handleDismissAlert = useCallback((id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const handleDismissRisk = useCallback(() => {
    setShowRiskAlert(false);
  }, []);

  // Calculate metrics using optimized utility
  const metrics = useMemo(() => calculateDashboardMetrics(transactions), [transactions]);

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

      {/* Alert Banners */}
      <AlertBanner 
        alerts={alerts} 
        onDismiss={handleDismissAlert}
      />

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
              onDismiss={handleDismissRisk}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Revenue Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-modern rounded-xl p-5 hover:scale-[1.02] transition-transform"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <p className="text-white/50 text-xs mb-1">This Month</p>
          <p className="text-2xl font-bold text-white">${metrics.totalMRR.toFixed(0)}</p>
          <p className={`text-xs mt-2 flex items-center gap-1 ${metrics.mrrTrend === 'up' ? 'text-emerald-400' : metrics.mrrTrend === 'down' ? 'text-red-400' : 'text-white/40'}`}>
            {metrics.mrrChange} vs last month
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-modern rounded-xl p-5 hover:scale-[1.02] transition-transform"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-white/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <p className="text-white/50 text-xs mb-1">Transactions</p>
          <p className="text-2xl font-bold text-white">{transactions.length}</p>
          <p className="text-xs text-white/40 mt-2">All-time</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-modern rounded-xl p-5 hover:scale-[1.02] transition-transform"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center">
              <CircleDollarSign className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <p className="text-white/50 text-xs mb-1">Avg Transaction</p>
          <p className="text-2xl font-bold text-white">
            ${transactions.length > 0 ? (metrics.totalMRR / transactions.length).toFixed(0) : 0}
          </p>
          <p className="text-xs text-white/40 mt-2">Per transaction</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card-modern rounded-xl p-5 hover:scale-[1.02] transition-transform"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-white/10 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <p className="text-white/50 text-xs mb-1">Platforms</p>
          <p className="text-2xl font-bold text-white">{metrics.platformBreakdown.length}</p>
          <p className="text-xs text-white/40 mt-2">Connected sources</p>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <React.Suspense fallback={
          <div className="card-modern rounded-xl p-6 h-[400px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-white/30" />
          </div>
        }>
          <InteractivePlatformChart transactions={transactions} />
        </React.Suspense>
        <React.Suspense fallback={
          <div className="card-modern rounded-xl p-6 h-[400px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-white/30" />
          </div>
        }>
          <RevenueForecasting transactions={transactions} />
        </React.Suspense>
      </div>

      {/* Insights & Lending Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
    </div>
  );
}