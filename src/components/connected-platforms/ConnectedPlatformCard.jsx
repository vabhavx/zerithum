import React from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Loader2, Plug, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLATFORMS } from "@/lib/platforms";
import { statusTone, statusLabel } from "@/lib/platform-utils";

export default function ConnectedPlatformCard({
  connection,
  syncingId,
  onSync,
  onDisconnect,
}) {
  const platform = PLATFORMS.find((item) => item.id === connection.platform);
  const Icon = platform?.icon;
  const syncing = syncingId === connection.id || connection.sync_status === "syncing";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="group rounded-lg border border-white/5 bg-white/[0.02] p-4 hover:border-white/10 hover:bg-white/[0.04] transition-all"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="relative mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-[#101014] transition-colors group-hover:border-white/20">
            {/* Status Indicator Dot */}
            <div
              className={`absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#15151A] ${
                connection.sync_status === "active"
                  ? "bg-green-500"
                  : connection.sync_status === "error"
                  ? "bg-red-500"
                  : connection.sync_status === "syncing"
                  ? "bg-blue-500 animate-pulse"
                  : "bg-gray-500"
              }`}
            />
            {Icon ? (
              <Icon className="h-5 w-5 text-white/70" />
            ) : (
              <Plug className="h-5 w-5 text-white/70" />
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-[#F5F5F5]">
              {platform?.name || connection.platform}
            </p>
            <div className="mt-1 flex items-center gap-2 text-xs text-white/50">
              <span>
                Connected{" "}
                {connection.connected_at
                  ? format(new Date(connection.connected_at), "MMM d")
                  : "-"}
              </span>
              {connection.last_synced_at && (
                <>
                  <span className="h-1 w-1 rounded-full bg-white/20" />
                  <span>
                    Synced {format(new Date(connection.last_synced_at), "h:mm a")}
                  </span>
                </>
              )}
            </div>
            {connection.error_message && (
              <p className="mt-1 text-xs text-[#F06C6C]">
                {connection.error_message}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 opacity-60 transition-opacity group-hover:opacity-100">
          <span
            className={`rounded-md border px-2 py-1 text-xs font-medium uppercase tracking-wider ${statusTone(
              connection.sync_status
            )}`}
          >
            {statusLabel(connection.sync_status)}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={syncing}
            onClick={() => onSync(connection, false)}
            className="h-8 border-white/20 bg-transparent px-3 text-xs text-[#F5F5F5] hover:bg-white/10"
          >
            {syncing ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Syncing
              </>
            ) : (
              "Sync"
            )}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={syncing}
            onClick={() => onSync(connection, true)}
            className="h-8 border-white/20 bg-transparent px-3 text-xs text-[#F5F5F5] hover:bg-white/10"
          >
            Full sync
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onDisconnect(connection)}
            className="h-8 border-[#F06C6C]/20 bg-transparent px-3 text-xs text-[#F06C6C] hover:bg-[#F06C6C]/10"
          >
            <Unplug className="mr-1.5 h-3.5 w-3.5" />
            Disconnect
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
