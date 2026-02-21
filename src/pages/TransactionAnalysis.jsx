import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Download, Filter, Search } from "lucide-react";
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

function SummaryCard({ label, value, helper, tone = "neutral" }) {
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
      <p className="mt-1 text-xs text-white/60">{helper}</p>
    </div>
  );
}

export default function TransactionAnalysis() {
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("transaction_date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [page, setPage] = useState(1);

  const pageSize = 20;

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["revenueTransactions"],
    queryFn: () => base44.entities.RevenueTransaction.list("-transaction_date", 3000),
    staleTime: 1000 * 60 * 5,
  });

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    const rows = transactions.filter((transaction) => {
      if (platformFilter !== "all" && transaction.platform !== platformFilter) return false;
      if (categoryFilter !== "all" && transaction.category !== categoryFilter) return false;
      if (statusFilter !== "all" && (transaction.status || "completed") !== statusFilter) return false;

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
  }, [transactions, search, platformFilter, categoryFilter, statusFilter, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const totals = useMemo(() => {
    const gross = filtered.reduce((sum, row) => sum + (row.amount || 0), 0);
    const fee = filtered.reduce((sum, row) => sum + (row.platform_fee || 0), 0);
    const net = gross - fee;
    return {
      count: filtered.length,
      gross,
      fee,
      net,
    };
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
      transaction.transaction_date ? format(new Date(transaction.transaction_date), "yyyy-MM-dd") : "",
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
    <div className="mx-auto w-full max-w-[1400px] rounded-2xl border border-white/10 bg-[#0A0A0A] p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#F5F5F5]">Transactions</h1>
          <p className="mt-1 text-sm text-white/70">
            Filter, inspect, and export transaction records with clear fee and net visibility.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={exportCsv}
          className="h-9 border-white/20 bg-transparent text-[#F5F5F5] hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#56C5D0]"
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </header>

      <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Filtered records"
          value={String(totals.count)}
          helper="Based on active filter set"
        />
        <SummaryCard
          label="Gross"
          value={formatMoney(totals.gross)}
          helper="Before fees"
        />
        <SummaryCard
          label="Fees"
          value={formatMoney(totals.fee)}
          helper="Reported platform fees"
          tone="orange"
        />
        <SummaryCard
          label="Net"
          value={formatMoney(totals.net)}
          helper="Gross minus fees"
          tone="teal"
        />
      </section>

      <section className="mb-6 rounded-xl border border-white/10 bg-[#111114] p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="relative xl:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
            <Input
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
              placeholder="Search description, platform ID, category"
              className="h-9 border-white/15 bg-[#15151A] pl-9 text-[#F5F5F5] focus-visible:ring-2 focus-visible:ring-[#56C5D0]"
            />
          </div>

          <Select
            value={platformFilter}
            onValueChange={(value) => {
              setPage(1);
              setPlatformFilter(value);
            }}
          >
            <SelectTrigger className="h-9 border-white/15 bg-[#15151A] text-[#F5F5F5] focus:ring-2 focus:ring-[#56C5D0]">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#0F0F12] text-[#F5F5F5]">
              <SelectItem value="all">All platforms</SelectItem>
              {Object.entries(PLATFORM_NAMES).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={categoryFilter}
            onValueChange={(value) => {
              setPage(1);
              setCategoryFilter(value);
            }}
          >
            <SelectTrigger className="h-9 border-white/15 bg-[#15151A] text-[#F5F5F5] focus:ring-2 focus:ring-[#56C5D0]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#0F0F12] text-[#F5F5F5]">
              <SelectItem value="all">All categories</SelectItem>
              {Object.entries(CATEGORY_NAMES).map(([value, label]) => (
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
            }}
          >
            <SelectTrigger className="h-9 border-white/15 bg-[#15151A] text-[#F5F5F5] focus:ring-2 focus:ring-[#56C5D0]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#0F0F12] text-[#F5F5F5]">
              <SelectItem value="all">All statuses</SelectItem>
              {Object.entries(STATUS_NAMES).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={clearFilters}
            className="h-8 border-white/20 bg-transparent px-3 text-xs text-[#F5F5F5] hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#56C5D0]"
          >
            <Filter className="mr-1.5 h-3.5 w-3.5" />
            Reset filters
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-[#111114]">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead
                className="cursor-pointer text-[#D8D8D8]"
                onClick={() => handleSort("transaction_date")}
              >
                Date {sortField === "transaction_date" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
              </TableHead>
              <TableHead className="text-[#D8D8D8]">Platform</TableHead>
              <TableHead className="text-[#D8D8D8]">Category</TableHead>
              <TableHead className="text-[#D8D8D8]">Status</TableHead>
              <TableHead className="text-[#D8D8D8]">Description</TableHead>
              <TableHead
                className="cursor-pointer text-right text-[#D8D8D8]"
                onClick={() => handleSort("amount")}
              >
                Amount {sortField === "amount" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
              </TableHead>
              <TableHead
                className="cursor-pointer text-right text-[#D8D8D8]"
                onClick={() => handleSort("platform_fee")}
              >
                Fee {sortField === "platform_fee" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
              </TableHead>
              <TableHead className="text-right text-[#D8D8D8]">Net</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedRows.length === 0 && (
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableCell colSpan={8} className="py-10 text-center text-sm text-white/60">
                  {isLoading ? "Loading transactions..." : "No transactions match your filters."}
                </TableCell>
              </TableRow>
            )}
            {pagedRows.map((transaction) => {
              const fee = transaction.platform_fee || 0;
              const net = calcNet(transaction);
              const status = transaction.status || "completed";
              return (
                <TableRow key={transaction.id} className="border-white/10 hover:bg-white/[0.02]">
                  <TableCell className="text-sm text-white/75">
                    {transaction.transaction_date ? format(new Date(transaction.transaction_date), "MMM d, yyyy") : "-"}
                  </TableCell>
                  <TableCell className="text-sm text-[#F5F5F5]">
                    {PLATFORM_NAMES[transaction.platform] || transaction.platform || "Unknown"}
                  </TableCell>
                  <TableCell className="text-sm text-white/75">
                    {CATEGORY_NAMES[transaction.category] || transaction.category || "-"}
                  </TableCell>
                  <TableCell>
                    <span className="rounded-md border border-white/20 bg-white/5 px-2 py-1 text-xs text-white/80">
                      {STATUS_NAMES[status] || status}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate text-sm text-white/75">
                    {transaction.description || "-"}
                  </TableCell>
                  <TableCell className="text-right font-mono-financial text-[#F5F5F5]">
                    {formatMoney(transaction.amount || 0)}
                  </TableCell>
                  <TableCell className="text-right font-mono-financial text-[#F0A562]">
                    {formatMoney(fee)}
                  </TableCell>
                  <TableCell className="text-right font-mono-financial text-[#56C5D0]">
                    {formatMoney(net)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </section>

      <section className="mt-4 flex items-center justify-between rounded-lg border border-white/10 bg-[#111114] px-4 py-3">
        <p className="text-sm text-white/70">
          Page {page} of {totalPages} • {filtered.length} filtered records
        </p>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="h-8 border-white/20 bg-transparent text-[#F5F5F5] hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#56C5D0]"
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            className="h-8 border-white/20 bg-transparent text-[#F5F5F5] hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#56C5D0]"
          >
            Next
          </Button>
        </div>
      </section>
    </div>
  );
}
