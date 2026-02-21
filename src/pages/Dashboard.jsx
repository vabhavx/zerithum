import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  differenceInCalendarDays,
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
    <div className="rounded-xl border border-white/10 bg-[#111114] p-4">
      <p className="text-xs uppercase tracking-wide text-white/60">{label}</p>
      <p className={`mt-2 font-mono-financial text-2xl font-semibold ${toneClass}`}>{value}</p>
      <p className="mt-1 text-xs text-white/60">{subtext}</p>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

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
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const prevStart = startOfMonth(subMonths(now, 1));
    const prevEnd = endOfMonth(subMonths(now, 1));

    const inMonth = transactions.filter((tx) => {
      const d = new Date(tx.transaction_date);
      return d >= monthStart && d <= monthEnd;
    });
    const inPrevMonth = transactions.filter((tx) => {
      const d = new Date(tx.transaction_date);
      return d >= prevStart && d <= prevEnd;
    });

    const grossRevenue = inMonth.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const estimatedFees = inMonth.reduce((sum, tx) => sum + calcFee(tx), 0);
    const netRevenue = grossRevenue - estimatedFees;

    const prevGrossRevenue = inPrevMonth.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const revenueDelta =
      prevGrossRevenue > 0 ? ((grossRevenue - prevGrossRevenue) / prevGrossRevenue) * 100 : 0;

    const monthExpenses = expenses
      .filter((expense) => {
        const d = new Date(expense.expense_date);
        return d >= monthStart && d <= monthEnd;
      })
      .reduce((sum, expense) => sum + (expense.amount || 0), 0);

    const operatingMargin = netRevenue - monthExpenses;

    const byPlatformMap = new Map();
    for (const tx of inMonth) {
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
          row.rows > 0 && row.withReportedFee === row.rows ? "Reported" : "Estimated where missing",
      }))
      .sort((a, b) => b.gross - a.gross);

    const latestTransactions = transactions
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
      revenueDelta,
      monthExpenses,
      operatingMargin,
      platformRows,
      latestTransactions,
      transactionCount: inMonth.length,
    };
  }, [transactions, expenses]);

  const dataCompleteness = useMemo(() => {
    const allDates = transactions
      .map((tx) => new Date(tx.transaction_date))
      .filter((d) => !Number.isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    const firstDate = allDates[0] || null;
    const daysHistory = firstDate ? Math.max(0, differenceInCalendarDays(new Date(), firstDate) + 1) : 0;

    const lastSyncDates = connectedPlatforms
      .map((platform) => platform.last_synced_at || platform.updated_at)
      .filter(Boolean)
      .map((dateString) => new Date(dateString))
      .filter((d) => !Number.isNaN(d.getTime()))
      .sort((a, b) => b.getTime() - a.getTime());

    const errorPlatforms = connectedPlatforms.filter((platform) => platform.sync_status === "error");

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
      <header className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#F5F5F5]">Dashboard</h1>
          <p className="mt-1 text-sm text-white/70">
            One clean view of revenue, fees, expenses, and follow-up actions.
          </p>
          <p className="mt-2 text-xs text-white/60">
            Last sync: {dataCompleteness.lastSync ? format(dataCompleteness.lastSync, "MMM d, yyyy h:mm a") : "No sync data"}
          </p>
        </div>

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
          Refresh data
        </Button>
      </header>

      <section className="mb-6 rounded-lg border border-[#56C5D0]/30 bg-[#56C5D0]/10 p-4">
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 text-[#56C5D0]" />
          <div>
            <p className="text-sm font-medium text-[#F5F5F5]">Trusted view for decisions</p>
            <p className="mt-1 text-xs text-white/75">
              Missing platform fee fields are estimated using published defaults. Source labels are shown in tables below.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardMetric
          label="Gross revenue (MTD)"
          value={formatMoney(computed.grossRevenue)}
          subtext={`${computed.transactionCount} transactions this month`}
        />
        <DashboardMetric
          label="Estimated net revenue"
          value={formatMoney(computed.netRevenue)}
          subtext={`Fees estimate: ${formatMoney(computed.estimatedFees)}`}
          tone="teal"
        />
        <DashboardMetric
          label="Operating margin"
          value={formatMoney(computed.operatingMargin)}
          subtext={`Month expenses: ${formatMoney(computed.monthExpenses)}`}
          tone={computed.operatingMargin < 0 ? "red" : "neutral"}
        />
        <DashboardMetric
          label="Change vs last month"
          value={`${computed.revenueDelta >= 0 ? "+" : ""}${computed.revenueDelta.toFixed(1)}%`}
          subtext={`History: ${dataCompleteness.daysHistory} days`}
          tone={computed.revenueDelta >= 0 ? "teal" : "orange"}
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="rounded-xl border border-white/10 bg-[#111114] xl:col-span-8">
          <div className="border-b border-white/10 p-4">
            <h2 className="text-lg font-semibold text-[#F5F5F5]">Revenue by platform (month-to-date)</h2>
            <p className="mt-1 text-sm text-white/70">All figures are traceable to transaction records.</p>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-[#D8D8D8]">Platform</TableHead>
                <TableHead className="text-right text-[#D8D8D8]">Gross</TableHead>
                <TableHead className="text-right text-[#D8D8D8]">Fee</TableHead>
                <TableHead className="text-right text-[#D8D8D8]">Net</TableHead>
                <TableHead className="text-right text-[#D8D8D8]">Share</TableHead>
                <TableHead className="text-right text-[#D8D8D8]">Fee Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {computed.platformRows.length === 0 && (
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-white/60">
                    {isLoading ? "Loading platform metrics..." : "No revenue yet for this month."}
                  </TableCell>
                </TableRow>
              )}
              {computed.platformRows.map((row) => (
                <TableRow key={row.key} className="border-white/10 hover:bg-white/[0.02]">
                  <TableCell className="font-medium text-[#F5F5F5]">{row.label}</TableCell>
                  <TableCell className="text-right font-mono-financial text-[#F5F5F5]">{formatMoney(row.gross)}</TableCell>
                  <TableCell className="text-right font-mono-financial text-[#F0A562]">{formatMoney(row.fee)}</TableCell>
                  <TableCell className="text-right font-mono-financial text-[#56C5D0]">{formatMoney(row.net)}</TableCell>
                  <TableCell className="text-right font-mono-financial text-white/80">{row.share.toFixed(1)}%</TableCell>
                  <TableCell className="text-right text-sm text-white/60">{row.feeSource}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-6 xl:col-span-4">
          <div className="rounded-xl border border-white/10 bg-[#111114] p-4">
            <h2 className="text-lg font-semibold text-[#F5F5F5]">Action queue</h2>
            <p className="mt-1 text-sm text-white/70">Clear these items to keep reports dependable.</p>

            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={() => navigate("/RevenueAutopsy")}
                className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-[#15151A] px-3 py-2 text-left hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#56C5D0]"
              >
                <div>
                  <p className="text-sm font-medium text-[#F5F5F5]">Pending anomalies</p>
                  <p className="text-xs text-white/65">{pendingAutopsyEvents.length} items need review</p>
                </div>
                <ArrowRight className="h-4 w-4 text-white/50" />
              </button>

              <button
                type="button"
                onClick={() => navigate("/ConnectedPlatforms")}
                className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-[#15151A] px-3 py-2 text-left hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#56C5D0]"
              >
                <div>
                  <p className="text-sm font-medium text-[#F5F5F5]">Platform sync issues</p>
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
                  <p className="text-sm font-medium text-[#F5F5F5]">Update tax set-aside</p>
                  <p className="text-xs text-white/65">Recalculate based on latest month results</p>
                </div>
                <ArrowRight className="h-4 w-4 text-white/50" />
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#111114] p-4">
            <h2 className="text-lg font-semibold text-[#F5F5F5]">Data completeness</h2>
            <div className="mt-3 space-y-2 text-sm">
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
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-white/10 bg-[#111114]">
        <div className="border-b border-white/10 p-4">
          <h2 className="text-lg font-semibold text-[#F5F5F5]">Recent transactions</h2>
          <p className="mt-1 text-sm text-white/70">Most recent entries from your connected sources.</p>
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
                  No transaction activity yet.
                </TableCell>
              </TableRow>
            )}
            {computed.latestTransactions.map((tx) => (
              <TableRow key={tx.id} className="border-white/10 hover:bg-white/[0.02]">
                <TableCell className="text-sm text-white/75">{format(new Date(tx.date), "MMM d, yyyy")}</TableCell>
                <TableCell className="max-w-[380px] truncate text-sm text-[#F5F5F5]">{tx.description}</TableCell>
                <TableCell className="text-sm text-white/75">{tx.platform}</TableCell>
                <TableCell className="text-right font-mono-financial text-[#F5F5F5]">{formatMoney(tx.gross)}</TableCell>
                <TableCell className="text-right font-mono-financial text-[#F0A562]">{formatMoney(tx.fee)}</TableCell>
                <TableCell className="text-right font-mono-financial text-[#56C5D0]">{formatMoney(tx.gross - tx.fee)}</TableCell>
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
                Resolve these before sharing exports with your accountant.
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="mt-6 rounded-lg border border-white/10 bg-[#111114] p-4">
        <div className="flex items-start gap-2">
          <Database className="mt-0.5 h-4 w-4 text-white/65" />
          <p className="text-sm text-white/75">
            Data source: Revenue transactions, expenses, connected platform sync records, and pending anomaly events.
          </p>
        </div>
      </section>
    </div>
  );
}
