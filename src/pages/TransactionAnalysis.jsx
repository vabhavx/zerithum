import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, eachDayOfInterval, isSameDay, subDays } from "date-fns";
import { Download, Filter, Search, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis } from "recharts";
import { base44 } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const PLATFORM_NAMES = {
  youtube: "YouTube",
  patreon: "Patreon",
  stripe: "Stripe",
  gumroad: "Gumroad",
  instagram: "Instagram",
  tiktok: "TikTok",
  shopify: "Shopify",
  substack: "Substack",
};

const CATEGORY_NAMES = {
  ad_revenue: "Ad revenue",
  sponsorship: "Sponsorship",
  affiliate: "Affiliate",
  product_sale: "Product sale",
  membership: "Membership",
  service: "Service",
};

const STATUS_NAMES = {
  completed: "Completed",
  pending: "Pending",
  unmatched: "Unmatched",
  refunded: "Refunded",
  failed: "Failed",
  reviewed: "Reviewed",
};

const QUICK_VIEWS = [
  { value: "all", label: "All" },
  { value: "unmatched", label: "Needs match" },
  { value: "refunded", label: "Refunds" },
  { value: "failed", label: "Failed" },
];

const PAGE_SIZE_OPTIONS = [20, 50, 100];

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatMoney(value) {
  return money.format(value || 0);
}

function calcNet(transaction) {
  return (transaction.amount || 0) - (transaction.platform_fee || 0);
}

export default function TransactionAnalysis() {
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [quickView, setQuickView] = useState("all");
  const [density, setDensity] = useState("comfortable");
  const [sortField, setSortField] = useState("transaction_date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  const [showVolumeChart, setShowVolumeChart] = useState(true);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["revenueTransactions"],
    queryFn: () => base44.entities.RevenueTransaction.list("-transaction_date", 3000),
    staleTime: 1000 * 60 * 5,
  });

  const effectiveStatusFilter = quickView === "all" ? statusFilter : quickView;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    const rows = transactions.filter((transaction) => {
      if (platformFilter !== "all" && transaction.platform !== platformFilter) return false;
      if (categoryFilter !== "all" && transaction.category !== categoryFilter) return false;
      if (
        effectiveStatusFilter !== "all" &&
        (transaction.status || "completed") !== effectiveStatusFilter
      ) {
        return false;
      }

      if (query) {
        const text = [
          transaction.description,
          transaction.platform_transaction_id,
          transaction.platform,
          transaction.category,
          transaction.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!text.includes(query)) return false;
      }

      return true;
    });

    const direction = sortDirection === "asc" ? 1 : -1;

    rows.sort((left, right) => {
      let leftValue = left[sortField];
      let rightValue = right[sortField];

      if (sortField === "transaction_date") {
        leftValue = new Date(leftValue || 0).getTime();
        rightValue = new Date(rightValue || 0).getTime();
      }

      if (sortField === "amount" || sortField === "platform_fee") {
        leftValue = Number(leftValue || 0);
        rightValue = Number(rightValue || 0);
      }

      if (leftValue === rightValue) return 0;
      return leftValue > rightValue ? direction : -direction;
    });

    return rows;
  }, [
    transactions,
    search,
    platformFilter,
    categoryFilter,
    effectiveStatusFilter,
    sortField,
    sortDirection,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const totals = useMemo(() => {
    const gross = filtered.reduce((sum, row) => sum + (row.amount || 0), 0);
    const fee = filtered.reduce((sum, row) => sum + (row.platform_fee || 0), 0);
    const net = gross - fee;

    const statusBreakdown = filtered.reduce(
      (acc, row) => {
        const status = row.status || "completed";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      { completed: 0, unmatched: 0, refunded: 0, failed: 0, pending: 0 }
    );

    return {
      count: filtered.length,
      gross,
      fee,
      net,
      statusBreakdown,
    };
  }, [filtered]);

  // Volume Chart Data: Aggregate filtered transactions by date (last 30 days of data in view)
  const volumeData = useMemo(() => {
    if (filtered.length === 0) return [];

    // Find range of current filtered data, cap at last 30 days if too large
    const dates = filtered
      .map(t => new Date(t.transaction_date))
      .filter(d => !Number.isNaN(d.getTime()))
      .sort((a,b) => a - b);

    if (dates.length === 0) return [];

    const end = dates[dates.length - 1];
    const start = dates[0];

    // If range is huge, just take last 30 days relative to the latest transaction
    const rangeStart = (end - start > 30 * 24 * 60 * 60 * 1000) ? subDays(end, 30) : start;

    const days = eachDayOfInterval({ start: rangeStart, end });

    return days.map(day => {
      const dayTotal = filtered
        .filter(tx => isSameDay(new Date(tx.transaction_date), day))
        .reduce((sum, tx) => sum + (tx.amount || 0), 0);
      return {
        date: format(day, "MMM d"),
        value: dayTotal
      };
    });
  }, [filtered]);


  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortField(field);
    setSortDirection("desc");
  };

  const clearFilters = () => {
    setSearch("");
    setPlatformFilter("all");
    setCategoryFilter("all");
    setStatusFilter("all");
    setQuickView("all");
    setSortField("transaction_date");
    setSortDirection("desc");
    setPage(1);
  };

  const exportCsv = () => {
    const headers = [
      "Date",
      "Platform",
      "Category",
      "Status",
      "Description",
      "Amount",
      "Platform Fee",
      "Net",
      "Platform Transaction ID",
    ];

    const body = filtered.map((transaction) => [
      transaction.transaction_date
        ? format(new Date(transaction.transaction_date), "yyyy-MM-dd")
        : "",
      PLATFORM_NAMES[transaction.platform] || transaction.platform || "",
      CATEGORY_NAMES[transaction.category] || transaction.category || "",
      STATUS_NAMES[transaction.status] || transaction.status || "Completed",
      transaction.description || "",
      (transaction.amount || 0).toFixed(2),
      (transaction.platform_fee || 0).toFixed(2),
      calcNet(transaction).toFixed(2),
      transaction.platform_transaction_id || "",
    ]);

    const csv = [headers, ...body]
      .map((line) =>
        line
          .map((value) => {
            const safe = String(value ?? "").replaceAll('"', '""');
            return `"${safe}"`;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `zerithum-transactions-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(url);
    link.remove();
  };

  return (
    <PageTransition className="mx-auto w-full max-w-[1400px] p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-6 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#F5F5F5]">Transactions</h1>
          <p className="mt-2 text-base text-white/70">
            Interactive transaction intelligence and audit trail.
          </p>
        </div>

        <div className="flex gap-2">
           <Button
             type="button"
             variant="outline"
             onClick={() => setShowVolumeChart(!showVolumeChart)}
             className={`h-9 border-white/20 bg-transparent text-[#F5F5F5] hover:bg-white/10 ${showVolumeChart ? "bg-white/10" : ""}`}
           >
             <BarChart3 className="mr-2 h-4 w-4" />
             {showVolumeChart ? "Hide Volume" : "Show Volume"}
           </Button>
           <Button
            type="button"
            variant="outline"
            onClick={exportCsv}
            className="h-9 border-white/20 bg-transparent text-[#F5F5F5] hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#56C5D0]"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AnimatedItem delay={0.1}>
          <InteractiveMetricCard
            title="Filtered Records"
            value={String(totals.count)}
            sub="Based on active controls"
          />
        </AnimatedItem>
        <AnimatedItem delay={0.2}>
          <InteractiveMetricCard
            title="Gross Volume"
            value={formatMoney(totals.gross)}
            sub="Before fees"
          />
        </AnimatedItem>
        <AnimatedItem delay={0.3}>
          <InteractiveMetricCard
            title="Platform Fees"
            value={formatMoney(totals.fee)}
            sub="Reported fees"
            tone="orange"
          />
        </AnimatedItem>
        <AnimatedItem delay={0.4}>
          <InteractiveMetricCard
            title="Net Revenue"
            value={formatMoney(totals.net)}
            sub="Gross minus fees"
            tone="teal"
          />
        </AnimatedItem>
      </div>

      {/* Volume Chart */}
      <AnimatePresence>
        {showVolumeChart && volumeData.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-6 overflow-hidden"
          >
            <ChartContainer height={180}>
              <BarChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ backgroundColor: '#09090b', borderColor: 'rgba(255,255,255,0.1)' }}
                  itemStyle={{ color: '#56C5D0' }}
                  labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                />
                <Bar dataKey="value" fill="#56C5D0" radius={[4, 4, 0, 0]} fillOpacity={0.8} />
              </BarChart>
            </ChartContainer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Bar */}
      <AnimatedItem delay={0.2} className="mb-6">
        <GlassCard variant="panel" className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Quick Views */}
            <div className="flex flex-wrap gap-2">
              {QUICK_VIEWS.map((view) => (
                <button
                  key={view.value}
                  type="button"
                  onClick={() => {
                    setPage(1);
                    setQuickView(view.value);
                  }}
                  className={`h-8 rounded-md border px-3 text-sm transition-all ${
                    quickView === view.value
                      ? "border-[#56C5D0]/45 bg-[#56C5D0]/10 text-[#56C5D0]"
                      : "border-white/20 bg-transparent text-white/70 hover:bg-white/10"
                  }`}
                >
                  {view.label}
                </button>
              ))}

              <div className="h-8 w-px bg-white/10 mx-2 hidden lg:block" />

              <button
                type="button"
                onClick={() => setDensity((prev) => (prev === "comfortable" ? "compact" : "comfortable"))}
                className="h-8 rounded-md border border-white/20 bg-transparent px-3 text-sm text-white/70 transition hover:bg-white/10"
              >
                {density === "comfortable" ? "Compact View" : "Comfortable View"}
              </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-1 lg:justify-end">
              <div className="relative w-full lg:max-w-[240px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                <Input
                  value={search}
                  onChange={(event) => {
                    setPage(1);
                    setSearch(event.target.value);
                  }}
                  placeholder="Search transactions..."
                  className="h-9 border-white/15 bg-[#0A0A0A] pl-9 text-[#F5F5F5] focus-visible:ring-2 focus-visible:ring-[#56C5D0]"
                />
              </div>

              <Select
                value={platformFilter}
                onValueChange={(value) => {
                  setPage(1);
                  setPlatformFilter(value);
                }}
              >
                <SelectTrigger className="h-9 w-full lg:w-[140px] border-white/15 bg-[#0A0A0A] text-[#F5F5F5] focus:ring-2 focus:ring-[#56C5D0]">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#0F0F12] text-[#F5F5F5]">
                  <SelectItem value="all">All Platforms</SelectItem>
                  {Object.entries(PLATFORM_NAMES).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setPage(1);
                  setStatusFilter(value);
                  setQuickView("all");
                }}
              >
                <SelectTrigger className="h-9 w-full lg:w-[130px] border-white/15 bg-[#0A0A0A] text-[#F5F5F5] focus:ring-2 focus:ring-[#56C5D0]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#0F0F12] text-[#F5F5F5]">
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(STATUS_NAMES).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={clearFilters}
                className="h-9 w-9 text-white/50 hover:bg-white/10 hover:text-white"
                title="Reset Filters"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </GlassCard>
      </AnimatedItem>

      {/* Transactions Table */}
      <AnimatedItem delay={0.3}>
        <GlassCard className="overflow-hidden">
          <Table>
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead
                  className="cursor-pointer text-xs font-medium uppercase text-white/50 hover:text-[#56C5D0] transition-colors"
                  onClick={() => handleSort("transaction_date")}
                >
                  Date {sortField === "transaction_date" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                </TableHead>
                <TableHead className="text-xs font-medium uppercase text-white/50">Platform</TableHead>
                <TableHead className="text-xs font-medium uppercase text-white/50">Category</TableHead>
                <TableHead className="text-xs font-medium uppercase text-white/50">Status</TableHead>
                <TableHead className="text-xs font-medium uppercase text-white/50">Description</TableHead>
                <TableHead
                  className="cursor-pointer text-right text-xs font-medium uppercase text-white/50 hover:text-[#56C5D0] transition-colors"
                  onClick={() => handleSort("amount")}
                >
                  Amount {sortField === "amount" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                </TableHead>
                <TableHead
                  className="cursor-pointer text-right text-xs font-medium uppercase text-white/50 hover:text-[#56C5D0] transition-colors"
                  onClick={() => handleSort("platform_fee")}
                >
                  Fee {sortField === "platform_fee" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                </TableHead>
                <TableHead className="text-right text-xs font-medium uppercase text-white/50">Net</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedRows.length === 0 && (
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableCell colSpan={8} className="py-20 text-center text-sm text-white/40">
                    {isLoading ? "Loading transactions..." : "No transactions match your filters."}
                  </TableCell>
                </TableRow>
              )}
              {pagedRows.map((transaction, index) => {
                const fee = transaction.platform_fee || 0;
                const net = calcNet(transaction);
                const status = transaction.status || "completed";
                return (
                  <motion.tr
                    key={transaction.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-b border-white/5 transition-colors hover:bg-white/[0.03]"
                  >
                    <TableCell className={`${density === "compact" ? "py-2" : "py-3"} text-sm text-white/75 font-mono`}>
                      {transaction.transaction_date
                        ? format(new Date(transaction.transaction_date), "MMM d, yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell className={`${density === "compact" ? "py-2" : "py-3"} text-sm text-[#F5F5F5]`}>
                      {PLATFORM_NAMES[transaction.platform] || transaction.platform || "Unknown"}
                    </TableCell>
                    <TableCell className={`${density === "compact" ? "py-2" : "py-3"} text-sm text-white/60`}>
                      {CATEGORY_NAMES[transaction.category] || transaction.category || "-"}
                    </TableCell>
                    <TableCell className={density === "compact" ? "py-2" : "py-3"}>
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border ${
                        status === "completed" ? "border-green-500/20 bg-green-500/10 text-green-500" :
                        status === "pending" ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-500" :
                        status === "failed" ? "border-red-500/20 bg-red-500/10 text-red-500" :
                        "border-white/10 bg-white/5 text-white/60"
                      }`}>
                        {STATUS_NAMES[status] || status}
                      </span>
                    </TableCell>
                    <TableCell className={`${density === "compact" ? "py-2" : "py-3"} max-w-[250px] truncate text-sm text-white/60`}>
                      {transaction.description || "-"}
                    </TableCell>
                    <TableCell className={`${density === "compact" ? "py-2" : "py-3"} text-right font-mono-financial text-[#F5F5F5]`}>
                      {formatMoney(transaction.amount || 0)}
                    </TableCell>
                    <TableCell className={`${density === "compact" ? "py-2" : "py-3"} text-right font-mono-financial text-[#F0A562]`}>
                      {formatMoney(fee)}
                    </TableCell>
                    <TableCell className={`${density === "compact" ? "py-2" : "py-3"} text-right font-mono-financial text-[#56C5D0]`}>
                      {formatMoney(net)}
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>
        </GlassCard>
      </AnimatedItem>

      {/* Pagination */}
      <section className="mt-4 flex flex-col gap-2 px-1 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-white/50">
          Page {page} of {totalPages} • {filtered.length} records
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              setPage(1);
              setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[100px] border-white/20 bg-transparent text-xs text-[#F5F5F5]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#0F0F12] text-[#F5F5F5]">
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="h-8 border-white/20 bg-transparent text-[#F5F5F5] hover:bg-white/10"
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="h-8 border-white/20 bg-transparent text-[#F5F5F5] hover:bg-white/10"
            >
              Next
            </Button>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
