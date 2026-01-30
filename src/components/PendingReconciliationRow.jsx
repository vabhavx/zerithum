import React, { memo } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

/**
 * @typedef {Object} PendingReconciliationRowProps
 * @property {any} transaction
 * @property {(transaction: any) => void} [onMatch]
 */

/**
 * @type {React.NamedExoticComponent<PendingReconciliationRowProps>}
 */
const PendingReconciliationRow = memo(({ transaction, onMatch }) => {
  return (
    <div className="clay-sm rounded-2xl p-4 flex items-center gap-4">
      <div className="flex-1">
        <p className="font-medium text-slate-800">
          {transaction.description || `${transaction.platform} - ${transaction.category}`}
        </p>
        <p className="text-sm text-slate-500">
          {format(new Date(transaction.transaction_date), "MMM d, yyyy")} · {transaction.platform}
        </p>
      </div>
      <p className="font-semibold text-slate-800">
        ${transaction.amount?.toFixed(2)}
      </p>
      <Button
        size="sm"
        variant="outline"
        className="rounded-xl bg-transparent hover:bg-slate-100"
        onClick={() => onMatch && onMatch(transaction)}
        aria-label={`Match transaction of $${transaction.amount?.toFixed(2)} from ${transaction.platform}`}
      >
        Match
      </Button>
    </div>
  );
});

PendingReconciliationRow.displayName = "PendingReconciliationRow";

export default PendingReconciliationRow;
