import React, { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Sparkles, Check, ArrowRight } from "lucide-react";

const MATCH_CATEGORY_LABELS = {
  exact_match: "Exact Match",
  fee_deduction: "Fee Deduction",
  hold_period: "Hold Period",
  refund: "Refund",
  duplicate: "Possible Duplicate",
  grouped_payout: "Grouped Payout",
  unmatched: "Unmatched"
};

const MATCH_CATEGORY_COLORS = {
  exact_match: "bg-emerald-50 text-emerald-700 border-emerald-200",
  fee_deduction: "bg-blue-50 text-blue-700 border-blue-200",
  hold_period: "bg-amber-50 text-amber-700 border-amber-200",
  refund: "bg-violet-50 text-violet-700 border-violet-200",
  duplicate: "bg-orange-50 text-orange-700 border-orange-200",
  grouped_payout: "bg-cyan-50 text-cyan-700 border-cyan-200",
  unmatched: "bg-red-50 text-red-700 border-red-200"
};

/**
 * @typedef {Object} ReconciliationRowProps
 * @property {any} rec
 */

/**
 * @type {React.NamedExoticComponent<ReconciliationRowProps>}
 */
const ReconciliationRow = memo(({ rec }) => {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <Badge className={cn("border text-xs font-medium", MATCH_CATEGORY_COLORS[rec.match_category])}>
          {MATCH_CATEGORY_LABELS[rec.match_category]}
        </Badge>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {rec.reconciled_by === "auto" ? (
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          ) : (
            <Check className="w-3.5 h-3.5 text-green-500" />
          )}
          <span className="text-xs">{rec.reconciled_by === "auto" ? "Auto-matched" : "Manual"}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2.5">
          <p className="text-xs text-gray-400 mb-0.5">Platform Revenue</p>
          <p className="font-medium text-gray-900 text-sm">Revenue Transaction</p>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
        <div className="flex-1 rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2.5">
          <p className="text-xs text-gray-400 mb-0.5">Bank Deposit</p>
          <p className="font-medium text-gray-900 text-sm">Bank Transaction</p>
        </div>
      </div>
      {rec.match_confidence && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${rec.match_confidence * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-500 tabular-nums">
            {(rec.match_confidence * 100).toFixed(0)}% confidence
          </span>
        </div>
      )}
      {rec.creator_notes && (
        <p className="mt-3 text-sm text-gray-500 italic">"{rec.creator_notes}"</p>
      )}
    </div>
  );
});

ReconciliationRow.displayName = "ReconciliationRow";

export default ReconciliationRow;
