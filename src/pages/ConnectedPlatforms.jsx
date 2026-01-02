import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Youtube, 
  Users, 
  CircleDollarSign, 
  ShoppingBag, 
  Plus,
  Check,
  AlertCircle,
  Clock,
  RefreshCw,
  Trash2,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const PLATFORMS = [
  {
    id: "youtube",
    name: "YouTube",
    icon: Youtube,
    color: "bg-red-50 text-red-600 border-red-200",
    description: "Connect your YouTube channel to track ad revenue and memberships",
    oauthUrl: "#youtube-oauth"
  },
  {
    id: "patreon",
    name: "Patreon",
    icon: Users,
    color: "bg-rose-50 text-rose-600 border-rose-200",
    description: "Sync your Patreon pledges and membership revenue",
    oauthUrl: "#patreon-oauth"
  },
  {
    id: "stripe",
    name: "Stripe",
    icon: CircleDollarSign,
    color: "bg-violet-50 text-violet-600 border-violet-200",
    description: "Import payments, subscriptions, and product sales",
    oauthUrl: "#stripe-oauth"
  },
  {
    id: "gumroad",
    name: "Gumroad",
    icon: ShoppingBag,
    color: "bg-pink-50 text-pink-600 border-pink-200",
    description: "Track your digital product sales and memberships",
    oauthUrl: "#gumroad-oauth"
  }
];

export default function ConnectedPlatforms() {
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const queryClient = useQueryClient();

  const { data: connectedPlatforms = [], isLoading } = useQuery({
    queryKey: ["connectedPlatforms"],
    queryFn: () => base44.entities.ConnectedPlatform.list("-connected_at"),
  });

  const disconnectMutation = useMutation({
    mutationFn: (id) => base44.entities.ConnectedPlatform.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["connectedPlatforms"]);
    },
  });

  const connectMutation = useMutation({
    mutationFn: (platform) => base44.entities.ConnectedPlatform.create({
      platform: platform.id,
      sync_status: "active",
      connected_at: new Date().toISOString(),
      last_synced_at: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(["connectedPlatforms"]);
      setShowConnectDialog(false);
      setSelectedPlatform(null);
    },
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <Check className="w-4 h-4 text-emerald-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "stale":
        return <Clock className="w-4 h-4 text-amber-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "active":
        return "Connected";
      case "error":
        return "Error";
      case "stale":
        return "Needs Refresh";
      default:
        return "Unknown";
    }
  };

  const connectedIds = connectedPlatforms.map(p => p.platform);
  const availablePlatforms = PLATFORMS.filter(p => !connectedIds.includes(p.id));

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Connected Platforms</h1>
          <p className="text-slate-500 mt-1">Manage your revenue sources</p>
        </div>
        {availablePlatforms.length > 0 && (
          <Button
            onClick={() => setShowConnectDialog(true)}
            className="clay-sm hover:clay rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white border-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Connect Platform
          </Button>
        )}
      </div>

      {/* Connected Platforms */}
      {isLoading ? (
        <div className="clay rounded-3xl p-8 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-slate-400 mx-auto" />
          <p className="text-slate-500 mt-4">Loading platforms...</p>
        </div>
      ) : connectedPlatforms.length === 0 ? (
        <div className="clay rounded-3xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No platforms connected</h3>
          <p className="text-slate-500 mb-6">Connect your first platform to start tracking revenue</p>
          <Button
            onClick={() => setShowConnectDialog(true)}
            className="clay-sm hover:clay rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white border-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Connect Platform
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {connectedPlatforms.map((connection) => {
            const platform = PLATFORMS.find(p => p.id === connection.platform);
            if (!platform) return null;
            const Icon = platform.icon;

            return (
              <div key={connection.id} className="clay rounded-2xl p-5 clay-hover transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center border",
                    platform.color
                  )}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-800">{platform.name}</h3>
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-xs">
                        {getStatusIcon(connection.sync_status)}
                        <span className="text-slate-600">{getStatusLabel(connection.sync_status)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500">
                      Connected {format(new Date(connection.connected_at), "MMM d, yyyy")}
                      {connection.last_synced_at && (
                        <> · Last synced {format(new Date(connection.last_synced_at), "MMM d, h:mm a")}</>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-red-600"
                      onClick={() => disconnectMutation.mutate(connection.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Connect Dialog */}
      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent className="clay rounded-3xl border-0 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">Connect a Platform</DialogTitle>
            <DialogDescription className="text-slate-500">
              Choose a platform to connect and start syncing your revenue data
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {availablePlatforms.map((platform) => {
              const Icon = platform.icon;
              return (
                <button
                  key={platform.id}
                  onClick={() => connectMutation.mutate(platform)}
                  className={cn(
                    "w-full clay-sm rounded-2xl p-4 flex items-center gap-4 text-left",
                    "hover:clay transition-all duration-200",
                    selectedPlatform?.id === platform.id && "clay-pressed"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center border",
                    platform.color
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-800">{platform.name}</h4>
                    <p className="text-sm text-slate-500">{platform.description}</p>
                  </div>
                  <Plus className="w-5 h-5 text-slate-400" />
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}