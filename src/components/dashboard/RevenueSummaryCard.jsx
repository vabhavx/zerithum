import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RevenueSummaryCard({
  totalRevenue,
  previousRevenue,
  platformCount,
  lastSynced
}) {
  const change = previousRevenue > 0
    ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
    : 0;

  const isPositive = change >= 0;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Revenue This Month</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">
          {/* Optional Icon */}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-mono-numbers">
          ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="flex items-center space-x-2 mt-1">
          <div className={cn(
            "flex items-center text-xs font-medium",
            isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
          )}>
            {isPositive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
            {Math.abs(change).toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            vs last month
          </p>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>Across {platformCount} platforms</span>
          <span className="flex items-center">
            Last synced: {lastSynced || "Just now"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
