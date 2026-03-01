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
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import { base44 } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  GlassCard,
  InteractiveMetricCard,
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
  youtube: "#DC2626",
  patreon: "#E65C46",
  stripe: "#635BFF",
  gumroad: "#D946EF",
  instagram: "#E1306C",
  tiktok: "#000000",
  shopify: "#5E8E3E",
  substack: "#FF6719",
  default: "#4F46E5",
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
  return (
    <InteractiveMetricCard
      title={label}
      value={value}
      subtitle={subtext}
      icon={Icon}
      tone={tone}
    />
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
        <p className="mb-1 text-xs text-gray-500">{format(new Date(label), "MMM d, yyyy")}</p>
        <p className="font-mono-financial text-sm font-semibold text-gray-900">
          {formatMoney(payload[0].value)}
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

    const trendMap = new Map();
    let currentDate = new Date(range.start);
    while (currentDate <= range.end) {
      const key = format(currentDate, "yyyy-MM-dd");
      trendMap.set(key, 0);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    inRange.forEach(tx => {
      const key = format(new Date(tx.transaction_date), "yyyy-MM-dd");
      if (trendMap.has(key)) {
        trendMap.set(key, trendMap.get(key) + (tx.amount || 0));
      }
    });

    const trendData = Array.from(trendMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

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
      trendData,
    };
  }, [period, transactions, expenses]);

  const dataCompleteness = useMemo(() => {
    let firstDate = null;
    let minTime = Infinity;

    for (const tx of transactions) {
      if (!tx.transaction_date) continue;
      const date = new Date(tx.transaction_date);
      const time = date.getTime();
      if (!Number.isNaN(time) && time < minTime) {
        minTime = time;
        firstDate = date;
      }
    }

    const daysHistory = firstDate
      ? Math.max(0, differenceInCalendarDays(new Date(), firstDate) + 1)
      : 0;

    let lastSync = null;
    let maxTime = -Infinity;

    for (const platform of connectedPlatforms) {
      const dateString = platform.last_synced_at || platform.updated_at;
      if (!dateString) continue;
      const date = new Date(dateString);
      const time = date.getTime();
      if (!Number.isNaN(time) && time > maxTime) {
        maxTime = time;
        lastSync = date;
      }
    }

    const errorPlatforms = connectedPlatforms.filter(
      (platform) => platform.sync_status === "error"
    );

    return {
      daysHistory,
      platformCount: connectedPlatforms.length,
      lastSync,
      errorPlatforms,
    };
  }, [transactions, connectedPlatforms]);

  const isLoading = txLoading || platformsLoading;

  return (
    <div className="relative">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative mx-auto w-full max-w-[1400px]"
      >
        <motion.header
          variants={itemVariants}
          className="mb-8 flex flex-col gap-6 border-b border-gray-200 pb-6 xl:flex-row xl:items-start xl:justify-between"
        >
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Dashboard</h1>
            <p className="mt-1.5 text-sm text-gray-500">
              Financial overview and operational summary
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              </span>
              Last sync:{" "}
              {dataCompleteness.lastSync
                ? format(dataCompleteness.lastSync, "MMM d, yyyy h:mm a")
                : "No sync data"}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-gray-100 p-1">
            {PERIODS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setPeriod(item.value)}
                className={`relative rounded-md px-3 py-1.5 text-xs font-medium transition-all ${period === item.value
                  ? "text-indigo-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                {period === item.value && (
                  <motion.div
                    layoutId="period-highlight"
                    className="absolute inset-0 rounded-md bg-white shadow-sm ring-1 ring-indigo-100"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </button>
            ))}
            <div className="mx-1 h-5 w-px bg-gray-200" />
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                refetchTransactions();
                refetchPlatforms();
              }}
              disabled={isFetching}
              className="h-7 w-7 rounded-full p-0 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
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
            tone="indigo"
          />
          <DashboardMetric
            label="Net Revenue"
            value={formatMoney(computed.netRevenue)}
            subtext={`Est. fees: ${formatMoney(computed.estimatedFees)}`}
            tone="green"
            icon={TrendingUp}
          />
          <DashboardMetric
            label="Operating Margin"
            value={formatMoney(computed.operatingMargin)}
            subtext={`Expenses: ${formatMoney(computed.periodExpenses)}`}
            tone={computed.operatingMargin < 0 ? "red" : "blue"}
            icon={Database}
          />
          <DashboardMetric
            label="Period Change"
            value={`${computed.revenueDelta >= 0 ? "+" : ""}${computed.revenueDelta.toFixed(1)}%`}
            subtext="vs previous period"
            tone={computed.revenueDelta >= 0 ? "green" : "amber"}
            icon={Zap}
          />
        </motion.section>

        {/* Main Content Grid */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 gap-6 xl:grid-cols-12"
        >
          {/* Left Column: Revenue Breakdown */}
          <GlassCard className="xl:col-span-8 overflow-visible">
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Revenue Trend</h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  Daily revenue performance over selected period
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-8 p-6">
              <div className="h-[300px] w-full">
                {computed.trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={computed.trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(str) => format(new Date(str), "MMM d")}
                        stroke="#E5E7EB"
                        tick={{ fill: '#9CA3AF', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        minTickGap={30}
                      />
                      <YAxis
                        stroke="#E5E7EB"
                        tick={{ fill: '#9CA3AF', fontSize: 11 }}
                        tickFormatter={(val) => `$${val / 1000}k`}
                        axisLine={false}
                        tickLine={false}
                        width={50}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#C7D2FE', strokeWidth: 1, strokeDasharray: '4 4' }} />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#4F46E5"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        animationDuration={1200}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center text-gray-400">
                    <div className="mb-2 rounded-full bg-gray-50 p-4">
                      <Database className="h-5 w-5" />
                    </div>
                    <p className="text-sm">No transaction data available</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {computed.platformRows.slice(0, 4).map((row) => (
                  <div key={row.key} className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <div
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: PLATFORM_COLORS[row.key] || PLATFORM_COLORS.default }}
                      />
                      <span className="text-xs font-medium text-gray-500">{row.label}</span>
                    </div>
                    <p className="font-mono-financial text-lg font-semibold text-gray-900">{formatMoney(row.gross)}</p>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* Right Column: Insights & Actions */}
          <div className="space-y-6 xl:col-span-4">
            <GlassCard className="h-full p-1">
              <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-gray-100 mb-4 mx-3 mt-3">
                <button
                  onClick={() => setPanelView("overview")}
                  className={`relative z-10 rounded-md py-1.5 text-xs font-medium transition-colors ${panelView === "overview" ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
                    }`}
                >
                  {panelView === "overview" && (
                    <motion.div
                      layoutId="panel-tab"
                      className="absolute inset-0 rounded-md bg-white shadow-sm"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10">System Health</span>
                </button>
                <button
                  onClick={() => setPanelView("operations")}
                  className={`relative z-10 rounded-md py-1.5 text-xs font-medium transition-colors ${panelView === "operations" ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
                    }`}
                >
                  {panelView === "operations" && (
                    <motion.div
                      layoutId="panel-tab"
                      className="absolute inset-0 rounded-md bg-white shadow-sm"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10">Operations</span>
                </button>
              </div>

              <div className="px-4 pb-4">
                <AnimatePresence mode="wait">
                  {panelView === "overview" ? (
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="space-y-6">
                        <div className="relative overflow-hidden rounded-lg bg-gray-50 p-4">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Data Coverage</span>
                            <span className="font-mono-financial text-lg font-semibold text-gray-900">{dataCompleteness.daysHistory} days</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-indigo-100">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (dataCompleteness.daysHistory / 365) * 100)}%` }}
                              transition={{ duration: 1, delay: 0.2 }}
                              className="h-full rounded-full bg-indigo-500"
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h3 className="text-xs font-medium text-gray-400 uppercase">Status</h3>
                          <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-3 transition-colors hover:bg-gray-50">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${dataCompleteness.errorPlatforms.length > 0 ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                              {dataCompleteness.errorPlatforms.length > 0 ? <AlertTriangle className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {dataCompleteness.errorPlatforms.length > 0 ? "Sync Issues Detected" : "All Systems Operational"}
                              </p>
                              <p className="text-xs text-gray-500">
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
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3"
                    >
                      {[
                        { label: "Review anomalies", count: pendingAutopsyEvents.length, path: "/RevenueAutopsy", urgent: pendingAutopsyEvents.length > 0 },
                        { label: "Resolve sync errors", count: dataCompleteness.errorPlatforms.length, path: "/ConnectedPlatforms", urgent: dataCompleteness.errorPlatforms.length > 0 },
                        { label: "Recalculate tax set-aside", count: null, path: "/TaxEstimator", urgent: false }
                      ].map((action) => (
                        <motion.button
                          key={action.label}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => navigate(action.path)}
                          className={`group flex w-full items-center justify-between rounded-lg border p-4 text-left transition-all ${action.urgent
                            ? "border-amber-200 bg-amber-50"
                            : "border-gray-100 bg-white hover:bg-gray-50 hover:border-gray-200"
                            }`}
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">{action.label}</p>
                            {action.count !== null && (
                              <p className={`mt-0.5 text-xs ${action.urgent ? "text-amber-600" : "text-gray-500"}`}>
                                {action.count} items pending
                              </p>
                            )}
                          </div>
                          <ArrowRight className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${action.urgent ? "text-amber-500" : "text-gray-300"}`} />
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
          <div className="border-b border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="z-table-wrap">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-100 hover:bg-transparent">
                  <TableHead className="text-gray-500 text-xs">Date</TableHead>
                  <TableHead className="text-gray-500 text-xs">Description</TableHead>
                  <TableHead className="text-gray-500 text-xs">Platform</TableHead>
                  <TableHead className="text-right text-gray-500 text-xs">Gross</TableHead>
                  <TableHead className="text-right text-gray-500 text-xs">Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {computed.latestTransactions.map((tx, i) => (
                  <motion.tr
                    key={tx.id}
                    initial={{ opacity: 0, y: 5 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.03 }}
                    className="group border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <TableCell className="text-sm text-gray-500">
                      {format(new Date(tx.date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate text-sm text-gray-900">
                      {tx.description}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      <span className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-600">
                        {tx.platform}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono-financial text-gray-900">
                      {formatMoney(tx.gross)}
                    </TableCell>
                    <TableCell className="text-right font-mono-financial text-gray-900 font-medium">
                      {formatMoney(tx.gross - tx.fee)}
                    </TableCell>
                  </motion.tr>
                ))}
                {computed.latestTransactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-sm text-gray-400">
                      No recent activity found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
