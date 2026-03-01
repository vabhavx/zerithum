import React, { useState, useMemo } from "react";
import { base44 } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears } from "date-fns";
import { Download, Calendar, TrendingUp, TrendingDown, DollarSign, BarChart3, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const PLATFORM_COLORS = { youtube: "#DC2626", patreon: "#F87171", stripe: "#6366F1", gumroad: "#EC4899", instagram: "#E11D48", tiktok: "#000000" };
const CATEGORY_COLORS = { ad_revenue: "#3B82F6", sponsorship: "#8B5CF6", affiliate: "#EC4899", product_sale: "#10B981", membership: "#F59E0B" };

const escapeHTML = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>"']/g, function(match) {
    switch (match) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return match;
    }
  });
};

export default function Reports() {
  const [dateRange, setDateRange] = useState("this_month");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { startDate, endDate, compareStartDate, compareEndDate } = useMemo(() => {
    const now = new Date();
    let start, end, compareStart, compareEnd;
    switch (dateRange) {
      case "this_month": start = startOfMonth(now); end = endOfMonth(now); compareStart = startOfMonth(subMonths(now, 1)); compareEnd = endOfMonth(subMonths(now, 1)); break;
      case "last_month": start = startOfMonth(subMonths(now, 1)); end = endOfMonth(subMonths(now, 1)); compareStart = startOfMonth(subMonths(now, 2)); compareEnd = endOfMonth(subMonths(now, 2)); break;
      case "last_3_months": start = startOfMonth(subMonths(now, 2)); end = endOfMonth(now); compareStart = startOfMonth(subMonths(now, 5)); compareEnd = endOfMonth(subMonths(now, 3)); break;
      case "this_year": start = startOfYear(now); end = endOfYear(now); compareStart = startOfYear(subYears(now, 1)); compareEnd = endOfYear(subYears(now, 1)); break;
      default: start = startOfMonth(now); end = endOfMonth(now); compareStart = startOfMonth(subMonths(now, 1)); compareEnd = endOfMonth(subMonths(now, 1));
    }
    return { startDate: start, endDate: end, compareStartDate: compareStart, compareEndDate: compareEnd };
  }, [dateRange]);

  const { data: transactions = [] } = useQuery({ queryKey: ["transactions", startDate, endDate], queryFn: () => base44.entities.RevenueTransaction.list("-transaction_date", 1000) });
  const { data: compareTransactions = [] } = useQuery({ queryKey: ["compareTransactions", compareStartDate, compareEndDate], queryFn: () => base44.entities.RevenueTransaction.list("-transaction_date", 1000) });

  const filteredTransactions = useMemo(() => transactions.filter(t => { const d = new Date(t.transaction_date); return d >= startDate && d <= endDate && (platformFilter === "all" || t.platform === platformFilter) && (categoryFilter === "all" || t.category === categoryFilter); }), [transactions, startDate, endDate, platformFilter, categoryFilter]);
  const filteredCompareTransactions = useMemo(() => compareTransactions.filter(t => { const d = new Date(t.transaction_date); return d >= compareStartDate && d <= compareEndDate; }), [compareTransactions, compareStartDate, compareEndDate]);

  const metrics = useMemo(() => {
    const totalRevenue = filteredTransactions.reduce((s, t) => s + t.amount, 0);
    const totalFees = filteredTransactions.reduce((s, t) => s + (t.platform_fee || 0), 0);
    const netRevenue = totalRevenue - totalFees;
    const compareTotalRevenue = filteredCompareTransactions.reduce((s, t) => s + t.amount, 0);
    const revenueChange = compareTotalRevenue > 0 ? ((totalRevenue - compareTotalRevenue) / compareTotalRevenue) * 100 : 0;
    const platformBreakdown = filteredTransactions.reduce((a, t) => { a[t.platform] = (a[t.platform] || 0) + t.amount; return a; }, {});
    const categoryBreakdown = filteredTransactions.reduce((a, t) => { a[t.category] = (a[t.category] || 0) + t.amount; return a; }, {});
    const tsMap = {}; filteredTransactions.forEach(t => { const d = format(new Date(t.transaction_date), "MMM dd"); tsMap[d] = (tsMap[d] || 0) + t.amount; });
    return { totalRevenue, totalFees, netRevenue, transactionCount: filteredTransactions.length, revenueChange, platformBreakdown, categoryBreakdown, timeSeries: Object.entries(tsMap).map(([date, amount]) => ({ date, amount })) };
  }, [filteredTransactions, filteredCompareTransactions]);

  const exportCSV = () => {
    const headers = ["Date", "Platform", "Category", "Description", "Amount", "Fees", "Net"];
    const rows = filteredTransactions.map(t => [t.transaction_date, t.platform, t.category, t.description || "", t.amount, t.platform_fee || 0, t.amount - (t.platform_fee || 0)]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `revenue_report_${format(new Date(), "yyyy-MM-dd")}.csv`; a.click();
  };

  const exportPDF = async () => {
    const pw = window.open("", "_blank");
    pw.document.write(`<html><head><title>Revenue Report - ${escapeHTML(format(startDate, "MMM dd, yyyy"))} to ${escapeHTML(format(endDate, "MMM dd, yyyy"))}</title><style>body{font-family:Inter,Arial,sans-serif;padding:20px;color:#111827}h1{color:#111827}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #E5E7EB;padding:8px;text-align:left}th{background:#F9FAFB;font-size:12px;text-transform:uppercase;color:#6B7280}</style></head><body><h1>Revenue Report</h1><p>${escapeHTML(format(startDate, "MMM dd, yyyy"))} to ${escapeHTML(format(endDate, "MMM dd, yyyy"))}</p><div><h2>Summary</h2><div>Total Revenue: $${metrics.totalRevenue.toFixed(2)}</div><div>Total Fees: $${metrics.totalFees.toFixed(2)}</div><div>Net Revenue: $${metrics.netRevenue.toFixed(2)}</div><div>Transactions: ${metrics.transactionCount}</div></div><h2>Transactions</h2><table><thead><tr><th>Date</th><th>Platform</th><th>Category</th><th>Description</th><th>Amount</th><th>Fees</th><th>Net</th></tr></thead><tbody>${filteredTransactions.map(t => `<tr><td>${escapeHTML(t.transaction_date)}</td><td>${escapeHTML(t.platform)}</td><td>${escapeHTML(t.category)}</td><td>${escapeHTML(t.description || "")}</td><td>$${t.amount.toFixed(2)}</td><td>$${(t.platform_fee || 0).toFixed(2)}</td><td>$${(t.amount - (t.platform_fee || 0)).toFixed(2)}</td></tr>`).join("")}</tbody></table></body></html>`);
    pw.document.close(); setTimeout(() => { pw.print(); }, 250);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (<div className="rounded-lg px-4 py-2.5 border border-gray-200 bg-white shadow-lg"><p className="font-semibold text-gray-900 text-sm">{payload[0].payload.date || payload[0].name}</p><p className="text-xs text-gray-600 font-medium">${payload[0].value.toLocaleString()}</p></div>);
    }
    return null;
  };

  return (
    <div className="max-w-[1600px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Revenue Reports</h1>
          <p className="text-gray-500 mt-1 text-sm">Comprehensive financial analytics and insights</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportCSV} variant="outline" className="h-9 border-gray-200 text-gray-600 hover:bg-gray-50 text-sm"><Download className="w-3.5 h-3.5 mr-2" />Export CSV</Button>
          <Button onClick={exportPDF} variant="outline" className="h-9 border-gray-200 text-gray-600 hover:bg-gray-50 text-sm"><FileText className="w-3.5 h-3.5 mr-2" />Export PDF</Button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.15 }} className="rounded-xl border border-gray-100 bg-white p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider font-medium">Date Range</label>
            <Select value={dateRange} onValueChange={setDateRange}><SelectTrigger className="border-gray-200 bg-white text-gray-900"><Calendar className="w-4 h-4 mr-2 text-gray-400" /><SelectValue /></SelectTrigger><SelectContent className="border-gray-200 bg-white text-gray-900"><SelectItem value="this_month">This Month</SelectItem><SelectItem value="last_month">Last Month</SelectItem><SelectItem value="last_3_months">Last 3 Months</SelectItem><SelectItem value="this_year">This Year</SelectItem></SelectContent></Select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider font-medium">Platform</label>
            <Select value={platformFilter} onValueChange={setPlatformFilter}><SelectTrigger className="border-gray-200 bg-white text-gray-900"><SelectValue /></SelectTrigger><SelectContent className="border-gray-200 bg-white text-gray-900"><SelectItem value="all">All Platforms</SelectItem><SelectItem value="youtube">YouTube</SelectItem><SelectItem value="patreon">Patreon</SelectItem><SelectItem value="stripe">Stripe</SelectItem><SelectItem value="gumroad">Gumroad</SelectItem><SelectItem value="instagram">Instagram</SelectItem><SelectItem value="tiktok">TikTok</SelectItem></SelectContent></Select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider font-medium">Category</label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}><SelectTrigger className="border-gray-200 bg-white text-gray-900"><SelectValue /></SelectTrigger><SelectContent className="border-gray-200 bg-white text-gray-900"><SelectItem value="all">All Categories</SelectItem><SelectItem value="ad_revenue">Ad Revenue</SelectItem><SelectItem value="sponsorship">Sponsorship</SelectItem><SelectItem value="affiliate">Affiliate</SelectItem><SelectItem value="product_sale">Product Sale</SelectItem><SelectItem value="membership">Membership</SelectItem></SelectContent></Select>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.08, type: "spring", stiffness: 600, damping: 40 }} className="rounded-xl border border-gray-100 bg-white p-5">
          <div className="flex items-center justify-between mb-3"><p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Revenue</p><DollarSign className="w-4 h-4 text-emerald-500" /></div>
          <p className="text-2xl font-bold text-gray-900 mb-1">${metrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <div className="flex items-center gap-1 text-xs">{metrics.revenueChange >= 0 ? (<><TrendingUp className="w-3 h-3 text-emerald-500" /><span className="text-emerald-600">+{metrics.revenueChange.toFixed(1)}%</span></>) : (<><TrendingDown className="w-3 h-3 text-red-500" /><span className="text-red-600">{metrics.revenueChange.toFixed(1)}%</span></>)}<span className="text-gray-300 ml-1">vs previous</span></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 600, damping: 40 }} className="rounded-xl border border-gray-100 bg-white p-5">
          <div className="flex items-center justify-between mb-3"><p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Fees</p><DollarSign className="w-4 h-4 text-red-500" /></div>
          <p className="text-2xl font-bold text-gray-900 mb-1">${metrics.totalFees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-gray-400">Platform fees deducted</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.12, type: "spring", stiffness: 600, damping: 40 }} className="rounded-xl border border-gray-100 bg-white p-5">
          <div className="flex items-center justify-between mb-3"><p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Net Revenue</p><DollarSign className="w-4 h-4 text-gray-900" /></div>
          <p className="text-2xl font-bold text-gray-900 mb-1">${metrics.netRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-gray-400">After platform fees</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.14, type: "spring", stiffness: 600, damping: 40 }} className="rounded-xl border border-gray-100 bg-white p-5">
          <div className="flex items-center justify-between mb-3"><p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Transactions</p><BarChart3 className="w-4 h-4 text-gray-500" /></div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{metrics.transactionCount}</p>
          <p className="text-xs text-gray-400">Total transactions</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.2 }} className="rounded-xl border border-gray-100 bg-white p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Revenue Over Time</h3>
          <p className="text-xs text-gray-400 mb-6">Daily revenue breakdown</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.timeSeries}>
                <defs><linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1} /><stop offset="95%" stopColor="#4F46E5" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="amount" stroke="#4F46E5" strokeWidth={2} fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.2 }} className="rounded-xl border border-gray-100 bg-white p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Platform Breakdown</h3>
          <p className="text-xs text-gray-400 mb-6">Revenue by platform</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={Object.entries(metrics.platformBreakdown).map(([p, v]) => ({ name: p.charAt(0).toUpperCase() + p.slice(1), value: v }))} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {Object.keys(metrics.platformBreakdown).map((p, i) => (<Cell key={`cell-${i}`} fill={PLATFORM_COLORS[p] || "#94a3b8"} />))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.2 }} className="rounded-xl border border-gray-100 bg-white p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Revenue by Category</h3>
        <p className="text-xs text-gray-400 mb-6">Transaction type breakdown</p>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={Object.entries(metrics.categoryBreakdown).map(([c, v]) => ({ name: c.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), value: v }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>{Object.keys(metrics.categoryBreakdown).map((c, i) => (<Cell key={`cell-${i}`} fill={CATEGORY_COLORS[c] || "#94a3b8"} />))}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}