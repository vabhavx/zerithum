import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/supabaseClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { RefreshCw, Sparkles, Loader2, TrendingUp, FileText, CircleDollarSign, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Lazy load chart components
const RevenueForecasting = React.lazy(() => import("@/components/dashboard/RevenueForecasting"));
const InteractivePlatformChart = React.lazy(() => import("@/components/dashboard/InteractivePlatformChart"));

export default function Dashboard() {
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const { data: transactions = [], isLoading, refetch } = useQuery({
    queryKey: ["revenueTransactions"],
    queryFn: () => base44.entities.RevenueTransaction.fetchAll({}, "-transaction_date"),
  });

  const queryClient = useQueryClient();

  // Metrics Calculation
  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const currentMonthTxns = transactions.filter(t => {
      const date = new Date(t.transaction_date);
      return date >= currentMonthStart && date <= currentMonthEnd;
    });

    const totalMRR = currentMonthTxns.reduce((sum, t) => sum + (t.amount || 0), 0);
    const prevMonthTxns = transactions.filter(t => {
      const date = new Date(t.transaction_date);
      return date >= startOfMonth(subMonths(now, 1)) && date <= endOfMonth(subMonths(now, 1));
    });
    const prevMRR = prevMonthTxns.reduce((sum, t) => sum + (t.amount || 0), 0);

    let mrrChange = "0.0%";
    if (prevMRR > 0) {
      const change = ((totalMRR - prevMRR) / prevMRR) * 100;
      mrrChange = `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
    }

    return { totalMRR, mrrChange, txnCount: currentMonthTxns.length, avgTxn: currentMonthTxns.length ? totalMRR / currentMonthTxns.length : 0 };
  }, [transactions]);

  const handleGenerateInsights = async () => {
    setGeneratingInsights(true);
    // Mock for now
    setTimeout(() => setGeneratingInsights(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Overview</h1>
          <p className="text-sm text-muted-foreground font-mono mt-1 uppercase tracking-wider">
             {format(new Date(), "MMMM yyyy")} · Financial Period Open
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading} className="h-9">
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Sync
          </Button>
          <Button size="sm" onClick={handleGenerateInsights} disabled={generatingInsights} className="h-9">
            {generatingInsights ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-2" />}
            Run Analysis
          </Button>
        </div>
      </div>

      {/* KPI Grid - Dense, bordered */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
        {[
            { label: "Net Revenue", value: `$${metrics.totalMRR.toLocaleString()}`, change: metrics.mrrChange, icon: TrendingUp },
            { label: "Transactions", value: metrics.txnCount, sub: "This Month", icon: FileText },
            { label: "Avg. Ticket", value: `$${metrics.avgTxn.toFixed(2)}`, sub: "Per Transaction", icon: CircleDollarSign },
            { label: "Active Sources", value: "3", sub: "Connected Platforms", icon: Link2 },
        ].map((stat, i) => (
            <div key={i} className="bg-background p-6 hover:bg-muted/5 transition-colors">
                <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider">{stat.label}</span>
                    <stat.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-serif font-medium text-foreground">{stat.value}</div>
                <div className="mt-2 text-xs">
                    {stat.change ? (
                        <span className={stat.change.startsWith('+') ? "text-emerald-500 font-mono" : "text-destructive font-mono"}>
                            {stat.change} <span className="text-muted-foreground font-sans">vs last month</span>
                        </span>
                    ) : (
                        <span className="text-muted-foreground">{stat.sub}</span>
                    )}
                </div>
            </div>
        ))}
      </div>

      {/* Charts Area */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 border border-border bg-card p-6">
            <h3 className="font-serif text-lg mb-6">Revenue Trend</h3>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm font-mono border border-dashed border-border">
                 {/* Placeholder for chart component which might need refactoring too */}
                 <React.Suspense fallback={<Loader2 className="animate-spin" />}>
                    <InteractivePlatformChart transactions={transactions} />
                 </React.Suspense>
            </div>
        </div>
        <div className="border border-border bg-card p-6">
            <h3 className="font-serif text-lg mb-6">Forecast</h3>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm font-mono border border-dashed border-border">
                 <React.Suspense fallback={<Loader2 className="animate-spin" />}>
                    <RevenueForecasting transactions={transactions} />
                 </React.Suspense>
            </div>
        </div>
      </div>
    </div>
  );
}
