import React, { memo } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * @typedef {Object} ResolvedEventRowProps
 * @property {any} event
 */

/**
 * @type {React.NamedExoticComponent<ResolvedEventRowProps>}
 */
const ResolvedEventRow = memo(({ event }) => {
  return (
    <div
      className="rounded-lg p-4 bg-white/[0.02] border border-white/5 flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "px-2 py-1 rounded text-xs font-semibold",
          event.status === 'mitigated' && "bg-emerald-500/20 text-emerald-400",
          event.status === 'ignored' && "bg-gray-500/20 text-gray-400",
          event.status === 'accepted_risk' && "bg-amber-500/20 text-amber-400"
        )}>
          {event.status.replace(/_/g, ' ').toUpperCase()}
        </div>
        <p className="text-sm text-white">{event.event_type.replace(/_/g, ' ')}</p>
        <p className="text-xs text-white/40">
          {format(new Date(event.decision_made_at), "MMM d, yyyy")}
        </p>
      </div>
      <p className="text-sm text-white/60">{event.impact_percentage.toFixed(1)}% impact</p>
    </div>
  );
});

ResolvedEventRow.displayName = "ResolvedEventRow";

export default ResolvedEventRow;
