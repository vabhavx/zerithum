import React, { useState } from "react";
import { format } from "date-fns";
import { Check, AlertCircle, Clock, RefreshCw, Trash2, Loader2, FileText, RotateCcw, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const getStatusIcon = (status) => {
  switch (status) {
    case "active": return <Check className="w-3.5 h-3.5" />;
    case "syncing": return <Loader2 className="w-3.5 h-3.5 animate-spin" />;
    case "error": return <AlertCircle className="w-3.5 h-3.5" />;
    case "stale": return <Clock className="w-3.5 h-3.5" />;
    default: return null;
  }
};
const getStatusLabel = (status) => ({ active: "Synced", syncing: "Syncing...", error: "Error", stale: "Stale" }[status] || "Unknown");
const getStatusColor = (status) => ({
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  syncing: "bg-blue-50 text-blue-700 border-blue-200",
  error: "bg-red-50 text-red-700 border-red-200",
  stale: "bg-amber-50 text-amber-700 border-amber-200"
}[status] || "bg-gray-50 text-gray-500 border-gray-200");

const ConnectedPlatformRow = React.memo(({ connection, platform, isSyncing, onViewHistory, onSync, onDisconnect, isDisconnecting }) => {
  const [showSyncMenu, setShowSyncMenu] = useState(false);
  if (!platform) return null;
  const Icon = platform.icon;

  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-gray-100 bg-white p-5 cursor-default">
      <div className="flex items-center gap-4">
        <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center border relative", platform.color)}>
          <Icon className="w-5 h-5" />
          {connection.sync_status === "active" && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-white">
              <Check className="w-2.5 h-2.5 text-white" />
            </motion.div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 text-sm">{platform.name}</h3>
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className={cn("flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border", getStatusColor(connection.sync_status))}>
              {getStatusIcon(connection.sync_status)}<span>{getStatusLabel(connection.sync_status)}</span>
            </motion.div>
          </div>
          <p className="text-xs text-gray-400">
            Connected {format(new Date(connection.connected_at), "MMM d, yyyy")}
            {connection.last_synced_at && connection.sync_status !== "syncing" && (<> · {format(new Date(connection.last_synced_at), "MMM d, h:mm a")}</>)}
          </p>
          {connection.error_message && connection.sync_status === "error" && (<p className="text-xs text-red-600 mt-1">{connection.error_message}</p>)}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => onViewHistory(connection)} className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors h-8 w-8" aria-label={`View sync history for ${platform.name}`}><FileText className="w-3.5 h-3.5" /></Button>
          <DropdownMenu open={showSyncMenu} onOpenChange={setShowSyncMenu}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" disabled={isSyncing || connection.sync_status === "syncing"} className="text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors h-8 px-2 gap-1" aria-label={`Sync ${platform.name} data`}>
                <RefreshCw className={cn("w-3.5 h-3.5", (isSyncing || connection.sync_status === "syncing") && "animate-spin")} /><ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white border-gray-200">
              <DropdownMenuItem onClick={() => { onSync(connection, false); setShowSyncMenu(false); }} className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 cursor-pointer">
                <RefreshCw className="w-4 h-4 mr-2" /><div><div className="font-medium text-sm">Quick Sync</div><div className="text-xs text-gray-400">Sync recent data</div></div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { onSync(connection, true); setShowSyncMenu(false); }} className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 cursor-pointer">
                <RotateCcw className="w-4 h-4 mr-2" /><div><div className="font-medium text-sm">Full Re-sync</div><div className="text-xs text-gray-400">Re-fetch all historical data (90 days)</div></div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors h-8 w-8" onClick={() => onDisconnect(connection, platform)} disabled={isDisconnecting} aria-label={`Disconnect ${platform.name}`}><Trash2 className="w-3.5 h-3.5" /></Button>
        </div>
      </div>
    </motion.div>
  );
});

ConnectedPlatformRow.displayName = "ConnectedPlatformRow";
export default ConnectedPlatformRow;