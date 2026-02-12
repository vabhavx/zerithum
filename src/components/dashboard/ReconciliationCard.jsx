import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ReconciliationCard({
  reconciledAmount,
  unreconciledAmount,
  unreconciledCount
}) {
  const total = reconciledAmount + unreconciledAmount;
  const percentage = total > 0 ? (reconciledAmount / total) * 100 : 0;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Reconciled vs Unreconciled</CardTitle>
        <Link to="/reconciliation" className="text-xs text-primary hover:underline">
          View Queue
        </Link>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <div className="text-2xl font-bold font-mono-numbers">
            ${reconciledAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-sm text-muted-foreground">reconciled</span>
        </div>

        <div className="mt-2 text-sm text-muted-foreground">
          <span className="font-mono-numbers font-medium text-foreground">
            ${unreconciledAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span> pending
        </div>

        <div className="mt-4 flex items-center space-x-2">
          <div className="h-2 flex-1 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-in-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground w-8 text-right">
            {Math.round(percentage)}%
          </span>
        </div>

        <div className="mt-2 flex items-center text-xs text-warning-foreground">
          {unreconciledCount > 0 ? (
            <div className="flex items-center text-warning font-medium">
              <AlertCircle className="h-3 w-3 mr-1" />
              {unreconciledCount} transactions need review
            </div>
          ) : (
             <div className="flex items-center text-emerald-600 font-medium">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              All caught up
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
