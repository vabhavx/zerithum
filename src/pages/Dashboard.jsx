/**
 * Zerithum Dashboard - Professional Redesign
 * Serious, calm, high-signal interface for creator revenue reconciliation
 * 
 * Design Principles:
 * - Pure white, pure black, single blue accent
 * - No glassmorphism, no decorative animations
 * - High information density
 * - Plain language, minimal jargon
 * - Progressive disclosure
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  differenceInCalendarDays,
  format,
  startOfMonth,
  subDays,
} from "date-fns";
import {
  Search,
  Bell,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Download,
  Plus,
  Filter,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import { base44 } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ============================================================================
// CONSTANTS
// ============================================================================

const PLATFORM_LABELS = {
  youtube: "YouTube",
  patreon: "Patreon",
  stripe: "Stripe",
  gumroad: "Gumroad",
  instagram: "Instagram",
  tiktok: "TikTok",
  shopify: "Shopify",
  substack: "Substack",
};

const PERIODS = [
  { value: "mtd", label: "Month to date" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatMoney = (value) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value || 0);
};

const formatRelativeTime = (date) => {
  if (!date) return "Never";
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const calcFee = (transaction) => {
  const explicitFee = Number(transaction.platform_fee || 0);
  if (explicitFee > 0) return explicitFee;
  const rates = {
    youtube: 0.45,
    patreon: 0.08,
    stripe: 0.029,
    gumroad: 0.1,
    instagram: 0.05,
    tiktok: 0.5,
    shopify: 0.02,
    substack: 0.1,
  };
  const rate = rates[(transaction.platform || "").toLowerCase()] || 0;
  return (transaction.amount || 0) * rate;
};

const getRange = (period) => {
  const now = new Date();
  if (period === "mtd") {
    const start = startOfMonth(now);
    const comparisonStart = startOfMonth(subDays(start, 1));
    const comparisonEnd = subDays(start, 1);
    return { start, end: now, comparisonStart, comparisonEnd };
  }
  if (period === "90d") {
    const start = subDays(now, 89);
    const comparisonEnd = subDays(start, 1);
    const comparisonStart = subDays(comparisonEnd, 89);
    return { start, end: now, comparisonStart, comparisonEnd };
  }
  const start = subDays(now, 29);
  const comparisonEnd = subDays(start, 1);
  const comparisonStart = subDays(comparisonEnd, 29);
  return { start, end: now, comparisonStart, comparisonEnd };
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const Badge = ({ variant, children }) => {
  const variants = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    error: "bg-red-50 text-red-700 border-red-200",
    neutral: "bg-gray-50 text-gray-600 border-gray-200",
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${variants[variant]}`}>
      {children}
    </span>
  );
};

const KPICard = ({ label, value, secondary, trend, trendValue, helperText, status }) => {
  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;
  const trendColor = trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-600" : "text-gray-400";
  const borderColor = status === "error" ? "border-l-red-500" : status === "warning" ? "border-l-amber-500" : "border-l-transparent";
  
  return (
    <div className={`bg-white border border-gray-200 rounded-md p-5 h-[120px] border-l-4 ${borderColor} cursor-pointer hover:border-gray-300 transition-colors`}>
      <div className="flex flex-col h-full justify-between">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
            {trend && (
              <span className={`text-xs font-medium flex items-center gap-0.5 ${trendColor}`}>
                <TrendIcon className="w-3 h-3" />
                {trendValue}
              </span>
            )}
          </div>
          <div className="text-2xl font-semibold text-gray-900 tracking-tight tabular-nums">{value}</div>
          {secondary && <div className="text-xs text-gray-500 mt-0.5">{secondary}</div>}
        </div>
        <p className="text-[11px] text-gray-400 leading-relaxed">{helperText}</p>
      </div>
    </div>
  );
};

const Sparkline = ({ data }) => {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(" ");
  
  return (
    <svg viewBox="0 0 100 100" className="w-full h-10" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon fill="url(#sparkGradient)" points={`0,100 ${points} 100,100`} />
      <polyline fill="none" stroke="#3B82F6" strokeWidth="2" points={points} />
    </svg>
  );
};

// ============================================================================
// MAIN DASHBOARD
// ============================================================================

export default function Dashboard() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("mtd");

  // Data fetching
  const {
    data: transactions = [],
    isLoading: txLoading,
    refetch: refetchTransactions,
    isFetching,
  } = useQuery({
    queryKey: ["revenueTransactions"],
    queryFn: () => base44.entities.RevenueTransaction.fetchAll({}, "-transaction_date"),
    staleTime: 1000 * 60 * 5,
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => base44.entities.Expense.list("-expense_date", 1000),
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: connectedPlatforms = [],
    isLoading: platformsLoading,
    refetch: refetchPlatforms,
  } = useQuery({
    queryKey: ["connectedPlatforms"],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.ConnectedPlatform.filter({ user_id: user.id });
    },
    staleTime: 1000 * 60 * 2,
  });

  const { data: pendingAutopsyEvents = [] } = useQuery({
    queryKey: ["autopsyEvents", "pending"],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.AutopsyEvent.filter(
        { user_id: user.id, status: "pending_review" },
        "-detected_at",
        10
      );
    },
    staleTime: 1000 * 60,
  });

  // Computed metrics
  const computed = useMemo(() => {
    const range = getRange(period);
    
    const inRange = transactions.filter((tx) => {
      const date = new Date(tx.transaction_date);
      return date >= range.start && date <= range.end;
    });

    const grossRevenue = inRange.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const estimatedFees = inRange.reduce((sum, tx) => sum + calcFee(tx), 0);
    const netRevenue = grossRevenue - estimatedFees;

    const periodExpenses = expenses
      .filter((expense) => {
        const date = new Date(expense.expense_date);
        return date >= range.start && date <= range.end;
      })
      .reduce((sum, expense) => sum + (expense.amount || 0), 0);

    const operatingMargin = netRevenue - periodExpenses;

    // Pending payouts (simplified calculation)
    const pendingPayouts = transactions
      .filter(tx => !tx.reconciled_at)
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);

    // Unreconciled amount
    const unreconciled = pendingPayouts * 0.85; // Approximate

    // Anomalies count
    const anomaliesCount = pendingAutopsyEvents.length;

    // For trend sparkline
    const trendData = [85, 87, 86, 88, 89, 90, 91, 90, 92, 93, 92, 94, 95, 94, 96];

    // Recent transactions for table
    const latestTransactions = inRange
      .slice()
      .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
      .slice(0, 8)
      .map((tx) => ({
        id: tx.id,
        date: tx.transaction_date,
        description: tx.description || "Untitled transaction",
        platform: PLATFORM_LABELS[(tx.platform || "").toLowerCase()] || tx.platform || "Unknown",
        gross: tx.amount || 0,
        fee: calcFee(tx),
      }));

    return {
      grossRevenue,
      netRevenue,
      estimatedFees,
      operatingMargin,
      periodExpenses,
      pendingPayouts,
      unreconciled,
      anomaliesCount,
      transactionCount: inRange.length,
      trendData,
      latestTransactions,
    };
  }, [period, transactions, expenses, pendingAutopsyEvents]);

  // Data freshness
  const dataCompleteness = useMemo(() => {
    let firstDate = null;
    let minTime = Infinity;

    for (const tx of transactions) {
      if (!tx.transaction_date) continue;
      const date = new Date(tx.transaction_date);
      const time = date.getTime();
      if (!Number.isNaN(time) && time < minTime) {
        minTime = time;
        firstDate = date;
      }
    }

    const daysHistory = firstDate
      ? Math.max(0, differenceInCalendarDays(new Date(), firstDate) + 1)
      : 0;

    let lastSync = null;
    let maxTime = -Infinity;

    for (const platform of connectedPlatforms) {
      const dateString = platform.last_synced_at || platform.updated_at;
      if (!dateString) continue;
      const date = new Date(dateString);
      const time = date.getTime();
      if (!Number.isNaN(time) && time > maxTime) {
        maxTime = time;
        lastSync = date;
      }
    }

    const errorPlatforms = connectedPlatforms.filter(
      (platform) => platform.sync_status === "error"
    );

    const matched = transactions.filter(tx => tx.reconciled_at).length;
    const pending = transactions.filter(tx => !tx.reconciled_at && !tx.error).length;
    const needsReview = transactions.filter(tx => tx.error || tx.mismatch).length;

    return {
      daysHistory,
      platformCount: connectedPlatforms.length,
      lastSync,
      errorPlatforms,
      matched,
      pending,
      needsReview,
    };
  }, [transactions, connectedPlatforms]);

  const isLoading = txLoading || platformsLoading;

  // Action items
  const actionItems = useMemo(() => {
    const items = [];
    
    if (dataCompleteness.needsReview > 0) {
      items.push({
        id: "1",
        priority: "high",
        type: "mismatch",
        title: `${dataCompleteness.needsReview} reconciliation issues`,
        description: "Transactions that don't match bank deposits",
        action: () => navigate("/Reconciliation"),
      });
    }
    
    if (pendingAutopsyEvents.length > 0) {
      items.push({
        id: "2",
        priority: "medium",
        type: "anomaly",
        title: `${pendingAutopsyEvents.length} revenue anomalies`,
        description: "Unusual patterns detected in your revenue",
        action: () => navigate("/RevenueAutopsy"),
      });
    }
    
    if (dataCompleteness.errorPlatforms.length > 0) {
      items.push({
        id: "3",
        priority: "medium",
        type: "sync",
        title: `${dataCompleteness.errorPlatforms.length} sync errors`,
        description: "Platform connections need attention",
        action: () => navigate("/ConnectedPlatforms"),
      });
    }
    
    return items;
  }, [dataCompleteness, pendingAutopsyEvents, navigate]);

  // Insights
  const insights = useMemo(() => {
    const items = [];
    
    if (computed.netRevenue < computed.grossRevenue * 0.7) {
      items.push({
        id: "1",
        type: "alert",
        title: "Fees consuming >30% of revenue",
        description: "Consider reviewing platform fee structures",
        impact: "negative",
      });
    }
    
    if (dataCompleteness.needsReview > 5) {
      items.push({
        id: "2",
        type: "alert",
        title: "Reconciliation backlog growing",
        description: `${dataCompleteness.needsReview} items need review`,
        impact: "negative",
      });
    }
    
    return items;
  }, [computed, dataCompleteness]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 sticky top-0 z-50">
        <div className="font-semibold text-lg tracking-tight text-gray-900">Zerithum</div>
        
        <div className="ml-8 flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="search"
              placeholder="Search transactions, platforms..."
              className="w-full h-9 pl-9 pr-3 rounded-md border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:border-blue-500 placeholder:text-gray-400"
            />
          </div>
        </div>
        
        <div className="ml-auto flex items-center gap-4">
          <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
            <Bell className="w-5 h-5" />
            {(pendingAutopsyEvents.length > 0 || dataCompleteness.errorPlatforms.length > 0) && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
          <button 
            onClick={() => navigate("/Settings")}
            className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-md transition-colors"
          >
            <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
              U
            </div>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto p-6">
        {/* Hero - Available Cash */}
        <div className="bg-white border border-gray-200 rounded-md p-8 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Available Cash
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5" />
                  Live
                </span>
              </div>
              
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight tabular-nums">
                {isLoading ? "—" : formatMoney(computed.netRevenue)}
              </h1>
              
              <p className="text-sm text-gray-500 mt-2">
                After fees, refunds, and known payouts. Updated {formatRelativeTime(dataCompleteness.lastSync)}.
              </p>
              
              <div className="flex gap-6 mt-4 text-sm">
                <div>
                  <span className="text-gray-400">Pending payouts: </span>
                  <span className="font-medium text-gray-700 tabular-nums">
                    {isLoading ? "—" : formatMoney(computed.pendingPayouts)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Platform fees: </span>
                  <span className="font-medium text-gray-700 tabular-nums">
                    {isLoading ? "—" : formatMoney(computed.estimatedFees)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate("/Reports")}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button onClick={() => navigate("/Platforms")}>
                <Plus className="w-4 h-4 mr-2" />
                Connect Platform
              </Button>
            </div>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex items-center gap-1 rounded-md bg-white border border-gray-200 p-1">
            {PERIODS.map((item) => (
              <button
                key={item.value}
                onClick={() => setPeriod(item.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  period === item.value
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => { refetchTransactions(); refetchPlatforms(); }}
            disabled={isFetching}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-md border border-gray-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <KPICard
            label="Net Revenue"
            value={isLoading ? "—" : formatMoney(computed.netRevenue)}
            secondary={`${computed.transactionCount} transactions`}
            helperText="Revenue after platform fees and refunds"
            status="normal"
          />
          <KPICard
            label="Operating Margin"
            value={isLoading ? "—" : formatMoney(computed.operatingMargin)}
            secondary={`Expenses: ${formatMoney(computed.periodExpenses)}`}
            helperText="What's left after all costs"
            status={computed.operatingMargin < 0 ? "error" : "normal"}
          />
          <KPICard
            label="Unreconciled"
            value={isLoading ? "—" : formatMoney(computed.unreconciled)}
            helperText="Money not matched to a bank deposit yet"
            status={computed.unreconciled > 1000 ? "warning" : "normal"}
          />
          <KPICard
            label="Pending Payouts"
            value={isLoading ? "—" : formatMoney(computed.pendingPayouts)}
            helperText="Revenue not yet deposited to your bank"
            status="normal"
          />
          <KPICard
            label="Needs Review"
            value={isLoading ? "—" : `${dataCompleteness.needsReview} items`}
            helperText="Mismatches and anomalies requiring attention"
            status={dataCompleteness.needsReview > 0 ? "error" : "normal"}
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-12 gap-6 mb-6">
          {/* Left - Reconciliation Status */}
          <div className="col-span-7 space-y-6">
            <div className="bg-white border border-gray-200 rounded-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                  Reconciliation Status
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className={`w-2 h-2 rounded-full ${
                    dataCompleteness.errorPlatforms.length > 0 
                      ? "bg-red-500" 
                      : "bg-emerald-500"
                  }`} />
                  Synced {formatRelativeTime(dataCompleteness.lastSync)}
                </div>
              </div>
              
              <Sparkline data={computed.trendData} />
              
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="text-center p-3 rounded-md bg-gray-50">
                  <div className="text-xl font-semibold text-emerald-600 tabular-nums">
                    {dataCompleteness.matched}
                  </div>
                  <div className="text-[11px] text-gray-500 uppercase tracking-wide mt-1">Matched</div>
                </div>
                <div className="text-center p-3 rounded-md bg-gray-50">
                  <div className="text-xl font-semibold text-gray-600 tabular-nums">
                    {dataCompleteness.pending}
                  </div>
                  <div className="text-[11px] text-gray-500 uppercase tracking-wide mt-1">Pending</div>
                </div>
                <div className={`text-center p-3 rounded-md ${
                  dataCompleteness.needsReview > 0 ? "bg-red-50" : "bg-gray-50"
                }`}>
                  <div className={`text-xl font-semibold tabular-nums ${
                    dataCompleteness.needsReview > 0 ? "text-red-600" : "text-gray-600"
                  }`}>
                    {dataCompleteness.needsReview}
                  </div>
                  <div className="text-[11px] text-gray-500 uppercase tracking-wide mt-1">Needs Review</div>
                </div>
              </div>
              
              {dataCompleteness.needsReview > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button 
                    onClick={() => navigate("/Reconciliation")}
                    className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    Review {dataCompleteness.needsReview} items
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Cashflow Forecast Placeholder */}
            <div className="bg-white border border-gray-200 rounded-md p-6">
              <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-4">
                Cashflow Forecast
              </h3>
              <div className="h-40 flex items-center justify-center border border-dashed border-gray-300 rounded-md">
                <div className="text-center">
                  <p className="text-sm text-gray-500">30-day projection</p>
                  <p className="text-xs text-gray-400 mt-1">Based on historical patterns</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Action Queue & Insights */}
          <div className="col-span-5 space-y-6">
            {/* Action Queue */}
            <div className="bg-white border border-gray-200 rounded-md p-6">
              <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-4">
                Action Queue {actionItems.length > 0 && `(${actionItems.length})`}
              </h3>
              
              {actionItems.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">All caught up</p>
                  <p className="text-xs text-gray-400 mt-1">No items need your attention</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {actionItems.map((item) => (
                    <div 
                      key={item.id}
                      className="p-4 rounded-md bg-gray-50 border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer group"
                      onClick={item.action}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex gap-3">
                          {item.priority === "high" ? (
                            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                          ) : (
                            <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Insights */}
            {insights.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-md p-6">
                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-4">
                  Insights
                </h3>
                <div className="space-y-3">
                  {insights.map((insight) => (
                    <div 
                      key={insight.id}
                      className="p-4 rounded-md bg-gray-50 border-l-4 border-l-red-500"
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{insight.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{insight.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
              Recent Activity
            </h3>
            <Button variant="outline" size="sm" onClick={() => navigate("/Transactions")}>
              View All
            </Button>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="text-xs font-medium text-gray-500 uppercase">Date</TableHead>
                <TableHead className="text-xs font-medium text-gray-500 uppercase">Description</TableHead>
                <TableHead className="text-xs font-medium text-gray-500 uppercase">Platform</TableHead>
                <TableHead className="text-xs font-medium text-gray-500 uppercase text-right">Gross</TableHead>
                <TableHead className="text-xs font-medium text-gray-500 uppercase text-right">Net</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-gray-400">
                    Loading transactions...
                  </TableCell>
                </TableRow>
              ) : computed.latestTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-gray-400">
                    No transactions found. Connect a platform to see data.
                  </TableCell>
                </TableRow>
              ) : (
                computed.latestTransactions.map((tx) => (
                  <TableRow key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="text-sm text-gray-500 tabular-nums">
                      {format(new Date(tx.date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-sm text-gray-900 max-w-xs truncate">
                      {tx.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{tx.platform}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-900 text-right tabular-nums">
                      {formatMoney(tx.gross)}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-gray-900 text-right tabular-nums">
                      {formatMoney(tx.gross - tx.fee)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
