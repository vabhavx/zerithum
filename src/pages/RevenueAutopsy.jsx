import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { endOfMonth, format, startOfMonth, subDays, subMonths } from "date-fns";
import {
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  Search,
  Activity,
  Zap,
  Microscope,
  Stethoscope,
  Scan
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";

import { base44 } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  GlassCard,
  containerVariants,
  itemVariants,
} from "@/components/ui/glass-card";
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

const PLATFORM_COLORS = {
  youtube: "#FF0000",
  patreon: "#F96854",
  stripe: "#635BFF",
  gumroad: "#ff90e8",
  instagram: "#E1306C",
  tiktok: "#00f2ea",
  shopify: "#96bf48",
  substack: "#FF6719",
  default: "#56C5D0",
};

const LENSES = [
  { value: "overview", label: "Overview", icon: Scan },
  { value: "risk", label: "Risk signals", icon: TriangleAlert },
  { value: "events", label: "Event queue", icon: Activity },
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

function MetricCard({ title, value, sub, tone = "neutral", icon: Icon }) {
  const valueClass =
    tone === "teal"
      ? "text-[#56C5D0]"
      : tone === "orange"
        ? "text-[#F0A562]"
        : tone === "red"
          ? "text-[#F06C6C]"
          : "text-[#F5F5F5]";

  return (
    <GlassCard hoverEffect glowEffect={tone === 'teal' || tone === 'red'} className="group p-5">
       <div className="flex items-start justify-between">
          <div>
             <p className="text-xs uppercase tracking-wide text-white/50 group-hover:text-white/70 transition-colors">{title}</p>
             <p className={`mt-2 font-mono-financial text-3xl font-bold tracking-tight ${valueClass}`}>{value}</p>
          </div>
          {Icon && (
             <div className={`rounded-lg p-2 transition-colors ${
                tone === 'red' ? 'bg-[#F06C6C]/10 text-[#F06C6C]' :
                tone === 'orange' ? 'bg-[#F0A562]/10 text-[#F0A562]' :
                tone === 'teal' ? 'bg-[#56C5D0]/10 text-[#56C5D0]' :
                'bg-white/5 text-white/40 group-hover:bg-white/10'
             }`}>
                <Icon className="h-5 w-5" />
             </div>
          )}
       </div>
       <p className="mt-2 text-xs text-white/50">{sub}</p>
    </GlassCard>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
   if (active && payload && payload.length) {
     const data = payload[0].payload;
     return (
       <div className="rounded-lg border border-white/10 bg-black/90 p-3 shadow-xl backdrop-blur-xl">
         <p className="mb-1 text-sm font-semibold text-white">{data.label}</p>
         <p className="font-mono-financial text-xs text-[#56C5D0]">
           {formatMoney(data.gross)} ({data.share.toFixed(1)}%)
         </p>
       </div>
     );
   }
   return null;
 };

export default function RevenueAutopsy() {
  const [lens, setLens] = useState("overview");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [activePlatformIndex, setActivePlatformIndex] = useState(null);

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
        icon: AlertTriangle
      });
    } else if (concentrationShare >= 40) {
      plainInsights.push({
        id: "concentration-medium",
        tone: "orange",
        title: "Revenue concentration is moderate",
        text: `${topPlatform.label} contributes ${concentrationShare.toFixed(1)}% of month revenue.`,
        icon: TriangleAlert
      });
    } else {
      plainInsights.push({
        id: "concentration-low",
        tone: "teal",
        title: "Revenue concentration is healthy",
        text: "No single platform dominates month revenue.",
        icon: ShieldCheck
      });
    }

    plainInsights.push({
      id: "refund",
      tone: refundRate > 5 ? "red" : refundRate > 3 ? "orange" : "teal",
      title: "Refund watch",
      text: `Trailing 90-day refund rate is ${refundRate.toFixed(1)}%.`,
      icon: Search
    });

    plainInsights.push({
      id: "trend",
      tone: changePct >= 0 ? "teal" : "orange",
      title: changePct >= 0 ? "Revenue trend positive" : "Revenue trend softened",
      text: `Month-to-date gross is ${changePct >= 0 ? "up" : "down"} ${Math.abs(changePct).toFixed(1)}% vs previous month.`,
      icon: Zap
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
    <div className="relative min-h-screen">
       {/* Background "Scan" Grid Effect */}
       <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none" />
       <div className="fixed inset-x-0 top-0 h-[500px] bg-gradient-to-b from-[#F06C6C]/5 via-transparent to-transparent blur-[120px] pointer-events-none" />

      <motion.div
         initial="hidden"
         animate="visible"
         variants={containerVariants}
         className="relative mx-auto w-full max-w-[1400px] p-6 lg:p-8"
      >
        <motion.header
          variants={itemVariants}
          className="mb-8 flex flex-col gap-6 border-b border-white/5 pb-6 xl:flex-row xl:items-start xl:justify-between"
        >
          <div>
            <div className="flex items-center gap-3">
               <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F06C6C]/10 text-[#F06C6C]">
                  <Microscope className="h-6 w-6" />
               </div>
               <div>
                  <h1 className="text-3xl font-bold tracking-tight text-[#F5F5F5] sm:text-4xl">Revenue Autopsy</h1>
                  <p className="mt-1 text-base text-white/60">
                     Diagnostic risk analysis and anomaly detection.
                  </p>
               </div>
            </div>
            <div className="ml-13 mt-2 flex items-center gap-2 text-xs font-medium text-white/40">
               <span className={`relative flex h-2 w-2 ${isRefreshing ? 'opacity-100' : 'opacity-50'}`}>
                 <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F06C6C] opacity-75"></span>
                 <span className="relative inline-flex h-2 w-2 rounded-full bg-[#F06C6C]"></span>
               </span>
               Last diagnostic: {lastSync ? format(lastSync, "MMM d, yyyy h:mm a") : "No sync data"}
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
            className="h-9 border-white/20 bg-transparent text-[#F5F5F5] hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#56C5D0]"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Run Diagnostics
          </Button>
        </motion.header>

        <motion.div variants={itemVariants} className="mb-8 flex flex-wrap gap-2">
          {LENSES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setLens(item.value)}
              className={`group relative flex items-center gap-2 overflow-hidden rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                lens === item.value
                  ? "text-[#0A0A0A]"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              {lens === item.value && (
                <motion.div
                  layoutId="lens-highlight"
                  className="absolute inset-0 bg-[#56C5D0]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <item.icon className={`relative z-10 h-4 w-4 ${lens === item.value ? "text-[#0A0A0A]" : "text-white/40 group-hover:text-white/80"}`} />
              <span className="relative z-10">{item.label}</span>
            </button>
          ))}
        </motion.div>

        <motion.section
           variants={containerVariants}
           className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          <MetricCard
             title="Gross revenue (MTD)"
             value={formatMoney(analysis.monthGross)}
             sub="Before fees"
             icon={Scan}
          />
          <MetricCard
             title="Estimated net (MTD)"
             value={formatMoney(analysis.monthNet)}
             sub={`Fee impact: ${formatMoney(analysis.monthFee)}`}
             tone="teal"
             icon={Stethoscope}
          />
          <MetricCard
             title="Month trend"
             value={`${analysis.changePct >= 0 ? "+" : ""}${analysis.changePct.toFixed(1)}%`}
             sub="Compared with previous month"
             tone={analysis.changePct >= 0 ? "teal" : "orange"}
             icon={Activity}
          />
          <MetricCard
             title="Refund rate (90d)"
             value={`${analysis.refundRate.toFixed(1)}%`}
             sub="Lower is better"
             tone={analysis.refundRate > 5 ? "red" : analysis.refundRate > 3 ? "orange" : "teal"}
             icon={AlertTriangle}
          />
        </motion.section>

        <AnimatePresence mode="wait">
        {lens !== "events" && (
          <motion.section
             key="insights"
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, height: 0 }}
             transition={{ duration: 0.3 }}
             className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3"
          >
             <div className="col-span-full mb-2">
                <h2 className="text-lg font-semibold text-[#F5F5F5] flex items-center gap-2">
                   <Zap className="h-4 w-4 text-[#56C5D0]" />
                   Diagnostic Insights
                </h2>
             </div>
            {analysis.plainInsights.map((item, index) => (
              <GlassCard
                key={item.id}
                hoverEffect
                glowEffect={item.tone === 'red'}
                className={`p-5 transition-all hover:scale-[1.01] ${
                  item.tone === "red" ? "border-[#F06C6C]/30 bg-[#F06C6C]/5" :
                  item.tone === "orange" ? "border-[#F0A562]/30 bg-[#F0A562]/5" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                   <div className={`mt-0.5 rounded-full p-1.5 ${
                      item.tone === "red" ? "bg-[#F06C6C]/20 text-[#F06C6C]" :
                      item.tone === "orange" ? "bg-[#F0A562]/20 text-[#F0A562]" :
                      "bg-[#56C5D0]/20 text-[#56C5D0]"
                   }`}>
                      <item.icon className="h-4 w-4" />
                   </div>
                   <div>
                      <p className="font-medium text-[#F5F5F5]">{item.title}</p>
                      <p className="mt-1 text-sm text-white/70 leading-relaxed">{item.text}</p>
                   </div>
                </div>
              </GlassCard>
            ))}
          </motion.section>
        )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
        {(lens === "overview" || lens === "risk") && (
          <motion.div
             key="concentration"
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, height: 0 }}
             transition={{ duration: 0.3 }}
          >
             <GlassCard className="mb-8">
               <div className="border-b border-white/10 p-5">
                 <h2 className="text-lg font-semibold text-[#F5F5F5]">Platform Concentration</h2>
                 <p className="mt-1 text-sm text-white/60">Revenue distribution visualization.</p>
               </div>

               <div className="grid grid-cols-1 gap-8 p-6 lg:grid-cols-2">
                  {/* Chart */}
                  <div className="h-[300px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={analysis.platformRows} margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                           <XAxis type="number" hide />
                           <YAxis
                              dataKey="label"
                              type="category"
                              width={80}
                              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                              axisLine={false}
                              tickLine={false}
                           />
                           <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                           <Bar dataKey="gross" radius={[0, 4, 4, 0]} barSize={24} onMouseEnter={(_, idx) => setActivePlatformIndex(idx)} onMouseLeave={() => setActivePlatformIndex(null)}>
                              {analysis.platformRows.map((entry, index) => (
                                 <Cell
                                    key={`cell-${index}`}
                                    fill={PLATFORM_COLORS[entry.key] || PLATFORM_COLORS.default}
                                    fillOpacity={activePlatformIndex === null || activePlatformIndex === index ? 1 : 0.4}
                                    className="transition-all duration-300"
                                 />
                              ))}
                           </Bar>
                        </BarChart>
                     </ResponsiveContainer>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                     <Table>
                       <TableHeader>
                         <TableRow className="border-white/10 hover:bg-transparent">
                           <TableHead className="text-[#D8D8D8]">Platform</TableHead>
                           <TableHead className="text-right text-[#D8D8D8]">Gross</TableHead>
                           <TableHead className="text-right text-[#D8D8D8]">Share</TableHead>
                         </TableRow>
                       </TableHeader>
                       <TableBody>
                         {analysis.platformRows.map((row, index) => (
                           <motion.tr
                              key={row.key}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className={`border-b border-white/5 transition-colors ${activePlatformIndex === index ? 'bg-white/10' : 'hover:bg-white/[0.02]'}`}
                              onMouseEnter={() => setActivePlatformIndex(index)}
                              onMouseLeave={() => setActivePlatformIndex(null)}
                           >
                             <TableCell className="font-medium text-[#F5F5F5] flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[row.key] || PLATFORM_COLORS.default }} />
                                {row.label}
                             </TableCell>
                             <TableCell className="text-right font-mono-financial text-[#F5F5F5]">{formatMoney(row.gross)}</TableCell>
                             <TableCell className="text-right font-mono-financial text-[#56C5D0]">{row.share.toFixed(1)}%</TableCell>
                           </motion.tr>
                         ))}
                       </TableBody>
                     </Table>
                  </div>
               </div>
             </GlassCard>
          </motion.div>
        )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
        {(lens === "events" || lens === "risk") && (
          <motion.section
             key="events"
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, height: 0 }}
             transition={{ duration: 0.3 }}
             className="rounded-xl border border-white/10 bg-[#111114]"
          >
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
                    <TableCell colSpan={4} className="py-12 text-center text-sm text-white/60">
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
          </motion.section>
        )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
