import React, { useState, useMemo } from "react";
import { base44 } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears } from "date-fns";
import { 
  Download, 
  Calendar,
  TrendingUp,
  TrendingDown,
  FileText,
  Printer,
  ChevronDown
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Reports() {
  const [dateRange, setDateRange] = useState("this_month");

  // Basic date range logic remains the same
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    if (dateRange === "last_month") return { startDate: startOfMonth(subMonths(now, 1)), endDate: endOfMonth(subMonths(now, 1)) };
    if (dateRange === "this_year") return { startDate: startOfYear(now), endDate: endOfYear(now) };
    return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
  }, [dateRange]);

  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions", startDate, endDate],
    queryFn: () => base44.entities.RevenueTransaction.list("-transaction_date", 1000),
  });

  const metrics = useMemo(() => {
    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
    const fees = transactions.reduce((sum, t) => sum + (t.platform_fee || 0), 0);
    return { totalRevenue, fees, net: totalRevenue - fees, count: transactions.length };
  }, [transactions]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* Header with Print Controls */}
      <div className="flex justify-between items-end border-b border-border pb-6 print:hidden">
        <div>
          <h1 className="text-3xl font-serif text-foreground mb-1">Financial Statements</h1>
          <p className="text-sm text-muted-foreground font-mono">
             PERIOD: {format(startDate, "MMM d, yyyy").toUpperCase()} — {format(endDate, "MMM d, yyyy").toUpperCase()}
          </p>
        </div>
        <div className="flex gap-2">
           <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px] h-9 rounded-none border-border">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none border-border">
                <SelectItem value="this_month">Current Period</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="this_year">YTD</SelectItem>
              </SelectContent>
            </Select>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-9 rounded-none border-border">
                        Export <ChevronDown className="w-3 h-3 ml-2" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="rounded-none border-border">
                    <DropdownMenuItem>PDF Document</DropdownMenuItem>
                    <DropdownMenuItem>CSV Data</DropdownMenuItem>
                    <DropdownMenuItem>JSON Archive</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <Button className="h-9 rounded-none" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
        </div>
      </div>

      {/* Report Document Surface */}
      <div className="bg-white text-black p-12 shadow-2xl min-h-[800px] font-serif border border-zinc-200">

          {/* Document Header */}
          <div className="flex justify-between items-start mb-16">
              <div>
                  <h2 className="text-4xl font-bold tracking-tight mb-2">Statement of Revenue</h2>
                  <p className="text-zinc-500 uppercase tracking-widest text-xs font-sans">Zerithum Reconciliation Engine</p>
              </div>
              <div className="text-right">
                  <div className="text-zinc-900 font-bold text-lg">ZERITHUM INC.</div>
                  <div className="text-zinc-500 text-sm">Revenue Operations</div>
                  <div className="text-zinc-500 text-sm mt-4">Report Generated:</div>
                  <div className="font-mono text-sm">{format(new Date(), "yyyy-MM-dd HH:mm:ss")}</div>
              </div>
          </div>

          <hr className="border-black mb-12" />

          {/* Summary Table */}
          <div className="mb-16">
              <h3 className="uppercase tracking-widest text-xs font-sans font-bold mb-4 text-zinc-500">Executive Summary</h3>
              <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm">
                  <div className="flex justify-between border-b border-zinc-200 pb-2">
                      <span>Gross Revenue</span>
                      <span className="font-bold font-mono">${metrics.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-200 pb-2">
                      <span>Platform Fees</span>
                      <span className="font-mono text-red-700">(${metrics.fees.toLocaleString(undefined, {minimumFractionDigits: 2})})</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-200 pb-2">
                      <span>Transaction Count</span>
                      <span className="font-mono">{metrics.count}</span>
                  </div>
                  <div className="flex justify-between border-b border-black pb-2 items-end">
                      <span className="font-bold text-lg">Net Income</span>
                      <span className="font-bold font-mono text-xl">${metrics.net.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
              </div>
          </div>

          {/* Detailed Breakdown */}
          <div>
              <h3 className="uppercase tracking-widest text-xs font-sans font-bold mb-6 text-zinc-500">Transaction Detail</h3>
              <table className="w-full text-sm">
                  <thead>
                      <tr className="border-b-2 border-black">
                          <th className="text-left py-2 font-bold w-32">Date</th>
                          <th className="text-left py-2 font-bold">Source</th>
                          <th className="text-left py-2 font-bold">Description</th>
                          <th className="text-right py-2 font-bold">Amount</th>
                      </tr>
                  </thead>
                  <tbody className="font-sans text-zinc-700">
                      {transactions.slice(0, 15).map((t, i) => (
                          <tr key={i} className="border-b border-zinc-100">
                              <td className="py-3">{format(new Date(t.transaction_date), "MMM d, yyyy")}</td>
                              <td className="py-3 capitalize">{t.platform}</td>
                              <td className="py-3 text-zinc-500">{t.description || "Payment processed"}</td>
                              <td className="py-3 text-right font-mono text-black">${t.amount.toFixed(2)}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
              {transactions.length > 15 && (
                  <p className="text-center text-xs text-zinc-400 mt-8 italic">
                      ... {transactions.length - 15} additional records omitted for brevity. See attached CSV for full ledger.
                  </p>
              )}
          </div>

          {/* Footer */}
          <div className="mt-24 pt-8 border-t border-zinc-200 flex justify-between text-[10px] text-zinc-400 font-sans uppercase tracking-wider">
              <span>Confidential Financial Document</span>
              <span>Page 1 of 1</span>
          </div>

      </div>
    </div>
  );
}
