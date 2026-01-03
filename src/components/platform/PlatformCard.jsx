import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { format } from "date-fns";

export default function PlatformCard({ platform, connection, onConnect, onDisconnect, onSync }) {
  const [syncing, setSyncing] = useState(false);

  const platformConfig = {
    youtube: {
      name: "YouTube",
      icon: "🎥",
      color: "#FF0000",
      description: "AdSense earnings, analytics",
      scopes: "yt-analytics.readonly, yt.readonly",
    },
    patreon: {
      name: "Patreon",
      icon: "💖",
      color: "#FF424D",
      description: "Pledges, memberships",
      scopes: "campaigns:read, pledges-to-me:read",
    },
    gumroad: {
      name: "Gumroad",
      icon: "📦",
      color: "#FF90E8",
      description: "Product sales",
      scopes: "API Key",
    },
    stripe: {
      name: "Stripe",
      icon: "⚡",
      color: "#635BFF",
      description: "Payments, subscriptions",
      scopes: "read_write",
      note: "India: Using Paddle",
    },
    instagram: {
      name: "Instagram",
      icon: "📷",
      color: "#E1306C",
      description: "Brand collaborations",
      scopes: "instagram_basic, insights",
    },
    tiktok: {
      name: "TikTok",
      icon: "🎵",
      color: "#000000",
      description: "Creator Fund earnings",
      scopes: "video.list, user.info.basic",
    },
  };

  const config = platformConfig[platform];
  const isConnected = connection && connection.sync_status !== "error";
  const hasError = connection && connection.sync_status === "error";

  const handleSync = async () => {
    setSyncing(true);
    await onSync(platform);
    setSyncing(false);
  };

  return (
    <div className="clay-card group">
      {/* Platform Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: `${config.color}15` }}>
            {config.icon}
          </div>
          <div>
            <h3 className="font-bold text-lg text-[#5E5240]">{config.name}</h3>
            <p className="text-xs text-[#5E5240]/60">{config.description}</p>
          </div>
        </div>
        {isConnected && (
          <CheckCircle2 className="w-5 h-5 text-[#208D9E]" />
        )}
        {hasError && (
          <AlertCircle className="w-5 h-5 text-[#C0152F]" />
        )}
      </div>

      {/* Connection Status */}
      <div className="mb-4 pb-4 border-b border-[#5E5240]/10">
        {isConnected ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#5E5240]/60">Last synced:</span>
              <span className="font-medium text-[#5E5240]">
                {connection.last_synced ? format(new Date(connection.last_synced), "MMM d, h:mm a") : "Never"}
              </span>
            </div>
            {connection.expires_at && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#5E5240]/60">Token expires:</span>
                <span className="font-medium text-[#5E5240]">
                  {format(new Date(connection.expires_at), "MMM d, yyyy")}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-[#5E5240]/60">
            <p className="mb-2">Scopes: {config.scopes}</p>
            {config.note && (
              <p className="text-xs italic text-[#208D9E]">{config.note}</p>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {hasError && connection.error_message && (
        <div className="mb-4 p-3 bg-[#C0152F]/10 rounded-lg">
          <p className="text-xs text-[#C0152F]">{connection.error_message}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {!isConnected ? (
          <Button
            onClick={() => onConnect(platform)}
            className="flex-1 btn-primary"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Connect
          </Button>
        ) : (
          <>
            <Button
              onClick={handleSync}
              disabled={syncing || connection.sync_status === "syncing"}
              className="flex-1 btn-primary text-sm"
            >
              {syncing || connection.sync_status === "syncing" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                "Sync Now"
              )}
            </Button>
            <Button
              onClick={() => onDisconnect(platform)}
              className="btn-secondary text-sm"
            >
              Disconnect
            </Button>
          </>
        )}
      </div>
    </div>
  );
}