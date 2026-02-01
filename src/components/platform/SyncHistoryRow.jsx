import React from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const SyncHistoryRow = React.memo(({ sync, platform }) => {
  if (!platform) return null;
  const Icon = platform.icon;
  const duration = sync.duration_ms ? `${(sync.duration_ms / 1000).toFixed(1)}s` : 'N/A';

  return (
    <div
      className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border", platform.color)}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-white text-sm font-medium">{platform.name}</p>
          <p className="text-white/40 text-xs">
            {format(new Date(sync.sync_started_at), "MMM d, h:mm a")}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-white/70 text-xs">{sync.transactions_synced} transactions</p>
          <p className="text-white/40 text-xs">{duration}</p>
        </div>
        <div className={cn(
          "px-2 py-1 rounded-md text-xs font-medium",
          sync.status === "success" && "bg-emerald-500/10 text-emerald-400",
          sync.status === "error" && "bg-red-500/10 text-red-400",
          sync.status === "partial" && "bg-amber-500/10 text-amber-400"
        )}>
          {sync.status}
        </div>
      </div>
    </div>
  );
});

SyncHistoryRow.displayName = "SyncHistoryRow";

export default SyncHistoryRow;
