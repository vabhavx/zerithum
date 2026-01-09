import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format, startOfYear, endOfYear } from "date-fns";
import { 
  Download, 
  Calendar, 
  DollarSign,
  TrendingUp,
  Percent,
  FileSpreadsheet,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORY_LABELS = {
  ad_revenue: "Ad Revenue",
  sponsorship: "Sponsorships",
  affiliate: "Affiliate Income",
  product_sale: "Product Sales",
  membership: "Memberships"
};

export default function TaxReports() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [exporting, setExporting] = useState(false);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["revenueTransactions"],
    queryFn: () => base44.entities.RevenueTransaction.list("-transaction_date", 1000),
  });

  // Filter transactions by year
  const yearTransactions = useMemo(() => {
    const yearStart = startOfYear(new Date(parseInt(selectedYear), 0, 1));
    const yearEnd = endOfYear(new Date(parseInt(selectedYear), 0, 1));
    
    return transactions.filter(t => {
      const date = new Date(t.transaction_date);
      return date >= yearStart && date <= yearEnd;
    });
  }, [transactions, selectedYear]);

  // Calculate summaries
  const summary = useMemo(() => {
    const totalRevenue = yearTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalFees = yearTransactions.reduce((sum, t) => sum + (t.platform_fee || 0), 0);
    const netRevenue = totalRevenue - totalFees;

    // By category
    const byCategory = {};
    yearTransactions.forEach(t => {
      if (!byCategory[t.category]) {
        byCategory[t.category] = { amount: 0, count: 0 };
      }
      byCategory[t.category].amount += t.amount || 0;
      byCategory[t.category].count += 1;
    });

    // By platform
    const byPlatform = {};
    yearTransactions.forEach(t => {
      if (!byPlatform[t.platform]) {
        byPlatform[t.platform] = { amount: 0, fees: 0, count: 0 };
      }
      byPlatform[t.platform].amount += t.amount || 0;
      byPlatform[t.platform].fees += t.platform_fee || 0;
      byPlatform[t.platform].count += 1;
    });

    // Monthly breakdown
    const monthly = {};
    yearTransactions.forEach(t => {
      const month = format(new Date(t.transaction_date), "MMM");
      if (!monthly[month]) monthly[month] = 0;
      monthly[month] += t.amount || 0;
    });

    return {
      totalRevenue,
      totalFees,
      netRevenue,
      transactionCount: yearTransactions.length,
      byCategory,
      byPlatform,
      monthly
    };
  }, [yearTransactions]);

  const handleExportCSV = async () => {
    setExporting(true);
    
    // Create CSV content
    const headers = ["Date", "Platform", "Category", "Description", "Amount", "Platform Fee", "Net Amount"];
    const rows = yearTransactions.map(t => [
      format(new Date(t.transaction_date), "yyyy-MM-dd"),
      t.platform,
      t.category,
      t.description || "",
      t.amount?.toFixed(2),
      (t.platform_fee || 0).toFixed(2),
      ((t.amount || 0) - (t.platform_fee || 0)).toFixed(2)
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zerithum-revenue-${selectedYear}.csv`;
    a.click();
    
    setExporting(false);
  };

  const years = [];
  for (let y = new Date().getFullYear(); y >= 2020; y--) {
    years.push(y.toString());
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Export & Tax Reports</h1>
          <p className="text-slate-500 mt-1">Generate reports for tax filing and analysis</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32 clay-sm rounded-xl border-0">
              <Calendar className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleExportCSV}
            disabled={exporting || yearTransactions.length === 0}
            className="clay-sm hover:clay rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white border-0"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export CSV
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="clay rounded-3xl p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto" />
          <p className="text-slate-500 mt-4">Loading transactions...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="clay rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-medium text-slate-500 uppercase">Gross Revenue</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">
                ${summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="clay rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="w-4 h-4 text-red-500" />
                <span className="text-xs font-medium text-slate-500 uppercase">Platform Fees</span>
              </div>
              <p className="text-2xl font-bold text-red-600">
                -${summary.totalFees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="clay rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-violet-500" />
                <span className="text-xs font-medium text-slate-500 uppercase">Net Revenue</span>
              </div>
              <p className="text-2xl font-bold text-violet-600">
                ${summary.netRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="clay rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-medium text-slate-500 uppercase">Transactions</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{summary.transactionCount}</p>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="clay rounded-3xl p-6 lg:p-8 mb-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Revenue by Category</h3>
            {Object.keys(summary.byCategory).length === 0 ? (
              <p className="text-slate-500 text-center py-8">No transactions in {selectedYear}</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(summary.byCategory)
                  .sort(([,a], [,b]) => b.amount - a.amount)
                  .map(([category, data]) => {
                    const percentage = (data.amount / summary.totalRevenue) * 100;
                    return (
                      <div key={category} className="clay-sm rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-slate-800">
                            {CATEGORY_LABELS[category] || category}
                          </span>
                          <span className="font-semibold text-slate-800">
                            ${data.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-slate-500 w-16 text-right">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">{data.count} transactions</p>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Platform Breakdown */}
          <div className="clay rounded-3xl p-6 lg:p-8">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Revenue by Platform</h3>
            {Object.keys(summary.byPlatform).length === 0 ? (
              <p className="text-slate-500 text-center py-8">No platform data for {selectedYear}</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {Object.entries(summary.byPlatform)
                  .sort(([,a], [,b]) => b.amount - a.amount)
                  .map(([platform, data]) => (
                    <div key={platform} className="clay-sm rounded-xl p-4">
                      <h4 className="font-semibold text-slate-800 capitalize mb-3">{platform}</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Gross Revenue</span>
                          <span className="font-medium text-slate-800">
                            ${data.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Platform Fees</span>
                          <span className="font-medium text-red-600">
                            -${data.fees.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="border-t border-slate-200 pt-2 flex justify-between text-sm">
                          <span className="text-slate-500">Net Revenue</span>
                          <span className="font-semibold text-emerald-600">
                            ${(data.amount - data.fees).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}