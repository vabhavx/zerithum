import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { endOfMonth, format, startOfMonth, subDays, subMonths, eachDayOfInterval, isSameDay } from "date-fns";
import {
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Activity,
  ArrowRight
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from "recharts";
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
import { PageTransition, AnimatedItem } from "@/components/ui/PageTransition";
import { ChartContainer } from "@/components/ui/ChartContainer";
import { GlassCard, InteractiveMetricCard } from "@/components/ui/glass-card";
import { formatMoney } from "@/lib/utils";

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
  { value: "all", label: "All" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

function feeFor(tx) {
  const reported = Number(tx.platform_fee || 0);
  if (reported > 0) return reported;
  const rate = PLATFORM_FEE_RATES[(tx.platform || "").toLowerCase()] || 0;
  return (tx.amount || 0) * rate;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
        <p className="mb-1 text-xs text-gray-500">{label}</p>
        <p className="font-mono-financial text-sm font-semibold text-gray-900">
          {formatMoney(payload[0].value, 0)}
        </p>
      </div>
    );
  }
  return null;
};

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

    const daysInMonth = eachDayOfInterval({ start: monthStart, end: now });
    const trendData = daysInMonth.map(day => {
      const dayTotal = monthRows
        .filter(tx => isSameDay(new Date(tx.transaction_date), day))
        .reduce((sum, tx) => sum + (tx.amount || 0), 0);
      return {
        date: format(day, "MMM d"),
        value: dayTotal
      };
    });

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
      trendData
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
    <PageTransition className="mx-auto w-full max-w-[1400px]">
      <header className="mb-8 flex flex-col gap-4 border-b border-gray-200 pb-6 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Revenue Autopsy</h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Interactive risk analysis and anomaly detection.
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
            <Activity className="h-3 w-3" />
            Last sync: {lastSync ? format(lastSync, "MMM d, yyyy h:mm a") : "No sync data"}
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            refetchTransactions();
            refetchPlatforms();
          }}
          disabled={isRefreshing}
          className="h-9 border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh analysis
        </Button>
      </header>

      {/* Lens Selector */}
      <AnimatedItem delay={0.1} className="mb-8">
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-gray-100 p-1 w-fit">
          {LENSES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setLens(item.value)}
              className={`h-8 rounded-md px-4 text-sm font-medium transition-all ${lens === item.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
                }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </AnimatedItem>

      {/* Key Metrics Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AnimatedItem delay={0.2}>
          <InteractiveMetricCard
            title="Gross Revenue (MTD)"
            value={formatMoney(analysis.monthGross, 0)}
            sub="Before fees"
          />
        </AnimatedItem>
        <AnimatedItem delay={0.3}>
          <InteractiveMetricCard
            title="Estimated Net (MTD)"
            value={formatMoney(analysis.monthNet, 0)}
            sub={`Fees: ${formatMoney(analysis.monthFee, 0)}`}
            tone="green"
          />
        </AnimatedItem>
        <AnimatedItem delay={0.4}>
          <InteractiveMetricCard
            title="Month Trend"
            value={`${analysis.changePct >= 0 ? "+" : ""}${analysis.changePct.toFixed(1)}%`}
            sub="vs previous month"
            tone={analysis.changePct >= 0 ? "teal" : "orange"}
            trend={analysis.changePct}
          />
        </AnimatedItem>
        <AnimatedItem delay={0.5}>
          <InteractiveMetricCard
            title="Refund Rate (90d)"
            value={`${analysis.refundRate.toFixed(1)}%`}
            sub="Trailing 90 days"
            tone={analysis.refundRate > 5 ? "red" : analysis.refundRate > 3 ? "orange" : "teal"}
          />
        </AnimatedItem>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Main Content Area */}
        <div className="xl:col-span-2 space-y-6">

          {/* Revenue Trend Chart */}
          {(lens === "overview" || lens === "risk") && (
            <AnimatedItem delay={0.6}>
              <GlassCard variant="panel" className="p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <TrendingUp className="h-4 w-4 text-gray-400" />
                    Revenue Momentum
                  </h3>
                </div>
                <ChartContainer height={300} className="border-0 bg-transparent p-0">
                  <AreaChart data={analysis.trendData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#D1D5DB"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#9CA3AF' }}
                    />
                    <YAxis
                      stroke="#D1D5DB"
                      fontSize={11}
                      tickFormatter={(val) => `$${val}`}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#9CA3AF' }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E5E7EB', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#4F46E5"
                      strokeWidth={1.5}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ChartContainer>
              </GlassCard>
            </AnimatedItem>
          )}

          {/* Platform Concentration */}
          {(lens === "overview" || lens === "risk") && (
            <AnimatedItem delay={0.7}>
              <GlassCard variant="panel" className="p-6">
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900">Platform Concentration</h3>
                  <p className="text-xs text-gray-500 mt-1">Revenue distribution across connected sources</p>
                </div>

                <ChartContainer height={200} className="mb-6 border-0 bg-transparent p-0">
                  <BarChart data={analysis.platformRows} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={true} vertical={false} />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="label"
                      type="category"
                      stroke="#9CA3AF"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      width={80}
                      tick={{ fill: '#6B7280' }}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
                              <p className="text-xs text-gray-500">{payload[0].payload.label}</p>
                              <p className="font-mono-financial text-sm font-semibold text-gray-900">
                                {formatMoney(payload[0].value, 0)} ({payload[0].payload.share.toFixed(1)}%)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="gross" radius={[0, 4, 4, 0]}>
                      {analysis.platformRows.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 && entry.share > 60 ? "#DC2626" : "#4F46E5"} fillOpacity={index === 0 ? 0.9 : 0.6 - index * 0.08} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>

                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow className="border-gray-100 hover:bg-transparent">
                        <TableHead className="text-xs font-medium text-gray-500">Platform</TableHead>
                        <TableHead className="text-right text-xs font-medium text-gray-500">Gross</TableHead>
                        <TableHead className="text-right text-xs font-medium text-gray-500">Fee</TableHead>
                        <TableHead className="text-right text-xs font-medium text-gray-500">Net</TableHead>
                        <TableHead className="text-right text-xs font-medium text-gray-500">Share</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analysis.platformRows.map((row) => (
                        <TableRow key={row.key} className="border-gray-100 hover:bg-gray-50/50">
                          <TableCell className="text-sm font-medium text-gray-900">{row.label}</TableCell>
                          <TableCell className="text-right font-mono-financial text-gray-900">{formatMoney(row.gross, 0)}</TableCell>
                          <TableCell className="text-right font-mono-financial text-amber-600">{formatMoney(row.fee, 0)}</TableCell>
                          <TableCell className="text-right font-mono-financial text-gray-900 font-medium">{formatMoney(row.net, 0)}</TableCell>
                          <TableCell className="text-right text-gray-500">{row.share.toFixed(1)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </GlassCard>
            </AnimatedItem>
          )}

          {/* Event Queue Lens */}
          {(lens === "events" || lens === "risk") && (
            <AnimatedItem delay={0.6}>
              <GlassCard variant="panel" className="overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Anomaly Detection Queue</h3>
                    <p className="text-xs text-gray-500 mt-0.5">AI-flagged transactions requiring review</p>
                  </div>
                  <div className="flex gap-1 bg-white p-1 rounded-lg border border-gray-200">
                    {SEVERITY_FILTERS.map((item) => (
                      <button
                        key={item.value}
                        onClick={() => setSeverityFilter(item.value)}
                        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${severityFilter === item.value
                            ? "bg-indigo-600 text-white"
                            : "text-gray-500 hover:text-gray-700"
                          }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow className="border-gray-100 hover:bg-transparent">
                      <TableHead className="text-xs font-medium text-gray-500">Detected</TableHead>
                      <TableHead className="text-xs font-medium text-gray-500">Event Type</TableHead>
                      <TableHead className="text-xs font-medium text-gray-500">Severity</TableHead>
                      <TableHead className="text-right text-xs font-medium text-gray-500">Impact</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.length === 0 && (
                      <TableRow className="border-gray-100 hover:bg-transparent">
                        <TableCell colSpan={5} className="py-12 text-center text-sm text-gray-400">
                          No pending anomalies found for this filter.
                        </TableCell>
                      </TableRow>
                    )}
                    {filteredEvents.slice(0, 10).map((event) => (
                      <TableRow key={event.id} className="border-gray-100 hover:bg-gray-50/50 group cursor-pointer">
                        <TableCell className="text-sm text-gray-500">
                          {event.detected_at ? format(new Date(event.detected_at), "MMM d") : "-"}
                        </TableCell>
                        <TableCell className="text-sm font-medium text-gray-900">
                          {(event.event_type || "Unknown").replaceAll("_", " ")}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${event.severity === "critical" || event.severity === "high"
                                ? "border-red-200 bg-red-50 text-red-700"
                                : event.severity === "medium"
                                  ? "border-amber-200 bg-amber-50 text-amber-700"
                                  : "border-gray-200 bg-gray-50 text-gray-600"
                              }`}
                          >
                            {event.severity || "low"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono-financial text-gray-900">
                          {typeof event.impact_amount === "number" ? formatMoney(event.impact_amount, 0) : "-"}
                        </TableCell>
                        <TableCell>
                          <ArrowRight className="h-4 w-4 text-gray-300 transition-colors group-hover:text-gray-600" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </GlassCard>
            </AnimatedItem>
          )}
        </div>

        {/* Sidebar Insights */}
        <div className="space-y-6">
          <AnimatedItem delay={0.8}>
            <GlassCard className="p-5">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Diagnostics
              </h3>
              <div className="space-y-3">
                {analysis.plainInsights.map((item) => (
                  <div
                    key={item.id}
                    className={`relative overflow-hidden rounded-lg border p-4 ${item.tone === "red"
                        ? "border-red-200 bg-red-50"
                        : item.tone === "orange"
                          ? "border-amber-200 bg-amber-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                  >
                    <div className={`absolute left-0 top-0 h-full w-0.5 ${item.tone === "red" ? "bg-red-500" : item.tone === "orange" ? "bg-amber-500" : "bg-gray-300"
                      }`} />
                    <p className="text-sm font-medium text-gray-900 ml-2">{item.title}</p>
                    <p className="mt-1 text-xs text-gray-500 leading-relaxed ml-2">{item.text}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </AnimatedItem>

          {analysis.concentrationShare >= 65 && (
            <AnimatedItem delay={0.9}>
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-red-100 p-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-red-700">Critical Concentration</h4>
                    <p className="mt-1 text-xs text-red-600/80">
                      Dependence on {analysis.platformRows[0]?.label} exceeds safe thresholds ({analysis.concentrationShare.toFixed(1)}%).
                      Diversification recommended.
                    </p>
                  </div>
                </div>
              </div>
            </AnimatedItem>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
