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
  AlertTriangle,
  ArrowRight,
  Database,
  RefreshCw,
  ShieldCheck,
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

const PLATFORM_FEE_RATES = {
  youtube: 0.45,
  patreon: 0.08,
  stripe: 0.029,
  gumroad: 0.1,
  instagram: 0.05,
  tiktok: 0.5,
  shopify: 0.02,
  substack: 0.1,
};

const PERIODS = [
  { value: "mtd", label: "Month to date" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatMoney(value) {
  return money.format(value || 0);
}

function calcFee(transaction) {
  const explicitFee = Number(transaction.platform_fee || 0);
  if (explicitFee > 0) return explicitFee;
  const rate = PLATFORM_FEE_RATES[(transaction.platform || "").toLowerCase()] || 0;
  return (transaction.amount || 0) * rate;
}

function getRange(period) {
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
}

function DashboardMetric({ label, value, subtext, tone = "neutral" }) {
  const toneClass =
    tone === "teal"
      ? "text-[#56C5D0]"
      : tone === "orange"
        ? "text-[#F0A562]"
        : tone === "red"
          ? "text-[#F06C6C]"
          : "text-[#F5F5F5]";

  return (
    <div className="rounded-xl border border-white/10 bg-[#111114] p-4 transition-colors hover:border-white/20">
      <p className="text-xs uppercase tracking-wide text-white/60">{label}</p>
      <p className={`mt-2 font-mono-financial text-2xl font-semibold ${toneClass}`}>{value}</p>
      <p className="mt-1 text-xs text-white/60">{subtext}</p>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [period, setPeriod] = useState("mtd");
  const [panelView, setPanelView] = useState("overview");

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
    const revenueDelta =
      comparisonGross > 0 ? ((grossRevenue - comparisonGross) / comparisonGross) * 100 : 0;

    const periodExpenses = expenses
      .filter((expense) => {
        const date = new Date(expense.expense_date);
        return date >= range.start && date <= range.end;
      })
      .reduce((sum, expense) => sum + (expense.amount || 0), 0);

    const operatingMargin = netRevenue - periodExpenses;

    const byPlatformMap = new Map();
    for (const tx of inRange) {
      const key = (tx.platform || "unknown").toLowerCase();
      const existing = byPlatformMap.get(key) || {
        key,
        label: PLATFORM_LABELS[key] || key,
        gross: 0,
        fee: 0,
        rows: 0,
        withReportedFee: 0,
      };
      existing.gross += tx.amount || 0;
      existing.fee += calcFee(tx);
      existing.rows += 1;
      if ((tx.platform_fee || 0) > 0) existing.withReportedFee += 1;
      byPlatformMap.set(key, existing);
    }

    const platformRows = [...byPlatformMap.values()]
      .map((row) => ({
        ...row,
        net: row.gross - row.fee,
        share: grossRevenue > 0 ? (row.gross / grossRevenue) * 100 : 0,
        feeSource:
          row.rows > 0 && row.withReportedFee === row.rows
            ? "Reported"
            : "Estimated where missing",
      }))
      .sort((a, b) => b.gross - a.gross);

    const latestTransactions = inRange
      .slice()
      .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
      .slice(0, 8)
      .map((tx) => ({
        id: tx.id,
        date: tx.transaction_date,
        description: tx.description || "Untitled transaction",
        platform:
          PLATFORM_LABELS[(tx.platform || "").toLowerCase()] || tx.platform || "Unknown",
        gross: tx.amount || 0,
        fee: calcFee(tx),
      }));

    return {
      range,
      grossRevenue,
      netRevenue,
      estimatedFees,
      revenueDelta,
      periodExpenses,
      operatingMargin,
      platformRows,
      latestTransactions,
      transactionCount: inRange.length,
    };
  }, [period, transactions, expenses]);

  const dataCompleteness = useMemo(() => {
    const allDates = transactions
      .map((tx) => new Date(tx.transaction_date))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((left, right) => left.getTime() - right.getTime());

    const firstDate = allDates[0] || null;
    const daysHistory = firstDate
      ? Math.max(0, differenceInCalendarDays(new Date(), firstDate) + 1)
      : 0;

    const lastSyncDates = connectedPlatforms
      .map((platform) => platform.last_synced_at || platform.updated_at)
      .filter(Boolean)
      .map((dateString) => new Date(dateString))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((left, right) => right.getTime() - left.getTime());

    const errorPlatforms = connectedPlatforms.filter(
      (platform) => platform.sync_status === "error"
    );

    return {
      daysHistory,
      platformCount: connectedPlatforms.length,
      lastSync: lastSyncDates[0] || null,
      errorPlatforms,
    };
  }, [transactions, connectedPlatforms]);

  const isLoading = txLoading || platformsLoading;

  return (
    <div className="mx-auto w-full max-w-[1400px] rounded-2xl border border-white/10 bg-[#0A0A0A] p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-6 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#F5F5F5]">Dashboard</h1>
          <p className="mt-1 text-sm text-white/70">
            Serious finance view with interactive controls for faster daily decisions.
          </p>
          <p className="mt-2 text-xs text-white/60">
            Last sync:{" "}
            {dataCompleteness.lastSync
              ? format(dataCompleteness.lastSync, "MMM d, yyyy h:mm a")
              : "No sync data"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {PERIODS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setPeriod(item.value)}
              className={`h-9 rounded-md border px-3 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#56C5D0] ${
                period === item.value
                  ? "border-[#56C5D0]/45 bg-[#56C5D0]/10 text-[#56C5D0]"
                  : "border-white/20 bg-transparent text-white/75 hover:bg-white/10"
              }`}
            >
              {item.label}
            </button>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              refetchTransactions();
              refetchPlatforms();
            }}
            disabled={isFetching}
            className="h-9 border-white/20 bg-transparent text-[#F5F5F5] hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#56C5D0]"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </header>

      <section className="mb-6 rounded-lg border border-[#56C5D0]/30 bg-[#56C5D0]/10 p-4">
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 text-[#56C5D0]" />
          <div>
            <p className="text-sm font-medium text-[#F5F5F5]">Interactive but audit-safe</p>
            <p className="mt-1 text-xs text-white/75">
              Missing platform fees are estimated from published defaults and labeled in the evidence table.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardMetric
          label="Gross revenue"
          value={formatMoney(computed.grossRevenue)}
          subtext={`${computed.transactionCount} transactions in selected period`}
        />
        <DashboardMetric
          label="Net revenue"
          value={formatMoney(computed.netRevenue)}
          subtext={`Estimated fees: ${formatMoney(computed.estimatedFees)}`}
          tone="teal"
        />
        <DashboardMetric
          label="Operating margin"
          value={formatMoney(computed.operatingMargin)}
          subtext={`Expenses in period: ${formatMoney(computed.periodExpenses)}`}
          tone={computed.operatingMargin < 0 ? "red" : "neutral"}
        />
        <DashboardMetric
          label="Period change"
          value={`${computed.revenueDelta >= 0 ? "+" : ""}${computed.revenueDelta.toFixed(1)}%`}
          subtext="Versus previous equivalent period"
          tone={computed.revenueDelta >= 0 ? "teal" : "orange"}
        />
      </section>

      <section className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setPanelView("overview")}
          className={`h-8 rounded-md border px-3 text-sm transition ${
            panelView === "overview"
              ? "border-[#56C5D0]/45 bg-[#56C5D0]/10 text-[#56C5D0]"
              : "border-white/20 bg-transparent text-white/70 hover:bg-white/10"
          }`}
        >
          Financial overview
        </button>
        <button
          type="button"
          onClick={() => setPanelView("operations")}
          className={`h-8 rounded-md border px-3 text-sm transition ${
            panelView === "operations"
              ? "border-[#56C5D0]/45 bg-[#56C5D0]/10 text-[#56C5D0]"
              : "border-white/20 bg-transparent text-white/70 hover:bg-white/10"
          }`}
        >
          Operations queue
        </button>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="rounded-xl border border-white/10 bg-[#111114] xl:col-span-8">
          <div className="border-b border-white/10 p-4">
            <h2 className="text-lg font-semibold text-[#F5F5F5]">Revenue by platform</h2>
            <p className="mt-1 text-sm text-white/70">
              Period: {format(computed.range.start, "MMM d, yyyy")} to {format(computed.range.end, "MMM d, yyyy")}
            </p>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-[#D8D8D8]">Platform</TableHead>
                <TableHead className="text-right text-[#D8D8D8]">Gross</TableHead>
                <TableHead className="text-right text-[#D8D8D8]">Fee</TableHead>
                <TableHead className="text-right text-[#D8D8D8]">Net</TableHead>
                <TableHead className="text-right text-[#D8D8D8]">Share</TableHead>
                <TableHead className="text-right text-[#D8D8D8]">Fee source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {computed.platformRows.length === 0 && (
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-white/60">
                    {isLoading ? "Loading platform metrics..." : "No revenue rows in selected period."}
                  </TableCell>
                </TableRow>
              )}
              {computed.platformRows.map((row) => (
                <TableRow key={row.key} className="border-white/10 hover:bg-white/[0.02]">
                  <TableCell className="font-medium text-[#F5F5F5]">{row.label}</TableCell>
                  <TableCell className="text-right font-mono-financial text-[#F5F5F5]">
                    {formatMoney(row.gross)}
                  </TableCell>
                  <TableCell className="text-right font-mono-financial text-[#F0A562]">
                    {formatMoney(row.fee)}
                  </TableCell>
                  <TableCell className="text-right font-mono-financial text-[#56C5D0]">
                    {formatMoney(row.net)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="ml-auto w-28">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-mono-financial text-white/80">{row.share.toFixed(1)}%</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-[#56C5D0] transition-all"
                          style={{ width: `${Math.min(100, Math.max(0, row.share))}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm text-white/60">{row.feeSource}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-6 xl:col-span-4">
          {panelView === "overview" ? (
            <div className="rounded-xl border border-white/10 bg-[#111114] p-4">
              <h2 className="text-lg font-semibold text-[#F5F5F5]">Data completeness</h2>
              <p className="mt-1 text-sm text-white/70">Interactive health snapshot for this account.</p>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-white/70">Platforms connected</span>
                  <span className="font-mono-financial text-[#F5F5F5]">{dataCompleteness.platformCount}</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-white/70">Days of history</span>
                  <span className="font-mono-financial text-[#F5F5F5]">{dataCompleteness.daysHistory}</span>
                </div>
                <div className="flex items-center justify-between pb-1">
                  <span className="text-white/70">Open issues</span>
                  <span className="font-mono-financial text-[#F5F5F5]">
                    {pendingAutopsyEvents.length + dataCompleteness.errorPlatforms.length}
                  </span>
                </div>
              </div>

              <div className="mt-4 h-2 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#56C5D0] transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        (Math.min(dataCompleteness.daysHistory / 365, 1) * 50) +
                          (Math.min(dataCompleteness.platformCount / 5, 1) * 50)
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-[#111114] p-4">
              <h2 className="text-lg font-semibold text-[#F5F5F5]">Action queue</h2>
              <p className="mt-1 text-sm text-white/70">Quick actions for today.</p>
              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  onClick={() => navigate("/RevenueAutopsy")}
                  className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-[#15151A] px-3 py-2 text-left hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#56C5D0]"
                >
                  <div>
                    <p className="text-sm font-medium text-[#F5F5F5]">Review anomalies</p>
                    <p className="text-xs text-white/65">{pendingAutopsyEvents.length} pending decisions</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-white/50" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/ConnectedPlatforms")}
                  className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-[#15151A] px-3 py-2 text-left hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#56C5D0]"
                >
                  <div>
                    <p className="text-sm font-medium text-[#F5F5F5]">Resolve sync errors</p>
                    <p className="text-xs text-white/65">{dataCompleteness.errorPlatforms.length} connections in error</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-white/50" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/TaxEstimator")}
                  className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-[#15151A] px-3 py-2 text-left hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#56C5D0]"
                >
                  <div>
                    <p className="text-sm font-medium text-[#F5F5F5]">Recalculate tax set-aside</p>
                    <p className="text-xs text-white/65">Update estimates with current period numbers</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-white/50" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <section className="mt-6 rounded-xl border border-white/10 bg-[#111114]">
        <div className="border-b border-white/10 p-4">
          <h2 className="text-lg font-semibold text-[#F5F5F5]">Recent transactions in selected period</h2>
          <p className="mt-1 text-sm text-white/70">Interactive view updates automatically with the period chips above.</p>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-[#D8D8D8]">Date</TableHead>
              <TableHead className="text-[#D8D8D8]">Description</TableHead>
              <TableHead className="text-[#D8D8D8]">Platform</TableHead>
              <TableHead className="text-right text-[#D8D8D8]">Gross</TableHead>
              <TableHead className="text-right text-[#D8D8D8]">Fee</TableHead>
              <TableHead className="text-right text-[#D8D8D8]">Net</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {computed.latestTransactions.length === 0 && (
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableCell colSpan={6} className="py-8 text-center text-sm text-white/60">
                  No transaction activity for selected period.
                </TableCell>
              </TableRow>
            )}
            {computed.latestTransactions.map((tx) => (
              <TableRow key={tx.id} className="border-white/10 hover:bg-white/[0.02]">
                <TableCell className="text-sm text-white/75">
                  {format(new Date(tx.date), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="max-w-[380px] truncate text-sm text-[#F5F5F5]">
                  {tx.description}
                </TableCell>
                <TableCell className="text-sm text-white/75">{tx.platform}</TableCell>
                <TableCell className="text-right font-mono-financial text-[#F5F5F5]">
                  {formatMoney(tx.gross)}
                </TableCell>
                <TableCell className="text-right font-mono-financial text-[#F0A562]">
                  {formatMoney(tx.fee)}
                </TableCell>
                <TableCell className="text-right font-mono-financial text-[#56C5D0]">
                  {formatMoney(tx.gross - tx.fee)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {(pendingAutopsyEvents.length > 0 || dataCompleteness.errorPlatforms.length > 0) && (
        <section className="mt-6 rounded-lg border border-[#F0A562]/35 bg-[#F0A562]/10 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-[#F0A562]" />
            <div className="text-sm text-white/85">
              <p className="font-medium text-[#F5F5F5]">Follow-up needed</p>
              <p className="mt-1">
                {pendingAutopsyEvents.length} anomaly items and {dataCompleteness.errorPlatforms.length} sync issues are open.
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="mt-6 rounded-lg border border-white/10 bg-[#111114] p-4">
        <div className="flex items-start gap-2">
          <Database className="mt-0.5 h-4 w-4 text-white/65" />
          <p className="text-sm text-white/75">
            Data source: Revenue transactions, expense records, connected platform sync logs, and anomaly queue.
          </p>
        </div>
      </section>
    </div>
  );
}
