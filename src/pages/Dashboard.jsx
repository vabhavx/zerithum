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
  TrendingUp,
  Activity,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

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

function DashboardMetric({ label, value, subtext, tone = "neutral", icon: Icon }) {
  const toneClass =
    tone === "teal"
      ? "text-[#56C5D0]"
      : tone === "orange"
      ? "text-[#F0A562]"
      : tone === "red"
      ? "text-[#F06C6C]"
      : "text-[#F5F5F5]";

  return (
    <GlassCard hoverEffect className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-white/50">{label}</p>
          <p className={`mt-2 font-mono-financial text-3xl font-bold tracking-tight ${toneClass}`}>
            {value}
          </p>
        </div>
        {Icon && (
          <div className={`rounded-full p-2 ${tone === 'teal' ? 'bg-[#56C5D0]/10 text-[#56C5D0]' : 'bg-white/5 text-white/40'}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      <p className="mt-2 text-xs font-medium text-white/60">{subtext}</p>
    </GlassCard>
  );
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border border-white/10 bg-black/90 p-3 shadow-xl backdrop-blur-xl">
        <p className="text-sm font-semibold text-white">{data.label}</p>
        <p className="font-mono-financial text-xs text-[#56C5D0]">
          {formatMoney(data.gross)} ({data.share.toFixed(1)}%)
        </p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const navigate = useNavigate();

  const [period, setPeriod] = useState("mtd");
  const [panelView, setPanelView] = useState("overview");
  const [activeChartIndex, setActiveChartIndex] = useState(null);

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
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="mx-auto w-full max-w-[1400px] p-6 lg:p-8"
    >
      <motion.header
        variants={itemVariants}
        className="mb-8 flex flex-col gap-6 border-b border-white/5 pb-6 xl:flex-row xl:items-start xl:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#F5F5F5] sm:text-4xl">Dashboard</h1>
          <p className="mt-2 text-base text-white/60">
            Real-time financial intelligence and operational command.
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs font-medium text-white/40">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#56C5D0] opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#56C5D0]"></span>
            </span>
            Last sync:{" "}
            {dataCompleteness.lastSync
              ? format(dataCompleteness.lastSync, "MMM d, yyyy h:mm a")
              : "No sync data"}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-white/5 p-1 backdrop-blur-sm">
          {PERIODS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setPeriod(item.value)}
              className={`relative rounded-md px-4 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#56C5D0] ${
                period === item.value
                  ? "text-[#0A0A0A] shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {period === item.value && (
                <motion.div
                  layoutId="period-highlight"
                  className="absolute inset-0 rounded-md bg-[#56C5D0]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{item.label}</span>
            </button>
          ))}
          <div className="mx-1 h-6 w-px bg-white/10" />
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              refetchTransactions();
              refetchPlatforms();
            }}
            disabled={isFetching}
            className="h-8 w-8 rounded-full p-0 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </motion.header>

      {/* Hero Metrics */}
      <motion.section
        variants={containerVariants}
        className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
      >
        <DashboardMetric
          label="Gross Revenue"
          value={formatMoney(computed.grossRevenue)}
          subtext={`${computed.transactionCount} transactions`}
          icon={Activity}
        />
        <DashboardMetric
          label="Net Revenue"
          value={formatMoney(computed.netRevenue)}
          subtext={`Est. fees: ${formatMoney(computed.estimatedFees)}`}
          tone="teal"
          icon={TrendingUp}
        />
        <DashboardMetric
          label="Operating Margin"
          value={formatMoney(computed.operatingMargin)}
          subtext={`Expenses: ${formatMoney(computed.periodExpenses)}`}
          tone={computed.operatingMargin < 0 ? "red" : "neutral"}
          icon={Database}
        />
        <DashboardMetric
          label="Period Change"
          value={`${computed.revenueDelta >= 0 ? "+" : ""}${computed.revenueDelta.toFixed(1)}%`}
          subtext="vs previous period"
          tone={computed.revenueDelta >= 0 ? "teal" : "orange"}
          icon={Zap}
        />
      </motion.section>

      {/* Main Content Grid */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 gap-6 xl:grid-cols-12"
      >
        {/* Left Column: Revenue Breakdown */}
        <GlassCard className="xl:col-span-8">
          <div className="flex items-center justify-between border-b border-white/10 p-5">
            <div>
              <h2 className="text-lg font-semibold text-[#F5F5F5]">Revenue by Platform</h2>
              <p className="mt-1 text-sm text-white/60">
                Performance breakdown for selected period.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-8 p-6 lg:flex-row">
             {/* Chart Section */}
            <div className="flex h-[300px] w-full items-center justify-center lg:w-1/3">
              {computed.platformRows.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={computed.platformRows}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="gross"
                      stroke="none"
                      onMouseEnter={(_, index) => setActiveChartIndex(index)}
                      onMouseLeave={() => setActiveChartIndex(null)}
                    >
                      {computed.platformRows.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PLATFORM_COLORS[entry.key] || PLATFORM_COLORS.default}
                          opacity={activeChartIndex === null || activeChartIndex === index ? 1 : 0.3}
                          className="transition-all duration-300"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center text-white/30">
                   <div className="mb-2 rounded-full bg-white/5 p-4">
                      <Database className="h-6 w-6" />
                   </div>
                   <p className="text-sm">No data available</p>
                </div>
              )}
            </div>

            {/* Table Section */}
            <div className="w-full lg:w-2/3">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-[#888] h-10">Platform</TableHead>
                    <TableHead className="text-right text-[#888] h-10">Net Revenue</TableHead>
                    <TableHead className="text-right text-[#888] h-10">Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {computed.platformRows.map((row, index) => (
                    <motion.tr
                      key={row.key}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onMouseEnter={() => setActiveChartIndex(index)}
                      onMouseLeave={() => setActiveChartIndex(null)}
                      className={`cursor-pointer border-b border-white/5 transition-colors ${
                        activeChartIndex === index ? "bg-white/5" : "hover:bg-white/[0.02]"
                      }`}
                    >
                      <TableCell className="font-medium text-[#F5F5F5] py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: PLATFORM_COLORS[row.key] || PLATFORM_COLORS.default }}
                          />
                          {row.label}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono-financial text-[#56C5D0] py-3">
                        {formatMoney(row.net)}
                      </TableCell>
                      <TableCell className="text-right py-3">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-mono-financial text-white/60">{row.share.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                  {computed.platformRows.length === 0 && (
                     <TableRow>
                        <TableCell colSpan={3} className="text-center text-white/40 h-24">No revenue data for this period.</TableCell>
                     </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </GlassCard>

        {/* Right Column: Insights & Actions */}
        <div className="space-y-6 xl:col-span-4">
            <GlassCard className="p-1">
              <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-black/40">
                <button
                  onClick={() => setPanelView("overview")}
                  className={`relative z-10 rounded-md py-1.5 text-xs font-medium transition-colors ${
                    panelView === "overview" ? "text-white" : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {panelView === "overview" && (
                    <motion.div
                      layoutId="panel-tab"
                      className="absolute inset-0 rounded-md bg-white/10 shadow-sm"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10">Health</span>
                </button>
                <button
                  onClick={() => setPanelView("operations")}
                  className={`relative z-10 rounded-md py-1.5 text-xs font-medium transition-colors ${
                    panelView === "operations" ? "text-white" : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {panelView === "operations" && (
                     <motion.div
                       layoutId="panel-tab"
                       className="absolute inset-0 rounded-md bg-white/10 shadow-sm"
                       transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                     />
                  )}
                  <span className="relative z-10">Actions</span>
                </button>
              </div>

              <div className="p-4">
                 <AnimatePresence mode="wait">
                    {panelView === "overview" ? (
                       <motion.div
                          key="overview"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                       >
                          <div className="space-y-4">
                             <div className="flex items-center justify-between">
                                <span className="text-sm text-white/60">Data Completeness</span>
                                <span className="font-mono-financial text-sm text-[#56C5D0]">{dataCompleteness.daysHistory} days</span>
                             </div>
                             <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                                <motion.div
                                   initial={{ width: 0 }}
                                   animate={{ width: `${Math.min(100, (dataCompleteness.daysHistory / 365) * 100)}%` }}
                                   transition={{ duration: 1, delay: 0.5 }}
                                   className="h-full rounded-full bg-[#56C5D0]"
                                />
                             </div>

                             <div className="mt-6 space-y-3">
                                <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                                   <div className={`flex h-8 w-8 items-center justify-center rounded-full ${dataCompleteness.errorPlatforms.length > 0 ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                                      {dataCompleteness.errorPlatforms.length > 0 ? <AlertTriangle className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                                   </div>
                                   <div>
                                      <p className="text-sm font-medium text-[#F5F5F5]">
                                         {dataCompleteness.errorPlatforms.length > 0 ? "Sync Issues Detected" : "Systems Healthy"}
                                      </p>
                                      <p className="text-xs text-white/50">
                                         {dataCompleteness.errorPlatforms.length} platform(s) need attention
                                      </p>
                                   </div>
                                </div>
                             </div>
                          </div>
                       </motion.div>
                    ) : (
                       <motion.div
                          key="operations"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-2"
                       >
                          {[
                             { label: "Review anomalies", count: pendingAutopsyEvents.length, path: "/RevenueAutopsy", urgent: pendingAutopsyEvents.length > 0 },
                             { label: "Resolve sync errors", count: dataCompleteness.errorPlatforms.length, path: "/ConnectedPlatforms", urgent: dataCompleteness.errorPlatforms.length > 0 },
                             { label: "Recalculate tax set-aside", count: null, path: "/TaxEstimator", urgent: false }
                          ].map((action, i) => (
                             <motion.button
                                key={action.label}
                                whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate(action.path)}
                                className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                                   action.urgent ? "border-[#F0A562]/40 bg-[#F0A562]/5" : "border-white/5 bg-white/[0.02]"
                                }`}
                             >
                                <div>
                                   <p className="text-sm font-medium text-[#F5F5F5]">{action.label}</p>
                                   {action.count !== null && (
                                      <p className={`text-xs ${action.urgent ? "text-[#F0A562]" : "text-white/50"}`}>
                                         {action.count} items pending
                                      </p>
                                   )}
                                </div>
                                <ArrowRight className="h-4 w-4 text-white/30" />
                             </motion.button>
                          ))}
                       </motion.div>
                    )}
                 </AnimatePresence>
              </div>
            </GlassCard>
        </div>
      </motion.div>

      {/* Recent Transactions Section */}
      <GlassCard className="mt-6">
        <div className="border-b border-white/10 p-5">
          <h2 className="text-lg font-semibold text-[#F5F5F5]">Recent Activity</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-[#888]">Date</TableHead>
              <TableHead className="text-[#888]">Description</TableHead>
              <TableHead className="text-[#888]">Platform</TableHead>
              <TableHead className="text-right text-[#888]">Gross</TableHead>
              <TableHead className="text-right text-[#888]">Net</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {computed.latestTransactions.map((tx, i) => (
              <motion.tr
                key={tx.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group border-b border-white/5 hover:bg-white/[0.02]"
              >
                <TableCell className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
                  {format(new Date(tx.date), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="max-w-[300px] truncate text-sm text-[#F5F5F5]">
                  {tx.description}
                </TableCell>
                <TableCell className="text-sm text-white/60">
                   <span className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/80">
                      {tx.platform}
                   </span>
                </TableCell>
                <TableCell className="text-right font-mono-financial text-white/80">
                  {formatMoney(tx.gross)}
                </TableCell>
                <TableCell className="text-right font-mono-financial text-[#56C5D0]">
                  {formatMoney(tx.gross - tx.fee)}
                </TableCell>
              </motion.tr>
            ))}
             {computed.latestTransactions.length === 0 && (
                <TableRow>
                   <TableCell colSpan={5} className="py-8 text-center text-sm text-white/40">
                      No recent activity found.
                   </TableCell>
                </TableRow>
             )}
          </TableBody>
        </Table>
      </GlassCard>
    </motion.div>
  );
}
