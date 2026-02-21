import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/supabaseClient";
import { format, startOfMonth, subMonths, endOfMonth, subDays } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Link2,
  RefreshCw,
  CheckCircle2,
  Loader2,
} from "lucide-react";

// ─── Platform fee rates (published rates, same as Dashboard) ──────────────────
const PLATFORM_FEE_RATES = {
  youtube: 0.45,
  patreon: 0.08,
  stripe: 0.029,
  gumroad: 0.10,
  instagram: 0.05,
  tiktok: 0.50,
  shopify: 0.02,
  substack: 0.10,
};

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) {
  return "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function pct(n) {
  return (n >= 0 ? "+" : "") + n.toFixed(1) + "%";
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function Skeleton({ className = "" }) {
  return (
    <div
      className={"rounded animate-pulse " + className}
      style={{ background: "var(--z-bg-3)" }}
      aria-hidden="true"
    />
  );
}

// ─── Empty state (no platforms connected) ─────────────────────────────────────
function EmptyNoPlatforms() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
      <div
        className="w-14 h-14 rounded-xl border flex items-center justify-center mb-5"
        style={{ background: "var(--z-bg-2)", borderColor: "var(--z-border-1)" }}
        aria-hidden="true"
      >
        <Link2 className="w-6 h-6" style={{ color: "var(--z-text-3)" }} />
      </div>
      <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--z-text-1)" }}>
        No platforms connected
      </h2>
      <p className="text-sm mb-6 max-w-sm" style={{ color: "var(--z-text-3)", lineHeight: 1.6 }}>
        Connect your revenue platforms so Zerithum can analyse your earnings, fees, and income patterns.
      </p>
      <button
        onClick={() => navigate("/ConnectedPlatforms")}
        className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#32B8C6]"
        style={{ background: "#32B8C6", color: "#09090B" }}
      >
        Connect platforms
      </button>
    </div>
  );
}

// ─── Empty state (platforms connected, no transactions yet) ───────────────────
function EmptyNoData({ connectedPlatforms }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
      <div
        className="w-14 h-14 rounded-xl border flex items-center justify-center mb-5"
        style={{ background: "var(--z-bg-2)", borderColor: "var(--z-border-1)" }}
        aria-hidden="true"
      >
        <RefreshCw className="w-6 h-6" style={{ color: "var(--z-text-3)" }} />
      </div>
      <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--z-text-1)" }}>
        Waiting for transactions
      </h2>
      <p className="text-sm mb-2 max-w-sm" style={{ color: "var(--z-text-3)", lineHeight: 1.6 }}>
        You have {connectedPlatforms.length} platform{connectedPlatforms.length !== 1 ? "s" : ""} connected.
        Revenue Autopsy will appear once your first transactions sync.
      </p>
      <p className="text-xs" style={{ color: "var(--z-text-3)" }}>
        Syncs happen automatically every few hours.
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function RevenueAutopsy() {
  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ["revenueTransactions"],
    queryFn: () => base44.entities.RevenueTransaction.fetchAll({}, "-transaction_date"),
    staleTime: 1000 * 60 * 5,
  });

  const { data: autopsyEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["autopsyEvents"],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.AutopsyEvent.filter({ user_id: user.id }, "-detected_at", 20);
    },
  });

  const { data: connectedPlatforms = [], isLoading: platformsLoading } = useQuery({
    queryKey: ["connectedPlatforms"],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.ConnectedPlatform.filter({ user_id: user.id });
    },
  });

  const isLoading = txLoading || eventsLoading || platformsLoading;

  // ── Computed metrics ──────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    const trailing90Start = subDays(now, 89);

    // MTD transactions
    const mtdTxns = transactions.filter(t => {
      const d = new Date(t.transaction_date);
      return d >= thisMonthStart && (t.amount || 0) > 0;
    });

    // Prior month transactions
    const prevTxns = transactions.filter(t => {
      const d = new Date(t.transaction_date);
      return d >= lastMonthStart && d <= lastMonthEnd && (t.amount || 0) > 0;
    });

    // Trailing 90 days
    const t90 = transactions.filter(t => {
      const d = new Date(t.transaction_date);
      return d >= trailing90Start && (t.amount || 0) > 0;
    });

    // ── Revenue MTD
    const revenueMTD = mtdTxns.reduce((s, t) => s + (t.amount || 0), 0);
    const revenuePrev = prevTxns.reduce((s, t) => s + (t.amount || 0), 0);
    const revenueDelta = revenuePrev > 0 ? ((revenueMTD - revenuePrev) / revenuePrev) * 100 : null;

    // ── Net revenue MTD (after estimated fees)
    const netMTD = mtdTxns.reduce((s, t) => {
      const rate = PLATFORM_FEE_RATES[(t.platform || "").toLowerCase()] ?? 0;
      return s + (t.amount || 0) * (1 - rate);
    }, 0);

    // ── Refunds (90-day)
    const refundTxns = transactions.filter(t => {
      const d = new Date(t.transaction_date);
      return d >= trailing90Start && (t.amount || 0) < 0;
    });
    const refundAmount = refundTxns.reduce((s, t) => s + Math.abs(t.amount || 0), 0);
    const gross90 = t90.reduce((s, t) => s + (t.amount || 0), 0);
    const refundRate = gross90 > 0 ? (refundAmount / gross90) * 100 : 0;

    // ── Platform breakdown (MTD)
    const platformMap = {};
    mtdTxns.forEach(t => {
      const key = (t.platform || "unknown").toLowerCase();
      platformMap[key] = (platformMap[key] || 0) + (t.amount || 0);
    });
    const platformRows = Object.entries(platformMap)
      .sort((a, b) => b[1] - a[1])
      .map(([platform, revenue]) => ({
        platform,
        label: PLATFORM_LABELS[platform] || platform,
        revenue,
        share: revenueMTD > 0 ? (revenue / revenueMTD) * 100 : 0,
          feeRate: (PLATFORM_FEE_RATES[platform] ?? 0) * 100,
      }));

    // ── Concentration risk: top platform share
    const topShare = platformRows.length > 0 ? platformRows[0].share : 0;
    const topPlatform = platformRows.length > 0 ? platformRows[0].label : null;

    return {
      revenueMTD,
      revenuePrev,
      revenueDelta,
      netMTD,
      refundRate,
      refundAmount,
      platformRows,
      topShare,
      topPlatform,
      hasMTDData: mtdTxns.length > 0,
      totalTxCount: transactions.length,
    };
  }, [transactions]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-5 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-7 w-40" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // ── Empty states ──────────────────────────────────────────────────────────
  if (connectedPlatforms.length === 0) {
    return <EmptyNoPlatforms />;
  }

  if (metrics.totalTxCount === 0) {
    return <EmptyNoData connectedPlatforms={connectedPlatforms} />;
  }

  // ── Determine concentration risk level ───────────────────────────────────
  const riskLevel =
    metrics.topShare >= 70 ? "high" :
    metrics.topShare >= 40 ? "medium" : "low";

  const riskConfig = {
    high: { label: "High risk", color: "#FF5459", bg: "rgba(255,84,89,0.08)", border: "rgba(255,84,89,0.25)" },
    medium: { label: "Medium risk", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)" },
    low: { label: "Low risk", color: "#4ade80", bg: "rgba(74,222,128,0.08)", border: "rgba(74,222,128,0.25)" },
  }[riskLevel];

  const refundRiskLevel = metrics.refundRate > 5 ? "high" : metrics.refundRate > 3 ? "medium" : "low";

  // ── Pending autopsy events ────────────────────────────────────────────────
  const pendingEvents = autopsyEvents.filter(e => e.status === "pending_review");

  return (
    <main className="max-w-3xl mx-auto py-8 px-4 space-y-6" id="revenue-autopsy-page">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight" style={{ color: "var(--z-text-1)" }}>
          Revenue Autopsy
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--z-text-3)" }}>
          A plain-language breakdown of how your revenue is composed.
        </p>
      </div>

      {/* ── Section 1: Your numbers this month ──────────────────────────── */}
      <section aria-label="Revenue this month">
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--z-text-3)" }}>
          This month
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Revenue */}
          <div
            className="rounded-xl border p-4"
            style={{ background: "var(--z-bg-2)", borderColor: "var(--z-border-1)" }}
          >
            <p className="text-xs mb-1" style={{ color: "var(--z-text-3)" }}>Gross Revenue</p>
            <p
              className="text-2xl font-semibold font-mono-financial tabular-nums"
              style={{ color: "var(--z-text-1)" }}
            >
              {fmt(metrics.revenueMTD)}
            </p>
            {metrics.revenueDelta !== null ? (
              <div className="flex items-center gap-1 mt-1.5">
                {metrics.revenueDelta >= 0
                  ? <TrendingUp className="w-3.5 h-3.5" style={{ color: "#4ade80" }} aria-hidden="true" />
                  : <TrendingDown className="w-3.5 h-3.5" style={{ color: "#FF5459" }} aria-hidden="true" />
                }
                <span
                  className="text-xs font-mono-financial"
                  style={{ color: metrics.revenueDelta >= 0 ? "#4ade80" : "#FF5459" }}
                >
                  {pct(metrics.revenueDelta)} vs last month
                </span>
              </div>
            ) : (
              <p className="text-xs mt-1.5" style={{ color: "var(--z-text-3)" }}>
                First month of data
              </p>
            )}
            <p className="text-[10px] mt-2 pt-2 border-t" style={{ color: "var(--z-text-3)", borderColor: "var(--z-border-1)" }}>
              Total earned, before fees
            </p>
          </div>

          {/* Net revenue */}
          <div
            className="rounded-xl border p-4"
            style={{ background: "var(--z-bg-2)", borderColor: "var(--z-border-1)" }}
          >
            <p className="text-xs mb-1" style={{ color: "var(--z-text-3)" }}>Est. Net Revenue</p>
            <p
              className="text-2xl font-semibold font-mono-financial tabular-nums"
              style={{ color: "var(--z-text-1)" }}
            >
              {fmt(metrics.netMTD)}
            </p>
            <p className="text-xs mt-1.5" style={{ color: "var(--z-text-3)" }}>
              {metrics.revenueMTD > 0
                ? fmt(metrics.revenueMTD - metrics.netMTD) + " in platform fees"
                : "—"}
            </p>
            <p className="text-[10px] mt-2 pt-2 border-t" style={{ color: "var(--z-text-3)", borderColor: "var(--z-border-1)" }}>
              After estimated fees · based on published rates
            </p>
          </div>

          {/* Refund rate */}
          <div
            className="rounded-xl border p-4"
            style={{
              background: "var(--z-bg-2)",
              borderColor: refundRiskLevel === "high"
                ? "rgba(255,84,89,0.35)"
                : refundRiskLevel === "medium"
                ? "rgba(245,158,11,0.3)"
                : "var(--z-border-1)",
            }}
          >
            <p className="text-xs mb-1" style={{ color: "var(--z-text-3)" }}>Refund Rate</p>
            <p
              className="text-2xl font-semibold font-mono-financial tabular-nums"
              style={{ color: "var(--z-text-1)" }}
            >
              {metrics.refundRate.toFixed(1)}%
            </p>
            <p className="text-xs mt-1.5" style={{ color: "var(--z-text-3)" }}>
              {fmt(metrics.refundAmount)} refunded · 90 days
            </p>
            <p className="text-[10px] mt-2 pt-2 border-t" style={{ color: "var(--z-text-3)", borderColor: "var(--z-border-1)" }}>
              Refunds ÷ gross revenue · trailing 90 days
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 2: Where your money comes from ───────────────────────── */}
      {metrics.platformRows.length > 0 && (
        <section aria-label="Revenue by platform">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--z-text-3)" }}>
            Where your money comes from this month
          </p>
          <div
            className="rounded-xl border overflow-hidden"
            style={{ background: "var(--z-bg-2)", borderColor: "var(--z-border-1)" }}
          >
            {metrics.platformRows.map((row, idx) => (
              <div
                key={row.platform}
                className="px-4 py-3 flex items-center gap-4"
                style={{
                  borderBottom: idx < metrics.platformRows.length - 1
                    ? "1px solid var(--z-border-1)"
                    : "none",
                }}
              >
                {/* Platform name */}
                <span
                  className="text-sm font-medium w-28 flex-shrink-0"
                  style={{ color: "var(--z-text-1)" }}
                >
                  {row.label}
                </span>

                {/* Bar */}
                <div className="flex-1 min-w-0">
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ background: "var(--z-bg-3)" }}
                    role="progressbar"
                    aria-valuenow={Math.round(row.share)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={row.label + " contributes " + row.share.toFixed(1) + "% of revenue"}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: row.share + "%",
                        background: idx === 0 ? "#32B8C6" : "var(--z-border-2)",
                      }}
                    />
                  </div>
                </div>

                {/* Revenue */}
                <span
                  className="text-sm font-mono-financial tabular-nums w-20 text-right flex-shrink-0"
                  style={{ color: "var(--z-text-1)" }}
                >
                  {fmt(row.revenue)}
                </span>

                {/* Share */}
                <span
                  className="text-xs w-10 text-right flex-shrink-0"
                  style={{ color: "var(--z-text-3)" }}
                >
                  {row.share.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>

          {/* Concentration notice */}
          {metrics.platformRows.length > 0 && metrics.topShare > 0 && (
            <div
              className="mt-3 rounded-lg border px-4 py-3 flex items-start gap-2.5"
              style={{
                background: riskConfig.bg,
                borderColor: riskConfig.border,
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                style={{ background: riskConfig.color }}
                aria-hidden="true"
              />
              <div>
                <span
                  className="text-xs font-semibold mr-1"
                  style={{ color: riskConfig.color }}
                >
                  {riskConfig.label}:
                </span>
                <span className="text-xs" style={{ color: "var(--z-text-2)" }}>
                  {metrics.topPlatform} makes up {metrics.topShare.toFixed(0)}% of your income.
                  {riskLevel === "high"
                    ? " If this platform changes its rules or pauses payouts, most of your revenue is affected."
                    : riskLevel === "medium"
                    ? " Consider growing a second income stream to reduce dependency."
                    : " Your income is reasonably spread across platforms."}
                </span>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Section 3: Flagged events ─────────────────────────────────────── */}
      <section aria-label="Flagged revenue events">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--z-text-3)" }}>
            Flagged events
          </p>
          {pendingEvents.length > 0 && (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
              style={{
                background: "rgba(255,84,89,0.08)",
                borderColor: "rgba(255,84,89,0.3)",
                color: "#FF5459",
              }}
            >
              {pendingEvents.length} need{pendingEvents.length === 1 ? "s" : ""} review
            </span>
          )}
        </div>

        {pendingEvents.length === 0 ? (
          <div
            className="rounded-xl border px-4 py-5 flex items-center gap-3"
            style={{ background: "var(--z-bg-2)", borderColor: "var(--z-border-1)" }}
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: "#4ade80" }} aria-hidden="true" />
            <p className="text-sm" style={{ color: "var(--z-text-2)" }}>
              No anomalies detected. Your revenue patterns look normal.
            </p>
          </div>
        ) : (
          <div
            className="rounded-xl border overflow-hidden divide-y"
            style={{ background: "var(--z-bg-2)", borderColor: "var(--z-border-1)" }}
            role="list"
          >
            {pendingEvents.slice(0, 5).map(event => {
              const isPositive = (event.impact_percentage || 0) > 0;
              const severityColor =
                event.severity === "critical" ? "#FF5459"
                : event.severity === "high" ? "#E68161"
                : "#f59e0b";

              return (
                <div
                  key={event.id}
                  className="px-4 py-3.5 flex items-start gap-3"
                  style={{ borderColor: "var(--z-border-1)" }}
                  role="listitem"
                >
                  <AlertTriangle
                    className="w-4 h-4 mt-0.5 flex-shrink-0"
                    style={{ color: severityColor }}
                    aria-hidden="true"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="text-sm font-medium capitalize" style={{ color: "var(--z-text-1)" }}>
                        {(event.event_type || "anomaly").replace(/_/g, " ")}
                      </p>
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase"
                        style={{
                          background: severityColor + "15",
                          border: "1px solid " + severityColor + "40",
                          color: severityColor,
                        }}
                      >
                        {event.severity}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: "var(--z-text-3)" }}>
                      {event.detected_at
                        ? format(new Date(event.detected_at), "MMM d, yyyy")
                        : "—"}
                      {event.impact_percentage
                        ? " · " + (isPositive ? "+" : "") + event.impact_percentage.toFixed(1) + "% impact"
                        : ""}
                    </p>
                  </div>
                  <Link
                    to="/RevenueAutopsyEvents"
                    className="text-xs flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#32B8C6] rounded"
                    style={{ color: "#32B8C6" }}
                    aria-label={"Review " + (event.event_type || "anomaly") + " event"}
                  >
                    Review →
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {autopsyEvents.filter(e => e.status !== "pending_review").length > 0 && (
          <p className="mt-2 text-xs text-right" style={{ color: "var(--z-text-3)" }}>
            {autopsyEvents.filter(e => e.status !== "pending_review").length} previously resolved
          </p>
        )}
      </section>

      {/* ── Footer note ───────────────────────────────────────────────────── */}
      <div
        className="pt-4 border-t text-xs leading-relaxed"
        style={{ borderColor: "var(--z-border-1)", color: "var(--z-text-3)" }}
      >
        <strong style={{ color: "var(--z-text-2)" }}>About these numbers: </strong>
        Gross revenue is pulled directly from your connected platforms. Net revenue deducts estimated fees using each platform's published standard rate — your actual rate may differ. Refund rate covers the trailing 90 days.{" "}
        <Link
          to="/Methodology"
          style={{ color: "#32B8C6" }}
          className="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#32B8C6] rounded"
        >
          Read our full methodology →
        </Link>
      </div>

    </main>
  );
}
