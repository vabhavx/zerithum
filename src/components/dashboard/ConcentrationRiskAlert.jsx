import React from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLATFORM_LABELS = {
  youtube: "YouTube",
  patreon: "Patreon",
  stripe: "Stripe",
  gumroad: "Gumroad"
};

export default function ConcentrationRiskAlert({ platform, percentage, onDismiss }) {
  if (!platform || percentage < 70) return null;

  return (
    <div className="rounded-xl p-4 bg-amber-500/10 border border-amber-500/30 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0 border border-amber-500/30">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-amber-400 mb-1 text-sm">Revenue Concentration Risk</h4>
          <p className="text-xs text-amber-300/80">
            <span className="font-medium">{percentage.toFixed(1)}%</span> of your revenue comes from{" "}
            <span className="font-medium">{PLATFORM_LABELS[platform] || platform}</span>. 
            Consider diversifying your income streams to reduce platform dependency risk.
          </p>
        </div>
        {onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            className="text-amber-400 hover:bg-amber-500/20 -mt-1 -mr-1 h-8 w-8"
            onClick={onDismiss}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}