import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { subMonths, subDays, startOfMonth, endOfMonth } from "date-fns";
import { RefreshCw, Link2, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Dashboard sub-components ─────────────────────────────────────────────────
import KpiTile from "@/components/dashboard/KpiTile";
import PlatformRevenueTable from "@/components/dashboard/PlatformRevenueTable";
import RevenueTrendChart from "@/components/dashboard/RevenueTrendChart";
import ActionItemsPanel from "@/components/dashboard/ActionItemsPanel";
import AlertBanner from "@/components/dashboard/AlertBanner";
import TrustBar from "@/components/dashboard/TrustBar";

// ── Constants ────────────────────────────────────────────────────────────────

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

/**
 * Published platform fee rates (creator share subtracted from gross).
 * Net Revenue = Gross × (1 − fee rate) for the relevant platform.
 */
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

// ── Empty State (new user) ───────────────────────────────────────────────────

function EmptyState({ onConnect }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-[var(--z-bg-2)] border border-[var(--z-border-1)] flex items-center justify-center mb-6">
        <LayoutDashboard className="w-7 h-7 text-[var(--z-text-3)]" />
      </div>
      <h2 className="text-[22px] font-semibold text-[var(--z-text-1)] tracking-tight mb-2">
        Connect platforms to see your dashboard
      </h2>
      <p className="text-[14px] text-[var(--z-text-3)] max-w-md mb-8 leading-relaxed">
        Zerithum pulls your revenue from YouTube, Patreon, Stripe, and more
        in one place — so you always know what you earned, what was taken
        as fees, and what hit your bank.
      </p>
      <button
        onClick={onConnect}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#32B8C6] text-[#09090B] text-[14px] font-semibold hover:bg-[#21808D] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#32B8C6] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--z-bg-0)]"
      >
        <Link2 className="w-4 h-4" />
        Connect your platforms
      </button>
      <p className="text-[11px] text-[var(--z-text-3)] mt-4">
        Supported: YouTube, Patreon, Stripe, Gumroad, TikTok, Shopify, Substack, Instagram
      </p>
    </div>
  );
}

// ── Dashboard Page ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [alerts, setAlerts] = useState([]);
  const navigate = useNavigate();

  // ── Data queries ─────────────────────────────────────────────────────────

  const {
    data: transactions = [],
    isLoading: txLoading,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ["revenueTransactions"],
    queryFn: () =>
      base44.entities.RevenueTransaction.fetchAll({}, "-transaction_date"),
    staleTime: 1000 * 60 * 5,
  });

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: autopsyEvents = [] } = useQuery({
    queryKey: ["autopsyEvents"],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.AutopsyEvent.filter(
        { user_id: user.id, status: "pending_review" },
        "-detected_at",
        5
      );
    },
  });

  const { data: connectedPlatforms = [], isLoading: platformsLoading } =
    useQuery({
      queryKey: ["connectedPlatforms"],
      queryFn: async () => {
        const user = await base44.auth.me();
        return base44.entities.ConnectedPlatform.filter({ user_id: user.id });
      },
    });

  const { data: reconciliations = [] } = useQuery({
    queryKey: ["reconciliations"],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Reconciliation.filter({ user_id: user.id });
    },
  });

  const isLoading = txLoading || platformsLoading;

  // ── Alert banners ─────────────────────────────────────────────────────────

  useEffect(() => {
    const newAlerts = [];
    if (autopsyEvents.length > 0) {
      newAlerts.push({
        id: "autopsy",
        type: "error",
        title: `${autopsyEvents.length} Revenue ${autopsyEvents.length > 1 ? "Anomalies" : "Anomaly"} Detected`,
        description: "Critical events require your decision. Review now to understand impact.",
        dismissible: false,
      });
    }
    const failedSyncs = connectedPlatforms.filter((p) => p.sync_status === "error");
    if (failedSyncs.length > 0) {
      newAlerts.push({
        id: "sync",
        type: "sync",
        title: `${failedSyncs.length} Platform${failedSyncs.length > 1 ? "s" : ""} Failed to Sync`,
        description: "Go to Connected Platforms to reconnect and resume data collection.",
        dismissible: true,
      });
    }
    setAlerts(newAlerts);
  }, [autopsyEvents, connectedPlatforms]);

  // ── Computed metrics ──────────────────────────────────────────────────────

  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const prevMonthStart = startOfMonth(subMonths(now, 1));
    const prevMonthEnd = endOfMonth(subMonths(now, 1));

    const currentTxns = transactions.filter((t) => {
      const d = new Date(t.transaction_date);
      return d >= currentMonthStart && d <= currentMonthEnd;
    });
    const prevTxns = transactions.filter((t) => {
      const d = new Date(t.transaction_date);
      return d >= prevMonthStart && d <= prevMonthEnd;
    });

    // ── Total Revenue (gross, MTD) ──────────────────────────────────────
    const totalRevenue = currentTxns.reduce((s, t) => s + (t.amount || 0), 0);
    const prevRevenue = prevTxns.reduce((s, t) => s + (t.amount || 0), 0);

    let revenueTrend = "neutral";
    let revenueChange = "No prior data";
    if (prevRevenue > 0) {
      const pct = ((totalRevenue - prevRevenue) / prevRevenue) * 100;
      revenueTrend = pct > 0 ? "up" : pct < 0 ? "down" : "neutral";
      revenueChange = `${pct > 0 ? "+" : ""}${pct.toFixed(1)}% vs last month`;
    }

    // ── Net Revenue (after platform fees, estimated) ────────────────────
    const netRevenue = currentTxns.reduce((s, t) => {
      const rate = PLATFORM_FEE_RATES[(t.platform || "").toLowerCase()] ?? 0;
      return s + (t.amount || 0) * (1 - rate);
    }, 0);
    const prevNetRevenue = prevTxns.reduce((s, t) => {
      const rate = PLATFORM_FEE_RATES[(t.platform || "").toLowerCase()] ?? 0;
      return s + (t.amount || 0) * (1 - rate);
    }, 0);
    let netTrend = "neutral";
    let netChange = "No prior data";
    if (prevNetRevenue > 0) {
      const pct = ((netRevenue - prevNetRevenue) / prevNetRevenue) * 100;
      netTrend = pct > 0 ? "up" : pct < 0 ? "down" : "neutral";
      netChange = `${pct > 0 ? "+" : ""}${pct.toFixed(1)}% vs last month`;
    }

    // ── Cash Received (bank-matched) ────────────────────────────────────
    const cashReceived = reconciliations
      .filter((r) => r.status === "matched" || r.status === "reconciled")
      .reduce((s, r) => s + (r.amount || 0), 0);

    // ── Items needing review ────────────────────────────────────────────
    const unreconciledCount = reconciliations.filter(
      (r) => r.status === "pending" || r.status === "unmatched"
    ).length;
    const reviewCount = unreconciledCount + autopsyEvents.length;

    // ── Platform breakdown ──────────────────────────────────────────────
    const currentMap = {};
    currentTxns.forEach((t) => {
      currentMap[t.platform] = (currentMap[t.platform] || 0) + (t.amount || 0);
    });
    const prevMap = {};
    prevTxns.forEach((t) => {
      prevMap[t.platform] = (prevMap[t.platform] || 0) + (t.amount || 0);
    });
    const allPlatformKeys = new Set([
      ...Object.keys(currentMap),
      ...Object.keys(prevMap),
    ]);
    const platformData = Array.from(allPlatformKeys).map((p) => ({
      platform: p,
      currentMonth: currentMap[p] || 0,
      lastMonth: prevMap[p] || 0,
    }));

    const activePlatformCount = Object.keys(currentMap).length;

    // ── Stale platforms ────────────────────────────────────────────────
    const stalePlatforms = connectedPlatforms
      .filter((p) => p.sync_status === "error")
      .map(
        (p) =>
          PLATFORM_LABELS[(p.platform_name || p.platform || "").toLowerCase()] ||
          p.platform_name ||
          p.platform
      );

    return {
      totalRevenue,
      prevRevenue,
      revenueTrend,
      revenueChange,
      netRevenue,
      netTrend,
      netChange,
      cashReceived,
      unreconciledCount,
      reviewCount,
      activePlatformCount,
      platformData,
      stalePlatforms,
    };
  }, [transactions, reconciliations, autopsyEvents, connectedPlatforms]);

  // ── Greeting ──────────────────────────────────────────────────────────────

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const firstName = user?.full_name?.split(" ")[0] || "";

  // ── Last sync ─────────────────────────────────────────────────────────────

  const lastDataUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  // ── Empty state ───────────────────────────────────────────────────────────

  if (!isLoading && connectedPlatforms.length === 0) {
    return <EmptyState onConnect={() => navigate("/ConnectedPlatforms")} />;
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-[26px] font-semibold text-[var(--z-text-1)] tracking-tight leading-tight">
            {greeting}{firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="text-[13px] text-[var(--z-text-3)] mt-0.5">
            Your earnings overview — month to date
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          disabled={isLoading}
          className="rounded-lg bg-[var(--z-bg-3)] border border-[var(--z-border-1)] text-[var(--z-text-2)] hover:bg-[var(--z-bg-3)] hover:border-[var(--z-border-2)] hover:text-[var(--z-text-1)] transition-all text-sm h-9 px-4 focus-visible:ring-2 focus-visible:ring-[#32B8C6]"
          aria-label="Refresh dashboard data"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* ── Trust Bar ───────────────────────────────────────────────────── */}
      <TrustBar
        connectedPlatforms={connectedPlatforms}
        transactions={transactions}
        totalPlatformCount={8}
      />

      {/* ── Alert Banners ───────────────────────────────────────────────── */}
      <AlertBanner
        alerts={alerts}
        onDismiss={(id) => setAlerts(alerts.filter((a) => a.id !== id))}
      />

      {/* ── KPI Tiles ───────────────────────────────────────────────────── */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8"
        role="region"
        aria-label="Key financial metrics"
      >
        {/* Tile 1: Total Revenue */}
        <KpiTile
          label="Total Revenue"
          value={`$${metrics.totalRevenue.toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}`}
          trend={metrics.revenueTrend}
          trendValue={metrics.revenueChange}
          source={
            metrics.activePlatformCount > 0
              ? `Synced from ${metrics.activePlatformCount} platform${metrics.activePlatformCount > 1 ? "s" : ""}`
              : "Synced from connected platforms"
          }
          lastUpdatedAt={lastDataUpdated}
          viewDetailsTo="/TransactionAnalysis"
          disclosure={{
            title: "How we calculate Total Revenue",
            body: "Total Revenue is the sum of all gross transaction amounts received from your connected platforms for the current calendar month. This is the amount before any platform fees are subtracted.",
            formula: "Sum of all platform payouts (gross) — month to date",
            source: "Calculated from synced transactions",
          }}
          isLoading={isLoading}
        />

        {/* Tile 2: Net Revenue */}
        <KpiTile
          label="Net Revenue"
          value={`$${metrics.netRevenue.toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}`}
          trend={metrics.netTrend}
          trendValue={metrics.netChange}
          source="After estimated platform fees"
          lastUpdatedAt={lastDataUpdated}
          viewDetailsTo="/TransactionAnalysis"
          disclosure={{
            title: "How we calculate Net Revenue",
            body: "Net Revenue is what you actually keep after each platform deducts its fee. We use each platform's published standard fee rate (e.g. YouTube keeps 45%, Patreon takes 8%). These are estimates — your actual rate may vary by tier.",
            formula: "Gross Revenue × (1 − Platform Fee Rate)",
            source: "Based on published platform fee rates",
          }}
          isLoading={isLoading}
        />

        {/* Tile 3: Cash Received */}
        <KpiTile
          label="Cash Received"
          value={`$${metrics.cashReceived.toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}`}
          source="Matched to bank deposits"
          lastUpdatedAt={lastDataUpdated}
          viewDetailsTo="/TransactionAnalysis"
          disclosure={{
            title: "What is Cash Received?",
            body: "Cash Received is the amount we have been able to match to an actual bank deposit. This means money that has left the platform and arrived in your account. It will always be less than or equal to your Net Revenue, because some payments may still be in transit or pending.",
            formula: "Reconciled transactions matched to bank deposits",
            source: "Matched to bank deposits via reconciliation",
          }}
          isLoading={isLoading}
        />

        {/* Tile 4: Items Needing Review */}
        <KpiTile
          label="Needs Review"
          value={metrics.reviewCount > 0 ? `${metrics.reviewCount} items` : "All clear"}
          source={
            metrics.reviewCount > 0
              ? "Unmatched transactions + anomalies"
              : "No unresolved items"
          }
          lastUpdatedAt={lastDataUpdated}
          viewDetailsTo={
            autopsyEvents.length > 0 ? "/RevenueAutopsy" : "/TransactionAnalysis"
          }
          viewDetailsLabel="Review now"
          highlight={metrics.reviewCount > 0}
          disclosure={{
            title: "What needs review?",
            body: "This count includes unreconciled transactions (payments we received from platforms but haven't matched to a bank deposit yet) and revenue anomalies (unusual changes in your earnings that may indicate a mistake or missed payment).",
            source: "Unreconciled transactions + pending revenue anomalies",
          }}
          isLoading={isLoading}
        />
      </div>

      {/* ── "Where your money came from" table ──────────────────────────── */}
      <div className="mb-8">
        <PlatformRevenueTable
          platformData={metrics.platformData}
          connectedPlatforms={connectedPlatforms}
        />
      </div>

      {/* ── Trend + Attention panels ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue trend chart — 2/3 width */}
        <div className="lg:col-span-2">
          <RevenueTrendChart transactions={transactions} />
        </div>

        {/* Attention required — 1/3 width */}
        <div>
          <ActionItemsPanel
            unreconciledCount={metrics.unreconciledCount}
            stalePlatforms={metrics.stalePlatforms}
            autopsyEventCount={autopsyEvents.length}
            hasTaxExport={false}
          />
        </div>
      </div>

      {/* ── Footer disclosure ────────────────────────────────────────────── */}
      <div className="mt-8 pt-6 border-t border-[var(--z-border-1)]">
        <p className="text-[11px] text-[var(--z-text-3)] leading-relaxed max-w-3xl">
          <strong className="font-medium text-[var(--z-text-2)]">Data source: </strong>
          Revenue figures are pulled from your connected platforms via OAuth API sync.
          Platform fees are estimated using each platform's published standard rates and
          may not reflect negotiated or tiered rates. Net Revenue and Cash Received are
          estimates — consult your accountant for tax purposes.{" "}
          <Link
            to="/ConnectedPlatforms"
            className="text-[#32B8C6] hover:text-[#21808D] transition-colors"
          >
            Manage connected platforms →
          </Link>
        </p>
      </div>
    </div>
  );
}