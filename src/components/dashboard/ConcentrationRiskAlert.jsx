import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const PLATFORM_LABELS = {
  youtube: "YouTube",
  patreon: "Patreon",
  stripe: "Stripe",
  gumroad: "Gumroad"
};

export default function ConcentrationRiskAlert({ platform, percentage }) {
  // If no risk (percentage < 50), show "Diversified" state
  const isRisk = percentage >= 50;
  const isHighRisk = percentage >= 70;

  return (
    <Card className="h-full border-l-4 border-l-warning">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Revenue Concentration</CardTitle>
        {isRisk ? (
          <AlertTriangle className={cn("h-4 w-4", isHighRisk ? "text-destructive" : "text-warning")} />
        ) : (
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-mono-numbers">
          {percentage.toFixed(1)}%
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          from <span className="font-semibold text-foreground">{PLATFORM_LABELS[platform] || platform || "Top Source"}</span>
        </p>

        <div className="mt-4 flex items-center">
          <span className={cn(
            "text-xs font-medium px-2 py-1 rounded-full",
            isHighRisk
              ? "bg-destructive/10 text-destructive"
              : isRisk
                ? "bg-warning/10 text-warning"
                : "bg-emerald-500/10 text-emerald-600"
          )}>
            {isHighRisk ? "High Risk" : isRisk ? "Moderate Risk" : "Diversified"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
