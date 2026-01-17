import React, { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Sparkles, Check, ArrowRight } from "lucide-react";

const MATCH_CATEGORY_LABELS = {
  exact_match: "Exact Match",
  fee_deduction: "Fee Deduction",
  hold_period: "Hold Period",
  unmatched: "Unmatched"
};

const MATCH_CATEGORY_COLORS = {
  exact_match: "bg-emerald-50 text-emerald-700 border-emerald-200",
  fee_deduction: "bg-blue-50 text-blue-700 border-blue-200",
  hold_period: "bg-amber-50 text-amber-700 border-amber-200",
  unmatched: "bg-red-50 text-red-700 border-red-200"
};

const ReconciliationRow = memo(({ rec }) => {
  return (
    <div className="clay rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <Badge className={cn("border", MATCH_CATEGORY_COLORS[rec.match_category])}>
          {MATCH_CATEGORY_LABELS[rec.match_category]}
        </Badge>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          {rec.reconciled_by === "auto" ? (
            <Sparkles className="w-4 h-4 text-violet-500" />
          ) : (
            <Check className="w-4 h-4 text-emerald-500" />
          )}
          <span>{rec.reconciled_by === "auto" ? "Auto-matched" : "Manual"}</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex-1 clay-sm rounded-xl p-3">
          <p className="text-xs text-slate-500 mb-1">Platform Revenue</p>
          <p className="font-medium text-slate-800">Revenue Transaction</p>
        </div>
        <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
        <div className="flex-1 clay-sm rounded-xl p-3">
          <p className="text-xs text-slate-500 mb-1">Bank Deposit</p>
          <p className="font-medium text-slate-800">Bank Transaction</p>
        </div>
      </div>
      {rec.match_confidence && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
              style={{ width: `${rec.match_confidence * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-slate-600">
            {(rec.match_confidence * 100).toFixed(0)}% confidence
          </span>
        </div>
      )}
      {rec.creator_notes && (
        <p className="mt-3 text-sm text-slate-500 italic">"{rec.creator_notes}"</p>
      )}
    </div>
  );
});

ReconciliationRow.displayName = "ReconciliationRow";

export default ReconciliationRow;
