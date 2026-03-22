import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, eachDayOfInterval, isSameDay, subDays } from "date-fns";
import { Download, Filter, Search, BarChart3, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis } from "recharts";
import { entities } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageTransition, AnimatedItem } from "@/components/ui/PageTransition";
import { ChartContainer } from "@/components/ui/ChartContainer";
import { GlassCard, InteractiveMetricCard } from "@/components/ui/glass-card";

const PLATFORM_NAMES = { youtube: "YouTube", patreon: "Patreon", stripe: "Stripe", gumroad: "Gumroad", instagram: "Instagram", tiktok: "TikTok", shopify: "Shopify", substack: "Substack" };
const CATEGORY_NAMES = { ad_revenue: "Ad revenue", sponsorship: "Sponsorship", affiliate: "Affiliate", product_sale: "Product sale", membership: "Membership", service: "Service" };
const STATUS_NAMES = { completed: "Completed", pending: "Pending", unmatched: "Unmatched", refunded: "Refunded", failed: "Failed", reviewed: "Reviewed" };
const QUICK_VIEWS = [{ value: "all", label: "All" }, { value: "unmatched", label: "Needs match" }, { value: "refunded", label: "Refunds" }, { value: "failed", label: "Failed" }];
const PAGE_SIZE_OPTIONS = [20, 50, 100];
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
function formatMoney(v) { return money.format(v || 0); }
function calcNet(t) { if (t.net_amount != null && t.net_amount > 0) return t.net_amount; return (t.amount || 0) - (t.fee || t.platform_fee || 0); }

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
    queryFn: () => entities.RevenueTransaction.list("-transaction_date", 3000),
    staleTime: 1000 * 60 * 5,
  });

  const effectiveStatusFilter = quickView === "all" ? statusFilter : quickView;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const rows = transactions.filter((t) => {
      if (platformFilter !== "all" && t.platform !== platformFilter) return false;
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
      if (effectiveStatusFilter !== "all" && (t.status || "completed") !== effectiveStatusFilter) return false;
      if (query) { const text = [t.description, t.platform_transaction_id, t.platform, t.category, t.status].filter(Boolean).join(" ").toLowerCase(); if (!text.includes(query)) return false; }
      return true;
    });
    const direction = sortDirection === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      let av = a[sortField], bv = b[sortField];
      if (sortField === "transaction_date") { av = new Date(av || 0).getTime(); bv = new Date(bv || 0).getTime(); }
      if (sortField === "amount" || sortField === "platform_fee") { av = Number(av || 0); bv = Number(bv || 0); }
      if (av === bv) return 0;
      return av > bv ? direction : -direction;
    });
    return rows;
  }, [transactions, search, platformFilter, categoryFilter, effectiveStatusFilter, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pagedRows = useMemo(() => { const start = (page - 1) * pageSize; return filtered.slice(start, start + pageSize); }, [filtered, page, pageSize]);

  const totals = useMemo(() => {
    const gross = filtered.reduce((s, r) => s + (r.amount || 0), 0);
    const fee = filtered.reduce((s, r) => s + (r.platform_fee || 0), 0);
    return { count: filtered.length, gross, fee, net: gross - fee };
  }, [filtered]);

  const volumeData = useMemo(() => {
    if (filtered.length === 0) return [];
    const dates = filtered.map(t => new Date(t.transaction_date)).filter(d => !Number.isNaN(d.getTime())).sort((a, b) => a - b);
    if (dates.length === 0) return [];
    const end = dates[dates.length - 1];
    const start = dates[0];
    const rangeStart = (end - start > 30 * 24 * 60 * 60 * 1000) ? subDays(end, 30) : start;
    return eachDayOfInterval({ start: rangeStart, end }).map(day => ({
      date: format(day, "MMM d"),
      value: filtered.filter(tx => isSameDay(new Date(tx.transaction_date), day)).reduce((s, tx) => s + (tx.amount || 0), 0)
    }));
  }, [filtered]);

  const handleSort = (field) => { if (field === sortField) { setSortDirection((p) => (p === "asc" ? "desc" : "asc")); return; } setSortField(field); setSortDirection("desc"); };
  const clearFilters = () => { setSearch(""); setPlatformFilter("all"); setCategoryFilter("all"); setStatusFilter("all"); setQuickView("all"); setSortField("transaction_date"); setSortDirection("desc"); setPage(1); };

  const exportCsv = () => {
    const headers = ["Date", "Platform", "Category", "Status", "Description", "Amount", "Platform Fee", "Net", "Platform Transaction ID"];
    const body = filtered.map((t) => [t.transaction_date ? format(new Date(t.transaction_date), "yyyy-MM-dd") : "", PLATFORM_NAMES[t.platform] || t.platform || "", CATEGORY_NAMES[t.category] || t.category || "", STATUS_NAMES[t.status] || t.status || "Completed", t.description || "", (t.amount || 0).toFixed(2), (t.fee || t.platform_fee || 0).toFixed(2), calcNet(t).toFixed(2), t.platform_transaction_id || ""]);
    const csv = [headers, ...body].map((line) => line.map((v) => { const safe = String(v ?? "").replaceAll('"', '""'); return `"${safe}"`; }).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `zerithum-transactions-${format(new Date(), "yyyy-MM-dd")}.csv`; document.body.appendChild(link); link.click(); URL.revokeObjectURL(url); link.remove();
  };

  const escapeHTML = (str) => typeof str !== "string" ? str : str.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m] || m));

  const exportPdf = () => {
    const pw = window.open("", "_blank");
    if (!pw) return;
    const rows = filtered.map((t) =>
      `<tr><td>${escapeHTML(t.transaction_date ? format(new Date(t.transaction_date), "yyyy-MM-dd") : "")}</td><td>${escapeHTML(PLATFORM_NAMES[t.platform] || t.platform || "")}</td><td>${escapeHTML(CATEGORY_NAMES[t.category] || t.category || "")}</td><td>${escapeHTML(t.description || "")}</td><td style="text-align:right">$${(t.amount || 0).toFixed(2)}</td><td style="text-align:right">$${(t.fee || t.platform_fee || 0).toFixed(2)}</td><td style="text-align:right">$${calcNet(t).toFixed(2)}</td></tr>`
    ).join("");
    pw.document.write(`<html><head><title>Zerithum Transaction Report</title><style>body{font-family:Inter,Arial,sans-serif;padding:24px;color:#111827;max-width:1100px;margin:0 auto}h1{font-size:20px;margin-bottom:4px}p.sub{color:#6B7280;font-size:13px;margin-bottom:24px}.stats{display:flex;gap:32px;margin-bottom:24px}.stat{font-size:13px;color:#6B7280}.stat strong{display:block;font-size:18px;color:#111827}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#F9FAFB;text-align:left;padding:8px 10px;border-bottom:2px solid #E5E7EB;text-transform:uppercase;color:#6B7280;font-size:10px;letter-spacing:0.05em}td{padding:7px 10px;border-bottom:1px solid #F3F4F6}tr:hover td{background:#FAFAFA}</style></head><body><h1>Transaction Report</h1><p class="sub">Generated ${format(new Date(), "MMM d, yyyy")} &bull; ${filtered.length} transactions</p><div class="stats"><div class="stat"><strong>$${totals.gross.toFixed(2)}</strong>Gross Revenue</div><div class="stat"><strong>$${totals.fee.toFixed(2)}</strong>Platform Fees</div><div class="stat"><strong>$${totals.net.toFixed(2)}</strong>Net Revenue</div></div><table><thead><tr><th>Date</th><th>Platform</th><th>Category</th><th>Description</th><th style="text-align:right">Amount</th><th style="text-align:right">Fee</th><th style="text-align:right">Net</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
    pw.document.close();
    setTimeout(() => pw.print(), 300);
  };

  return (
    <PageTransition className="mx-auto w-full max-w-[1400px]">
      <header className="mb-6 flex flex-col gap-4 border-b border-gray-200 pb-6 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Transactions</h1>
          <p className="mt-1.5 text-sm text-gray-500">Revenue transaction log with filtering and export.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setShowVolumeChart(!showVolumeChart)} className={`h-9 border-gray-200 text-gray-600 hover:bg-gray-50 ${showVolumeChart ? "bg-gray-50" : ""}`}>
            <BarChart3 className="mr-2 h-4 w-4" />{showVolumeChart ? "Hide Volume" : "Show Volume"}
          </Button>
          <Button type="button" variant="outline" onClick={exportCsv} className="h-9 border-gray-200 text-gray-600 hover:bg-gray-50">
            <Download className="mr-2 h-4 w-4" />Export CSV
          </Button>
          <Button type="button" variant="outline" onClick={exportPdf} className="h-9 border-gray-200 text-gray-600 hover:bg-gray-50">
            <FileText className="mr-2 h-4 w-4" />Export PDF
          </Button>
        </div>
      </header>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AnimatedItem delay={0.1}><InteractiveMetricCard title="Filtered Records" value={String(totals.count)} sub="Based on active controls" /></AnimatedItem>
        <AnimatedItem delay={0.2}><InteractiveMetricCard title="Gross Volume" value={formatMoney(totals.gross)} sub="Before fees" /></AnimatedItem>
        <AnimatedItem delay={0.3}><InteractiveMetricCard title="Platform Fees" value={formatMoney(totals.fee)} sub="Reported fees" tone="amber" /></AnimatedItem>
        <AnimatedItem delay={0.4}><InteractiveMetricCard title="Net Revenue" value={formatMoney(totals.net)} sub="Gross minus fees" tone="green" /></AnimatedItem>
      </div>

      <AnimatePresence>
        {showVolumeChart && volumeData.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-6 overflow-hidden">
            <ChartContainer height={180}>
              <BarChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} contentStyle={{ backgroundColor: '#fff', borderColor: '#E5E7EB', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} itemStyle={{ color: '#111827' }} labelStyle={{ color: '#6B7280' }} />
                <Bar dataKey="value" fill="#4F46E5" radius={[4, 4, 0, 0]} fillOpacity={0.85} />
              </BarChart>
            </ChartContainer>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatedItem delay={0.2} className="mb-6">
        <GlassCard variant="panel" className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-1">
              {QUICK_VIEWS.map((view) => (
                <button key={view.value} type="button" onClick={() => { setPage(1); setQuickView(view.value); }} className={`h-8 rounded-md px-3 text-sm font-medium transition-all ${quickView === view.value ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"}`}>{view.label}</button>
              ))}
              <div className="h-8 w-px bg-gray-200 mx-2 hidden lg:block" />
              <button type="button" onClick={() => setDensity((p) => (p === "comfortable" ? "compact" : "comfortable"))} className="h-8 rounded-md border border-gray-200 px-3 text-sm text-gray-500 transition hover:bg-gray-50">{density === "comfortable" ? "Compact View" : "Comfortable View"}</button>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-1 lg:justify-end">
              <div className="relative w-full lg:max-w-[240px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                <Input value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} placeholder="Search transactions..." className="h-9 border-gray-200 bg-white pl-9 text-gray-900 focus-visible:border-gray-400 focus-visible:ring-0" />
              </div>
              <Select value={platformFilter} onValueChange={(v) => { setPage(1); setPlatformFilter(v); }}>
                <SelectTrigger className="h-9 w-full lg:w-[140px] border-gray-200 bg-white text-gray-700"><SelectValue placeholder="Platform" /></SelectTrigger>
                <SelectContent className="border-gray-200 bg-white text-gray-900"><SelectItem value="all">All Platforms</SelectItem>{Object.entries(PLATFORM_NAMES).map(([v, l]) => (<SelectItem key={v} value={v}>{l}</SelectItem>))}</SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => { setPage(1); setStatusFilter(v); setQuickView("all"); }}>
                <SelectTrigger className="h-9 w-full lg:w-[130px] border-gray-200 bg-white text-gray-700"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent className="border-gray-200 bg-white text-gray-900"><SelectItem value="all">All Status</SelectItem>{Object.entries(STATUS_NAMES).map(([v, l]) => (<SelectItem key={v} value={v}>{l}</SelectItem>))}</SelectContent>
              </Select>
              <Button type="button" variant="ghost" size="icon" onClick={clearFilters} className="h-9 w-9 text-gray-400 hover:bg-gray-100 hover:text-gray-600" title="Reset Filters"><Filter className="h-4 w-4" /></Button>
            </div>
          </div>
        </GlassCard>
      </AnimatedItem>

      <AnimatedItem delay={0.3}>
        <GlassCard className="overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow className="border-gray-100 hover:bg-transparent">
                <TableHead className="cursor-pointer text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors" onClick={() => handleSort("transaction_date")}>Date {sortField === "transaction_date" ? (sortDirection === "asc" ? "↑" : "↓") : ""}</TableHead>
                <TableHead className="text-xs font-medium text-gray-500">Platform</TableHead>
                <TableHead className="text-xs font-medium text-gray-500">Category</TableHead>
                <TableHead className="text-xs font-medium text-gray-500">Status</TableHead>
                <TableHead className="text-xs font-medium text-gray-500">Description</TableHead>
                <TableHead className="cursor-pointer text-right text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors" onClick={() => handleSort("amount")}>Amount {sortField === "amount" ? (sortDirection === "asc" ? "↑" : "↓") : ""}</TableHead>
                <TableHead className="cursor-pointer text-right text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors" onClick={() => handleSort("platform_fee")}>Fee {sortField === "platform_fee" ? (sortDirection === "asc" ? "↑" : "↓") : ""}</TableHead>
                <TableHead className="text-right text-xs font-medium text-gray-500">Net</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedRows.length === 0 && (
                <TableRow className="border-gray-100 hover:bg-transparent"><TableCell colSpan={8} className="py-20 text-center text-sm text-gray-400">{isLoading ? "Loading transactions..." : "No transactions match your filters."}</TableCell></TableRow>
              )}
              {pagedRows.map((t, index) => {
                const fee = t.fee || t.platform_fee || 0;
                const net = calcNet(t);
                const status = t.status || "completed";
                return (
                  <motion.tr key={t.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.01, type: "spring", stiffness: 600, damping: 40 }} className="border-b border-gray-100 transition-colors hover:bg-gray-50/50">
                    <TableCell className={`${density === "compact" ? "py-2" : "py-3"} text-sm text-gray-500`}>{t.transaction_date ? format(new Date(t.transaction_date), "MMM d, yyyy") : "-"}</TableCell>
                    <TableCell className={`${density === "compact" ? "py-2" : "py-3"} text-sm text-gray-900`}>{PLATFORM_NAMES[t.platform] || t.platform || "Unknown"}</TableCell>
                    <TableCell className={`${density === "compact" ? "py-2" : "py-3"} text-sm text-gray-500`}>{CATEGORY_NAMES[t.category] || t.category || "-"}</TableCell>
                    <TableCell className={density === "compact" ? "py-2" : "py-3"}>
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border ${status === "completed" ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
                        status === "pending" ? "border-amber-200 bg-amber-50 text-amber-700" :
                          status === "failed" ? "border-red-200 bg-red-50 text-red-700" :
                            "border-gray-200 bg-gray-50 text-gray-600"
                        }`}>{STATUS_NAMES[status] || status}</span>
                    </TableCell>
                    <TableCell className={`${density === "compact" ? "py-2" : "py-3"} max-w-[250px] truncate text-sm text-gray-500`}>{t.description || "-"}</TableCell>
                    <TableCell className={`${density === "compact" ? "py-2" : "py-3"} text-right font-mono-financial text-gray-900`}>{formatMoney(t.amount || 0)}</TableCell>
                    <TableCell className={`${density === "compact" ? "py-2" : "py-3"} text-right font-mono-financial text-amber-600`}>{formatMoney(fee)}</TableCell>
                    <TableCell className={`${density === "compact" ? "py-2" : "py-3"} text-right font-mono-financial text-gray-900 font-medium`}>{formatMoney(net)}</TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>
        </GlassCard>
      </AnimatedItem>

      <section className="mt-4 flex flex-col gap-2 px-1 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500">Page {page} of {totalPages} • {filtered.length} records</p>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={String(pageSize)} onValueChange={(v) => { setPage(1); setPageSize(Number(v)); }}>
            <SelectTrigger className="h-8 w-[100px] border-gray-200 bg-white text-xs text-gray-700"><SelectValue /></SelectTrigger>
            <SelectContent className="border-gray-200 bg-white text-gray-900">{PAGE_SIZE_OPTIONS.map((s) => (<SelectItem key={s} value={String(s)}>{s} / page</SelectItem>))}</SelectContent>
          </Select>
          <div className="flex gap-1">
            <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="h-8 border-gray-200 text-gray-600 hover:bg-gray-50">Previous</Button>
            <Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="h-8 border-gray-200 text-gray-600 hover:bg-gray-50">Next</Button>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
