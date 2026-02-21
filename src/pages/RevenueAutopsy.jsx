import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { endOfMonth, format, startOfMonth, subDays, subMonths } from "date-fns";
import {
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
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

const LENSES = [
  { value: "overview", label: "Overview" },
  { value: "risk", label: "Risk signals" },
  { value: "events", label: "Event queue" },
];

const SEVERITY_FILTERS = [
  { value: "all", label: "All severities" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
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

function feeFor(tx) {
  const reported = Number(tx.platform_fee || 0);
  if (reported > 0) return reported;
  const rate = PLATFORM_FEE_RATES[(tx.platform || "").toLowerCase()] || 0;
  return (tx.amount || 0) * rate;
}

function MetricCard({ title, value, sub, tone = "neutral" }) {
  const valueClass =
    tone === "teal"
      ? "text-[#56C5D0]"
      : tone === "orange"
        ? "text-[#F0A562]"
        : tone === "red"
          ? "text-[#F06C6C]"
          : "text-[#F5F5F5]";

  return (
    <div className="rounded-xl border border-white/10 bg-[#111114] p-4 transition-colors hover:border-white/20">
      <p className="text-xs uppercase tracking-wide text-white/60">{title}</p>
      <p className={`mt-2 font-mono-financial text-2xl font-semibold ${valueClass}`}>{value}</p>
      <p className="mt-1 text-xs text-white/60">{sub}</p>
    </div>
  );
}

export default function RevenueAutopsy() {
  const [lens, setLens] = useState("overview");
  const [severityFilter, setSeverityFilter] = useState("all");

  const {
    data: transactions = [],
    isLoading: txLoading,
    refetch: refetchTransactions,
    isFetching: isFetchingTransactions,
  } = useQuery({
    queryKey: ["revenueTransactions"],
    queryFn: () => base44.entities.RevenueTransaction.fetchAll({}, "-transaction_date"),
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: connectedPlatforms = [],
    refetch: refetchPlatforms,
    isFetching: isFetchingPlatforms,
  } = useQuery({
    queryKey: ["connectedPlatforms"],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.ConnectedPlatform.filter({ user_id: user.id });
    },
    staleTime: 1000 * 60 * 2,
  });

  const { data: autopsyEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["autopsyEvents"],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.AutopsyEvent.filter({ user_id: user.id }, "-detected_at", 40);
    },
    staleTime: 1000 * 60,
  });

  const isRefreshing = isFetchingTransactions || isFetchingPlatforms;

  const analysis = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const prevStart = startOfMonth(subMonths(now, 1));
    const prevEnd = endOfMonth(subMonths(now, 1));
    const trailing90Start = subDays(now, 89);

    const monthRows = transactions.filter((tx) => {
      const date = new Date(tx.transaction_date);
      return date >= monthStart && date <= monthEnd;
    });

    const prevRows = transactions.filter((tx) => {
      const date = new Date(tx.transaction_date);
      return date >= prevStart && date <= prevEnd;
    });

    const trailing90Rows = transactions.filter((tx) => {
      const date = new Date(tx.transaction_date);
      return date >= trailing90Start;
    });

    const monthGross = monthRows.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const monthFee = monthRows.reduce((sum, tx) => sum + feeFor(tx), 0);
    const monthNet = monthGross - monthFee;

    const prevGross = prevRows.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const changePct = prevGross > 0 ? ((monthGross - prevGross) / prevGross) * 100 : 0;

    const refunds90 = trailing90Rows
      .filter((tx) => (tx.amount || 0) < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);

    const gross90 = trailing90Rows
      .filter((tx) => (tx.amount || 0) > 0)
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);

    const refundRate = gross90 > 0 ? (refunds90 / gross90) * 100 : 0;

    const byPlatform = new Map();
    for (const tx of monthRows) {
      const key = (tx.platform || "unknown").toLowerCase();
      const existing = byPlatform.get(key) || {
        key,
        label: PLATFORM_LABELS[key] || key,
        gross: 0,
        fee: 0,
        rows: 0,
        withReportedFee: 0,
      };
      existing.gross += tx.amount || 0;
      existing.fee += feeFor(tx);
      existing.rows += 1;
      if ((tx.platform_fee || 0) > 0) existing.withReportedFee += 1;
      byPlatform.set(key, existing);
    }

    const platformRows = [...byPlatform.values()]
      .map((row) => ({
        ...row,
        net: row.gross - row.fee,
        share: monthGross > 0 ? (row.gross / monthGross) * 100 : 0,
        source:
          row.rows > 0 && row.withReportedFee === row.rows
            ? "Reported"
            : "Estimated where fee missing",
      }))
      .sort((a, b) => b.gross - a.gross);

    const topPlatform = platformRows[0] || null;
    const concentrationShare = topPlatform ? topPlatform.share : 0;

    const plainInsights = [];

    if (concentrationShare >= 65) {
      plainInsights.push({
        id: "concentration-high",
        tone: "red",
        title: "Revenue is highly concentrated",
        text: `${topPlatform.label} contributes ${concentrationShare.toFixed(1)}% of month revenue.`,
      });
    } else if (concentrationShare >= 40) {
      plainInsights.push({
        id: "concentration-medium",
        tone: "orange",
        title: "Revenue concentration is moderate",
        text: `${topPlatform.label} contributes ${concentrationShare.toFixed(1)}% of month revenue.`,
      });
    } else {
      plainInsights.push({
        id: "concentration-low",
        tone: "teal",
        title: "Revenue concentration is healthy",
        text: "No single platform dominates month revenue.",
      });
    }

    plainInsights.push({
      id: "refund",
      tone: refundRate > 5 ? "red" : refundRate > 3 ? "orange" : "teal",
      title: "Refund watch",
      text: `Trailing 90-day refund rate is ${refundRate.toFixed(1)}%.`,
    });

    plainInsights.push({
      id: "trend",
      tone: changePct >= 0 ? "teal" : "orange",
      title: changePct >= 0 ? "Revenue trend positive" : "Revenue trend softened",
      text: `Month-to-date gross is ${changePct >= 0 ? "up" : "down"} ${Math.abs(changePct).toFixed(1)}% vs previous month.`,
    });

    return {
      monthGross,
      monthNet,
      monthFee,
      changePct,
      refundRate,
      platformRows,
      concentrationShare,
      plainInsights,
    };
  }, [transactions]);

  const filteredEvents = useMemo(() => {
    const pending = autopsyEvents.filter((event) => event.status === "pending_review");
    if (severityFilter === "all") return pending;
    return pending.filter((event) => (event.severity || "low") === severityFilter);
  }, [autopsyEvents, severityFilter]);

  const lastSync = useMemo(() => {
    const syncDates = connectedPlatforms
      .map((platform) => platform.last_synced_at || platform.updated_at)
      .filter(Boolean)
      .map((entry) => new Date(entry))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((left, right) => right.getTime() - left.getTime());

    return syncDates[0] || null;
  }, [connectedPlatforms]);

  const loading = txLoading || eventsLoading;

  return (
    <div className="mx-auto w-full max-w-[1400px] rounded-2xl border border-white/10 bg-[#0A0A0A] p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-6 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#F5F5F5]">Revenue Autopsy</h1>
          <p className="mt-1 text-sm text-white/70">
            Interactive risk analysis with plain-language insights for non-technical teams.
          </p>
          <p className="mt-2 text-xs text-white/60">
            Last sync: {lastSync ? format(lastSync, "MMM d, yyyy h:mm a") : "No sync data"}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            refetchTransactions();
            refetchPlatforms();
          }}
          disabled={isRefreshing}
          className="h-9 border-white/20 bg-transparent text-[#F5F5F5] hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#56C5D0]"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh analysis
        </Button>
      </header>

      <section className="mb-6 rounded-lg border border-[#56C5D0]/30 bg-[#56C5D0]/10 p-4">
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 text-[#56C5D0]" />
          <p className="text-sm text-white/85">
            Lens controls below let you switch between summary, risk focus, and event queue without leaving the page.
          </p>
        </div>
      </section>

      <section className="mb-6 flex flex-wrap gap-2">
        {LENSES.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setLens(item.value)}
            className={`h-8 rounded-md border px-3 text-sm transition ${
              lens === item.value
                ? "border-[#56C5D0]/45 bg-[#56C5D0]/10 text-[#56C5D0]"
                : "border-white/20 bg-transparent text-white/70 hover:bg-white/10"
            }`}
          >
            {item.label}
          </button>
        ))}
      </section>

      <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Gross revenue (MTD)" value={formatMoney(analysis.monthGross)} sub="Before fees" />
        <MetricCard title="Estimated net (MTD)" value={formatMoney(analysis.monthNet)} sub={`Fee impact: ${formatMoney(analysis.monthFee)}`} tone="teal" />
        <MetricCard title="Month trend" value={`${analysis.changePct >= 0 ? "+" : ""}${analysis.changePct.toFixed(1)}%`} sub="Compared with previous month" tone={analysis.changePct >= 0 ? "teal" : "orange"} />
        <MetricCard title="Refund rate (90d)" value={`${analysis.refundRate.toFixed(1)}%`} sub="Lower is better" tone={analysis.refundRate > 5 ? "red" : analysis.refundRate > 3 ? "orange" : "teal"} />
      </section>

      {lens !== "events" && (
        <section className="mb-6 rounded-xl border border-white/10 bg-[#111114] p-4">
          <h2 className="text-lg font-semibold text-[#F5F5F5]">What this means</h2>
          <div className="mt-4 space-y-3">
            {analysis.plainInsights.map((item) => (
              <div
                key={item.id}
                className={`rounded-lg border p-3 ${
                  item.tone === "red"
                    ? "border-[#F06C6C]/40 bg-[#F06C6C]/10"
                    : item.tone === "orange"
                      ? "border-[#F0A562]/40 bg-[#F0A562]/10"
                      : "border-[#56C5D0]/40 bg-[#56C5D0]/10"
                }`}
              >
                <p className="text-sm font-medium text-[#F5F5F5]">{item.title}</p>
                <p className="mt-1 text-sm text-white/80">{item.text}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {(lens === "overview" || lens === "risk") && (
        <section className="mb-6 rounded-xl border border-white/10 bg-[#111114]">
          <div className="border-b border-white/10 p-4">
            <h2 className="text-lg font-semibold text-[#F5F5F5]">Platform concentration evidence</h2>
            <p className="mt-1 text-sm text-white/70">Interactive share bars help identify concentration risk quickly.</p>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-[#D8D8D8]">Platform</TableHead>
                <TableHead className="text-right text-[#D8D8D8]">Gross</TableHead>
                <TableHead className="text-right text-[#D8D8D8]">Fee</TableHead>
                <TableHead className="text-right text-[#D8D8D8]">Net</TableHead>
                <TableHead className="text-right text-[#D8D8D8]">Share</TableHead>
                <TableHead className="text-right text-[#D8D8D8]">Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analysis.platformRows.length === 0 && (
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-white/60">
                    {loading ? "Loading revenue evidence..." : "No revenue rows available for this month."}
                  </TableCell>
                </TableRow>
              )}
              {analysis.platformRows.map((row) => (
                <TableRow key={row.key} className="border-white/10 hover:bg-white/[0.02]">
                  <TableCell className="font-medium text-[#F5F5F5]">{row.label}</TableCell>
                  <TableCell className="text-right font-mono-financial text-[#F5F5F5]">{formatMoney(row.gross)}</TableCell>
                  <TableCell className="text-right font-mono-financial text-[#F0A562]">{formatMoney(row.fee)}</TableCell>
                  <TableCell className="text-right font-mono-financial text-[#56C5D0]">{formatMoney(row.net)}</TableCell>
                  <TableCell className="text-right">
                    <div className="ml-auto w-28">
                      <span className="font-mono-financial text-white/80">{row.share.toFixed(1)}%</span>
                      <div className="mt-1 h-1.5 rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-[#56C5D0] transition-all"
                          style={{ width: `${Math.min(100, Math.max(0, row.share))}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm text-white/60">{row.source}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      )}

      {(lens === "events" || lens === "risk") && (
        <section className="rounded-xl border border-white/10 bg-[#111114]">
          <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#F5F5F5]">Pending anomaly decisions</h2>
              <p className="mt-1 text-sm text-white/70">Filter by severity for faster triage.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {SEVERITY_FILTERS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setSeverityFilter(item.value)}
                  className={`h-7 rounded-md border px-2.5 text-xs transition ${
                    severityFilter === item.value
                      ? "border-[#56C5D0]/45 bg-[#56C5D0]/10 text-[#56C5D0]"
                      : "border-white/20 bg-transparent text-white/70 hover:bg-white/10"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-[#D8D8D8]">Detected</TableHead>
                <TableHead className="text-[#D8D8D8]">Event</TableHead>
                <TableHead className="text-[#D8D8D8]">Severity</TableHead>
                <TableHead className="text-right text-[#D8D8D8]">Impact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.length === 0 && (
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableCell colSpan={4} className="py-8 text-center text-sm text-white/60">
                    No pending events for this severity filter.
                  </TableCell>
                </TableRow>
              )}
              {filteredEvents.slice(0, 12).map((event) => (
                <TableRow key={event.id} className="border-white/10 hover:bg-white/[0.02]">
                  <TableCell className="text-sm text-white/75">
                    {event.detected_at ? format(new Date(event.detected_at), "MMM d, yyyy") : "-"}
                  </TableCell>
                  <TableCell className="text-sm text-[#F5F5F5]">
                    {(event.event_type || "Unknown").replaceAll("_", " ")}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`rounded-md border px-2 py-1 text-xs capitalize ${
                        event.severity === "critical" || event.severity === "high"
                          ? "border-[#F06C6C]/40 bg-[#F06C6C]/10 text-[#F06C6C]"
                          : event.severity === "medium"
                            ? "border-[#F0A562]/40 bg-[#F0A562]/10 text-[#F0A562]"
                            : "border-[#56C5D0]/40 bg-[#56C5D0]/10 text-[#56C5D0]"
                      }`}
                    >
                      {event.severity || "low"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono-financial text-white/80">
                    {typeof event.impact_amount === "number" ? formatMoney(event.impact_amount) : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      )}

      {filteredEvents.length > 0 && (
        <section className="mt-6 rounded-lg border border-[#F0A562]/35 bg-[#F0A562]/10 p-4">
          <div className="flex items-start gap-2">
            <TriangleAlert className="mt-0.5 h-4 w-4 text-[#F0A562]" />
            <p className="text-sm text-white/85">
              {filteredEvents.length} anomaly decision{filteredEvents.length > 1 ? "s" : ""} need review in current filter view.
            </p>
          </div>
        </section>
      )}

      {analysis.concentrationShare >= 65 && (
        <section className="mt-6 rounded-lg border border-[#F06C6C]/35 bg-[#F06C6C]/10 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-[#F06C6C]" />
            <p className="text-sm text-white/85">
              Concentration warning: top platform currently contributes {analysis.concentrationShare.toFixed(1)}% of month revenue.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
