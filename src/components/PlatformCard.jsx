import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, AlertCircle, Loader2, Clock, FileText, RefreshCw, Trash2 } from 'lucide-react';
import { format } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { PLATFORMS } from "@/lib/platforms";

/**
 * @typedef {Object} PlatformCardProps
 * @property {string|object} platform - Platform ID or object
 * @property {object} [connection] - Connection object
 * @property {function} [onConnect]
 * @property {function} [onSync]
 * @property {function} [onDisconnect]
 * @property {function} [onViewHistory]
 * @property {boolean} [isSyncing]
 * @property {boolean} [isDisconnecting]
 */

/**
 * @param {PlatformCardProps} props
 */
export default function PlatformCard({
  platform,
  connection,
  onConnect,
  onSync,
  onDisconnect,
  onViewHistory,
  isSyncing: isSyncingProp,
  isDisconnecting
}) {
  const platformData = typeof platform === 'string' ? PLATFORMS.find(p => p.id === platform) : platform;

  if (!platformData) return null;

  const Icon = platformData.icon;
  const isConnected = connection?.sync_status === "active" || connection?.sync_status === "error" || connection?.sync_status === "syncing" || connection?.sync_status === "stale";
  const isSyncing = isSyncingProp || connection?.sync_status === "syncing";
  const hasError = connection?.sync_status === "error";

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <Check className="w-3.5 h-3.5" />;
      case "syncing":
        return <Loader2 className="w-3.5 h-3.5 animate-spin" />;
      case "error":
        return <AlertCircle className="w-3.5 h-3.5" />;
      case "stale":
        return <Clock className="w-3.5 h-3.5" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "active":
        return "Synced";
      case "syncing":
        return "Syncing...";
      case "error":
        return "Error";
      case "stale":
        return "Stale";
      default:
        return "Unknown";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "syncing":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "error":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "stale":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default:
        return "bg-white/5 text-white/40 border-white/10";
    }
  };

  // If not connected, show the "Connect" style card (or simple card)
  if (!connection) {
     // Check if it's the "clay-card" style from Platforms.jsx or we want the modern style?
     // ConnectedPlatforms.jsx didn't show unconnected cards in the main list.
     // Platforms.jsx DOES show them.
     // I'll implement a card that looks good for unconnected state too, using modern style.

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-modern rounded-xl p-5"
      >
        <div className="flex items-center gap-4 mb-4">
            <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center border",
                platformData.color
            )}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <h3 className="font-semibold text-white text-sm">{platformData.name}</h3>
                <p className="text-xs text-white/40">{platformData.description}</p>
            </div>
        </div>
        <Button
            onClick={() => onConnect?.(platformData)}
            className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white h-9"
        >
            Connect
        </Button>
      </motion.div>
    );
  }

  // Connected State
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-modern rounded-xl p-5 cursor-default"
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center border relative",
          platformData.color
        )}>
          <Icon className="w-5 h-5" />
          {connection.sync_status === "active" && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center border border-[#0A0A0A]"
            >
              <Check className="w-2.5 h-2.5 text-white" />
            </motion.div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white text-sm">{platformData.name}</h3>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border",
                getStatusColor(connection.sync_status)
              )}
            >
              {getStatusIcon(connection.sync_status)}
              <span>{getStatusLabel(connection.sync_status)}</span>
            </motion.div>
          </div>
          <p className="text-xs text-white/40">
            Connected {format(new Date(connection.connected_at), "MMM d, yyyy")}
            {connection.last_synced_at && connection.sync_status !== "syncing" && (
              <> · {format(new Date(connection.last_synced_at), "MMM d, h:mm a")}</>
            )}
          </p>
          {connection.error_message && connection.sync_status === "error" && (
            <p className="text-xs text-red-400 mt-1">{connection.error_message}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onViewHistory && (
            <Button
                variant="ghost"
                size="icon"
                onClick={() => onViewHistory(connection)}
                className="text-white/40 hover:text-blue-400 hover:bg-white/5 transition-colors h-8 w-8"
                aria-label={`View sync history for ${platformData.name}`}
            >
                <FileText className="w-3.5 h-3.5" />
            </Button>
          )}
          {onSync && (
            <Button
                variant="ghost"
                size="icon"
                onClick={() => onSync(connection.id || platformData.id)}
                disabled={isSyncing}
                className="text-white/40 hover:text-indigo-400 hover:bg-white/5 transition-colors h-8 w-8"
                aria-label={`Sync ${platformData.name} data`}
            >
                <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} />
            </Button>
          )}
          {onDisconnect && (
             <Button
                variant="ghost"
                size="icon"
                className="text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors h-8 w-8"
                onClick={() => onDisconnect(connection.id ? { id: connection.id, platform: platformData.id, name: platformData.name } : platformData.id)}
                disabled={isDisconnecting}
                aria-label={`Disconnect ${platformData.name}`}
             >
                <Trash2 className="w-3.5 h-3.5" />
             </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
