/**
 * Zerithum Dashboard Redesign v2.0
 * Professional, calm, high-signal interface for creator revenue reconciliation
 * Design principles: Palantir/Paradigm style - restrained, precise, minimal decoration
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  differenceInCalendarDays,
  format,
  startOfMonth,
  subDays,
} from "date-fns";
import {
  Search,
  Bell,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  Filter,
  Download,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  MoreHorizontal,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/supabaseClient";

// Performance utilities
import {
  useDebounce,
  useThrottle,
  useIsVisible,
  memoize,
  LRUCache
} from "@/lib/performance.js";

// ============================================================================
// PERFORMANCE CONSTANTS & UTILS
// ============================================================================
const QUERY_STALE_TIME = 30 * 1000;
const QUERY_CACHE_TIME = 5 * 60 * 1000;
const calcCache = new LRUCache(1000);

const PLATFORM_LABELS = { youtube: "YouTube", patreon: "Patreon", stripe: "Stripe", gumroad: "Gumroad", instagram: "Instagram", tiktok: "TikTok", shopify: "Shopify", substack: "Substack" };
const PLATFORM_FEE_RATES = { youtube: 0.45, patreon: 0.08, stripe: 0.029, gumroad: 0.1, instagram: 0.05, tiktok: 0.5, shopify: 0.02, substack: 0.1 };

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
  const start = subDays(now, 29);
  const comparisonEnd = subDays(start, 1);
  const comparisonStart = subDays(comparisonEnd, 29);
  return { start, end: now, comparisonStart, comparisonEnd };
});

// ============================================================================
// DESIGN TOKENS - CSS VARIABLES
// ============================================================================

const DesignTokens = () => (
  <style>{`
    :root {
      /* Neutral scale - pure grayscale */
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
      --neutral-900: #000000;
      
      /* Single accent - blue */
      --accent-50: #EFF6FF;
      --accent-100: #DBEAFE;
      --accent-200: #BFDBFE;
      --accent-500: #3B82F6;
      --accent-600: #2563EB;
      --accent-700: #1D4ED8;
      
      /* Semantic */
      --success: #10B981;
      --warning: #F59E0B;
      --error: #EF4444;
      
      /* Typography */
      --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
      
      /* Motion */
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
  `}</style>
);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatCurrency = (amount, currency = "USD") =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);

const formatRelativeTime = (date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

// ============================================================================
// PRIMITIVE COMPONENTS
// ============================================================================

const Card = ({
  children,
  className = ''
}) => (
  <div className={`bg-white border border-[var(--neutral-200)] rounded-md ${className}`}>
    {children}
  </div>
);

const Badge = ({ variant, children }) => {
  const variants = {
    default: 'bg-[var(--accent-100)] text-[var(--accent-700)]',
    success: 'bg-[var(--success)]/10 text-[var(--success)]',
    warning: 'bg-[var(--warning)]/10 text-[var(--warning)]',
    error: 'bg-[var(--error)]/10 text-[var(--error)]',
    neutral: 'bg-[var(--neutral-100)] text-[var(--neutral-600)]',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
};

const Button = ({ variant = 'secondary', size = 'md', isLoading, children, onClick, className = '' }) => {
  const variants = {
    primary: 'bg-[var(--accent-500)] text-white hover:bg-[var(--accent-600)]',
    secondary: 'bg-[var(--neutral-100)] text-[var(--neutral-700)] hover:bg-[var(--neutral-200)] border border-[var(--neutral-300)]',
    ghost: 'bg-transparent text-[var(--neutral-600)] hover:bg-[var(--neutral-100)]',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  };

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`
        inline-flex items-center justify-center rounded-md font-medium
        transition-all duration-[var(--duration-fast)]
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
};

// ============================================================================
// SPARKLINE COMPONENT
// ============================================================================

const Sparkline = ({ data, color = 'var(--accent-500)' }) => {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,100 ${points} 100,100`;

  return (
    <svg viewBox="0 0 100 100" className="w-full h-10" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon fill="url(#sparkGradient)" points={areaPoints} />
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
    </svg>
  );
};

// ============================================================================
// SECTION COMPONENTS
// ============================================================================

const Header = ({ user, onNavigate, searchQuery, onSearchChange }) => (
  <header className="h-14 bg-white border-b border-[var(--neutral-200)] flex items-center px-6 sticky top-0 z-50">
    <div className="font-bold text-lg tracking-tight text-[var(--neutral-900)]">Zerithum</div>

    <div className="ml-8 flex-1 max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--neutral-400)]" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search transactions, platforms..."
          className="w-full h-9 pl-9 pr-3 rounded-md border border-[var(--neutral-200)] 
                     text-sm focus:outline-none focus:border-[var(--accent-500)]
                     placeholder:text-[var(--neutral-400)] bg-[var(--neutral-50)]"
        />
      </div>
    </div>

    <div className="ml-auto flex items-center gap-4">
      <button onClick={() => onNavigate('/notifications')} className="relative p-2 text-[var(--neutral-500)] hover:text-[var(--neutral-700)] hover:bg-[var(--neutral-100)] rounded-md transition-colors">
        <Bell className="w-5 h-5" />
      </button>
      <button onClick={() => onNavigate('/settings')} className="flex items-center gap-2 p-1.5 hover:bg-[var(--neutral-100)] rounded-md transition-colors">
        <div className="w-7 h-7 bg-[var(--accent-500)] rounded-full flex items-center justify-center text-white text-xs font-medium">
          {user ? (user.email ? user.email.substring(0, 2).toUpperCase() : 'U') : ''}
        </div>
      </button>
    </div>
  </header>
);

const CashHero = ({ position, onExport, onConnect }) => (
  <Card className="p-8 mb-6 bg-gradient-to-br from-white to-[var(--neutral-50)]">
    <div className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-[var(--neutral-500)] uppercase tracking-wider">
            Available Cash
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--success)]/10 text-[var(--success)]">
            <span className="w-1.5 h-1.5 bg-[var(--success)] rounded-full mr-1.5 animate-pulse" />
            Live
          </span>
        </div>

        <h1 className="text-4xl font-bold text-[var(--neutral-900)] tracking-tight tabular-nums">
          {formatCurrency(position.availableCash)}
        </h1>

        <p className="text-sm text-[var(--neutral-500)] mt-2 max-w-md">
          After fees, refunds, and known payouts. Updated {formatRelativeTime(position.lastUpdated)}.
        </p>

        <div className="flex gap-6 mt-4 text-sm">
          <div>
            <span className="text-[var(--neutral-400)]">Pending payouts: </span>
            <span className="font-medium text-[var(--neutral-700)] tabular-nums">
              {formatCurrency(position.pendingPayouts)}
            </span>
          </div>
          <div>
            <span className="text-[var(--neutral-400)]">Held for fees: </span>
            <span className="font-medium text-[var(--neutral-700)] tabular-nums">
              {formatCurrency(position.heldForFees)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onExport}>
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
        <Button variant="primary" onClick={onConnect}>
          <Plus className="w-4 h-4 mr-2" />
          Connect Platform
        </Button>
      </div>
    </div>
  </Card>
);

const KPICard = ({ metric }) => {
  const TrendIcon = metric.trend === 'up' ? ArrowUpRight :
    metric.trend === 'down' ? ArrowDownRight : Minus;

  const trendColor = metric.trend === 'up' ? 'text-[var(--success)]' :
    metric.trend === 'down' ? 'text-[var(--error)]' :
      'text-[var(--neutral-400)]';

  const borderColor = metric.status === 'error' ? 'border-l-[var(--error)]' :
    metric.status === 'warning' ? 'border-l-[var(--warning)]' :
      'border-l-transparent';

  return (
    <Card className={`p-5 h-[120px] border-l-4 ${borderColor} cursor-pointer
                     hover:shadow-sm hover:border-[var(--neutral-300)] transition-all duration-[var(--duration-fast)]`}>
      <div className="flex flex-col h-full justify-between">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-[var(--neutral-500)] uppercase tracking-wider">
              {metric.label}
            </span>
            {metric.trend && (
              <span className={`text-xs font-medium flex items-center gap-0.5 ${trendColor}`}>
                <TrendIcon className="w-3 h-3" />
                {metric.trendValue}
              </span>
            )}
          </div>
          <div className="text-2xl font-semibold text-[var(--neutral-900)] tracking-tight tabular-nums">
            {metric.value}
          </div>
          {metric.secondaryValue && (
            <div className="text-xs text-[var(--neutral-500)] mt-0.5">
              {metric.secondaryValue}
            </div>
          )}
        </div>
        <p className="text-[11px] text-[var(--neutral-400)] leading-relaxed">
          {metric.helperText}
        </p>
      </div>
    </Card>
  );
};

const ReconciliationCard = ({ summary }) => {
  const total = summary.matched + summary.pending + summary.needsReview;
  const matchRate = total > 0 ? Math.round((summary.matched / total) * 100) : 0;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-[var(--neutral-900)] uppercase tracking-wider">
          Reconciliation Status
        </h3>
        <div className="flex items-center gap-2 text-xs text-[var(--neutral-500)]">
          <span className={`
            w-2 h-2 rounded-full
            ${summary.syncStatus === 'syncing' ? 'bg-[var(--warning)] animate-pulse' :
              summary.syncStatus === 'error' ? 'bg-[var(--error)]' :
                'bg-[var(--success)]'}
          `} />
          Synced {formatRelativeTime(summary.lastSyncAt)}
        </div>
      </div>

      <div className="mb-4">
        <Sparkline data={summary.trendData} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 rounded-md bg-[var(--neutral-50)]">
          <div className="text-xl font-semibold text-[var(--success)] tabular-nums">
            {summary.matched}
          </div>
          <div className="text-[11px] text-[var(--neutral-500)] mt-1 uppercase tracking-wide">Matched</div>
        </div>
        <div className="text-center p-3 rounded-md bg-[var(--neutral-50)]">
          <div className="text-xl font-semibold text-[var(--neutral-600)] tabular-nums">
            {summary.pending}
          </div>
          <div className="text-[11px] text-[var(--neutral-500)] mt-1 uppercase tracking-wide">Pending</div>
        </div>
        <div className={`
          text-center p-3 rounded-md
          ${summary.needsReview > 0 ? 'bg-[var(--error)]/5' : 'bg-[var(--neutral-50)]'}
        `}>
          <div className={`text-xl font-semibold tabular-nums
            ${summary.needsReview > 0 ? 'text-[var(--error)]' : 'text-[var(--neutral-600)]'}
          `}>
            {summary.needsReview}
          </div>
          <div className="text-[11px] text-[var(--neutral-500)] mt-1 uppercase tracking-wide">Needs Review</div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-[var(--neutral-200)]">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-[var(--neutral-500)]">Match rate</span>
          <span className="font-semibold text-[var(--neutral-900)] tabular-nums">{matchRate}%</span>
        </div>
        <div className="w-full h-1.5 bg-[var(--neutral-200)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--accent-500)] rounded-full transition-all duration-500"
            style={{ width: `${matchRate}%` }}
          />
        </div>
      </div>
    </Card>
  );
};

const ActionQueue = ({ items, onReview }) => {
  if (items.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-xs font-semibold text-[var(--neutral-900)] uppercase tracking-wider mb-4">
          Action Queue
        </h3>
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[var(--neutral-100)] flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-[var(--neutral-400)]" />
          </div>
          <p className="text-sm font-medium text-[var(--neutral-700)]">All caught up</p>
          <p className="text-xs text-[var(--neutral-400)] mt-1">No items need your attention</p>
        </div>
      </Card>
    );
  }

  const typeConfig = {
    mismatch: { badge: 'error', label: 'Mismatch' },
    missing_receipt: { badge: 'warning', label: 'Receipt Missing' },
    anomaly: { badge: 'warning', label: 'Anomaly' },
    duplicate: { badge: 'neutral', label: 'Duplicate' },
  };

  const priorityIcon = {
    high: <AlertTriangle className="w-4 h-4 text-[var(--error)]" />,
    medium: <Clock className="w-4 h-4 text-[var(--warning)]" />,
    low: <Minus className="w-4 h-4 text-[var(--neutral-400)]" />,
  };

  return (
    <Card className="p-6">
      <h3 className="text-xs font-semibold text-[var(--neutral-900)] uppercase tracking-wider mb-4">
        Action Queue ({items.length})
      </h3>

      <div className="space-y-3">
        {items.slice(0, 3).map(item => (
          <div
            key={item.id}
            className="p-4 rounded-md bg-[var(--neutral-50)] border border-[var(--neutral-200)]
                       hover:border-[var(--neutral-300)] transition-colors cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                {priorityIcon[item.priority] || <AlertTriangle className="w-4 h-4 text-[var(--neutral-400)]" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-[var(--neutral-900)] truncate">
                      {item.title}
                    </span>
                    <Badge variant={(typeConfig[item.type] || { badge: 'neutral' }).badge}>
                      {(typeConfig[item.type] || { label: 'Item' }).label}
                    </Badge>
                  </div>
                  <p className="text-xs text-[var(--neutral-500)] mt-1 line-clamp-2">
                    {item.description}
                  </p>
                  {item.amount && (
                    <p className="text-sm font-medium text-[var(--neutral-700)] mt-2 tabular-nums">
                      {formatCurrency(item.amount, item.currency)}
                      {item.expectedAmount && (
                        <span className="text-[var(--neutral-400)] font-normal ml-1">
                          (expected {formatCurrency(item.expectedAmount, item.currency)})
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
              <Button variant="primary" size="sm" onClick={() => onReview(item)} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                Review
              </Button>
            </div>
          </div>
        ))}

        {items.length > 3 && (
          <button className="w-full text-center text-sm text-[var(--accent-600)] hover:text-[var(--accent-700)] py-2 font-medium">
            +{items.length - 3} more items
          </button>
        )}
      </div>
    </Card>
  );
};

const InsightsPanel = ({ insights }) => {
  const impactConfig = {
    positive: { border: 'border-l-[var(--success)]', icon: ArrowUpRight },
    negative: { border: 'border-l-[var(--error)]', icon: ArrowDownRight },
    neutral: { border: 'border-l-[var(--neutral-400)]', icon: Minus },
  };

  return (
    <Card className="p-6">
      <h3 className="text-xs font-semibold text-[var(--neutral-900)] uppercase tracking-wider mb-4">
        Insights
      </h3>

      <div className="space-y-3">
        {insights.map(insight => {
          const config = impactConfig[insight.impact];
          const Icon = config.icon;

          return (
            <div
              key={insight.id}
              className={`p-4 rounded-md bg-[var(--neutral-50)] border-l-4 ${config.border}
                         hover:bg-[var(--neutral-100)] transition-colors cursor-pointer`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-4 h-4 mt-0.5 shrink-0
                  ${insight.impact === 'positive' ? 'text-[var(--success)]' :
                    insight.impact === 'negative' ? 'text-[var(--error)]' :
                      'text-[var(--neutral-400)]'}
                `} />
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
      </div>
    </Card>
  );
};

const ReviewTable = ({ items, onExport }) => {
  const [selectedId, setSelectedId] = useState(null);

  const statusConfig = {
    matched: { badge: 'success', label: 'Matched' },
    pending: { badge: 'neutral', label: 'Pending' },
    mismatch: { badge: 'error', label: 'Mismatch' },
    duplicate: { badge: 'warning', label: 'Duplicate' },
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-[var(--neutral-200)] flex items-center justify-between">
        <h3 className="text-xs font-semibold text-[var(--neutral-900)] uppercase tracking-wider">
          Needs Review ({items.length})
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onExport}>
            <Download className="w-4 h-4 mr-1.5" />
            Export
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[var(--neutral-50)]">
              <th className="text-left py-3 px-4 text-[11px] font-semibold text-[var(--neutral-500)] uppercase tracking-wider">
                Status
              </th>
              <th className="text-left py-3 px-4 text-[11px] font-semibold text-[var(--neutral-500)] uppercase tracking-wider">
                Platform
              </th>
              <th className="text-left py-3 px-4 text-[11px] font-semibold text-[var(--neutral-500)] uppercase tracking-wider">
                Description
              </th>
              <th className="text-left py-3 px-4 text-[11px] font-semibold text-[var(--neutral-500)] uppercase tracking-wider">
                Date
              </th>
              <th className="text-right py-3 px-4 text-[11px] font-semibold text-[var(--neutral-500)] uppercase tracking-wider">
                Amount
              </th>
              <th className="text-right py-3 px-4 text-[11px] font-semibold text-[var(--neutral-500)] uppercase tracking-wider">
                Expected
              </th>
              <th className="text-center py-3 px-4 text-[11px] font-semibold text-[var(--neutral-500)] uppercase tracking-wider">
                Match
              </th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`
                  border-b border-[var(--neutral-200)] last:border-0
                  hover:bg-[var(--neutral-50)] transition-colors cursor-pointer
                  ${selectedId === item.id ? 'bg-[var(--accent-50)]' : ''}
                `}
              >
                <td className="py-3 px-4">
                  <Badge variant={statusConfig[item.status].badge}>
                    {statusConfig[item.status].label}
                  </Badge>
                </td>
                <td className="py-3 px-4 text-sm font-medium text-[var(--neutral-700)]">
                  {item.platform}
                </td>
                <td className="py-3 px-4 text-sm text-[var(--neutral-600)] max-w-xs truncate">
                  {item.description}
                </td>
                <td className="py-3 px-4 text-sm text-[var(--neutral-500)] tabular-nums">
                  {item.date}
                </td>
                <td className="py-3 px-4 text-sm font-medium text-[var(--neutral-900)] text-right tabular-nums">
                  {formatCurrency(item.amount)}
                </td>
                <td className="py-3 px-4 text-sm text-[var(--neutral-500)] text-right tabular-nums">
                  {item.expectedAmount ? formatCurrency(item.expectedAmount) : '—'}
                </td>
                <td className="py-3 px-4 text-center">
                  {item.matchConfidence ? (
                    <span className={`
                      text-sm font-medium tabular-nums
                      ${item.matchConfidence >= 90 ? 'text-[var(--success)]' :
                        item.matchConfidence >= 70 ? 'text-[var(--warning)]' :
                          'text-[var(--error)]'}
                    `}>
                      {item.matchConfidence}%
                    </span>
                  ) : (
                    <span className="text-[var(--neutral-400)]">—</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <button className="p-1 hover:bg-[var(--neutral-200)] rounded transition-colors">
                    <MoreHorizontal className="w-4 h-4 text-[var(--neutral-400)]" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

const Dashboard = () => {

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState("mtd");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tableRef, isTableVisible] = useIsVisible({ threshold: 0.1 });
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: transactions = [], isLoading: txLoading, refetch: refetchTransactions } = useQuery({
    queryKey: ["revenueTransactions", period],
    queryFn: async () => base44.entities.RevenueTransaction.fetchAll({}, "-transaction_date"),
    staleTime: QUERY_STALE_TIME,
    cacheTime: QUERY_CACHE_TIME,
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses", period],
    queryFn: () => base44.entities.Expense.list("-expense_date", 1000),
    staleTime: QUERY_STALE_TIME,
    cacheTime: QUERY_CACHE_TIME,
  });

  const { data: connectedPlatforms = [], isLoading: platformsLoading, refetch: refetchPlatforms } = useQuery({
    queryKey: ["connectedPlatforms"],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.ConnectedPlatform.filter({ user_id: user.id });
    }
  });

  const { data: pendingAutopsyEvents = [] } = useQuery({
    queryKey: ["autopsyEvents", "pending"],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.AutopsyEvent.filter({ user_id: user.id, status: "pending_review" }, "-detected_at", 10);
    },
    staleTime: QUERY_STALE_TIME,
  });

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

    const filteredLatest = inRange
      .slice()
      .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
      .filter((tx) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (tx.description && tx.description.toLowerCase().includes(query)) ||
          (tx.platform && tx.platform.toLowerCase().includes(query));
      })
      .slice(0, 20)
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
      grossRevenue, netRevenue, estimatedFees, revenueDelta, periodExpenses, operatingMargin,
      latestTransactions: filteredLatest, transactionCount: inRange.length, trendData
    };
  }, [period, transactions, expenses, searchQuery]);

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
    return { platformCount: connectedPlatforms.length, lastSync, errorPlatforms };
  }, [transactions, connectedPlatforms]);

  const isLoading = txLoading || platformsLoading;
  const throttledRefresh = useThrottle(async () => {
    setIsRefreshing(true);
    await Promise.all([refetchTransactions(), refetchPlatforms()]);
    setIsRefreshing(false);
  }, 1000);

  const handleExportTransactions = useCallback(() => {
    if (!transactions.length) return;
    const header = ['Date', 'Platform', 'Description', 'Amount'];
    const rows = transactions.map(tx => [
      format(new Date(tx.transaction_date), "yyyy-MM-dd"),
      tx.platform || 'Unknown',
      `"${(tx.description || '').replace(/"/g, '""')}"`,
      tx.amount || 0
    ]);
    const csvContent = [header, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `transactions_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [transactions]);


  // Real data integrations
  const cashPosition = {
    availableCash: computed.netRevenue - computed.periodExpenses,
    currency: 'USD',
    lastUpdated: new Date(),
    pendingPayouts: 0,
    heldForFees: computed.estimatedFees,
  };

  const kpiMetrics = [
    {
      id: 'net-rev-mtd',
      label: 'Net Revenue MTD',
      value: formatCurrency(computed.netRevenue),
      trend: computed.revenueDelta >= 0 ? 'up' : 'down',
      trendValue: Math.abs(computed.revenueDelta).toFixed(1) + '%',
      helperText: 'Revenue after platform fees and refunds',
      status: 'normal',
    },
    {
      id: 'gross-revenue',
      label: 'Gross Revenue',
      value: formatCurrency(computed.grossRevenue),
      helperText: 'Total customer payments before fees',
      status: 'normal',
    },
    {
      id: 'operating-margin',
      label: 'Operating Margin',
      value: formatCurrency(computed.operatingMargin),
      helperText: `Net Revenue minus expenses (${formatCurrency(computed.periodExpenses)})`,
      status: computed.operatingMargin >= 0 ? 'normal' : 'warning',
    },
    {
      id: 'transactions',
      label: 'Transactions',
      value: computed.transactionCount.toString(),
      helperText: 'Successful payments this period',
      status: 'normal',
    },
    {
      id: 'anomalies',
      label: 'Anomalies',
      value: pendingAutopsyEvents.length + ' items',
      helperText: 'Issues that need your review',
      status: pendingAutopsyEvents.length > 0 ? 'error' : 'normal',
    },
  ];

  const reconciliationSummary = {
    matched: computed.transactionCount,
    pending: 0,
    needsReview: pendingAutopsyEvents.length,
    lastSyncAt: dataCompleteness.lastSync || new Date(),
    syncStatus: (dataCompleteness.errorPlatforms && dataCompleteness.errorPlatforms.length > 0) ? 'error' : (isLoading ? 'syncing' : 'idle'),
    trendData: computed.trendData.map(d => d.amount),
  };

  const actionItems = [
    ...pendingAutopsyEvents.map(event => ({
      id: event.id,
      priority: 'high',
      type: 'anomaly',
      platform: event.platform || 'System',
      title: 'Review Anomaly',
      description: event.reason || 'Anomalous transaction event detected.',
      currency: 'USD',
    })),
    ...(dataCompleteness.errorPlatforms || []).map(p => ({
      id: 'err-' + p.id,
      priority: 'high',
      type: 'mismatch',
      platform: p.provider || 'Platform',
      title: 'Sync failed',
      description: 'Connection failed during last sync. Please re-authenticate.',
      currency: 'USD',
    }))
  ];

  const insights = [
    {
      id: 'trend-1',
      type: 'trend',
      title: computed.revenueDelta >= 0 ? `Revenue up ${computed.revenueDelta.toFixed(1)}%` : `Revenue down ${Math.abs(computed.revenueDelta).toFixed(1)}%`,
      description: 'Compared to previous typical period.',
      impact: computed.revenueDelta >= 0 ? 'positive' : 'negative',
      citationCount: computed.transactionCount,
    }
  ];

  const reviewItems = computed.latestTransactions.map(tx => ({
    id: tx.id,
    status: 'matched',
    platform: tx.platform,
    description: tx.description,
    date: tx.date,
    amount: tx.gross,
    expectedAmount: tx.net,
    matchConfidence: 100
  }));

  return (
    <>
      <DesignTokens />
      <div className="min-h-screen bg-[var(--neutral-50)]">
        <Header
          user={user}
          onNavigate={navigate}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <main className="max-w-[1400px] mx-auto p-6">
          {/* Cash Hero */}
          <CashHero
            position={cashPosition}
            onExport={handleExportTransactions}
            onConnect={() => navigate('/platforms')}
          />

          {/* KPI Row */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            {kpiMetrics.map(metric => (
              <KPICard key={metric.id} metric={metric} />
            ))}
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-12 gap-6 mb-6">
            {/* Left - 7 cols */}
            <div className="col-span-7 space-y-6">
              <ReconciliationCard summary={reconciliationSummary} />
            </div>

            {/* Right - 5 cols */}
            <div className="col-span-5 space-y-6">
              <ActionQueue
                items={actionItems}
                onReview={(item) => navigate('/revenue_autopsy')}
              />
              {insights.length > 0 && <InsightsPanel insights={insights} />}
            </div>
          </div>

          {/* Review Table */}
          <ReviewTable
            items={reviewItems}
            onExport={handleExportTransactions}
          />
        </main>
      </div>
    </>
  );
};

export default Dashboard;
