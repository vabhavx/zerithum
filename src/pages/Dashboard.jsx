import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import {
  RefreshCw,
  DollarSign,
  ShieldAlert,
  CalendarClock,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import SummaryCard from "@/components/dashboard/SummaryCard";
import PlatformRevenueTable from "@/components/dashboard/PlatformRevenueTable";
import RevenueTrendChart from "@/components/dashboard/RevenueTrendChart";
import ActionItemsPanel from "@/components/dashboard/ActionItemsPanel";
import AlertBanner from "@/components/dashboard/AlertBanner";
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics";

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

export default function Dashboard() {
  const [alerts, setAlerts] = useState([]);
  const navigate = useNavigate();

  // ── Data queries ──────────────────────────────────────────────────────

  const {
    data: transactions = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["revenueTransactions"],
    queryFn: () => {
      // Optimization: Fetch only last 4 months of data
      // This covers: current month, previous month, and 90-day trend chart/risk analysis
      const fourMonthsAgo = startOfMonth(subMonths(new Date(), 4));
      return base44.entities.RevenueTransaction.fetchAll(
        { transaction_date: { $gte: fourMonthsAgo.toISOString() } },
        "-transaction_date"
      );
    },
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

  const { data: connectedPlatforms = [] } = useQuery({
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

  // ── Alert banners ─────────────────────────────────────────────────────

  useEffect(() => {
    const newAlerts = [];

    if (autopsyEvents.length > 0) {
      newAlerts.push({
        id: "autopsy",
        type: "error",
        title: `${autopsyEvents.length} Revenue ${autopsyEvents.length > 1 ? "Anomalies" : "Anomaly"} Detected`,
        description:
          "Critical events require your decision. Review now to understand impact.",
        dismissible: false,
      });
    }

    const failedSyncs = connectedPlatforms.filter(
      (p) => p.sync_status === "error"
    );
    if (failedSyncs.length > 0) {
      newAlerts.push({
        id: "sync",
        type: "sync",
        title: `${failedSyncs.length} Platform${failedSyncs.length > 1 ? "s" : ""} Failed to Sync`,
        description: "Go to Connected Platforms to reconnect.",
        dismissible: true,
      });
    }

    setAlerts(newAlerts);
  }, [autopsyEvents, connectedPlatforms]);

  // ── Computed metrics ──────────────────────────────────────────────────

  const metrics = useDashboardMetrics(transactions, reconciliations);

  // ── Stale platforms for action items ──────────────────────────────────

  const stalePlatforms = connectedPlatforms
    .filter((p) => p.sync_status === "error")
    .map(
      (p) =>
        PLATFORM_LABELS[(p.platform_name || p.platform || "").toLowerCase()] ||
        p.platform_name ||
        p.platform
    );

  // ── Concentration risk badge ──────────────────────────────────────────

  const riskBadge = metrics.concentrationRisk
    ? {
      high: { text: "High risk", variant: "danger" },
      moderate: { text: "Moderate", variant: "warning" },
      diversified: { text: "Diversified", variant: "success" },
    }[metrics.concentrationRisk.level]
    : null;

  // ── Greeting ──────────────────────────────────────────────────────────

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const firstName = user?.full_name?.split(" ")[0] || "there";

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-semibold text-[var(--z-text-1)] tracking-tight leading-tight">
            {greeting}, {firstName}
          </h1>
          <p className="text-[var(--z-text-3)] mt-1 text-sm">
            Your earnings at a glance
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          disabled={isLoading}
          className="rounded-lg bg-[var(--z-bg-3)] border border-[var(--z-border-1)] text-[var(--z-text-2)] hover:bg-[var(--z-bg-3)] hover:border-[var(--z-border-2)] hover:text-[var(--z-text-1)] transition-all text-sm h-9 px-4"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Alert Banners */}
      <AlertBanner
        alerts={alerts}
        onDismiss={(id) => setAlerts(alerts.filter((a) => a.id !== id))}
      />

      {/* No Platforms Connected CTA */}
      {connectedPlatforms.length === 0 && (
        <div className="mb-6">
          <div
            onClick={() => navigate("/ConnectedPlatforms")}
            className="group cursor-pointer rounded-xl p-4 border border-[var(--z-border-1)] bg-[var(--z-bg-2)] hover:border-[#32B8C6]/30 transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#32B8C6]/10 border border-[#32B8C6]/20 flex items-center justify-center flex-shrink-0">
                <Link2 className="w-4 h-4 text-[#32B8C6]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--z-text-2)] group-hover:text-[var(--z-text-1)] transition-colors">
                  No platforms connected.{" "}
                  <span className="text-[#32B8C6] font-medium">
                    Connect now
                  </span>{" "}
                  to start tracking your revenue.
                </p>
              </div>
              <div className="text-[var(--z-text-3)] group-hover:text-[#32B8C6] transition-colors">
                →
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Card 1: Total Revenue This Month */}
        <SummaryCard
          icon={DollarSign}
          iconColor="text-[#32B8C6]"
          label="Total Revenue This Month"
          value={`$${metrics.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          trend={metrics.revenueTrend}
          trendValue={metrics.revenueChange}
          subtitle={
            metrics.activePlatformCount > 0
              ? `Across ${metrics.activePlatformCount} platform${metrics.activePlatformCount > 1 ? "s" : ""}`
              : null
          }
          microcopy="Based on synced transactions"
        />

        {/* Card 2: Reconciled vs Unreconciled */}
        <SummaryCard
          icon={DollarSign}
          iconColor="text-emerald-400"
          label="Reconciled Revenue"
          value={`$${metrics.reconciledAmount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          secondaryValue={
            metrics.unreconciledAmount > 0
              ? `$${metrics.unreconciledAmount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} pending`
              : null
          }
          subtitle={
            metrics.unreconciledCount > 0
              ? `${metrics.unreconciledCount} transaction${metrics.unreconciledCount > 1 ? "s" : ""} need review`
              : "All transactions matched"
          }
          microcopy="Bank deposits matched"
        />

        {/* Card 3: Revenue Concentration Risk */}
        <SummaryCard
          icon={ShieldAlert}
          iconColor={
            metrics.concentrationRisk?.level === "high"
              ? "text-[#FF5459]"
              : metrics.concentrationRisk?.level === "moderate"
                ? "text-[#E68161]"
                : "text-emerald-400"
          }
          label="Revenue Concentration"
          value={
            metrics.concentrationRisk
              ? `${metrics.concentrationRisk.percentage.toFixed(0)}% from ${PLATFORM_LABELS[metrics.concentrationRisk.platform] || metrics.concentrationRisk.platform}`
              : "—"
          }
          isMonospace={false}
          badge={riskBadge}
          subtitle={
            metrics.concentrationRisk?.level === "diversified"
              ? "Well diversified income"
              : "Diversify to reduce platform dependency"
          }
          microcopy="Based on last 90 days"
        />

        {/* Card 4: Next Payout Date */}
        <SummaryCard
          icon={CalendarClock}
          iconColor="text-[#32B8C6]"
          label="Next Expected Payout"
          value="—"
          isMonospace={false}
          subtitle={
            connectedPlatforms.length > 0
              ? "Payout prediction coming soon"
              : "Connect platforms for payout estimates"
          }
          microcopy="Based on platform payout schedules"
        />
      </div>

      {/* Platform Revenue Table */}
      <div className="mb-8">
        <PlatformRevenueTable
          platformData={metrics.platformData}
          connectedPlatforms={connectedPlatforms}
        />
      </div>

      {/* Revenue Trend + Action Items Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueTrendChart transactions={transactions} />
        </div>
        <div>
          <ActionItemsPanel
            unreconciledCount={metrics.unreconciledCount}
            stalePlatforms={stalePlatforms}
            autopsyEventCount={autopsyEvents.length}
            hasTaxExport={false}
          />
        </div>
      </div>
    </div>
  );
}