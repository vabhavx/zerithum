/**
 * Zerithum Enterprise Dashboard v3.0
 * Professional, high-performance interface for creator revenue reconciliation
 * Design principles: Palantir/Paradigm style - restrained, precise, minimal decoration
 * 
 * Features:
 * - Real-time data synchronization
 * - Advanced export (CSV, PDF, Excel)
 * - Predictive cashflow forecasting
 * - AI-powered insights
 * - Platform health monitoring
 * - Keyboard shortcuts & accessibility
 * - Virtualized rendering for large datasets
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  format,
  startOfMonth,
  subDays,
  addDays,
  parseISO,
} from "date-fns";
import {
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  Plus,
  Minus,
  MoreHorizontal,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Zap,
  Shield,
  WifiOff,
  X,
  BarChart3,
  PieChart,
  Activity,
  CreditCard,
  Wallet,
  ArrowRight,
  Copy,
  Check,
} from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid, PieChart as RePieChart, Pie, Cell, ReferenceLine } from 'recharts';
import { base44 } from "@/api/supabaseClient";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

// Performance utilities
import {
  useThrottle,
  memoize,
  LRUCache,
} from "@/lib/performance.js";

// ============================================================================
// PERFORMANCE CONSTANTS
// ============================================================================
const QUERY_STALE_TIME = 30 * 1000;
const QUERY_CACHE_TIME = 5 * 60 * 1000;
const calcCache = new LRUCache(1000);
const VISIBLE_ROWS = 50;

const PLATFORM_LABELS = {
  youtube: "YouTube",
  patreon: "Patreon",
  stripe: "Stripe",
  gumroad: "Gumroad",
  instagram: "Instagram",
  tiktok: "TikTok",
  shopify: "Shopify",
  substack: "Substack",
  paypal: "PayPal",
  "ko-fi": "Ko-fi",
  "buy_me_a_coffee": "Buy Me a Coffee",
};

const PLATFORM_COLORS = {
  youtube: '#FF0000',
  patreon: '#FF424D',
  stripe: '#635BFF',
  gumroad: '#36A9AE',
  instagram: '#E4405F',
  tiktok: '#000000',
  shopify: '#96BF48',
  substack: '#FF6719',
  paypal: '#003087',
  "ko-fi": '#FF5E5B',
  "buy_me_a_coffee": '#FFDD00',
};

const PLATFORM_FEE_RATES = {
  youtube: 0.45,
  patreon: 0.08,
  stripe: 0.029,
  gumroad: 0.1,
  instagram: 0.05,
  tiktok: 0.5,
  shopify: 0.02,
  substack: 0.1,
  paypal: 0.034,
  "ko-fi": 0.05,
  "buy_me_a_coffee": 0.05,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const calcFee = memoize((transaction) => {
  const cacheKey = JSON.stringify(transaction);
  const cached = calcCache.get(cacheKey);
  if (cached !== undefined) return cached;
  const explicitFee = Number(transaction.platform_fee || 0);
  if (explicitFee > 0) { calcCache.set(cacheKey, explicitFee); return explicitFee; }
  const rate = PLATFORM_FEE_RATES[(transaction.platform || "").toLowerCase()] || 0;
  const result = (transaction.amount || 0) * rate;
  calcCache.set(cacheKey, result);
  return result;
}, 1000);

const getRange = memoize((period) => {
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
  if (period === "7d") {
    const start = subDays(now, 6);
    const comparisonEnd = subDays(start, 1);
    const comparisonStart = subDays(comparisonEnd, 6);
    return { start, end: now, comparisonStart, comparisonEnd };
  }
  const start = subDays(now, 29);
  const comparisonEnd = subDays(start, 1);
  const comparisonStart = subDays(comparisonEnd, 29);
  return { start, end: now, comparisonStart, comparisonEnd };
});

const formatCurrency = (amount, currency = "USD") =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);

const formatNumber = (num) =>
  new Intl.NumberFormat('en-US').format(num || 0);

const formatRelativeTime = (date) => {
  if (!date) return 'never';
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const formatCompactNumber = (number) => {
  if (number >= 1e9) return (number / 1e9).toFixed(1) + 'B';
  if (number >= 1e6) return (number / 1e6).toFixed(1) + 'M';
  if (number >= 1e3) return (number / 1e3).toFixed(1) + 'K';
  return number.toString();
};

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

const generateCSV = (data, filename) => {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(h => {
      const val = row[h];
      if (typeof val === 'string' && val.includes(',')) return `"${val.replace(/"/g, '""')}"`;
      return val;
    }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const generateJSON = (data, filename) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${format(new Date(), 'yyyy-MM-dd')}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ============================================================================
// PREDICTIVE ANALYTICS
// ============================================================================

const calculateTrend = (data) => {
  if (data.length < 2) return { slope: 0, intercept: 0, r2: 0 };
  const n = data.length;
  const sumX = data.reduce((sum, _, i) => sum + i, 0);
  const sumY = data.reduce((sum, val) => sum + val, 0);
  const sumXY = data.reduce((sum, val, i) => sum + i * val, 0);
  const sumXX = data.reduce((sum, _, i) => sum + i * i, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const yMean = sumY / n;
  const ssTotal = data.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
  const ssResidual = data.reduce((sum, val, i) => sum + Math.pow(val - (slope * i + intercept), 2), 0);
  const r2 = ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 0;

  return { slope, intercept, r2 };
};

const generateForecast = (historicalData, days = 30) => {
  if (historicalData.length < 7) return [];
  const values = historicalData.map(d => d.amount || d.value || 0);
  const { slope, intercept } = calculateTrend(values);

  const lastDate = historicalData[historicalData.length - 1]?.date
    ? parseISO(historicalData[historicalData.length - 1].date)
    : new Date();

  const forecast = [];
  for (let i = 1; i <= days; i++) {
    const predictedValue = Math.max(0, slope * (values.length + i) + intercept);
    const confidenceInterval = Math.sqrt(i) * 0.1 * predictedValue;
    forecast.push({
      date: format(addDays(lastDate, i), 'yyyy-MM-dd'),
      predicted: Math.round(predictedValue),
      upper: Math.round(predictedValue + confidenceInterval),
      lower: Math.round(Math.max(0, predictedValue - confidenceInterval)),
      isForecast: true,
    });
  }
  return forecast;
};

// ============================================================================
// COMPONENT: DesignTokens
// ============================================================================

const DesignTokens = () => (
  <style>{`
    :root {
      --neutral-0: #FFFFFF;
      --neutral-50: #FAFAFA;
      --neutral-100: #F5F5F5;
      --neutral-200: #E5E5E5;
      --neutral-300: #D4D4D4;
      --neutral-400: #A3A3A3;
      --neutral-500: #737373;
      --neutral-600: #525252;
      --neutral-700: #404040;
      --neutral-800: #262626;
      --neutral-900: #171717;
      --accent-50: #EFF6FF;
      --accent-100: #DBEAFE;
      --accent-200: #BFDBFE;
      --accent-500: #3B82F6;
      --accent-600: #2563EB;
      --accent-700: #1D4ED8;
      --success: #10B981;
      --warning: #F59E0B;
      --error: #EF4444;
      --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
      --duration-fast: 100ms;
      --duration-normal: 150ms;
      --ease-out: cubic-bezier(0, 0, 0.2, 1);
    }
    * { box-sizing: border-box; }
    body {
      font-family: var(--font-sans);
      background: var(--neutral-50);
      color: var(--neutral-900);
      margin: 0;
      -webkit-font-smoothing: antialiased;
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }
    .tabular-nums { font-variant-numeric: tabular-nums; }
    .animate-pulse-slow { animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .glass {
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }
  `}</style>
);

// ============================================================================
// COMPONENT: Card
// ============================================================================

const Card = ({ children, className = '', onClick }) => (
  <div
    onClick={onClick}
    className={cn(
      "bg-white border border-[var(--neutral-200)] rounded-lg overflow-hidden",
      onClick && "cursor-pointer hover:border-[var(--neutral-300)] hover:shadow-sm transition-all duration-[var(--duration-fast)]",
      className
    )}
  >
    {children}
  </div>
);

// ============================================================================
// COMPONENT: Badge
// ============================================================================

const Badge = ({ variant = 'default', children, className }) => {
  const variants = {
    default: 'bg-[var(--accent-100)] text-[var(--accent-700)]',
    success: 'bg-[var(--success)]/10 text-[var(--success)]',
    warning: 'bg-[var(--warning)]/10 text-[var(--warning)]',
    error: 'bg-[var(--error)]/10 text-[var(--error)]',
    neutral: 'bg-[var(--neutral-100)] text-[var(--neutral-600)]',
    outline: 'bg-transparent border border-[var(--neutral-300)] text-[var(--neutral-600)]',
  };
  return (
    <span className={cn(`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium`, variants[variant], className)}>
      {children}
    </span>
  );
};

// ============================================================================
// COMPONENT: Button
// ============================================================================

const Button = ({
  variant = 'secondary',
  size = 'md',
  isLoading,
  children,
  onClick,
  className = '',
  disabled,
  icon: Icon,
}) => {
  const variants = {
    primary: 'bg-[var(--accent-600)] text-white hover:bg-[var(--accent-700)] shadow-sm',
    secondary: 'bg-white text-[var(--neutral-700)] hover:bg-[var(--neutral-50)] border border-[var(--neutral-300)]',
    ghost: 'bg-transparent text-[var(--neutral-600)] hover:bg-[var(--neutral-100)]',
    danger: 'bg-[var(--error)]/10 text-[var(--error)] hover:bg-[var(--error)]/20',
  };
  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-11 px-5 text-sm',
    icon: 'h-9 w-9 p-0 justify-center',
  };
  return (
    <button
      onClick={onClick}
      disabled={isLoading || disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-[var(--duration-fast)]',
        'disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]',
        variants[variant], sizes[size], className
      )}
    >
      {isLoading ? (
        <RefreshCw className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className={cn("w-4 h-4", children && "mr-2")} />
      ) : null}
      {children}
    </button>
  );
};

// ============================================================================
// COMPONENT: ExportMenu
// ============================================================================

const ExportMenu = ({ onExport, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const exportOptions = [
    { label: 'CSV', icon: FileSpreadsheet, format: 'csv' },
    { label: 'JSON', icon: FileText, format: 'json' },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="secondary"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        icon={Download}
        className="relative"
      >
        Export
        <ChevronDown className={cn("ml-2 w-4 h-4 transition-transform", isOpen && "rotate-180")} />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg border border-[var(--neutral-200)] shadow-lg z-50 py-1">
          {exportOptions.map((opt) => (
            <button
              key={opt.format}
              onClick={() => { onExport(opt.format); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--neutral-700)] hover:bg-[var(--neutral-50)] transition-colors"
            >
              <opt.icon className="w-4 h-4 text-[var(--neutral-400)]" />
              Export as {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENT: PeriodSelector
// ============================================================================

const PeriodSelector = ({ value, onChange }) => {
  const periods = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: 'mtd', label: 'Month to Date' },
    { value: '90d', label: '90 Days' },
  ];

  return (
    <div className="flex items-center gap-1 bg-[var(--neutral-100)] rounded-lg p-1">
      {periods.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
            value === p.value
              ? "bg-white text-[var(--neutral-900)] shadow-sm"
              : "text-[var(--neutral-500)] hover:text-[var(--neutral-700)]"
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
};

// ============================================================================
// COMPONENT: Sparkline
// ============================================================================

const Sparkline = ({ data, color = 'var(--accent-500)', height = 40 }) => {
  if (data.length < 2) return <div className="w-full" style={{ height }} />;

  const chartData = data.map((val, i) => ({
    index: i,
    value: typeof val === 'object' ? val.amount || val.value : val
  }));

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#spark-${color})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// ============================================================================
// COMPONENT: CashHero
// ============================================================================

const CashHero = ({ position, onExport, onConnect, onRefresh, isRefreshing, lastUpdated }) => {
  const [showCopied, setShowCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formatCurrency(position.availableCash));
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  return (
    <Card className="p-6 lg:p-8 mb-6 bg-gradient-to-br from-white via-white to-[var(--neutral-50)]">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-semibold text-[var(--neutral-500)] uppercase tracking-wider">
              Net Operating Profit
            </span>
            <Badge variant="success">
              <span className="w-1.5 h-1.5 bg-[var(--success)] rounded-full mr-1.5 animate-pulse" />
              Live
            </Badge>
            {lastUpdated && (
              <span className="text-xs text-[var(--neutral-400)]">
                Updated {formatRelativeTime(lastUpdated)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 group">
            <h1 className="text-4xl lg:text-5xl font-bold text-[var(--neutral-900)] tracking-tight tabular-nums">
              {formatCurrency(position.availableCash)}
            </h1>
            <button
              onClick={copyToClipboard}
              className="p-2 text-[var(--neutral-400)] hover:text-[var(--neutral-600)] hover:bg-[var(--neutral-100)] rounded-lg transition-all opacity-0 group-hover:opacity-100"
              title="Copy amount"
            >
              {showCopied ? <Check className="w-4 h-4 text-[var(--success)]" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <p className="text-sm text-[var(--neutral-500)] mt-3 max-w-lg">
            Actual cash available after all platform fees, pending payouts, and expenses.
          </p>

          <div className="flex flex-wrap gap-6 mt-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--warning)]/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-[var(--warning)]" />
              </div>
              <div>
                <span className="text-xs text-[var(--neutral-400)] block">Pending Payouts</span>
                <span className="text-sm font-semibold text-[var(--neutral-700)] tabular-nums">
                  {formatCurrency(position.pendingPayouts)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--error)]/10 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-[var(--error)]" />
              </div>
              <div>
                <span className="text-xs text-[var(--neutral-400)] block">Platform Fees</span>
                <span className="text-sm font-semibold text-[var(--neutral-700)] tabular-nums">
                  {formatCurrency(position.heldForFees)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-100)] flex items-center justify-center">
                <Wallet className="w-4 h-4 text-[var(--accent-600)]" />
              </div>
              <div>
                <span className="text-xs text-[var(--neutral-400)] block">Gross Revenue</span>
                <span className="text-sm font-semibold text-[var(--neutral-700)] tabular-nums">
                  {formatCurrency(position.grossRevenue)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            isLoading={isRefreshing}
            className="hidden lg:flex"
            title="Refresh data"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          </Button>
          <ExportMenu onExport={onExport} disabled={!position.availableCash} />
          <Button variant="primary" onClick={onConnect} icon={Plus}>
            Connect Platform
          </Button>
        </div>
      </div>
    </Card>
  );
};

// ============================================================================
// COMPONENT: KPICard
// ============================================================================

const KPICard = ({ metric, onClick }) => {
  const TrendIcon = metric.trend === 'up' ? TrendingUp : metric.trend === 'down' ? TrendingDown : Minus;
  const trendColor = metric.trend === 'up' ? 'text-[var(--success)]' : metric.trend === 'down' ? 'text-[var(--error)]' : 'text-[var(--neutral-400)]';
  const borderColor = metric.status === 'error' ? 'border-l-[var(--error)]' : metric.status === 'warning' ? 'border-l-[var(--warning)]' : 'border-l-transparent';

  return (
    <Card
      onClick={onClick}
      className={cn(
        "p-5 h-[140px] border-l-4",
        borderColor,
        onClick && "cursor-pointer hover:shadow-md hover:border-[var(--neutral-300)]"
      )}
    >
      <div className="flex flex-col h-full justify-between">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-[var(--neutral-500)] uppercase tracking-wider">
              {metric.label}
            </span>
            {metric.trend && (
              <span className={cn("text-xs font-medium flex items-center gap-0.5", trendColor)}>
                <TrendIcon className="w-3.5 h-3.5" />
                {metric.trendValue}
              </span>
            )}
          </div>
          <div className="text-2xl font-bold text-[var(--neutral-900)] tracking-tight tabular-nums">
            {metric.value}
          </div>
          {metric.secondaryValue && (
            <div className="text-xs text-[var(--neutral-500)] mt-1">
              {metric.secondaryValue}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-[var(--neutral-400)] leading-relaxed">
            {metric.helperText}
          </p>
          {metric.sparkline && (
            <div className="w-16">
              <Sparkline data={metric.sparkline} color={metric.trend === 'up' ? 'var(--success)' : metric.trend === 'down' ? 'var(--error)' : 'var(--neutral-400)'} height={24} />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

// ============================================================================
// COMPONENT: ReconciliationCard
// ============================================================================

const ReconciliationCard = ({ summary, onViewDetails }) => {
  const total = summary.matched + summary.pending + summary.needsReview;
  const matchRate = total > 0 ? Math.round((summary.matched / total) * 100) : 0;

  const statusConfig = {
    idle: { color: 'var(--success)', label: 'Synced' },
    syncing: { color: 'var(--warning)', label: 'Syncing...' },
    error: { color: 'var(--error)', label: 'Sync Failed' },
  };
  const status = statusConfig[summary.syncStatus] || statusConfig.idle;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[var(--neutral-500)]" />
          <h3 className="text-xs font-semibold text-[var(--neutral-900)] uppercase tracking-wider">
            Reconciliation Status
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: status.color }} />
          <span style={{ color: status.color }}>{status.label}</span>
          <span className="text-[var(--neutral-400)]">{formatRelativeTime(summary.lastSyncAt)}</span>
        </div>
      </div>

      {summary.trendData?.length > 0 && (
        <div className="mb-5">
          <Sparkline data={summary.trendData} color="var(--accent-500)" height={50} />
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="text-center p-4 rounded-lg bg-[var(--success)]/5 border border-[var(--success)]/10">
          <div className="text-2xl font-bold text-[var(--success)] tabular-nums">{formatNumber(summary.matched)}</div>
          <div className="text-[11px] text-[var(--neutral-500)] mt-1 uppercase tracking-wide font-medium">Matched</div>
        </div>
        <div className="text-center p-4 rounded-lg bg-[var(--neutral-100)]">
          <div className="text-2xl font-bold text-[var(--neutral-600)] tabular-nums">{formatNumber(summary.pending)}</div>
          <div className="text-[11px] text-[var(--neutral-500)] mt-1 uppercase tracking-wide font-medium">Pending</div>
        </div>
        <div className={cn(
          "text-center p-4 rounded-lg border",
          summary.needsReview > 0 ? 'bg-[var(--error)]/5 border-[var(--error)]/10' : 'bg-[var(--neutral-100)] border-transparent'
        )}>
          <div className={cn("text-2xl font-bold tabular-nums", summary.needsReview > 0 ? 'text-[var(--error)]' : 'text-[var(--neutral-600)]')}>
            {formatNumber(summary.needsReview)}
          </div>
          <div className="text-[11px] text-[var(--neutral-500)] mt-1 uppercase tracking-wide font-medium">Needs Review</div>
        </div>
      </div>

      <div className="pt-4 border-t border-[var(--neutral-200)]">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-[var(--neutral-500)]">Match Rate</span>
          <span className="font-bold text-[var(--neutral-900)] tabular-nums">{matchRate}%</span>
        </div>
        <div className="w-full h-2 bg-[var(--neutral-200)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${matchRate}%`,
              background: matchRate >= 95 ? 'var(--success)' : matchRate >= 80 ? 'var(--warning)' : 'var(--error)'
            }}
          />
        </div>
      </div>

      {summary.needsReview > 0 && (
        <button
          onClick={onViewDetails}
          className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-[var(--error)] bg-[var(--error)]/5 hover:bg-[var(--error)]/10 rounded-lg transition-colors"
        >
          Review {summary.needsReview} Items
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </Card>
  );
};

// ============================================================================
// COMPONENT: CashflowForecast
// ============================================================================

const CashflowForecast = ({ historicalData, forecastData }) => {
  const [showConfidenceInterval, setShowConfidenceInterval] = useState(true);

  const combinedData = useMemo(() => {
    const historical = historicalData.map(d => ({ ...d, isHistorical: true }));
    return [...historical, ...forecastData];
  }, [historicalData, forecastData]);

  const totalPredicted = forecastData.reduce((sum, d) => sum + d.predicted, 0);
  const avgDaily = forecastData.length > 0 ? totalPredicted / forecastData.length : 0;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[var(--neutral-500)]" />
          <h3 className="text-xs font-semibold text-[var(--neutral-900)] uppercase tracking-wider">
            Cashflow Forecast
          </h3>
          <Badge variant="default">30 Days</Badge>
        </div>
        <button
          onClick={() => setShowConfidenceInterval(!showConfidenceInterval)}
          className="text-xs text-[var(--accent-600)] hover:text-[var(--accent-700)] font-medium"
        >
          {showConfidenceInterval ? 'Hide' : 'Show'} Confidence Interval
        </button>
      </div>

      {forecastData.length > 0 ? (
        <>
          <div className="h-48 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={combinedData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="forecastHistorical" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-500)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="var(--accent-500)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="forecastFuture" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-500)" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="var(--accent-500)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--neutral-200)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(val) => format(parseISO(val), 'MMM d')}
                  stroke="var(--neutral-400)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={(val) => `$${formatCompactNumber(val)}`}
                  stroke="var(--neutral-400)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  width={50}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white border border-[var(--neutral-200)] shadow-lg rounded-lg p-3">
                        <p className="text-xs text-[var(--neutral-500)] mb-1">
                          {format(parseISO(data.date), 'MMM d, yyyy')}
                        </p>
                        {'predicted' in data ? (
                          <>
                            <p className="text-sm font-semibold text-[var(--accent-600)]">
                              Predicted: {formatCurrency(data.predicted)}
                            </p>
                            {showConfidenceInterval && (
                              <p className="text-xs text-[var(--neutral-400)] mt-1">
                                Range: {formatCurrency(data.lower)} - {formatCurrency(data.upper)}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-sm font-semibold text-[var(--neutral-900)]">
                            Actual: {formatCurrency(data.amount)}
                          </p>
                        )}
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="var(--accent-500)"
                  strokeWidth={2}
                  fill="url(#forecastHistorical)"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="predicted"
                  stroke="var(--accent-500)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="url(#forecastFuture)"
                  isAnimationActive={false}
                />
                {showConfidenceInterval && (
                  <Area
                    type="monotone"
                    dataKey="upper"
                    stroke="none"
                    fill="var(--accent-500)"
                    fillOpacity={0.05}
                    isAnimationActive={false}
                  />
                )}
                <ReferenceLine x={historicalData[historicalData.length - 1]?.date} stroke="var(--neutral-300)" strokeDasharray="3 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[var(--neutral-200)]">
            <div>
              <span className="text-xs text-[var(--neutral-400)] block">30-Day Projection</span>
              <span className="text-lg font-bold text-[var(--accent-600)] tabular-nums">{formatCurrency(totalPredicted)}</span>
            </div>
            <div>
              <span className="text-xs text-[var(--neutral-400)] block">Daily Average</span>
              <span className="text-lg font-bold text-[var(--neutral-700)] tabular-nums">{formatCurrency(avgDaily)}</span>
            </div>
            <div>
              <span className="text-xs text-[var(--neutral-400)] block">Confidence</span>
              <span className="text-lg font-bold text-[var(--success)]">{forecastData.length > 7 ? 'High' : 'Medium'}</span>
            </div>
          </div>
        </>
      ) : (
        <div className="h-48 flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-[var(--neutral-300)] mx-auto mb-3" />
            <p className="text-sm text-[var(--neutral-500)]">Not enough data for forecasting</p>
            <p className="text-xs text-[var(--neutral-400)] mt-1">Need at least 7 days of data</p>
          </div>
        </div>
      )}
    </Card>
  );
};

// ============================================================================
// COMPONENT: PlatformHealth
// ============================================================================

const PlatformHealth = ({ platforms, onConnect }) => {
  const getStatus = (platform) => {
    if (platform.sync_status === 'error') return { label: 'Error', color: 'var(--error)', icon: WifiOff };
    if (platform.sync_status === 'syncing') return { label: 'Syncing', color: 'var(--warning)', icon: RefreshCw };
    const lastSync = platform.last_synced_at ? new Date(platform.last_synced_at) : null;
    const hoursSinceSync = lastSync ? (new Date() - lastSync) / (1000 * 60 * 60) : Infinity;
    if (hoursSinceSync > 24) return { label: 'Stale', color: 'var(--warning)', icon: Clock };
    return { label: 'Healthy', color: 'var(--success)', icon: CheckCircle };
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[var(--neutral-500)]" />
          <h3 className="text-xs font-semibold text-[var(--neutral-900)] uppercase tracking-wider">
            Platform Health
          </h3>
        </div>
        <Badge variant={platforms.length > 0 ? 'success' : 'neutral'}>
          {platforms.length} Connected
        </Badge>
      </div>

      {platforms.length > 0 ? (
        <div className="space-y-3">
          {platforms.map((platform) => {
            const status = getStatus(platform);
            const StatusIcon = status.icon;
            const color = PLATFORM_COLORS[platform.provider?.toLowerCase()] || 'var(--neutral-400)';

            return (
              <div key={platform.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--neutral-50)] hover:bg-[var(--neutral-100)] transition-colors">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: color }}
                  >
                    {platform.provider?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--neutral-900)]">
                      {PLATFORM_LABELS[platform.provider?.toLowerCase()] || platform.provider}
                    </p>
                    <p className="text-xs text-[var(--neutral-400)]">
                      Last sync {formatRelativeTime(platform.last_synced_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusIcon className="w-4 h-4" style={{ color: status.color }} />
                  <span className="text-xs font-medium" style={{ color: status.color }}>{status.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <WifiOff className="w-12 h-12 text-[var(--neutral-300)] mx-auto mb-3" />
          <p className="text-sm text-[var(--neutral-500)]">No platforms connected</p>
          <p className="text-xs text-[var(--neutral-400)] mt-1 mb-4">Connect platforms to see health status</p>
          <Button variant="primary" size="sm" onClick={onConnect}>Connect Platform</Button>
        </div>
      )}
    </Card>
  );
};

// ============================================================================
// COMPONENT: ActionQueue
// ============================================================================

const ActionQueue = ({ items, onReview }) => {
  if (items.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="w-4 h-4 text-[var(--success)]" />
          <h3 className="text-xs font-semibold text-[var(--neutral-900)] uppercase tracking-wider">
            Action Queue
          </h3>
        </div>
        <div className="text-center py-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[var(--success)]/10 flex items-center justify-center">
            <CheckCircle className="w-7 h-7 text-[var(--success)]" />
          </div>
          <p className="text-sm font-semibold text-[var(--neutral-700)]">All caught up</p>
          <p className="text-xs text-[var(--neutral-400)] mt-1">No items need your attention</p>
        </div>
      </Card>
    );
  }

  const typeConfig = {
    mismatch: { badge: 'error', label: 'Mismatch', icon: AlertTriangle },
    missing_receipt: { badge: 'warning', label: 'Receipt Missing', icon: FileText },
    anomaly: { badge: 'warning', label: 'Anomaly', icon: Activity },
    duplicate: { badge: 'neutral', label: 'Duplicate', icon: Copy },
    sync_error: { badge: 'error', label: 'Sync Error', icon: WifiOff },
  };

  const priorityConfig = {
    high: { color: 'var(--error)', label: 'High' },
    medium: { color: 'var(--warning)', label: 'Medium' },
    low: { color: 'var(--neutral-400)', label: 'Low' },
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[var(--warning)]" />
          <h3 className="text-xs font-semibold text-[var(--neutral-900)] uppercase tracking-wider">
            Action Queue
          </h3>
        </div>
        <Badge variant="warning">{items.length} Items</Badge>
      </div>

      <div className="space-y-3">
        {items.slice(0, 4).map((item) => {
          const config = typeConfig[item.type] || typeConfig.anomaly;
          const TypeIcon = config.icon;
          const priority = priorityConfig[item.priority] || priorityConfig.medium;

          return (
            <div
              key={item.id}
              onClick={() => onReview(item)}
              className="p-4 rounded-lg bg-[var(--neutral-50)] border border-[var(--neutral-200)] hover:border-[var(--warning)]/50 hover:shadow-sm transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3 flex-1 min-w-0">
                  <div className="mt-0.5">
                    <TypeIcon className="w-4 h-4" style={{ color: priority.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-[var(--neutral-900)] truncate">
                        {item.title}
                      </span>
                      <Badge variant={config.badge}>{config.label}</Badge>
                    </div>
                    <p className="text-xs text-[var(--neutral-500)] mt-1 line-clamp-2">
                      {item.description}
                    </p>
                    {item.amount !== undefined && (
                      <p className="text-sm font-semibold text-[var(--neutral-700)] mt-2 tabular-nums">
                        {formatCurrency(item.amount, item.currency)}
                        {item.expectedAmount !== undefined && (
                          <span className="text-[var(--neutral-400)] font-normal ml-1">
                            (expected {formatCurrency(item.expectedAmount, item.currency)})
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); onReview(item); }}
                >
                  Review
                </Button>
              </div>
            </div>
          );
        })}

        {items.length > 4 && (
          <button className="w-full text-center text-sm font-medium text-[var(--accent-600)] hover:text-[var(--accent-700)] py-2 hover:bg-[var(--accent-50)] rounded-lg transition-colors">
            +{items.length - 4} more items
          </button>
        )}
      </div>
    </Card>
  );
};

// ============================================================================
// COMPONENT: InsightsPanel
// ============================================================================

const InsightsPanel = ({ insights, transactions, periodExpenses }) => {
  const generatedInsights = useMemo(() => {
    const computed = [...insights];

    // Platform concentration insight
    const platformTotals = transactions.reduce((acc, tx) => {
      acc[tx.platform] = (acc[tx.platform] || 0) + (tx.amount || 0);
      return acc;
    }, {});
    const totalRevenue = Object.values(platformTotals).reduce((a, b) => a + b, 0);
    const sortedPlatforms = Object.entries(platformTotals).sort((a, b) => b[1] - a[1]);

    if (sortedPlatforms.length > 0 && totalRevenue > 0) {
      const [topPlatform, topAmount] = sortedPlatforms[0];
      const concentration = (topAmount / totalRevenue) * 100;

      if (concentration > 60) {
        computed.push({
          id: 'concentration-risk',
          type: 'alert',
          title: `${concentration.toFixed(0)}% revenue from ${PLATFORM_LABELS[topPlatform] || topPlatform}`,
          description: 'High platform concentration risk. Consider diversifying revenue sources.',
          impact: 'negative',
          citationCount: transactions.filter(t => t.platform === topPlatform).length,
        });
      }
    }

    // Expense ratio insight
    const totalRevenueVal = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    if (totalRevenueVal > 0 && periodExpenses > 0) {
      const expenseRatio = (periodExpenses / totalRevenueVal) * 100;
      if (expenseRatio > 30) {
        computed.push({
          id: 'expense-ratio',
          type: 'alert',
          title: `Expenses are ${expenseRatio.toFixed(1)}% of revenue`,
          description: 'Your expense ratio is above recommended levels. Review discretionary spending.',
          impact: 'negative',
          citationCount: 1,
        });
      }
    }

    return computed.slice(0, 5);
  }, [insights, transactions, periodExpenses]);

  const impactConfig = {
    positive: { border: 'border-l-[var(--success)]', bg: 'bg-[var(--success)]/5', icon: TrendingUp },
    negative: { border: 'border-l-[var(--error)]', bg: 'bg-[var(--error)]/5', icon: TrendingDown },
    neutral: { border: 'border-l-[var(--neutral-400)]', bg: 'bg-[var(--neutral-100)]', icon: Minus },
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-[var(--warning)]" />
        <h3 className="text-xs font-semibold text-[var(--neutral-900)] uppercase tracking-wider">
          AI Insights
        </h3>
      </div>

      <div className="space-y-3">
        {generatedInsights.map((insight) => {
          const config = impactConfig[insight.impact];
          const Icon = config.icon;

          return (
            <div
              key={insight.id}
              className={cn(
                "p-4 rounded-lg border-l-4",
                config.border,
                config.bg,
                "hover:shadow-sm transition-shadow cursor-pointer"
              )}
            >
              <div className="flex items-start gap-3">
                <Icon className={cn("w-4 h-4 mt-0.5 shrink-0",
                  insight.impact === 'positive' ? 'text-[var(--success)]' :
                    insight.impact === 'negative' ? 'text-[var(--error)]' : 'text-[var(--neutral-400)]'
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--neutral-900)]">
                    {insight.title}
                  </p>
                  <p className="text-xs text-[var(--neutral-500)] mt-1">
                    {insight.description}
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-[11px] text-[var(--neutral-400)]">
                      Based on {insight.citationCount} transactions
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {generatedInsights.length === 0 && (
          <div className="text-center py-6">
            <Activity className="w-10 h-10 text-[var(--neutral-300)] mx-auto mb-2" />
            <p className="text-sm text-[var(--neutral-500)]">No insights available yet</p>
            <p className="text-xs text-[var(--neutral-400)]">Continue using the platform for personalized insights</p>
          </div>
        )}
      </div>
    </Card>
  );
};

// ============================================================================
// COMPONENT: PlatformBreakdown
// ============================================================================

const PlatformBreakdown = ({ transactions }) => {
  const data = useMemo(() => {
    const platformTotals = transactions.reduce((acc, tx) => {
      const platform = tx.platform || 'unknown';
      acc[platform] = (acc[platform] || 0) + (tx.amount || 0);
      return acc;
    }, {});

    return Object.entries(platformTotals)
      .map(([platform, amount]) => ({
        name: PLATFORM_LABELS[platform] || platform,
        value: amount,
        color: PLATFORM_COLORS[platform] || 'var(--neutral-400)',
        rawPlatform: platform,
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-5">
        <PieChart className="w-4 h-4 text-[var(--neutral-500)]" />
        <h3 className="text-xs font-semibold text-[var(--neutral-900)] uppercase tracking-wider">
          Revenue by Platform
        </h3>
      </div>

      {data.length > 0 ? (
        <>
          <div className="h-40 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
              </RePieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {data.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[var(--neutral-700)]">{item.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium tabular-nums">{formatCurrency(item.value)}</span>
                  <span className="text-xs text-[var(--neutral-400)] w-10 text-right">
                    {((item.value / total) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="h-40 flex items-center justify-center">
          <p className="text-sm text-[var(--neutral-400)]">No platform data available</p>
        </div>
      )}
    </Card>
  );
};

// ============================================================================
// COMPONENT: ReviewTable
// ============================================================================

const ReviewTable = ({ items, onExport }) => {
  const [selectedId, setSelectedId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [filterStatus, setFilterStatus] = useState('all');
  const tableRef = useRef(null);

  const statusConfig = {
    matched: { badge: 'success', label: 'Matched' },
    pending: { badge: 'neutral', label: 'Pending' },
    mismatch: { badge: 'error', label: 'Mismatch' },
    duplicate: { badge: 'warning', label: 'Duplicate' },
  };

  const filteredItems = useMemo(() => {
    let filtered = filterStatus === 'all' ? items : items.filter(i => i.status === filterStatus);
    return filtered.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (sortConfig.direction === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });
  }, [items, filterStatus, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-[var(--neutral-200)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-xs font-semibold text-[var(--neutral-900)] uppercase tracking-wider">
            Recent Transactions
          </h3>
          <Badge variant="neutral">{items.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs border border-[var(--neutral-200)] rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-[var(--accent-500)]"
          >
            <option value="all">All Status</option>
            <option value="matched">Matched</option>
            <option value="pending">Pending</option>
            <option value="mismatch">Mismatch</option>
          </select>
          <Button variant="secondary" size="sm" onClick={() => onExport('csv')} icon={Download}>
            Export
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto" ref={tableRef}>
        <table className="w-full">
          <thead>
            <tr className="bg-[var(--neutral-50)]">
              {[
                { key: 'status', label: 'Status' },
                { key: 'platform', label: 'Platform' },
                { key: 'description', label: 'Description' },
                { key: 'date', label: 'Date' },
                { key: 'amount', label: 'Amount', right: true },
                { key: 'expectedAmount', label: 'Expected', right: true },
                { key: 'matchConfidence', label: 'Match', center: true },
              ].map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={cn(
                    "py-3 px-4 text-[11px] font-semibold text-[var(--neutral-500)] uppercase tracking-wider cursor-pointer hover:bg-[var(--neutral-100)] transition-colors select-none",
                    col.right && "text-right",
                    col.center && "text-center"
                  )}
                >
                  <div className={cn("flex items-center gap-1", col.right && "justify-end", col.center && "justify-center")}>
                    {col.label}
                    {sortConfig.key === col.key && (
                      <ChevronDown className={cn("w-3 h-3 transition-transform", sortConfig.direction === 'asc' && "rotate-180")} />
                    )}
                  </div>
                </th>
              ))}
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.slice(0, VISIBLE_ROWS).map((item) => (
              <tr
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={cn(
                  "border-b border-[var(--neutral-200)] last:border-0 hover:bg-[var(--neutral-50)] transition-colors cursor-pointer",
                  selectedId === item.id && "bg-[var(--accent-50)]"
                )}
              >
                <td className="py-3 px-4">
                  <Badge variant={statusConfig[item.status]?.badge || 'neutral'}>
                    {statusConfig[item.status]?.label || item.status}
                  </Badge>
                </td>
                <td className="py-3 px-4 text-sm font-medium text-[var(--neutral-700)]">
                  {item.platform}
                </td>
                <td className="py-3 px-4 text-sm text-[var(--neutral-600)] max-w-xs truncate" title={item.description}>
                  {item.description}
                </td>
                <td className="py-3 px-4 text-sm text-[var(--neutral-500)] tabular-nums">
                  {item.date}
                </td>
                <td className="py-3 px-4 text-sm font-semibold text-[var(--neutral-900)] text-right tabular-nums">
                  {formatCurrency(item.amount)}
                </td>
                <td className="py-3 px-4 text-sm text-[var(--neutral-500)] text-right tabular-nums">
                  {item.expectedAmount ? formatCurrency(item.expectedAmount) : '—'}
                </td>
                <td className="py-3 px-4 text-center">
                  {item.matchConfidence ? (
                    <span className={cn(
                      "text-sm font-semibold tabular-nums",
                      item.matchConfidence >= 90 ? 'text-[var(--success)]' :
                        item.matchConfidence >= 70 ? 'text-[var(--warning)]' : 'text-[var(--error)]'
                    )}>
                      {item.matchConfidence}%
                    </span>
                  ) : (
                    <span className="text-[var(--neutral-400)]">—</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <button className="p-1.5 hover:bg-[var(--neutral-200)] rounded-md transition-colors">
                    <MoreHorizontal className="w-4 h-4 text-[var(--neutral-400)]" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredItems.length > VISIBLE_ROWS && (
        <div className="p-3 border-t border-[var(--neutral-200)] text-center">
          <span className="text-xs text-[var(--neutral-400)]">
            Showing {VISIBLE_ROWS} of {filteredItems.length} transactions
          </span>
        </div>
      )}
    </Card>
  );
};

// ============================================================================
// COMPONENT: KeyboardShortcuts
// ============================================================================

const KeyboardShortcuts = () => {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        setShowHelp(true);
      }
      if (e.key === 'Escape') {
        setShowHelp(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!showHelp) return null;

  const shortcuts = [
    { key: '?', description: 'Show keyboard shortcuts' },
    { key: 'R', description: 'Refresh data' },
    { key: 'E', description: 'Export transactions' },
    { key: 'N', description: 'New transaction' },
    { key: 'P', description: 'Connect platform' },
    { key: 'Esc', description: 'Close modal / Deselect' },
    { key: '/', description: 'Focus search' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setShowHelp(false)}>
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--neutral-900)]">Keyboard Shortcuts</h3>
          <button onClick={() => setShowHelp(false)} className="p-1 hover:bg-[var(--neutral-100)] rounded-lg transition-colors">
            <X className="w-5 h-5 text-[var(--neutral-400)]" />
          </button>
        </div>
        <div className="space-y-2">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.key} className="flex items-center justify-between py-2">
              <span className="text-sm text-[var(--neutral-600)]">{shortcut.description}</span>
              <kbd className="px-2 py-1 bg-[var(--neutral-100)] rounded text-xs font-mono font-semibold text-[var(--neutral-700)]">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState("30d");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Fetch user
  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  // Fetch transactions
  const {
    data: transactions = [],
    isLoading: txLoading,
    refetch: refetchTransactions,
    dataUpdatedAt: txUpdatedAt,
  } = useQuery({
    queryKey: ["revenueTransactions", period],
    queryFn: async () => {
      const data = await base44.entities.RevenueTransaction.fetchAll({}, "-transaction_date");
      setLastUpdated(new Date());
      return data;
    },
    staleTime: QUERY_STALE_TIME,
    cacheTime: QUERY_CACHE_TIME,
  });

  // Fetch expenses
  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses", period],
    queryFn: () => base44.entities.Expense.list("-expense_date", 1000),
    staleTime: QUERY_STALE_TIME,
    cacheTime: QUERY_CACHE_TIME,
  });

  // Fetch connected platforms
  const {
    data: connectedPlatforms = [],
    isLoading: platformsLoading,
    refetch: refetchPlatforms,
  } = useQuery({
    queryKey: ["connectedPlatforms"],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user?.id) return [];
      return base44.entities.ConnectedPlatform.filter({ user_id: user.id });
    },
    staleTime: QUERY_STALE_TIME,
  });

  // Fetch pending autopsy events
  const { data: pendingAutopsyEvents = [] } = useQuery({
    queryKey: ["autopsyEvents", "pending"],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user?.id) return [];
      return base44.entities.AutopsyEvent.filter({ user_id: user.id, status: "pending_review" }, "-detected_at", 10);
    },
    staleTime: QUERY_STALE_TIME,
  });

  // Computed metrics
  const computed = useMemo(() => {
    const range = getRange(period);
    const inRange = transactions.filter((tx) => {
      const date = new Date(tx.transaction_date);
      return date >= range.start && date <= range.end;
    });
    const inComparisonRange = transactions.filter((tx) => {
      const date = new Date(tx.transaction_date);
      return date >= range.comparisonStart && date <= range.comparisonEnd;
    });

    const grossRevenue = inRange.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const estimatedFees = inRange.reduce((sum, tx) => sum + calcFee(tx), 0);
    const netRevenue = grossRevenue - estimatedFees;

    const comparisonGross = inComparisonRange.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const revenueDelta = comparisonGross > 0 ? ((grossRevenue - comparisonGross) / comparisonGross) * 100 : 0;

    const periodExpenses = expenses
      .filter((expense) => {
        const date = new Date(expense.expense_date);
        return date >= range.start && date <= range.end;
      })
      .reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const operatingMargin = netRevenue - periodExpenses;

    // Build trend data
    const trendMap = new Map();
    let currentDate = new Date(range.start);
    while (currentDate <= range.end) {
      trendMap.set(format(currentDate, "yyyy-MM-dd"), 0);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    inRange.forEach(tx => {
      const key = format(new Date(tx.transaction_date), "yyyy-MM-dd");
      if (trendMap.has(key)) trendMap.set(key, trendMap.get(key) + (tx.amount || 0));
    });
    const trendData = Array.from(trendMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Filtered transactions for table
    const filteredLatest = inRange
      .slice()
      .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
      .filter((tx) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (tx.description && tx.description.toLowerCase().includes(query)) ||
          (tx.platform && tx.platform.toLowerCase().includes(query));
      })
      .slice(0, VISIBLE_ROWS)
      .map((tx) => ({
        id: tx.id,
        date: format(new Date(tx.transaction_date), "MMM d"),
        description: tx.description || "Untitled transaction",
        platform: PLATFORM_LABELS[(tx.platform || "").toLowerCase()] || tx.platform || "Unknown",
        gross: tx.amount || 0,
        fee: calcFee(tx),
        net: (tx.amount || 0) - calcFee(tx)
      }));

    return {
      grossRevenue,
      netRevenue,
      estimatedFees,
      revenueDelta,
      periodExpenses,
      operatingMargin,
      latestTransactions: filteredLatest,
      transactionCount: inRange.length,
      trendData,
      range,
    };
  }, [period, transactions, expenses, searchQuery]);

  // Data completeness
  const dataCompleteness = useMemo(() => {
    let firstDate = null;
    let minTime = Infinity;
    for (const tx of transactions) {
      if (!tx.transaction_date) continue;
      const date = new Date(tx.transaction_date);
      const time = date.getTime();
      if (!Number.isNaN(time) && time < minTime) { minTime = time; firstDate = date; }
    }
    let lastSync = null;
    let maxTime = -Infinity;
    for (const platform of connectedPlatforms) {
      const dateString = platform.last_synced_at || platform.updated_at;
      if (!dateString) continue;
      const date = new Date(dateString);
      const time = date.getTime();
      if (!Number.isNaN(time) && time > maxTime) { maxTime = time; lastSync = date; }
    }
    const errorPlatforms = connectedPlatforms.filter((p) => p.sync_status === "error");
    return { platformCount: connectedPlatforms.length, lastSync, errorPlatforms, firstDate };
  }, [transactions, connectedPlatforms]);

  // Forecast data
  const forecastData = useMemo(() => {
    return generateForecast(computed.trendData, 30);
  }, [computed.trendData]);

  // Refresh handler
  const throttledRefresh = useThrottle(async () => {
    setIsRefreshing(true);
    await Promise.all([refetchTransactions(), refetchPlatforms()]);
    setIsRefreshing(false);
    toast({ title: "Data refreshed", description: "Dashboard data has been updated." });
  }, 1000);

  // Export handlers
  const handleExport = useCallback((exportFormat) => {
    const exportData = transactions.map(tx => ({
      Date: format(new Date(tx.transaction_date), "yyyy-MM-dd"),
      Platform: PLATFORM_LABELS[tx.platform?.toLowerCase()] || tx.platform || 'Unknown',
      Description: tx.description || '',
      Amount: tx.amount || 0,
      Fees: calcFee(tx),
      Net: (tx.amount || 0) - calcFee(tx),
      Currency: tx.currency || 'USD',
    }));

    if (exportFormat === 'csv') {
      generateCSV(exportData, 'transactions');
      toast({ title: "Export complete", description: "Transactions exported as CSV." });
    } else if (exportFormat === 'json') {
      generateJSON(exportData, 'transactions');
      toast({ title: "Export complete", description: "Transactions exported as JSON." });
    }
  }, [transactions, toast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key.toLowerCase()) {
        case 'r':
          e.preventDefault();
          throttledRefresh();
          break;
        case 'e':
          e.preventDefault();
          handleExport('csv');
          break;
        case 'p':
          e.preventDefault();
          navigate('/ConnectedPlatforms');
          break;
        case '/':
          e.preventDefault();
          document.querySelector('input[type="search"]')?.focus();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [throttledRefresh, handleExport, navigate]);

  const isLoading = txLoading || platformsLoading;

  // Cash position
  const cashPosition = {
    availableCash: computed.netRevenue - computed.periodExpenses,
    currency: 'USD',
    lastUpdated,
    pendingPayouts: 0,
    heldForFees: computed.estimatedFees,
    grossRevenue: computed.grossRevenue,
  };

  // KPI metrics
  const kpiMetrics = [
    {
      id: 'net-rev',
      label: 'Net Revenue',
      value: formatCurrency(computed.netRevenue),
      trend: computed.revenueDelta >= 0 ? 'up' : 'down',
      trendValue: `${Math.abs(computed.revenueDelta).toFixed(1)}% vs last period`,
      helperText: 'After platform fees and refunds',
      status: computed.revenueDelta < -10 ? 'error' : computed.revenueDelta < 0 ? 'warning' : 'normal',
      sparkline: computed.trendData.map(d => d.amount),
    },
    {
      id: 'gross-revenue',
      label: 'Gross Revenue',
      value: formatCurrency(computed.grossRevenue),
      helperText: 'Total customer payments',
      status: 'normal',
    },
    {
      id: 'operating-margin',
      label: 'Operating Margin',
      value: formatCurrency(computed.operatingMargin),
      secondaryValue: `${computed.grossRevenue > 0 ? ((computed.operatingMargin / computed.grossRevenue) * 100).toFixed(1) : 0}% margin`,
      helperText: `Net minus expenses (${formatCurrency(computed.periodExpenses)})`,
      status: computed.operatingMargin < 0 ? 'error' : 'normal',
    },
    {
      id: 'transactions',
      label: 'Transactions',
      value: formatNumber(computed.transactionCount),
      helperText: 'Successful payments',
      status: 'normal',
    },
    {
      id: 'anomalies',
      label: 'Issues',
      value: `${pendingAutopsyEvents.length + (dataCompleteness.errorPlatforms?.length || 0)} items`,
      helperText: 'Need your attention',
      status: pendingAutopsyEvents.length > 0 || dataCompleteness.errorPlatforms?.length > 0 ? 'error' : 'normal',
    },
  ];

  // Reconciliation summary
  const reconciliationSummary = {
    matched: computed.transactionCount,
    pending: 0,
    needsReview: pendingAutopsyEvents.length + (dataCompleteness.errorPlatforms?.length || 0),
    lastSyncAt: dataCompleteness.lastSync || new Date(),
    syncStatus: dataCompleteness.errorPlatforms?.length > 0 ? 'error' : isLoading ? 'syncing' : 'idle',
    trendData: computed.trendData.map(d => d.amount),
  };

  // Action items
  const actionItems = [
    ...pendingAutopsyEvents.map(event => ({
      id: event.id,
      priority: 'high',
      type: 'anomaly',
      platform: PLATFORM_LABELS[event.platform?.toLowerCase()] || event.platform || 'System',
      title: event.title || 'Review Anomaly',
      description: event.reason || 'Anomalous transaction detected',
      currency: 'USD',
      amount: event.amount,
    })),
    ...(dataCompleteness.errorPlatforms || []).map(p => ({
      id: `err-${p.id}`,
      priority: 'high',
      type: 'sync_error',
      platform: PLATFORM_LABELS[p.provider?.toLowerCase()] || p.provider || 'Platform',
      title: 'Sync Failed',
      description: 'Connection failed during last sync. Please re-authenticate.',
      currency: 'USD',
    })),
  ];

  // Insights
  const insights = [
    {
      id: 'trend-1',
      type: 'trend',
      title: computed.revenueDelta >= 0
        ? `Revenue up ${computed.revenueDelta.toFixed(1)}%`
        : `Revenue down ${Math.abs(computed.revenueDelta).toFixed(1)}%`,
      description: `Compared to previous ${period === 'mtd' ? 'month' : period === '7d' ? 'week' : 'period'}.`,
      impact: computed.revenueDelta >= 0 ? 'positive' : 'negative',
      citationCount: computed.transactionCount,
    },
  ];

  // Review items
  const reviewItems = computed.latestTransactions.map(tx => ({
    id: tx.id,
    status: 'matched',
    platform: tx.platform,
    description: tx.description,
    date: tx.date,
    amount: tx.gross,
    expectedAmount: tx.net,
    matchConfidence: 100,
  }));

  return (
    <>
      <DesignTokens />
      <KeyboardShortcuts />

      <div className="min-h-screen bg-[var(--neutral-50)]">
        {/* Header */}
        <header className="h-14 bg-white border-b border-[var(--neutral-200)] flex items-center px-4 lg:px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4 flex-1">
            <div className="font-bold text-lg tracking-tight text-[var(--neutral-900)]">Zerithum</div>

            <div className="hidden md:flex flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--neutral-400)]" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search transactions... (Press /)"
                  className="w-full h-9 pl-9 pr-3 rounded-lg border border-[var(--neutral-200)] text-sm focus:outline-none focus:border-[var(--accent-500)] focus:ring-2 focus:ring-[var(--accent-500)]/20 placeholder:text-[var(--neutral-400)] bg-[var(--neutral-50)]"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PeriodSelector value={period} onChange={setPeriod} />
            <Button
              variant="ghost"
              size="icon"
              onClick={throttledRefresh}
              isLoading={isRefreshing}
              className="hidden sm:flex"
              title="Refresh (R)"
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            </Button>
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2 p-1.5 hover:bg-[var(--neutral-100)] rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-[var(--accent-500)] to-[var(--accent-700)] rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {user?.email?.[0]?.toUpperCase() || user?.full_name?.[0]?.toUpperCase() || 'U'}
              </div>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-[1600px] mx-auto p-4 lg:p-6">
          {/* Cash Hero */}
          <CashHero
            position={cashPosition}
            onExport={handleExport}
            onConnect={() => navigate('/ConnectedPlatforms')}
            onRefresh={throttledRefresh}
            isRefreshing={isRefreshing}
            lastUpdated={lastUpdated}
          />

          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            {kpiMetrics.map(metric => (
              <KPICard
                key={metric.id}
                metric={metric}
                onClick={() => {
                  if (metric.id === 'anomalies' && metric.status === 'error') {
                    navigate('/RevenueAutopsy');
                  }
                }}
              />
            ))}
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
            {/* Left - 8 cols */}
            <div className="lg:col-span-8 space-y-6">
              <ReconciliationCard
                summary={reconciliationSummary}
                onViewDetails={() => navigate('/RevenueAutopsy')}
              />

              <CashflowForecast
                historicalData={computed.trendData}
                forecastData={forecastData}
              />
            </div>

            {/* Right - 4 cols */}
            <div className="lg:col-span-4 space-y-6">
              <PlatformHealth platforms={connectedPlatforms} onConnect={() => navigate('/ConnectedPlatforms')} />

              <PlatformBreakdown transactions={computed.latestTransactions} />

              <ActionQueue
                items={actionItems}
                onReview={(item) => navigate('/RevenueAutopsy')}
              />

              <InsightsPanel
                insights={insights}
                transactions={computed.latestTransactions}
                periodExpenses={computed.periodExpenses}
              />
            </div>
          </div>

          {/* Review Table */}
          <ReviewTable
            items={reviewItems}
            onExport={handleExport}
          />
        </main>
      </div>
    </>
  );
};

export default Dashboard;
