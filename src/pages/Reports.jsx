import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears } from "date-fns";
import { 
  Download, 
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar,
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from "recharts";

const PLATFORM_COLORS = {
  youtube: "#FF0000",
  patreon: "#FF424D",
  stripe: "#635BFF",
  gumroad: "#FF90E8",
  instagram: "#E4405F",
  tiktok: "#00F2EA"
};

const CATEGORY_COLORS = {
  ad_revenue: "#3B82F6",
  sponsorship: "#8B5CF6",
  affiliate: "#EC4899",
  product_sale: "#10B981",
  membership: "#F59E0B"
};

export default function Reports() {
  const [dateRange, setDateRange] = useState("this_month");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Calculate date ranges
  const { startDate, endDate, compareStartDate, compareEndDate } = useMemo(() => {
    const now = new Date();
    let start, end, compareStart, compareEnd;

    switch (dateRange) {
      case "this_month":
        start = startOfMonth(now);
        end = endOfMonth(now);
        compareStart = startOfMonth(subMonths(now, 1));
        compareEnd = endOfMonth(subMonths(now, 1));
        break;
      case "last_month":
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(subMonths(now, 1));
        compareStart = startOfMonth(subMonths(now, 2));
        compareEnd = endOfMonth(subMonths(now, 2));
        break;
      case "last_3_months":
        start = startOfMonth(subMonths(now, 2));
        end = endOfMonth(now);
        compareStart = startOfMonth(subMonths(now, 5));
        compareEnd = endOfMonth(subMonths(now, 3));
        break;
      case "this_year":
        start = startOfYear(now);
        end = endOfYear(now);
        compareStart = startOfYear(subYears(now, 1));
        compareEnd = endOfYear(subYears(now, 1));
        break;
      default:
        start = startOfMonth(now);
        end = endOfMonth(now);
        compareStart = startOfMonth(subMonths(now, 1));
        compareEnd = endOfMonth(subMonths(now, 1));
    }

    return {
      startDate: start,
      endDate: end,
      compareStartDate: compareStart,
      compareEndDate: compareEnd
    };
  }, [dateRange]);

  // Fetch data
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["transactions", startDate, endDate],
    queryFn: () => base44.entities.RevenueTransaction.list("-transaction_date", 1000),
  });

  const { data: compareTransactions = [] } = useQuery({
    queryKey: ["compareTransactions", compareStartDate, compareEndDate],
    queryFn: () => base44.entities.RevenueTransaction.list("-transaction_date", 1000),
  });

  // Filter and process data
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const transactionDate = new Date(t.transaction_date);
      const inDateRange = transactionDate >= startDate && transactionDate <= endDate;
      const matchesPlatform = platformFilter === "all" || t.platform === platformFilter;
      const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
      return inDateRange && matchesPlatform && matchesCategory;
    });
  }, [transactions, startDate, endDate, platformFilter, categoryFilter]);

  const filteredCompareTransactions = useMemo(() => {
    return compareTransactions.filter(t => {
      const transactionDate = new Date(t.transaction_date);
      return transactionDate >= compareStartDate && transactionDate <= compareEndDate;
    });
  }, [compareTransactions, compareStartDate, compareEndDate]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalFees = filteredTransactions.reduce((sum, t) => sum + (t.platform_fee || 0), 0);
    const netRevenue = totalRevenue - totalFees;
    const transactionCount = filteredTransactions.length;

    const compareTotalRevenue = filteredCompareTransactions.reduce((sum, t) => sum + t.amount, 0);
    const revenueChange = compareTotalRevenue > 0 
      ? ((totalRevenue - compareTotalRevenue) / compareTotalRevenue) * 100 
      : 0;

    // Platform breakdown
    const platformBreakdown = filteredTransactions.reduce((acc, t) => {
      acc[t.platform] = (acc[t.platform] || 0) + t.amount;
      return acc;
    }, {});

    // Category breakdown
    const categoryBreakdown = filteredTransactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

    // Time series data
    const timeSeriesMap = {};
    filteredTransactions.forEach(t => {
      const date = format(new Date(t.transaction_date), "MMM dd");
      timeSeriesMap[date] = (timeSeriesMap[date] || 0) + t.amount;
    });

    const timeSeries = Object.entries(timeSeriesMap).map(([date, amount]) => ({
      date,
      amount
    }));

    return {
      totalRevenue,
      totalFees,
      netRevenue,
      transactionCount,
      revenueChange,
      platformBreakdown,
      categoryBreakdown,
      timeSeries
    };
  }, [filteredTransactions, filteredCompareTransactions]);

  // Export functions
  const exportCSV = () => {
    const headers = ["Date", "Platform", "Category", "Description", "Amount", "Fees", "Net"];
    const rows = filteredTransactions.map(t => [
      t.transaction_date,
      t.platform,
      t.category,
      t.description || "",
      t.amount,
      t.platform_fee || 0,
      t.amount - (t.platform_fee || 0)
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenue_report_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const exportPDF = async () => {
    // Simple PDF export using window.print
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Revenue Report - ${format(startDate, "MMM dd, yyyy")} to ${format(endDate, "MMM dd, yyyy")}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f4f4f4; }
            .summary { margin: 20px 0; }
            .summary div { margin: 10px 0; }
          </style>
        </head>
        <body>
          <h1>Revenue Report</h1>
          <p>${format(startDate, "MMM dd, yyyy")} to ${format(endDate, "MMM dd, yyyy")}</p>
          <div class="summary">
            <h2>Summary</h2>
            <div>Total Revenue: $${metrics.totalRevenue.toFixed(2)}</div>
            <div>Total Fees: $${metrics.totalFees.toFixed(2)}</div>
            <div>Net Revenue: $${metrics.netRevenue.toFixed(2)}</div>
            <div>Transactions: ${metrics.transactionCount}</div>
          </div>
          <h2>Transactions</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Platform</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Fees</th>
                <th>Net</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTransactions.map(t => `
                <tr>
                  <td>${t.transaction_date}</td>
                  <td>${t.platform}</td>
                  <td>${t.category}</td>
                  <td>${t.description || ""}</td>
                  <td>$${t.amount.toFixed(2)}</td>
                  <td>$${(t.platform_fee || 0).toFixed(2)}</td>
                  <td>$${(t.amount - (t.platform_fee || 0)).toFixed(2)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-effect rounded-lg px-4 py-2.5 border border-white/10">
          <p className="font-semibold text-white text-sm">{payload[0].payload.date || payload[0].name}</p>
          <p className="text-xs text-indigo-400 font-medium">
            ${payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-[1600px] mx-auto">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Revenue Reports</h1>
          <p className="text-white/40 mt-1 text-sm">Comprehensive financial analytics and insights</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={exportCSV}
            className="rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white text-sm h-9"
          >
            <Download className="w-3.5 h-3.5 mr-2" />
            Export CSV
          </Button>
          <Button
            onClick={exportPDF}
            className="rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white text-sm h-9"
          >
            <FileText className="w-3.5 h-3.5 mr-2" />
            Export PDF
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-modern rounded-xl p-5 mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-white/40 mb-2 block uppercase tracking-wider">Date Range</label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-lg">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                <SelectItem value="this_year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-white/40 mb-2 block uppercase tracking-wider">Platform</label>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="patreon">Patreon</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="gumroad">Gumroad</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-white/40 mb-2 block uppercase tracking-wider">Category</label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="ad_revenue">Ad Revenue</SelectItem>
                <SelectItem value="sponsorship">Sponsorship</SelectItem>
                <SelectItem value="affiliate">Affiliate</SelectItem>
                <SelectItem value="product_sale">Product Sale</SelectItem>
                <SelectItem value="membership">Membership</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="card-modern rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.15em]">Total Revenue</p>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">
            ${metrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-1 text-xs">
            {metrics.revenueChange >= 0 ? (
              <>
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">+{metrics.revenueChange.toFixed(1)}%</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-3 h-3 text-red-400" />
                <span className="text-red-400">{metrics.revenueChange.toFixed(1)}%</span>
              </>
            )}
            <span className="text-white/30 ml-1">vs previous</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="card-modern rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.15em]">Total Fees</p>
            <DollarSign className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">
            ${metrics.totalFees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-white/30">Platform fees deducted</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          className="card-modern rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.15em]">Net Revenue</p>
            <DollarSign className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">
            ${metrics.netRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-white/30">After platform fees</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="card-modern rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.15em]">Transactions</p>
            <BarChart3 className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">
            {metrics.transactionCount}
          </p>
          <p className="text-[10px] text-white/30">Total transactions</p>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Over Time */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="card-modern rounded-xl p-6"
        >
          <h3 className="text-base font-semibold text-white mb-1">Revenue Over Time</h3>
          <p className="text-xs text-white/40 mb-6">Daily revenue breakdown</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.timeSeries}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                  tickFormatter={(value) => `$${value >= 1000 ? `${(value/1000).toFixed(0)}K` : value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#6366F1"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Platform Breakdown */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card-modern rounded-xl p-6"
        >
          <h3 className="text-base font-semibold text-white mb-1">Platform Breakdown</h3>
          <p className="text-xs text-white/40 mb-6">Revenue by platform</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(metrics.platformBreakdown).map(([platform, value]) => ({
                    name: platform.charAt(0).toUpperCase() + platform.slice(1),
                    value
                  }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {Object.keys(metrics.platformBreakdown).map((platform, index) => (
                    <Cell key={`cell-${index}`} fill={PLATFORM_COLORS[platform] || "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Category Breakdown */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="card-modern rounded-xl p-6"
      >
        <h3 className="text-base font-semibold text-white mb-1">Revenue by Category</h3>
        <p className="text-xs text-white/40 mb-6">Transaction type breakdown</p>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={Object.entries(metrics.categoryBreakdown).map(([category, value]) => ({
              name: category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
              value
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                tickFormatter={(value) => `$${value >= 1000 ? `${(value/1000).toFixed(0)}K` : value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {Object.keys(metrics.categoryBreakdown).map((category, index) => (
                  <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[category] || "#94a3b8"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}