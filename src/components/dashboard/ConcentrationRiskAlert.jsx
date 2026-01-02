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
    <div className="clay rounded-2xl p-4 lg:p-5 bg-gradient-to-r from-amber-50/80 to-orange-50/80 border border-amber-200/50">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-amber-800 mb-1">Revenue Concentration Risk</h4>
          <p className="text-sm text-amber-700">
            <span className="font-medium">{percentage.toFixed(1)}%</span> of your revenue comes from{" "}
            <span className="font-medium">{PLATFORM_LABELS[platform] || platform}</span>. 
            Consider diversifying your income streams to reduce platform dependency risk.
          </p>
        </div>
        {onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            className="text-amber-600 hover:bg-amber-100/50 -mt-1 -mr-1"
            onClick={onDismiss}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}