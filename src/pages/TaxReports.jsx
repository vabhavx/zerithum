import React, { useState, useMemo } from "react";
import { base44 } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { format, startOfYear, endOfYear } from "date-fns";
import { 
  Download, 
  Calendar, 
  DollarSign,
  TrendingUp,
  Percent,
  FileSpreadsheet,
  Loader2,
  Receipt,
  Printer
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

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

    return {
      totalRevenue,
      totalFees,
      netRevenue,
      transactionCount: yearTransactions.length,
      byCategory,
      byPlatform
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-serif text-foreground mb-1">Fiscal Reporting</h1>
          <p className="text-sm text-muted-foreground font-mono">
             TAX PREPARATION & EXPORT · {selectedYear}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32 rounded-none border-border bg-background font-mono text-xs">
              <Calendar className="w-3 h-3 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-none border-border">
              {years.map(year => (
                <SelectItem key={year} value={year} className="font-mono text-xs">{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleExportCSV}
            disabled={exporting || yearTransactions.length === 0}
            className="h-9 px-4 bg-foreground text-background hover:bg-foreground/90 font-mono text-xs uppercase tracking-wider rounded-none"
          >
            {exporting ? (
              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
            ) : (
              <Download className="w-3 h-3 mr-2" />
            )}
            Export CSV
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64 border border-border bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
            {[
              { label: "Gross Revenue", value: summary.totalRevenue, icon: DollarSign, color: "text-emerald-500" },
              { label: "Platform Fees", value: summary.totalFees, icon: Percent, color: "text-destructive" },
              { label: "Net Earnings", value: summary.netRevenue, icon: TrendingUp, color: "text-foreground" },
              { label: "Transaction Vol", value: summary.transactionCount, icon: FileSpreadsheet, color: "text-muted-foreground", isCount: true }
            ].map((stat, i) => (
               <div key={i} className="bg-background p-6">
                  <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">{stat.label}</span>
                      <stat.icon className={cn("w-4 h-4", stat.color)} />
                  </div>
                  <div className="text-2xl font-serif font-medium">
                      {stat.isCount ? stat.value : `$${stat.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
             {/* Category Breakdown */}
            <div className="border border-border bg-background">
               <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
                  <h3 className="font-serif text-lg">Revenue by Category</h3>
                  <Receipt className="w-4 h-4 text-muted-foreground" />
              </div>
              <Table>
                  <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Volume</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                     {Object.keys(summary.byCategory).length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center py-8 text-muted-foreground font-mono text-xs uppercase">No Data</TableCell>
                        </TableRow>
                     ) : (
                         Object.entries(summary.byCategory)
                          .sort(([,a], [,b]) => b.amount - a.amount)
                          .map(([category, data]) => (
                              <TableRow key={category} className="border-b border-border">
                                  <TableCell className="font-medium text-xs font-mono uppercase">
                                      {CATEGORY_LABELS[category] || category}
                                  </TableCell>
                                  <TableCell className="text-right text-xs font-mono">{data.count}</TableCell>
                                  <TableCell className="text-right font-mono">
                                      ${data.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </TableCell>
                              </TableRow>
                          ))
                     )}
                  </TableBody>
              </Table>
            </div>

            {/* Platform Breakdown */}
            <div className="border border-border bg-background">
               <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
                  <h3 className="font-serif text-lg">Platform Performance</h3>
                  <Printer className="w-4 h-4 text-muted-foreground" />
              </div>
              <Table>
                  <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
                          <TableHead>Source</TableHead>
                          <TableHead className="text-right">Gross</TableHead>
                          <TableHead className="text-right">Fees</TableHead>
                          <TableHead className="text-right">Net</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                     {Object.keys(summary.byPlatform).length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground font-mono text-xs uppercase">No Data</TableCell>
                        </TableRow>
                     ) : (
                         Object.entries(summary.byPlatform)
                          .sort(([,a], [,b]) => b.amount - a.amount)
                          .map(([platform, data]) => (
                              <TableRow key={platform} className="border-b border-border">
                                  <TableCell className="font-medium text-xs font-mono uppercase">
                                      {platform}
                                  </TableCell>
                                  <TableCell className="text-right font-mono">
                                      ${data.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </TableCell>
                                   <TableCell className="text-right font-mono text-destructive">
                                      -${data.fees.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </TableCell>
                                  <TableCell className="text-right font-mono font-medium">
                                      ${(data.amount - data.fees).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </TableCell>
                              </TableRow>
                          ))
                     )}
                  </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
