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
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
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

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-white/10 bg-[#09090b]/90 p-3 backdrop-blur-md">
        <p className="mb-1 text-xs text-white/60">{label}</p>
        <p className="font-mono-financial text-sm font-semibold text-[#56C5D0]">
          {formatMoney(payload[0].value)}
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

    // Trend Chart Data
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
    <PageTransition className="mx-auto w-full max-w-[1400px] p-6 lg:p-8">
      <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#F5F5F5]">Revenue Autopsy</h1>
          <p className="mt-2 text-base text-white/70">
            Interactive risk analysis and anomaly detection.
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs text-white/50">
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
          className="h-10 border-white/20 bg-white/5 text-[#F5F5F5] hover:bg-white/10 hover:text-white"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh analysis
        </Button>
      </header>

      {/* Lens Selector */}
      <AnimatedItem delay={0.1} className="mb-8">
        <GlassCard className="flex flex-wrap items-center gap-2 p-1.5" variant="panel">
          {LENSES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setLens(item.value)}
              className={`h-9 rounded-lg px-4 text-sm font-medium transition-all ${
                lens === item.value
                  ? "bg-[#56C5D0]/10 text-[#56C5D0] shadow-[0_0_10px_-2px_rgba(86,197,208,0.2)]"
                  : "text-white/60 hover:bg-white/5 hover:text-white/90"
              }`}
            >
              {item.label}
            </button>
          ))}
        </GlassCard>
      </AnimatedItem>

      {/* Key Metrics Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AnimatedItem delay={0.2}>
          <InteractiveMetricCard
            title="Gross Revenue (MTD)"
            value={formatMoney(analysis.monthGross)}
            sub="Before fees"
            glowEffect
          />
        </AnimatedItem>
        <AnimatedItem delay={0.3}>
          <InteractiveMetricCard
            title="Estimated Net (MTD)"
            value={formatMoney(analysis.monthNet)}
            sub={`Fees: ${formatMoney(analysis.monthFee)}`}
            tone="teal"
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

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        {/* Main Content Area */}
        <div className="xl:col-span-2 space-y-8">

          {/* Revenue Trend Chart */}
          {(lens === "overview" || lens === "risk") && (
            <AnimatedItem delay={0.6}>
              <GlassCard variant="panel" className="p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-[#F5F5F5]">
                    <TrendingUp className="h-5 w-5 text-[#56C5D0]" />
                    Revenue Momentum
                  </h3>
                </div>
                <ChartContainer height={300} className="border-0 bg-transparent p-0">
                  <AreaChart data={analysis.trendData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#56C5D0" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#56C5D0" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="rgba(255,255,255,0.3)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.3)"
                      fontSize={12}
                      tickFormatter={(val) => `$${val}`}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#56C5D0"
                      strokeWidth={2}
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
                  <h3 className="text-lg font-semibold text-[#F5F5F5]">Platform Concentration</h3>
                  <p className="text-sm text-white/60">Revenue distribution across connected sources</p>
                </div>

                {/* Visual Bar Chart for Concentration */}
                <ChartContainer height={200} className="mb-6 border-0 bg-transparent p-0">
                  <BarChart data={analysis.platformRows} layout="vertical" margin={{ left: 40 }}>
                     <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                     <XAxis type="number" hide />
                     <YAxis
                       dataKey="label"
                       type="category"
                       stroke="rgba(255,255,255,0.7)"
                       fontSize={12}
                       tickLine={false}
                       axisLine={false}
                       width={80}
                     />
                     <Tooltip
                       cursor={{fill: 'rgba(255,255,255,0.05)'}}
                       content={({ active, payload }) => {
                         if (active && payload && payload.length) {
                           return (
                             <div className="rounded-lg border border-white/10 bg-[#09090b]/90 p-2 backdrop-blur-md">
                               <p className="text-xs text-white/60">{payload[0].payload.label}</p>
                               <p className="font-mono-financial text-sm font-semibold text-[#56C5D0]">
                                 {formatMoney(payload[0].value)} ({payload[0].payload.share.toFixed(1)}%)
                               </p>
                             </div>
                           );
                         }
                         return null;
                       }}
                     />
                     <Bar dataKey="gross" radius={[0, 4, 4, 0]}>
                        {analysis.platformRows.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 && entry.share > 60 ? "#F06C6C" : "#56C5D0"} fillOpacity={0.8} />
                        ))}
                     </Bar>
                  </BarChart>
                </ChartContainer>

                <div className="overflow-hidden rounded-lg border border-white/5">
                  <Table>
                    <TableHeader className="bg-white/[0.02]">
                      <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-xs font-medium uppercase text-white/50">Platform</TableHead>
                        <TableHead className="text-right text-xs font-medium uppercase text-white/50">Gross</TableHead>
                        <TableHead className="text-right text-xs font-medium uppercase text-white/50">Fee</TableHead>
                        <TableHead className="text-right text-xs font-medium uppercase text-white/50">Net</TableHead>
                        <TableHead className="text-right text-xs font-medium uppercase text-white/50">Share</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analysis.platformRows.map((row) => (
                        <TableRow key={row.key} className="border-white/5 hover:bg-white/[0.02]">
                          <TableCell className="font-medium text-[#F5F5F5]">{row.label}</TableCell>
                          <TableCell className="text-right font-mono-financial text-[#F5F5F5]">{formatMoney(row.gross)}</TableCell>
                          <TableCell className="text-right font-mono-financial text-[#F0A562]">{formatMoney(row.fee)}</TableCell>
                          <TableCell className="text-right font-mono-financial text-[#56C5D0]">{formatMoney(row.net)}</TableCell>
                          <TableCell className="text-right text-white/70">{row.share.toFixed(1)}%</TableCell>
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
                 <div className="flex flex-col gap-3 border-b border-white/5 bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between">
                   <div>
                     <h3 className="font-semibold text-[#F5F5F5]">Anomaly Detection Queue</h3>
                     <p className="text-xs text-white/60">AI-flagged transactions requiring review</p>
                   </div>
                   <div className="flex gap-1 bg-[#0A0A0A] p-1 rounded-lg border border-white/10">
                     {SEVERITY_FILTERS.map((item) => (
                       <button
                         key={item.value}
                         onClick={() => setSeverityFilter(item.value)}
                         className={`px-3 py-1 text-[10px] uppercase font-medium rounded transition-colors ${
                           severityFilter === item.value
                             ? "bg-[#56C5D0] text-[#0A0A0A]"
                             : "text-white/50 hover:text-white"
                         }`}
                       >
                         {item.label}
                       </button>
                     ))}
                   </div>
                 </div>

                 <Table>
                   <TableHeader className="bg-white/[0.02]">
                     <TableRow className="border-white/5 hover:bg-transparent">
                       <TableHead className="text-xs font-medium uppercase text-white/50">Detected</TableHead>
                       <TableHead className="text-xs font-medium uppercase text-white/50">Event Type</TableHead>
                       <TableHead className="text-xs font-medium uppercase text-white/50">Severity</TableHead>
                       <TableHead className="text-right text-xs font-medium uppercase text-white/50">Impact</TableHead>
                       <TableHead className="w-[50px]"></TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {filteredEvents.length === 0 && (
                       <TableRow className="border-white/5 hover:bg-transparent">
                         <TableCell colSpan={5} className="py-12 text-center text-sm text-white/40">
                           No pending anomalies found for this filter.
                         </TableCell>
                       </TableRow>
                     )}
                     {filteredEvents.slice(0, 10).map((event) => (
                       <TableRow key={event.id} className="border-white/5 hover:bg-white/[0.02] group cursor-pointer">
                         <TableCell className="text-sm text-white/70">
                           {event.detected_at ? format(new Date(event.detected_at), "MMM d") : "-"}
                         </TableCell>
                         <TableCell className="text-sm font-medium text-[#F5F5F5]">
                           {(event.event_type || "Unknown").replaceAll("_", " ")}
                         </TableCell>
                         <TableCell>
                           <span
                             className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                               event.severity === "critical" || event.severity === "high"
                                 ? "bg-[#F06C6C]/20 text-[#F06C6C]"
                                 : event.severity === "medium"
                                   ? "bg-[#F0A562]/20 text-[#F0A562]"
                                   : "bg-[#56C5D0]/20 text-[#56C5D0]"
                             }`}
                           >
                             {event.severity || "low"}
                           </span>
                         </TableCell>
                         <TableCell className="text-right font-mono-financial text-white/90">
                           {typeof event.impact_amount === "number" ? formatMoney(event.impact_amount) : "-"}
                         </TableCell>
                         <TableCell>
                           <ArrowRight className="h-4 w-4 text-white/20 transition-colors group-hover:text-[#56C5D0]" />
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
            <GlassCard variant="hud" className="p-5">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">
                System Diagnostics
              </h3>
              <div className="space-y-3">
                {analysis.plainInsights.map((item) => (
                  <div
                    key={item.id}
                    className={`relative overflow-hidden rounded-md border p-4 transition-all hover:scale-[1.02] ${
                      item.tone === "red"
                        ? "border-[#F06C6C]/30 bg-[#F06C6C]/10"
                        : item.tone === "orange"
                          ? "border-[#F0A562]/30 bg-[#F0A562]/10"
                          : "border-[#56C5D0]/30 bg-[#56C5D0]/10"
                    }`}
                  >
                    <div className={`absolute left-0 top-0 h-full w-1 ${
                       item.tone === "red" ? "bg-[#F06C6C]" : item.tone === "orange" ? "bg-[#F0A562]" : "bg-[#56C5D0]"
                    }`} />
                    <p className="text-sm font-semibold text-[#F5F5F5]">{item.title}</p>
                    <p className="mt-1 text-xs text-white/70 leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </AnimatedItem>

          {analysis.concentrationShare >= 65 && (
            <AnimatedItem delay={0.9}>
              <div className="rounded-lg border border-[#F06C6C]/50 bg-[#F06C6C]/10 p-4 shadow-[0_0_20px_-5px_rgba(240,108,108,0.3)]">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-[#F06C6C]/20 p-2">
                    <AlertTriangle className="h-5 w-5 text-[#F06C6C]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#F06C6C]">Critical Concentration</h4>
                    <p className="mt-1 text-xs text-white/80">
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
