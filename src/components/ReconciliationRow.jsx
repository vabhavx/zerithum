import React, { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Sparkles, Check, ArrowRight, User } from "lucide-react";
import { format } from "date-fns";

const MATCH_CATEGORY_LABELS = {
  exact_match: "Exact Match",
  fee_deduction: "Fee Deduction",
  hold_period: "Hold Period",
  manual: "Manual Match",
  unmatched: "Unmatched"
};

const MATCH_CATEGORY_COLORS = {
  exact_match: "bg-emerald-50 text-emerald-700 border-emerald-200",
  fee_deduction: "bg-blue-50 text-blue-700 border-blue-200",
  hold_period: "bg-amber-50 text-amber-700 border-amber-200",
  manual: "bg-purple-50 text-purple-700 border-purple-200",
  unmatched: "bg-red-50 text-red-700 border-red-200"
};

/**
 * @typedef {Object} ReconciliationRowProps
 * @property {any} rec
 * @property {any} [revenue]
 * @property {any} [bank]
 */

/**
 * @type {React.NamedExoticComponent<ReconciliationRowProps>}
 */
const ReconciliationRow = memo(({ rec, revenue, bank }) => {
  const fmt = (val, cur) => new Intl.NumberFormat('en-US', { style: 'currency', currency: cur || 'USD' }).format(val || 0);
  const date = (d) => {
      try {
          return d ? format(new Date(d), 'MMM d, yyyy') : '-';
      } catch {
          return '-';
      }
  };

  return (
    <div className="clay rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <Badge className={cn("border", MATCH_CATEGORY_COLORS[rec.match_category] || MATCH_CATEGORY_COLORS.unmatched)}>
          {MATCH_CATEGORY_LABELS[rec.match_category] || rec.match_category}
        </Badge>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          {rec.reconciled_by === "auto" ? (
            <Sparkles className="w-4 h-4 text-violet-500" />
          ) : (
            <User className="w-4 h-4 text-purple-500" />
          )}
          <span>{rec.reconciled_by === "auto" ? "Auto-matched" : "Manual"}</span>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="flex-1 clay-sm rounded-xl p-3 bg-white/50">
          <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">Platform Revenue</p>
          {revenue ? (
              <div>
                  <p className="font-medium text-slate-800 text-sm line-clamp-1" title={revenue.description}>
                      {revenue.description || `${revenue.platform} Revenue`}
                  </p>
                  <div className="flex justify-between items-baseline mt-1">
                      <span className="text-xs text-slate-500">{date(revenue.transaction_date)}</span>
                      <span className="text-sm font-bold text-slate-700">{fmt(revenue.amount, revenue.currency)}</span>
                  </div>
                   <Badge variant="outline" className="mt-1 text-[10px] h-5 px-1.5 font-normal text-slate-500 border-slate-200">
                       {revenue.platform}
                   </Badge>
              </div>
          ) : (
              <p className="text-sm italic text-slate-400">Transaction ID: {rec.revenue_transaction_id}</p>
          )}
        </div>

        <ArrowRight className="w-5 h-5 text-slate-300 flex-shrink-0 rotate-90 sm:rotate-0 self-center" />

        <div className="flex-1 clay-sm rounded-xl p-3 bg-white/50">
          <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">Bank Deposit</p>
          {bank ? (
              <div>
                   <p className="font-medium text-slate-800 text-sm line-clamp-1" title={bank.description}>
                      {bank.description || 'Deposit'}
                  </p>
                  <div className="flex justify-between items-baseline mt-1">
                      <span className="text-xs text-slate-500">{date(bank.transaction_date)}</span>
                      <span className="text-sm font-bold text-slate-700">{fmt(bank.amount, bank.currency)}</span>
                  </div>
              </div>
          ) : (
               <p className="text-sm italic text-slate-400">Transaction ID: {rec.bank_transaction_id}</p>
          )}
        </div>
      </div>

      {rec.match_confidence && rec.match_category !== 'manual' && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
              style={{ width: `${rec.match_confidence * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-slate-400">
            {(rec.match_confidence * 100).toFixed(0)}% match
          </span>
        </div>
      )}
      {rec.creator_notes && (
        <div className="mt-3 p-2 bg-yellow-50/50 border border-yellow-100 rounded-lg">
             <p className="text-xs text-yellow-700 italic">"{rec.creator_notes}"</p>
        </div>
      )}
    </div>
  );
});

ReconciliationRow.displayName = "ReconciliationRow";

export default ReconciliationRow;
