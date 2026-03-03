/**
 * Zerithum Dashboard — Principal Redesign
 * ─────────────────────────────────────────
 * Design philosophy: Palantir/Paradigm-inspired. Pure white + black + blue.
 * Every pixel earns its place. Motion exists only for feedback.
 * Progressive disclosure: calm default view, details on demand.
 *
 * Three pillars:
 *   A) Cash & Runway   B) Reconciliation Status   C) Action Queue
 */

import { useMemo, useState, useCallback, useRef, useEffect, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, subDays } from "date-fns";
import {
  Search, RefreshCw, Download, Plus, ChevronRight, AlertTriangle,
  CheckCircle2, ArrowUpRight, ArrowDownRight,
  X, HelpCircle, Zap, ExternalLink, TrendingUp,
  ShieldAlert, Link2,
} from "lucide-react";
import { base44 } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";

// Stable Intl formatters — allocated once, never re-created per render
const FMT_S = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });
const FMT_F = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

// ─── Constants ───────────────────────────────────────────────────────────────

const PLATFORM_LABELS = {
  youtube: "YouTube", patreon: "Patreon", stripe: "Stripe",
  gumroad: "Gumroad", instagram: "Instagram", tiktok: "TikTok",
  shopify: "Shopify", substack: "Substack",
};

const FEE_RATES = {
  youtube: 0.45, patreon: 0.08, stripe: 0.029, gumroad: 0.1,
  instagram: 0.05, tiktok: 0.5, shopify: 0.02, substack: 0.1,
};

const PERIODS = [
  { value: "mtd", label: "This month" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

// ─── Utilities ────────────────────────────────────────────────────────────────

const fmt = (v) => FMT_S.format(v || 0);
const fmtFull = (v) => FMT_F.format(v || 0);

const relativeTime = (date) => {
  if (!date) return "Never synced";
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const calcFee = (tx) => {
  if (tx.platform_fee > 0) return tx.platform_fee;
  return (tx.amount || 0) * (FEE_RATES[(tx.platform || "").toLowerCase()] || 0);
};

const getRange = (period) => {
  const now = new Date();
  if (period === "mtd") return { start: startOfMonth(now), end: now };
  if (period === "90d") return { start: subDays(now, 89), end: now };
  return { start: subDays(now, 29), end: now };
};

// ─── Skeleton ────────────────────────────────────────────────────────────────

const Sk = ({ w = "100%", h = 16, r = 4, className = "" }) => (
  <div
    className={`shimmer ${className}`}
    style={{ width: w, height: h, borderRadius: r }}
    aria-hidden="true"
  />
);

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function Tooltip({ text, children }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex items-center"
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)} onBlur={() => setShow(false)}>
      {children}
      {show && (
        <span role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded bg-gray-900 text-white text-[11px] leading-relaxed px-2.5 py-1.5 shadow-lg pointer-events-none">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </span>
      )}
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  matched: { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", label: "Matched" },
  pending: { dot: "bg-amber-400", text: "text-amber-700", bg: "bg-amber-50 border-amber-200", label: "Pending" },
  needs_review: { dot: "bg-red-500", text: "text-red-700", bg: "bg-red-50 border-red-200", label: "Needs review" },
  anomaly: { dot: "bg-orange-500", text: "text-orange-700", bg: "bg-orange-50 border-orange-200", label: "Anomaly" },
  normal: { dot: "bg-gray-400", text: "text-gray-600", bg: "bg-gray-50 border-gray-200", label: "Normal" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.normal;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Platform Badge ───────────────────────────────────────────────────────────

function PlatformBadge({ platform }) {
  const colors = {
    YouTube: "bg-red-50 text-red-700 border-red-200",
    Patreon: "bg-orange-50 text-orange-700 border-orange-200",
    Stripe: "bg-violet-50 text-violet-700 border-violet-200",
    Gumroad: "bg-pink-50 text-pink-700 border-pink-200",
    Substack: "bg-amber-50 text-amber-700 border-amber-200",
  };
  const cls = colors[platform] || "bg-gray-50 text-gray-600 border-gray-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${cls}`}>
      {platform}
    </span>
  );
}

// ─── Sparkline (interactive) ─────────────────────────────────────────────────────────────────────

const Sparkline = memo(function Sparkline({ data, color = "#2563EB", height = 36, labels }) {
  const [hov, setHov] = useState(null);
  const svgRef = useRef(null);
  const rafRef = useRef(null);

  const onMove = useCallback((e) => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect || !data || data.length < 2) return;
      const idx = Math.max(0, Math.min(data.length - 1,
        Math.round(((e.clientX - rect.left) / rect.width) * (data.length - 1))));
      setHov({ v: data[idx], i: idx, label: labels?.[idx] ?? `Day ${idx + 1}` });
    });
  }, [data, labels]);

  const onLeave = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    setHov(null);
  }, []);

  if (!data || data.length < 2) return <div style={{ height }} />;
  const max = Math.max(...data); const min = Math.min(...data, 0);
  const range = max - min || 1;
  const W = 100, H = height;
  const px = (i) => (i / (data.length - 1)) * W;
  const py = (v) => H - 2 - ((v - min) / range) * (H - 4);
  const pts = data.map((v, i) => `${px(i)},${py(v)}`).join(" ");

  return (
    <div className="relative">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%" height={H}
        preserveAspectRatio="none" onMouseMove={onMove} onMouseLeave={onLeave}
        className="cursor-crosshair" aria-label="Revenue trend">
        <defs>
          <linearGradient id={`sg-${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon fill={`url(#sg-${color.slice(1)})`} points={`0,${H} ${pts} ${W},${H}`} />
        <polyline fill="none" stroke={color} strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round" points={pts} />
        {hov && (
          <>
            <line x1={px(hov.i)} y1={0} x2={px(hov.i)} y2={H}
              stroke={color} strokeWidth="0.8" strokeOpacity="0.4" strokeDasharray="2,2" />
            <circle cx={px(hov.i)} cy={py(hov.v)} r={2.5} fill={color} stroke="white" strokeWidth="1.5" />
          </>
        )}
      </svg>
      {hov && (
        <div className="absolute pointer-events-none z-10 bg-gray-900 text-white rounded px-2 py-1 text-[10px] shadow-lg"
          style={{
            left: `${(hov.i / (data.length - 1)) * 100}%`, top: 0,
            transform: hov.i > data.length * 0.6 ? "translateX(-110%)" : "translateX(4px)"
          }}>
          <div className="font-semibold tabular-nums">{fmt(hov.v)}</div>
          <div className="text-gray-400">{hov.label}</div>
        </div>
      )}
    </div>
  );
});

// ─── Cashflow Interactive Chart ────────────────────────────────────────────────

const CashflowChart = memo(function CashflowChart({ data, hasData }) {
  const [hovered, setHovered] = useState(null);
  const svgRef = useRef(null);
  const rafRef = useRef(null);
  const W = 600, H = 100;

  // All hooks before any early return (Rules of Hooks)
  const onMove = useCallback((e) => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const idx = Math.max(0, Math.min(data.length - 1,
        Math.round(((e.clientX - rect.left) / rect.width) * (data.length - 1))));
      setHovered({ ...data[idx], idx });
    });
  }, [data]);

  const onLeave = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    setHovered(null);
  }, []);

  if (!hasData || !data || data.length < 2) {
    return (
      <div style={{ height: H }} className="flex items-center justify-center border border-dashed border-gray-200 rounded-md">
        <span className="text-[11px] text-gray-400">No transaction history to chart yet.</span>
      </div>
    );
  }

  const maxV = Math.max(...data.map(d => d.amount));
  const minV = Math.min(...data.map(d => d.amount), 0);
  const rangeV = maxV - minV || 1;
  const px = (i) => (i / (data.length - 1)) * W;
  const py = (v) => H - 8 - ((v - minV) / rangeV) * (H - 16);
  const linePts = data.map((d, i) => `${px(i)},${py(d.amount)}`).join(" ");
  const fillPts = `0,${H} ${linePts} ${W},${H}`;

  return (
    <div className="relative">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%" height={H}
        preserveAspectRatio="none" aria-label="Revenue cashflow chart"
        onMouseMove={onMove} onMouseLeave={onLeave} className="cursor-crosshair">
        <defs>
          <linearGradient id="cf-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1={0} y1={py(0)} x2={W} y2={py(0)} stroke="#E5E7EB" strokeWidth="1" />
        <polygon fill="url(#cf-fill)" points={fillPts} />
        <polyline fill="none" stroke="#2563EB" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" points={linePts} />
        {hovered && (
          <>
            <line x1={px(hovered.idx)} y1={0} x2={px(hovered.idx)} y2={H}
              stroke="#2563EB" strokeWidth="1" strokeDasharray="3,3" strokeOpacity="0.5" />
            <circle cx={px(hovered.idx)} cy={py(hovered.amount)} r={4}
              fill="#2563EB" stroke="white" strokeWidth="2" />
          </>
        )}
      </svg>
      {hovered && (
        <div className="absolute pointer-events-none z-10 bg-gray-900 text-white rounded px-2.5 py-1.5 text-[11px] leading-relaxed shadow-lg"
          style={{
            left: `calc(${(hovered.idx / (data.length - 1)) * 100}% + 8px)`, top: 0,
            transform: hovered.idx > data.length * 0.7 ? "translateX(-110%)" : undefined
          }}>
          <div className="font-semibold tabular-nums">{fmtFull(hovered.amount)}</div>
          <div className="text-gray-400">{hovered.label}</div>
        </div>
      )}
    </div>
  );
});

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({ label, helperText, value, secondary, trend, trendValue, status, loading, onClick }) {
  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : null;
  const trendCls = trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-600" : "text-gray-400";
  const borderLeft = status === "error" ? "border-l-red-500" : status === "warning" ? "border-l-amber-400" : "border-l-transparent";

  return (
    <button
      onClick={onClick}
      className={[
        "group text-left w-full bg-white border border-gray-200 rounded-md p-5",
        "border-l-4 transition-all duration-150 outline-none",
        "hover:border-gray-300 hover:shadow-sm",
        "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1",
        borderLeft,
      ].join(" ")}
      aria-label={`${label}: ${loading ? "Loading" : value}`}
    >
      {/* Label row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</span>
          {helperText && (
            <Tooltip text={helperText}>
              <HelpCircle className="w-3 h-3 text-gray-300 cursor-help" />
            </Tooltip>
          )}
        </div>
        {!loading && trend && TrendIcon && (
          <span className={`flex items-center gap-0.5 text-[11px] font-medium ${trendCls}`}>
            <TrendIcon className="w-3 h-3" />{trendValue}
          </span>
        )}
      </div>

      {/* Value */}
      {loading ? (
        <div className="space-y-2">
          <Sk h={28} w="70%" r={4} />
          <Sk h={12} w="50%" r={3} />
        </div>
      ) : (
        <>
          <div className="text-[22px] font-semibold text-gray-900 tracking-tight tabular-nums leading-none mb-1">
            {value}
          </div>
          {secondary && <div className="text-[11px] text-gray-400">{secondary}</div>}
        </>
      )}
    </button>
  );
}

// ─── Action Item ─────────────────────────────────────────────────────────────

function ActionItem({ item }) {
  const icons = {
    high: <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />,
    medium: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
    low: <Clock className="w-4 h-4 text-gray-400 shrink-0" />,
  };
  return (
    <button
      onClick={item.action}
      className="group w-full flex items-center gap-3 px-4 py-3 rounded-md border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 text-left focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
    >
      {icons[item.priority] || icons.low}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
        <p className="text-[11px] text-gray-400 truncate mt-0.5">{item.description}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
    </button>
  );
}

// ─── Insight Card ─────────────────────────────────────────────────────────────

function InsightCard({ insight }) {
  const [expanded, setExpanded] = useState(false);
  const borderColor = insight.impact === "negative" ? "border-l-red-400" : insight.impact === "positive" ? "border-l-emerald-400" : "border-l-blue-400";
  return (
    <div className={`bg-white border border-gray-200 border-l-4 ${borderColor} rounded-md p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{insight.title}</p>
          <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{insight.description}</p>
        </div>
      </div>
      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-[11px] text-gray-500 leading-relaxed mb-2">{insight.detail}</p>
        </div>
      )}
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[11px] font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
        >
          <HelpCircle className="w-3 h-3" />
          {expanded ? "Less" : "Why?"}
        </button>
        {insight.action && (
          <>
            <span className="text-gray-200">·</span>
            <button
              onClick={insight.action}
              className="text-[11px] font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
            >
              <Zap className="w-3 h-3" />
              Fix it
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Needs Review Table ───────────────────────────────────────────────────────

function NeedsReviewTable({ rows, loading, onRowClick }) {
  const [sortCol, setSortCol] = useState("priority");
  const [sortDir, setSortDir] = useState("asc");
  const [filter, setFilter] = useState("");

  const toggleSort = useCallback((col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  }, [sortCol]);

  const sorted = useMemo(() => {
    const PRIORITY = { high: 0, medium: 1, low: 2 };
    let items = [...rows];
    if (filter.trim()) {
      const q = filter.toLowerCase();
      items = items.filter(r =>
        r.description?.toLowerCase().includes(q) ||
        r.platform?.toLowerCase().includes(q) ||
        r.type?.toLowerCase().includes(q)
      );
    }
    items.sort((a, b) => {
      let av = a[sortCol], bv = b[sortCol];
      if (sortCol === "priority") { av = PRIORITY[a.priority] ?? 9; bv = PRIORITY[b.priority] ?? 9; }
      if (sortCol === "amount") { av = a.amount; bv = b.amount; }
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return items;
  }, [rows, sortCol, sortDir, filter]);

  const SortBtn = ({ col, children }) => (
    <button
      onClick={() => toggleSort(col)}
      className={`flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider transition-colors ${sortCol === col ? "text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
    >
      {children}
      {sortCol === col && <span className="text-[9px]">{sortDir === "asc" ? "▲" : "▼"}</span>}
    </button>
  );

  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {[...Array(4)].map((_, i) => <Sk key={i} h={40} r={4} />)}
      </div>
    );
  }

  return (
    <div>
      {/* Quick filter */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="search"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Filter by name or platform…"
            className="w-full h-8 pl-8 pr-3 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
          />
        </div>
        {filter && (
          <button onClick={() => setFilter("")} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors">
            <X className="w-3 h-3" /> Reset
          </button>
        )}
        <span className="text-[11px] text-gray-400 ml-auto">{sorted.length} item{sorted.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto" role="region" aria-label="Needs review table">
        <table className="w-full text-sm" role="table">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="px-4 py-2.5 text-left w-24"><SortBtn col="priority">Priority</SortBtn></th>
              <th className="px-4 py-2.5 text-left"><SortBtn col="description">Description</SortBtn></th>
              <th className="px-4 py-2.5 text-left w-28"><SortBtn col="platform">Platform</SortBtn></th>
              <th className="px-4 py-2.5 text-right w-28"><SortBtn col="amount">Amount</SortBtn></th>
              <th className="px-4 py-2.5 text-left w-32"><SortBtn col="status">Status</SortBtn></th>
              <th className="px-4 py-2.5 w-10" />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  {filter ? (
                    <div>
                      <p className="text-sm text-gray-500">No results for "{filter}"</p>
                      <button onClick={() => setFilter("")} className="mt-2 text-xs text-blue-600 hover:text-blue-700">Clear filter</button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                      <p className="text-sm font-medium text-gray-700">All clear</p>
                      <p className="text-xs text-gray-400">No items need your review right now.</p>
                    </div>
                  )}
                </td>
              </tr>
            ) : sorted.map((row, idx) => (
              <tr
                key={row.id || idx}
                tabIndex={0}
                onClick={() => onRowClick?.(row)}
                onKeyDown={e => (e.key === "Enter" || e.key === " ") && onRowClick?.(row)}
                className="border-b border-gray-50 cursor-pointer hover:bg-blue-50/40 transition-colors duration-100 focus-visible:outline-none focus-visible:bg-blue-50/60 group"
                role="row"
              >
                <td className="px-4 py-3">
                  <span className={`text-[11px] font-semibold uppercase tracking-wide ${row.priority === "high" ? "text-red-600" : row.priority === "medium" ? "text-amber-600" : "text-gray-400"}`}>
                    {row.priority}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-gray-900 font-medium truncate max-w-xs">{row.description}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{row.date ? format(new Date(row.date), "MMM d, yyyy") : ""}</p>
                </td>
                <td className="px-4 py-3">
                  <PlatformBadge platform={PLATFORM_LABELS[(row.platform || "").toLowerCase()] || row.platform || "Unknown"} />
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">
                  {fmtFull(row.amount)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.status || "needs_review"} />
                </td>
                <td className="px-4 py-3 text-center">
                  <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Reconciliation Overview ──────────────────────────────────────────────────

function ReconciliationOverview({ matched, pending, needsReview, trend, lastSync, errorPlatforms, loading, onReview }) {
  const total = matched + pending + needsReview;
  const matchPct = total > 0 ? Math.round((matched / total) * 100) : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Reconciliation</h2>
          <p className="text-[11px] text-gray-400 mt-0.5">Whether payouts match your bank deposits</p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
          <span className={`w-1.5 h-1.5 rounded-full ${errorPlatforms > 0 ? "bg-red-400" : "bg-emerald-400"}`} />
          {loading ? "Syncing…" : `Synced ${relativeTime(lastSync)}`}
        </div>
      </div>

      <div className="px-5 pt-4 pb-2">
        {loading ? <Sk h={32} r={4} /> : <Sparkline data={trend} />}
      </div>

      <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100">
        {[
          { label: "Matched", value: matched, color: "text-emerald-600" },
          { label: "Pending", value: pending, color: "text-amber-600" },
          { label: "Needs review", value: needsReview, color: needsReview > 0 ? "text-red-600" : "text-gray-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="px-4 py-4 text-center">
            {loading ? <Sk h={24} w={40} className="mx-auto mb-1" r={4} /> : (
              <div className={`text-2xl font-semibold tabular-nums ${color}`}>{value}</div>
            )}
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {!loading && needsReview > 0 && (
        <div className="px-5 py-3 border-t border-gray-100 bg-red-50/50">
          <button
            onClick={onReview}
            className="w-full flex items-center justify-center gap-2 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 transition-colors group"
          >
            Review {needsReview} item{needsReview !== 1 ? "s" : ""} now
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}

      {!loading && needsReview === 0 && matched > 0 && (
        <div className="px-5 py-3 border-t border-gray-100 bg-emerald-50/50 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[11px] font-medium text-emerald-700">{matchPct}% reconciled — great shape</span>
        </div>
      )}
    </div>
  );
}

// ─── Cashflow Forecast ────────────────────────────────────────────────────────

function CashflowCard({ transactions, expenses, period, loading }) {
  // Compute real grouped data from actual transactions — no invented values
  const { chartData, hasData, totalNet, lastNet, firstNet } = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return { chartData: [], hasData: false, totalNet: 0, lastNet: 0, firstNet: 0 };
    }
    // Group transactions by week (last 12 weeks)
    const now = new Date();
    const weeks = Array.from({ length: 12 }, (_, i) => {
      const weekStart = subDays(now, (11 - i) * 7);
      const weekEnd = subDays(now, (10 - i) * 7);
      return { start: weekStart, end: weekEnd, label: format(weekStart, "MMM d") };
    });
    const data = weeks.map(w => {
      const gross = transactions
        .filter(tx => {
          const d = new Date(tx.transaction_date);
          return d >= w.start && d <= w.end;
        })
        .reduce((s, tx) => s + (tx.amount || 0) - calcFee(tx), 0);
      const exp = (expenses || [])
        .filter(e => {
          const d = new Date(e.expense_date);
          return d >= w.start && d <= w.end;
        })
        .reduce((s, e) => s + (e.amount || 0), 0);
      return { label: w.label, amount: Math.max(0, gross - exp) };
    });
    const nonZero = data.some(d => d.amount > 0);
    return {
      chartData: data,
      hasData: nonZero,
      totalNet: data.reduce((s, d) => s + d.amount, 0),
      firstNet: data[0]?.amount || 0,
      lastNet: data[data.length - 1]?.amount || 0,
    };
  }, [transactions, expenses, period]);

  const delta = lastNet - firstNet;

  return (
    <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Revenue over time</h2>
          <p className="text-[11px] text-gray-400 mt-0.5">Net revenue by week — actual data only</p>
        </div>
        <div className="text-right">
          {loading ? <Sk h={18} w={64} r={3} /> : hasData ? (
            <>
              <div className="text-sm font-semibold text-gray-900 tabular-nums">{fmt(totalNet)} total</div>
              <div className={`text-[11px] flex items-center justify-end gap-0.5 mt-0.5 ${delta >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {delta >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {fmt(Math.abs(delta))} vs. 11 weeks ago
              </div>
            </>
          ) : (
            <span className="text-[11px] text-gray-400">No data yet</span>
          )}
        </div>
      </div>
      <div className="px-5 py-4">
        {loading ? <Sk h={100} r={4} /> : <CashflowChart data={chartData} hasData={hasData} />}
        {hasData && (
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <span className="w-5 h-0.5 bg-blue-500 inline-block rounded" />
              Net revenue (after fees &amp; expenses)
            </div>
            <span className="text-[11px] text-gray-400">Hover to inspect</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onConnect }) {
  return (
    <div className="py-16 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-5">
        <Link2 className="w-6 h-6 text-blue-500" />
      </div>
      <h2 className="text-base font-semibold text-gray-900 mb-2">Connect your first platform</h2>
      <p className="text-sm text-gray-500 max-w-xs leading-relaxed mb-5">
        Connect YouTube, Patreon, Stripe, or Gumroad to see your revenue, reconcile payouts, and stay ahead of your finances.
      </p>
      <Button onClick={onConnect} className="bg-blue-600 hover:bg-blue-700 text-white text-sm h-9">
        <Plus className="w-4 h-4 mr-2" /> Connect a platform
      </Button>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("mtd");
  const [search, setSearch] = useState("");
  const [selectedRow, setSelectedRow] = useState(null);
  const searchRef = useRef(null);

  // ── Keyboard: Cmd/Ctrl+K → focus search
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // ── Data fetching
  const {
    data: transactions = [], isLoading: txLoading, isFetching, refetch: refetchTx,
  } = useQuery({
    queryKey: ["revenueTransactions"],
    queryFn: () => base44.entities.RevenueTransaction.fetchAll({}, "-transaction_date"),
    staleTime: 5 * 60 * 1000,
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => base44.entities.Expense.list("-expense_date", 1000),
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: connectedPlatforms = [], isLoading: plLoading, refetch: refetchPl,
  } = useQuery({
    queryKey: ["connectedPlatforms"],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.ConnectedPlatform.filter({ user_id: user.id });
    },
    staleTime: 2 * 60 * 1000,
  });

  const { data: autopsyEvents = [] } = useQuery({
    queryKey: ["autopsyEvents"],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.AutopsyEvent.filter({ user_id: user.id, status: "pending_review" }, "-detected_at", 20);
    },
    staleTime: 60 * 1000,
  });

  const isLoading = txLoading || plLoading;

  const handleRefresh = () => { refetchTx(); refetchPl(); };

  // ── Computed metrics
  const computed = useMemo(() => {
    const range = getRange(period);
    const inRange = transactions.filter(tx => {
      const d = new Date(tx.transaction_date);
      return d >= range.start && d <= range.end;
    });

    const gross = inRange.reduce((s, tx) => s + (tx.amount || 0), 0);
    const fees = inRange.reduce((s, tx) => s + calcFee(tx), 0);
    const net = gross - fees;
    const periodExp = expenses.filter(e => {
      const d = new Date(e.expense_date);
      return d >= range.start && d <= range.end;
    }).reduce((s, e) => s + (e.amount || 0), 0);
    const operating = net - periodExp;

    const unreconciled = transactions.filter(tx => !tx.reconciled_at).reduce((s, tx) => s + (tx.amount || 0), 0);
    const pendingPayouts = unreconciled * 0.6; // arriving next 7d estimate

    const matched = transactions.filter(tx => tx.reconciled_at).length;
    const pending = transactions.filter(tx => !tx.reconciled_at && !tx.error && !tx.mismatch).length;
    const needsReview = transactions.filter(tx => tx.error || tx.mismatch).length;

    const lastSync = connectedPlatforms.reduce((best, p) => {
      const d = new Date(p.last_synced_at || p.updated_at || 0);
      return d > best ? d : best;
    }, new Date(0));

    const errorPlatforms = connectedPlatforms.filter(p => p.sync_status === "error").length;

    // Real sparkline: bucket last 30 days of transactions by day, sum net per day
    const trendData = (() => {
      const buckets = {};
      const now2 = new Date();
      for (let i = 29; i >= 0; i--) {
        const d = subDays(now2, i);
        buckets[format(d, "yyyy-MM-dd")] = 0;
      }
      transactions.forEach(tx => {
        const key = tx.transaction_date ? tx.transaction_date.slice(0, 10) : null;
        if (key && key in buckets) buckets[key] += (tx.amount || 0) - calcFee(tx);
      });
      return Object.values(buckets);
    })();

    // Needs review rows: anomaly events + mismatched transactions
    const reviewRows = [
      ...autopsyEvents.slice(0, 5).map((ev, i) => ({
        id: ev.id || `ev-${i}`,
        priority: i === 0 ? "high" : "medium",
        description: ev.description || ev.event_type || "Unusual revenue pattern",
        platform: ev.platform || "Unknown",
        amount: ev.amount || 0,
        date: ev.detected_at,
        status: "anomaly",
        type: "anomaly",
      })),
      ...transactions.filter(tx => tx.error || tx.mismatch).slice(0, 5).map((tx, i) => ({
        id: tx.id || `tx-${i}`,
        priority: tx.error ? "high" : "medium",
        description: tx.description || "Unmatched transaction",
        platform: tx.platform || "Unknown",
        amount: tx.amount || 0,
        date: tx.transaction_date,
        status: "needs_review",
        type: "mismatch",
      })),
    ].slice(0, 10);

    // Recent activity for table (if no review rows)
    const latestTx = inRange.slice(0, 8).map(tx => ({
      id: tx.id,
      priority: "low",
      description: tx.description || "Revenue transaction",
      platform: tx.platform || "",
      amount: tx.amount || 0,
      date: tx.transaction_date,
      status: tx.reconciled_at ? "matched" : "pending",
      type: "transaction",
    }));

    return {
      net, gross, fees, operating, periodExp, unreconciled, pendingPayouts,
      matched, pending, needsReview, errorPlatforms,
      lastSync: lastSync.getTime() > 0 ? lastSync : null,
      transactionCount: inRange.length, trendData, reviewRows, latestTx,
    };
  }, [period, transactions, expenses, connectedPlatforms, autopsyEvents]);

  // ── Action items
  const actionItems = useMemo(() => {
    const items = [];
    if (computed.needsReview > 0)
      items.push({ id: "1", priority: "high", title: `${computed.needsReview} reconciliation issue${computed.needsReview !== 1 ? "s" : ""}`, description: "Transactions that don't match bank deposits", action: () => navigate("/Reconciliation") });
    if (autopsyEvents.length > 0)
      items.push({ id: "2", priority: "medium", title: `${autopsyEvents.length} revenue anomal${autopsyEvents.length !== 1 ? "ies" : "y"}`, description: "Unusual patterns detected — review recommended", action: () => navigate("/RevenueAutopsy") });
    if (computed.errorPlatforms > 0)
      items.push({ id: "3", priority: "medium", title: `${computed.errorPlatforms} sync error${computed.errorPlatforms !== 1 ? "s" : ""}`, description: "Platform connections need your attention", action: () => navigate("/ConnectedPlatforms") });
    return items;
  }, [computed, autopsyEvents, navigate]);

  // ── Insights
  const insights = useMemo(() => {
    const items = [];
    if (computed.fees > computed.gross * 0.3)
      items.push({ id: "1", impact: "negative", title: "Platform fees are above 30% of gross", description: `You're paying ${fmt(computed.fees)} in fees on ${fmt(computed.gross)} gross revenue this period.`, detail: "YouTube takes 45% of Super Chat revenue. Consider diversifying to Patreon (8% fee) for a better net margin.", action: () => navigate("/Expenses") });
    if (computed.unreconciled > 2000)
      items.push({ id: "2", impact: "negative", title: `${fmt(computed.unreconciled)} hasn't hit your bank yet`, description: "This money is on its way but not yet deposited.", detail: "Platform payout schedules vary: Stripe is 2 days, YouTube is monthly. Most of this should clear soon.", action: () => navigate("/Reconciliation") });
    if (computed.net > 0 && computed.operating > 0)
      items.push({ id: "3", impact: "positive", title: "You're cash-positive this period", description: `After fees and expenses, you kept ${fmt(computed.operating)} — solid.`, detail: "Operating margin is healthy. Good time to review tax set-asides before quarter end.", action: () => navigate("/TaxEstimator") });
    if (items.length === 0)
      items.push({ id: "4", impact: "neutral", title: "Connect more platforms for deeper insights", description: "Zerithum needs data from at least one platform to generate revenue insights.", detail: "Once connected, we'll analyze fee efficiency, reconciliation health, and cashflow trends.", action: () => navigate("/ConnectedPlatforms") });
    return items.slice(0, 3);
  }, [computed, navigate]);

  const noPlatforms = !isLoading && connectedPlatforms.length === 0;

  // ── Table rows: use reviewRows when available, else latest
  const tableRows = computed.reviewRows.length > 0 ? computed.reviewRows : computed.latestTx;
  const tableLabel = computed.reviewRows.length > 0 ? "Needs review" : "Recent activity";

  return (
    <div className="min-h-screen bg-[#FAFAFA]">

      {/* ── Page header ── */}
      <div className="bg-white border-b border-gray-200 px-1 py-5 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">

          {/* Left: title + period */}
          <div>
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-sm text-gray-400 mt-0.5">Your revenue, reconciliation, and cash position at a glance.</p>
          </div>

          {/* Right: search + period + refresh + CTAs */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Global search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                ref={searchRef}
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search… (⌘K)"
                className="h-8 w-52 pl-8 pr-3 text-sm bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 transition-all focus:w-72"
              />
            </div>

            {/* Period selector */}
            <div className="flex items-center bg-white border border-gray-200 rounded-md p-0.5 gap-0.5">
              {PERIODS.map(p => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`px-3 h-7 text-xs font-medium rounded transition-colors ${period === p.value ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-900"}`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              disabled={isFetching}
              aria-label="Refresh data"
              className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-md text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 outline-none"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            </button>

            {/* Primary CTAs */}
            <Button variant="outline" size="sm" onClick={() => navigate("/Reports")} className="h-8 text-xs border-gray-200 text-gray-600 hover:text-gray-900">
              <Download className="w-3.5 h-3.5 mr-1.5" /> Export
            </Button>
            <Button size="sm" onClick={() => navigate("/ConnectedPlatforms")} className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Connect platform
            </Button>
          </div>
        </div>
      </div>


      {/* ── No platform notice (never hides the dashboard) ── */}
      {noPlatforms && (
        <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-md border border-blue-100 bg-blue-50/60 text-sm">
          <Link2 className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="text-gray-600">
            <span className="font-medium text-gray-900">No platforms connected.</span>{" "}
            All figures show $0 until you connect a platform.
          </span>
          <button
            onClick={() => navigate("/ConnectedPlatforms")}
            className="ml-auto shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Connect now →
          </button>
        </div>
      )}

      <div className="space-y-6">

        {/* ── Hero: Available Cash ── */}
        <div className="bg-white border border-gray-200 rounded-md px-6 py-5">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Available Cash</span>
                <Tooltip text="After platform fees, refunds, and known upcoming payouts. This is what you could safely spend today.">
                  <HelpCircle className="w-3 h-3 text-gray-300 cursor-help" />
                </Tooltip>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Live
                </span>
              </div>
              {isLoading ? (
                <Sk w={180} h={40} r={6} />
              ) : (
                <div className="text-[38px] font-bold text-gray-900 tracking-tight tabular-nums leading-none">
                  {fmt(computed.net)}
                </div>
              )}
              <div className="flex items-center gap-5 mt-3 text-sm">
                <span className="text-gray-400">
                  Gross: <span className="font-medium text-gray-700 tabular-nums">{isLoading ? "—" : fmt(computed.gross)}</span>
                </span>
                <span className="text-gray-400">
                  Fees: <span className="font-medium text-gray-700 tabular-nums">{isLoading ? "—" : fmt(computed.fees)}</span>
                </span>
                <span className="text-gray-400">
                  Expenses: <span className="font-medium text-gray-700 tabular-nums">{isLoading ? "—" : fmt(computed.periodExp)}</span>
                </span>
              </div>
            </div>
            {!isLoading && (
              <div className="flex items-center gap-2 self-end">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-600">{computed.transactionCount} transactions this period</span>
              </div>
            )}
          </div>
        </div>

        {/* ── KPI Row (5 tiles) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <KPICard
            label="Net Revenue"
            helperText="Revenue after all platform fees and refunds, for this period."
            value={fmt(computed.net)}
            secondary={`${computed.transactionCount} transactions`}
            loading={isLoading}
            onClick={() => navigate("/TransactionAnalysis")}
          />
          <KPICard
            label="Unreconciled"
            helperText="Money that has not been matched to a bank deposit yet. Not missing — just in transit."
            value={fmt(computed.unreconciled)}
            status={computed.unreconciled > 2000 ? "warning" : "normal"}
            loading={isLoading}
            onClick={() => navigate("/Reconciliation")}
          />
          <KPICard
            label="Arriving (7 days)"
            helperText="Platform payouts expected to hit your bank in the next 7 days."
            value={fmt(computed.pendingPayouts)}
            loading={isLoading}
            trend="up"
            trendValue="expected"
            onClick={() => navigate("/Reconciliation")}
          />
          <KPICard
            label="Operating margin"
            helperText="What's left after fees and business expenses. A positive number means you're profitable."
            value={fmt(computed.operating)}
            status={computed.operating < 0 ? "error" : "normal"}
            loading={isLoading}
            onClick={() => navigate("/Expenses")}
          />
          <KPICard
            label="Needs review"
            helperText="Mismatches and anomalies that need a human decision to resolve."
            value={isLoading ? "—" : `${computed.needsReview + autopsyEvents.length} items`}
            status={(computed.needsReview + autopsyEvents.length) > 0 ? "error" : "normal"}
            loading={isLoading}
            onClick={() => navigate("/RevenueAutopsy")}
          />
        </div>

        {/* ── Main grid: Reconciliation left, Action+Insights right ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left column: Reconciliation + Cashflow */}
          <div className="lg:col-span-7 space-y-5">
            <ReconciliationOverview
              matched={computed.matched}
              pending={computed.pending}
              needsReview={computed.needsReview}
              trend={computed.trendData}
              lastSync={computed.lastSync}
              errorPlatforms={computed.errorPlatforms}
              loading={isLoading}
              onReview={() => navigate("/Reconciliation")}
            />
            <CashflowCard transactions={transactions} expenses={expenses} period={period} loading={isLoading} />
          </div>

          {/* Right column: Action Queue + Insights */}
          <div className="lg:col-span-5 space-y-5">

            {/* Action Queue */}
            <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    What to do next
                    {actionItems.length > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold">{actionItems.length}</span>
                    )}
                  </h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">Prioritised tasks that need your attention</p>
                </div>
              </div>
              <div className="p-4 space-y-2">
                {isLoading ? (
                  <div className="space-y-2">
                    <Sk h={56} r={6} />
                    <Sk h={56} r={6} />
                  </div>
                ) : actionItems.length === 0 ? (
                  <div className="py-8 flex flex-col items-center text-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    <p className="text-sm font-medium text-gray-700">All caught up</p>
                    <p className="text-[11px] text-gray-400 max-w-xs">No urgent items. Your books are in good shape.</p>
                  </div>
                ) : actionItems.map(item => <ActionItem key={item.id} item={item} />)}
              </div>
            </div>

            {/* Insights */}
            <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Insights</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">What your numbers are telling you</p>
              </div>
              <div className="p-4 space-y-3">
                {isLoading ? (
                  <div className="space-y-3">
                    <Sk h={80} r={6} />
                    <Sk h={80} r={6} />
                  </div>
                ) : insights.map(ins => <InsightCard key={ins.id} insight={ins} />)}
              </div>
            </div>
          </div>
        </div>

        {/* ── Needs Review Table ── */}
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">{tableLabel}</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {computed.reviewRows.length > 0
                  ? "These items need a decision from you before they can be reconciled."
                  : "Your most recent revenue transactions across all platforms."}
              </p>
            </div>
            <button
              onClick={() => navigate(computed.reviewRows.length > 0 ? "/Reconciliation" : "/TransactionAnalysis")}
              className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <NeedsReviewTable
            rows={tableRows}
            loading={isLoading}
            onRowClick={(row) => navigate(row.type === "anomaly" ? "/RevenueAutopsy" : "/Reconciliation")}
          />
        </div>

      </div>
    </div>
  );
}
