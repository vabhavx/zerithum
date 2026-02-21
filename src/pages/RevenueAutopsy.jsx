import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Repeat2,
  BadgePercent,
  Clock,
  ShieldAlert,
  Info,
  Download,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import RiskMeter from "@/components/autopsy/RiskMeter";
import EvidenceTable from "@/components/autopsy/EvidenceTable";
import AnomalyList from "@/components/autopsy/AnomalyList";
import MethodologyDisclosure from "@/components/autopsy/MethodologyDisclosure";
import { cn } from "@/lib/utils";

// ─── Toggle for demonstrating empty state ─────────────────────────────────────
const FORCE_EMPTY_STATE = false;
const SEEDED_DAYS = 7; // Days of data when empty state is active

// ─── Seeded realistic data ────────────────────────────────────────────────────
const LAST_SYNC_AT = new Date("2026-02-21T06:43:00Z");
const COMPUTED_AT = new Date("2026-02-21T06:45:12Z");

const EXECUTIVE_METRICS = {
  revenueMTD: 14820.5,
  threeMonthAvg: 13241.0,
  volatilityIndex: 22.4,
  topPlatformShare: 67.3,
  refundRate: 3.1,
  feeRate: 8.7,
};

const PLATFORM_CONCENTRATION_ROWS = [
  { platform: "Gumroad", revenue: 9974.0, share: 67.3, transactions: 312, avgFee: 8.5 },
  { platform: "Stripe", revenue: 3201.5, share: 21.6, transactions: 89, avgFee: 2.9 },
  { platform: "Lemon Squeezy", revenue: 1192.0, share: 8.0, transactions: 41, avgFee: 6.5 },
  { platform: "Paddle", revenue: 453.0, share: 3.1, transactions: 14, avgFee: 10.1 },
];

const PRODUCT_CONCENTRATION_ROWS = [
  { product: "Creator OS Pro", revenue: 8430.0, share: 56.9, type: "One-time" },
  { product: "Analytics Toolkit (sub)", revenue: 3680.0, share: 24.8, type: "Recurring" },
  { product: "Notion Templates Bundle", revenue: 1720.5, share: 11.6, type: "One-time" },
  { product: "Monthly Coaching (sub)", revenue: 990.0, share: 6.7, type: "Recurring" },
];

const MONTHLY_CHART_DATA = [
  { month: "Aug", revenue: 9870 },
  { month: "Sep", revenue: 11230 },
  { month: "Oct", revenue: 13100 },
  { month: "Nov", revenue: 12580 },
  { month: "Dec", revenue: 14410 },
  { month: "Jan", revenue: 13990 },
  { month: "Feb", revenue: 14821 },
];

const ANOMALIES = [
  {
    id: 1,
    type: "spike",
    severity: "medium",
    detected_at: "2026-02-15T00:00:00Z",
    detection_rule: "z-score > 2.5",
    evidence_summary:
      "Feb 15 Gumroad revenue was $1,847 — 2.8x the 30-day daily average of $661. No corresponding marketing campaign detected.",
    evidence_detail: `Detection algorithm:
  daily_z_score = (day_revenue - 30d_mean) / 30d_std

Inputs:
  day_revenue   = $1,847.00
  30d_mean      = $660.87
  30d_std       = $420.34
  z_score       = 2.82  (threshold: 2.5)

Context:
  No UTM campaign traffic detected on Feb 15.
  Gumroad affiliate referral IDs: none flagged.
  Nearest content publish date: Feb 12 (YouTube video).`,
    suggested_action:
      "Verify whether the Feb 12 video drove delayed purchases. Tag the event as 'organic spike' or 'unattributed' in your records.",
    impact: "+$1,186 above baseline",
  },
  {
    id: 2,
    type: "drop",
    severity: "high",
    detected_at: "2026-01-27T00:00:00Z",
    detection_rule: "7d-avg drop > 30%",
    evidence_summary:
      "Week of Jan 20-27 average daily revenue dropped to $391 from prior 4-week average of $619 — a 36.8% decline.",
    evidence_detail: `Detection algorithm:
  rolling_7d_avg vs prior_28d_avg

Inputs:
  rolling_7d_avg   = $391.14
  prior_28d_avg    = $619.07
  drop_pct         = 36.8%  (threshold: 30%)

Platform breakdown:
  Gumroad:       $248/day  (was $412/day)
  Stripe:        $89/day   (was $141/day)
  Lemon Squeezy: $54/day   (was $66/day)

Note: Gumroad experienced a reported checkout outage Jan 22-23.`,
    suggested_action:
      "Cross-reference with Gumroad status page for Jan 22-23 outage. Consider filing a support inquiry if checkout abandonment logs are available.",
    impact: "-$1,596 vs baseline (7 days)",
  },
  {
    id: 3,
    type: "missing_sync",
    severity: "critical",
    detected_at: "2026-02-18T00:00:00Z",
    detection_rule: "sync_gap > 48h",
    evidence_summary:
      "Lemon Squeezy last synced 72 hours ago. Revenue data for Feb 16-18 is missing and excluded from all calculations.",
    evidence_detail: `Detection algorithm:
  sync_gap = now() - last_successful_sync

Inputs:
  last_sync_at = 2026-02-15 08:22 UTC
  now          = 2026-02-18 08:44 UTC
  gap_hours    = 72.4h  (threshold: 48h)

Affected metrics:
  - Revenue MTD (undercount by est. $320-$480)
  - Platform concentration (Lemon Squeezy share artificially low)
  - Refund rate (Lemon Squeezy refunds not yet fetched)

Last known Lemon Squeezy daily avg: $47.30`,
    suggested_action:
      "Re-authenticate your Lemon Squeezy API connection in Platform Settings. All affected metrics are flagged with a warning until sync is restored.",
    impact: "Est. $320-$480 undercounted",
  },
  {
    id: 4,
    type: "fee_jump",
    severity: "medium",
    detected_at: "2026-02-10T00:00:00Z",
    detection_rule: "fee_rate delta > 1.5pp",
    evidence_summary:
      "Paddle effective fee rate jumped from 7.1% (Jan avg) to 10.1% (Feb 1-10), a 3.0 percentage-point increase with no tariff notice on file.",
    evidence_detail: `Detection algorithm:
  monthly_fee_rate = total_fees / gross_revenue
  delta = current_rate - prior_month_rate

Inputs (Paddle):
  Jan fee rate:  7.1%  (fees: $28.40, revenue: $400.00)
  Feb fee rate: 10.1%  (fees: $45.76, revenue: $452.50)
  delta:         3.0pp  (threshold: 1.5pp)

Possible causes:
  1. Volume bracket change (Paddle scales fees by GMV tier)
  2. Currency conversion surcharge applied
  3. New tax passthrough (VAT region change)
  4. Data error — manual review recommended`,
    suggested_action:
      "Download the Paddle transaction CSV for Feb and compare line-item fee categories. Contact Paddle support if no bracket change applies.",
    impact: "+$17.36 excess fees (10 days)",
  },
];

const METHODOLOGY_FORMULAS = [
  {
    metric: "Revenue MTD",
    formula: `Revenue MTD =
  SUM(transaction.amount)
  WHERE transaction.date >= first_day_of_current_month
    AND transaction.status IN ('completed', 'paid')
    AND platform.sync_status = 'current'

Source: All connected platforms. Amounts in USD
(converted at day-of-transaction exchange rate).`,
    notes:
      "Platforms with a sync gap > 48h are excluded and flagged. Refunds are netted against gross revenue on the refund date.",
  },
  {
    metric: "3-Month Average",
    formula: `3M_avg =
  SUM(monthly_revenue for last 3 complete months) / 3

Where monthly_revenue =
  SUM(gross) - SUM(refunds)
  for all complete calendar months preceding
  the current one.`,
    notes:
      "Partial current month is excluded. If fewer than 3 complete months of data exist, this metric shows N/A.",
  },
  {
    metric: "Volatility Index",
    formula: `Volatility Index =
  (std_dev_daily_revenue / mean_daily_revenue) * 100

std_dev = SQRT(SUM((x - mean)^2) / (n - 1))
mean    = SUM(daily_revenue) / n
n       = days with >= 1 transaction in trailing 90d`,
    notes:
      "Below 20 = stable, 20-40 = moderate, above 40 = volatile. Zero-revenue days are included in the denominator.",
  },
  {
    metric: "Top Platform Share",
    formula: `Top Platform Share =
  MAX(platform_revenue) /
  SUM(all_platform_revenue) * 100

Calculated over the trailing 30 days.
Excludes platforms with sync gap > 48h.`,
    notes:
      "Concentration above 70% on a single platform represents high dependency risk.",
  },
  {
    metric: "Refund Rate",
    formula: `Refund Rate =
  SUM(refunded_amount) /
  SUM(gross_revenue_in_same_period) * 100

Period: trailing 90 days.
Refunds matched to original transaction platform.`,
    notes:
      "Includes full and partial refunds. Chargebacks counted separately. Above 5% typically triggers increased Stripe scrutiny.",
  },
  {
    metric: "Effective Fee Rate",
    formula: `Fee Rate =
  SUM(platform_fees) /
  SUM(gross_revenue) * 100

platform_fees =
  transaction_fee
  + payout_fee
  + currency_conversion_fee

Period: trailing 30 days. All platforms blended.`,
    notes:
      "Each platform reports fees differently. We aggregate all fee line items per transaction before dividing.",
  },
];

// ─── Small helpers ────────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold tracking-tight" style={{ color: "var(--z-text-1)" }}>
        {title}
      </h2>
      {subtitle && (
        <p className="mt-0.5 text-sm" style={{ color: "var(--z-text-3)" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function Divider() {
  return <div className="my-8 border-t" style={{ borderColor: "var(--z-border-1)" }} />;
}

function MetricCard({ label, value, subvalue, definition, delta, deltaLabel, icon: Icon, provenance }) {
  const [showDef, setShowDef] = useState(false);
  const isPositiveDelta = delta > 0;
  const deltaColor = delta === 0 ? "var(--z-text-3)" : isPositiveDelta ? "#4ade80" : "#FF5459";

  return (
    <div
      className="rounded-lg border p-4 flex flex-col gap-2 transition-colors"
      style={{ background: "var(--z-bg-2)", borderColor: "var(--z-border-1)" }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--z-text-3)" }}>
            {label}
          </span>
          {definition && (
            <div className="relative">
              <button
                className="rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#32B8C6]"
                onMouseEnter={() => setShowDef(true)}
                onMouseLeave={() => setShowDef(false)}
                onFocus={() => setShowDef(true)}
                onBlur={() => setShowDef(false)}
                aria-label={"Definition for " + label}
              >
                <Info className="w-3 h-3" style={{ color: "var(--z-text-3)" }} />
              </button>
              {showDef && (
                <div
                  className="absolute z-50 top-5 left-0 w-60 rounded-lg border p-3 text-xs shadow-xl"
                  style={{
                    background: "var(--z-bg-3)",
                    borderColor: "var(--z-border-2)",
                    color: "var(--z-text-2)",
                    lineHeight: 1.5,
                  }}
                  role="tooltip"
                >
                  {definition}
                </div>
              )}
            </div>
          )}
        </div>
        {Icon && (
          <div
            className="w-7 h-7 rounded flex items-center justify-center"
            style={{ background: "var(--z-bg-3)" }}
            aria-hidden="true"
          >
            <Icon className="w-3.5 h-3.5" style={{ color: "#32B8C6" }} />
          </div>
        )}
      </div>

      <div>
        <p className="text-2xl font-semibold font-mono-financial tabular-nums" style={{ color: "var(--z-text-1)" }}>
          {value}
        </p>
        {subvalue && (
          <p className="text-xs mt-0.5" style={{ color: "var(--z-text-3)" }}>
            {subvalue}
          </p>
        )}
      </div>

      {delta !== undefined && (
        <div className="flex items-center gap-1 text-xs font-mono-financial">
          {isPositiveDelta ? (
            <TrendingUp className="w-3 h-3" style={{ color: deltaColor }} />
          ) : (
            <TrendingDown className="w-3 h-3" style={{ color: deltaColor }} />
          )}
          <span style={{ color: deltaColor }}>
            {isPositiveDelta ? "+" : ""}{delta.toFixed(1)}%
          </span>
          {deltaLabel && (
            <span style={{ color: "var(--z-text-3)" }}> {deltaLabel}</span>
          )}
        </div>
      )}

      {provenance && (
        <p
          className="text-[10px] mt-auto pt-1.5 border-t"
          style={{ color: "var(--z-text-3)", borderColor: "var(--z-border-1)" }}
        >
          Source: {provenance}
        </p>
      )}
    </div>
  );
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-xl"
      style={{
        background: "var(--z-bg-3)",
        borderColor: "var(--z-border-2)",
        color: "var(--z-text-1)",
      }}
    >
      <p className="font-semibold mb-1">{label}</p>
      <p className="font-mono-financial tabular-nums">
        ${payload[0].value.toLocaleString()}
      </p>
    </div>
  );
};

// ─── Empty state ─────────────────────────────────────────────────────────────
function EmptyState({ daysOfData, required }) {
  const pct = Math.min(100, Math.round((daysOfData / required) * 100));

  const requirements = [
    { label: "At least 1 platform connected", met: true },
    { label: "30 days of transaction history", met: daysOfData >= required },
    { label: "Payout records from connected platforms", met: daysOfData >= 14 },
    { label: "Refund data (requires 7+ days of history)", met: daysOfData >= 7 },
  ];

  return (
    <div className="max-w-xl mx-auto mt-16 px-4 text-center">
      <div
        className="w-14 h-14 rounded-xl border flex items-center justify-center mx-auto mb-5"
        style={{ background: "var(--z-bg-2)", borderColor: "var(--z-border-1)" }}
        aria-hidden="true"
      >
        <ShieldAlert className="w-6 h-6" style={{ color: "#32B8C6" }} />
      </div>
      <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--z-text-1)" }}>
        Insufficient history for analysis
      </h2>
      <p className="text-sm mb-6" style={{ color: "var(--z-text-3)" }}>
        Revenue Autopsy requires at least 30 days of synced transaction data to produce defensible metrics.
      </p>

      <div
        className="rounded-lg border p-5 text-left mb-6"
        style={{ background: "var(--z-bg-2)", borderColor: "var(--z-border-1)" }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium" style={{ color: "var(--z-text-2)" }}>Data Readiness</span>
          <span className="text-sm font-mono-financial font-semibold" style={{ color: "var(--z-text-1)" }}>
            {daysOfData} of {required} days
          </span>
        </div>
        <div
          className="h-2.5 rounded-full overflow-hidden mb-1"
          style={{ background: "var(--z-bg-3)" }}
          role="progressbar"
          aria-valuenow={daysOfData}
          aria-valuemin={0}
          aria-valuemax={required}
          aria-label={daysOfData + " of " + required + " days of data collected"}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: pct + "%", background: "#32B8C6" }}
          />
        </div>
        <p className="text-[11px]" style={{ color: "var(--z-text-3)" }}>{pct}% complete</p>
      </div>

      <div
        className="rounded-lg border divide-y text-left"
        style={{ borderColor: "var(--z-border-1)" }}
      >
        {requirements.map((r, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3"
            style={{ borderColor: "var(--z-border-1)", background: "var(--z-bg-2)" }}
          >
            <span className="text-xs font-semibold" style={{ color: r.met ? "#4ade80" : "var(--z-text-3)" }}>
              {r.met ? "✓" : "○"}
            </span>
            <span className="text-sm" style={{ color: r.met ? "var(--z-text-1)" : "var(--z-text-3)" }}>
              {r.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function RevenueAutopsy() {
  const daysOfData = FORCE_EMPTY_STATE ? SEEDED_DAYS : 91;

  const topPlatformConcentration = EXECUTIVE_METRICS.topPlatformShare;
  const productTopShare = useMemo(
    () => Math.max(...PRODUCT_CONCENTRATION_ROWS.map((r) => r.share)),
    []
  );
  const recurringRevenue = useMemo(
    () => PRODUCT_CONCENTRATION_ROWS.filter((r) => r.type === "Recurring").reduce((s, r) => s + r.revenue, 0),
    []
  );
  const totalRevenue = useMemo(
    () => PRODUCT_CONCENTRATION_ROWS.reduce((s, r) => s + r.revenue, 0),
    []
  );
  const recurringShare = ((recurringRevenue / totalRevenue) * 100).toFixed(1);
  const mtdVs3m = (
    ((EXECUTIVE_METRICS.revenueMTD - EXECUTIVE_METRICS.threeMonthAvg) /
      EXECUTIVE_METRICS.threeMonthAvg) *
    100
  );

  if (daysOfData < 30) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-8">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 style={{ color: "var(--z-text-1)" }}>Revenue Autopsy</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--z-text-3)" }}>
              Forensic revenue analysis — composition, concentration, quality, anomalies
            </p>
          </div>
        </header>
        <EmptyState daysOfData={daysOfData} required={30} />
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8" id="revenue-autopsy-page">

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 style={{ color: "var(--z-text-1)" }}>Revenue Autopsy</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--z-text-3)" }}>
            Forensic analysis — composition, concentration, quality, anomalies
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border"
            style={{ background: "var(--z-bg-2)", borderColor: "var(--z-border-1)", color: "var(--z-text-3)" }}
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Last sync: {format(LAST_SYNC_AT, "MMM d 'at' HH:mm 'UTC'")}</span>
          </div>
          <button
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors hover:border-[#32B8C6] hover:text-[#32B8C6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#32B8C6]"
            style={{ background: "var(--z-bg-2)", borderColor: "var(--z-border-1)", color: "var(--z-text-2)" }}
            aria-label="Export Revenue Autopsy report as CSV"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            Export CSV
          </button>
        </div>
      </header>

      {/* ── Section 1: Executive Snapshot ───────────────────────────── */}
      <section aria-labelledby="exec-snapshot-label">
        <span id="exec-snapshot-label" aria-hidden="true" />
        <SectionHeader
          title="Executive Snapshot"
          subtitle="All figures: trailing 30 days unless stated. Refunds netted on refund date."
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <MetricCard
            label="Revenue MTD"
            value={"$" + EXECUTIVE_METRICS.revenueMTD.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            subvalue={"vs. 3M avg $" + EXECUTIVE_METRICS.threeMonthAvg.toLocaleString()}
            delta={mtdVs3m}
            deltaLabel="vs. 3M avg"
            icon={TrendingUp}
            definition="Sum of completed transaction amounts since the 1st of the current month, across all platforms with current sync status."
            provenance="All connected platforms · Current month only"
          />
          <MetricCard
            label="3-Month Average"
            value={"$" + EXECUTIVE_METRICS.threeMonthAvg.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            subvalue="Nov-Jan monthly average"
            icon={Repeat2}
            definition="Mean of the 3 most recently completed calendar months' net revenue (gross minus refunds), excluding the current partial month."
            provenance="3 complete months · All platforms"
          />
          <MetricCard
            label="Volatility Index"
            value={EXECUTIVE_METRICS.volatilityIndex + "%"}
            subvalue="Coeff. of variation · 90 days"
            icon={BadgePercent}
            definition="Coefficient of variation of daily revenue over the trailing 90 days (std dev / mean x 100). Below 20 = stable, 20-40 = moderate, above 40 = volatile."
            provenance="90-day daily transaction data"
          />
          <MetricCard
            label="Top Platform Share"
            value={EXECUTIVE_METRICS.topPlatformShare + "%"}
            subvalue="Gumroad · trailing 30 days"
            icon={ShieldAlert}
            definition="Percentage of total net revenue attributable to the single highest-revenue platform over the trailing 30 days."
            provenance="Platform-level revenue split · 30 days"
          />
          <MetricCard
            label="Refund Rate"
            value={EXECUTIVE_METRICS.refundRate + "%"}
            subvalue="of gross · 90-day window"
            icon={TrendingDown}
            definition="Total refunded amount divided by total gross revenue over the trailing 90 days."
            provenance="Refund records · All platforms · 90 days"
          />
          <MetricCard
            label="Effective Fee Rate"
            value={EXECUTIVE_METRICS.feeRate + "%"}
            subvalue="blended across platforms · 30 days"
            icon={BadgePercent}
            definition="Total platform fees (transaction + payout + currency conversion) divided by gross revenue, blended across all platforms."
            provenance="Fee line items · All platforms · 30 days"
          />
        </div>

        {/* Revenue trend bar chart */}
        <div
          className="rounded-lg border p-4 mt-3"
          style={{ background: "var(--z-bg-2)", borderColor: "var(--z-border-1)" }}
        >
          <p className="text-xs font-medium mb-3" style={{ color: "var(--z-text-3)" }}>
            Monthly revenue — Aug 2025 to Feb 2026 (teal = current partial month)
          </p>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={MONTHLY_CHART_DATA} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--z-border-1)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: "var(--z-text-3)", fontSize: 11 }}
                stroke="transparent"
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="revenue" radius={[3, 3, 0, 0]}>
                {MONTHLY_CHART_DATA.map((entry, index) => (
                  <Cell
                    key={"cell-" + index}
                    fill={index === MONTHLY_CHART_DATA.length - 1 ? "#32B8C6" : "var(--z-bg-3)"}
                    stroke={index === MONTHLY_CHART_DATA.length - 1 ? "#21808D" : "var(--z-border-1)"}
                    strokeWidth={1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <Divider />

      {/* ── Section 2: Concentration Risk ───────────────────────────── */}
      <section aria-labelledby="concentration-risk-label">
        <span id="concentration-risk-label" aria-hidden="true" />
        <SectionHeader
          title="Concentration Risk"
          subtitle="High dependency on a single platform or product increases fragility. Thresholds: Low < 40%, Medium 40-70%, High > 70%."
        />
        <div className="grid sm:grid-cols-2 gap-6 mb-5">
          <div
            className="rounded-lg border p-4"
            style={{ background: "var(--z-bg-2)", borderColor: "var(--z-border-1)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--z-text-3)" }}>
              By Platform
            </p>
            <RiskMeter
              value={topPlatformConcentration}
              label="Platform Concentration"
              sublabel="Gumroad holds 67.3% of total net revenue. A platform outage or policy change would immediately cut your income by more than half."
              definition="Share of total net revenue from the single highest-revenue platform. Calculated over the trailing 30 days."
            />
          </div>
          <div
            className="rounded-lg border p-4"
            style={{ background: "var(--z-bg-2)", borderColor: "var(--z-border-1)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--z-text-3)" }}>
              By Product Type
            </p>
            <RiskMeter
              value={productTopShare}
              label="Product Concentration"
              sublabel="Creator OS Pro accounts for 56.9% of revenue. It is a one-time purchase — any sales slowdown is not buffered by recurring income."
              definition="Share of total net revenue from the single highest-revenue product SKU over the trailing 30 days."
            />
          </div>
        </div>
        <EvidenceTable
          caption="Platform revenue breakdown — trailing 30 days"
          columns={[
            { key: "platform", label: "Platform" },
            {
              key: "revenue",
              label: "Net Revenue",
              numeric: true,
              render: (v) => "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2 }),
            },
            {
              key: "share",
              label: "Share %",
              numeric: true,
              render: (v) => (
                <span style={{ color: v > 60 ? "#FF5459" : v > 40 ? "#f59e0b" : "#4ade80", fontWeight: 600 }}>
                  {v.toFixed(1)}%
                </span>
              ),
            },
            { key: "transactions", label: "Transactions", numeric: true },
            {
              key: "avgFee",
              label: "Avg Fee %",
              numeric: true,
              render: (v) => v.toFixed(1) + "%",
            },
          ]}
          rows={PLATFORM_CONCENTRATION_ROWS}
        />
      </section>

      <Divider />

      {/* ── Section 3: Revenue Quality ───────────────────────────────── */}
      <section aria-labelledby="revenue-quality-label">
        <span id="revenue-quality-label" aria-hidden="true" />
        <SectionHeader
          title="Revenue Quality"
          subtitle="Not all revenue is equal. Recurring is more durable; one-time is more volatile. Refunds and delays erode net cash."
        />
        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          {/* Recurring vs one-time */}
          <div
            className="rounded-lg border p-4"
            style={{ background: "var(--z-bg-2)", borderColor: "var(--z-border-1)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Repeat2 className="w-4 h-4" style={{ color: "#32B8C6" }} aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--z-text-3)" }}>
                Recurring vs One-time
              </span>
            </div>
            <p className="text-2xl font-semibold font-mono-financial tabular-nums mb-1" style={{ color: "var(--z-text-1)" }}>
              {recurringShare}%
            </p>
            <p className="text-xs mb-3" style={{ color: "var(--z-text-3)" }}>
              recurring · ${recurringRevenue.toLocaleString()} of ${totalRevenue.toLocaleString()}
            </p>
            <div
              className="h-2 rounded-full overflow-hidden mb-3"
              style={{ background: "var(--z-bg-3)" }}
              role="img"
              aria-label={recurringShare + "% recurring revenue"}
            >
              <div className="h-full rounded-full" style={{ width: recurringShare + "%", background: "#32B8C6" }} />
            </div>
            <p className="text-[11px]" style={{ color: "var(--z-text-3)" }}>
              <strong style={{ color: "var(--z-text-2)" }}>Definition:</strong> Recurring = subscription products with monthly/annual billing. One-time = single-purchase products and bundles.
            </p>
            <p className="text-[11px] mt-1" style={{ color: "var(--z-text-3)" }}>
              <strong style={{ color: "var(--z-text-2)" }}>How calculated:</strong> Product type flag set at product creation, matched to transactions by product_id.
            </p>
          </div>

          {/* Refunds & Disputes */}
          <div
            className="rounded-lg border p-4"
            style={{
              background: "var(--z-bg-2)",
              borderColor: EXECUTIVE_METRICS.refundRate > 5 ? "rgba(255,84,89,0.4)" : "var(--z-border-1)",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown
                className="w-4 h-4"
                style={{ color: EXECUTIVE_METRICS.refundRate > 5 ? "#FF5459" : "#f59e0b" }}
                aria-hidden="true"
              />
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--z-text-3)" }}>
                Refunds & Disputes
              </span>
            </div>
            <p className="text-2xl font-semibold font-mono-financial tabular-nums mb-1" style={{ color: "var(--z-text-1)" }}>
              {EXECUTIVE_METRICS.refundRate}%
            </p>
            <p className="text-xs mb-3" style={{ color: "var(--z-text-3)" }}>refund rate · trailing 90 days</p>
            <div
              className="text-xs px-2.5 py-1.5 rounded border mb-3"
              style={{
                background: "rgba(245,158,11,0.08)",
                borderColor: "rgba(245,158,11,0.25)",
                color: "#f59e0b",
              }}
            >
              Watch — above 3% draws increased platform scrutiny
            </div>
            <p className="text-[11px]" style={{ color: "var(--z-text-3)" }}>
              <strong style={{ color: "var(--z-text-2)" }}>Definition:</strong> Refunds = customer-initiated returns. Disputes = chargebacks via card network.
            </p>
            <p className="text-[11px] mt-1" style={{ color: "var(--z-text-3)" }}>
              <strong style={{ color: "var(--z-text-2)" }}>How calculated:</strong> refunded_amount / gross_revenue x 100 over trailing 90 days.
            </p>
          </div>

          {/* Payout Delays */}
          <div
            className="rounded-lg border p-4"
            style={{ background: "var(--z-bg-2)", borderColor: "var(--z-border-1)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4" style={{ color: "#32B8C6" }} aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--z-text-3)" }}>
                Payout Delays
              </span>
            </div>
            <p className="text-2xl font-semibold font-mono-financial tabular-nums mb-1" style={{ color: "var(--z-text-1)" }}>
              4.2 days
            </p>
            <p className="text-xs mb-3" style={{ color: "var(--z-text-3)" }}>avg. sale-to-bank · 30 days</p>
            <div
              className="text-xs px-2.5 py-1.5 rounded border mb-3"
              style={{
                background: "rgba(74,222,128,0.08)",
                borderColor: "rgba(74,222,128,0.25)",
                color: "#4ade80",
              }}
            >
              Normal — Gumroad weekly, Stripe 2-day, Lemon Squeezy weekly
            </div>
            <p className="text-[11px]" style={{ color: "var(--z-text-3)" }}>
              <strong style={{ color: "var(--z-text-2)" }}>Definition:</strong> Average calendar days between transaction completion and cash arriving in your bank account.
            </p>
            <p className="text-[11px] mt-1" style={{ color: "var(--z-text-3)" }}>
              <strong style={{ color: "var(--z-text-2)" }}>How calculated:</strong> MEAN(payout_date - transaction_date) for all settled payouts in trailing 30 days.
            </p>
          </div>
        </div>

        <EvidenceTable
          caption="Product type breakdown — trailing 30 days"
          columns={[
            { key: "product", label: "Product" },
            { key: "type", label: "Type" },
            {
              key: "revenue",
              label: "Net Revenue",
              numeric: true,
              render: (v) => "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2 }),
            },
            {
              key: "share",
              label: "Share %",
              numeric: true,
              render: (v) => v.toFixed(1) + "%",
            },
          ]}
          rows={PRODUCT_CONCENTRATION_ROWS}
        />
      </section>

      <Divider />

      {/* ── Section 4: Anomalies & Flags ────────────────────────────── */}
      <section aria-labelledby="anomalies-label">
        <span id="anomalies-label" aria-hidden="true" />
        <div className="flex items-start justify-between mb-4 gap-3">
          <SectionHeader
            title="Anomalies & Flags"
            subtitle="Automatically detected deviations. Each flag shows the detection rule, evidence, and suggested action."
          />
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full border mt-0.5 flex-shrink-0"
            style={{
              background: "rgba(255,84,89,0.08)",
              borderColor: "rgba(255,84,89,0.3)",
              color: "#FF5459",
            }}
          >
            {ANOMALIES.filter((a) => a.severity === "critical" || a.severity === "high").length} high-priority
          </span>
        </div>
        <AnomalyList anomalies={ANOMALIES} />
      </section>

      <Divider />

      {/* ── Section 5: Methodology ──────────────────────────────────── */}
      <section aria-labelledby="methodology-label">
        <span id="methodology-label" aria-hidden="true" />
        <SectionHeader
          title="Methodology"
          subtitle="Every metric has a defensible formula. Expand to inspect inputs, edge cases, and data sources."
        />
        <MethodologyDisclosure formulas={METHODOLOGY_FORMULAS} computedAt={COMPUTED_AT} />
      </section>
    </main>
  );
}
