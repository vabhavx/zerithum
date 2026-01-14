import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Youtube, 
  Users, 
  CircleDollarSign, 
  ShoppingBag, 
  Instagram,
  Music,
  Plus,
  Check,
  ExternalLink,
  Loader2,
  Key,
  History,
  RefreshCw
} from "lucide-react";
import PlatformSyncHistory from "../components/platform/PlatformSyncHistory";
import ConnectedPlatformRow from "../components/platform/ConnectedPlatformRow";
import MotivationalQuote from "../components/shared/MotivationalQuote";
import SuccessConfetti from "../components/shared/SuccessConfetti";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const PLATFORMS = [
  {
    id: "youtube",
    name: "YouTube",
    icon: Youtube,
    color: "bg-red-500/10 border-red-500/20 text-red-400",
    description: "Track ad revenue, memberships, and Super Chat earnings",
    oauthUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    scope: "https://www.googleapis.com/auth/yt-analytics.readonly https://www.googleapis.com/auth/youtube.readonly",
    redirectUri: "https://zerithum-copy-36d43903.base44.app/authcallback",
    requiresApiKey: false,
    clientId: "985180453886-pof8b9qoqf1a7cha901khhg9lk7548b4.apps.googleusercontent.com"
  },
  {
    id: "patreon",
    name: "Patreon",
    icon: Users,
    color: "bg-rose-500/10 border-rose-500/20 text-rose-400",
    description: "Sync pledges, membership tiers, and patron data",
    oauthUrl: "https://www.patreon.com/oauth2/authorize",
    scope: "identity identity[email] campaigns campaigns.members",
    redirectUri: "https://zerithum-copy-36d43903.base44.app/authcallback",
    requiresApiKey: false,
    clientId: "i1ircOfqA2eD5ChN4-d6uElxt4vjWzIEv4vCfj0K_92LqilSM5OA_dJS24uFjiTR"
  },
  {
    id: "gumroad",
    name: "Gumroad",
    icon: ShoppingBag,
    color: "bg-pink-500/10 border-pink-500/20 text-pink-400",
    description: "Import product sales, subscriptions, and license data",
    requiresApiKey: true,
    validationUrl: "https://api.gumroad.com/v2/user"
  },
  {
    id: "stripe",
    name: "Stripe",
    icon: CircleDollarSign,
    color: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
    description: "Connect payments, subscriptions, and payout data",
    oauthUrl: "https://connect.stripe.com/oauth/authorize",
    scope: "read_write",
    redirectUri: "https://zerithum-copy-36d43903.base44.app/authcallback",
    requiresApiKey: false,
    clientId: "YOUR_STRIPE_CLIENT_ID"
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    color: "bg-purple-500/10 border-purple-500/20 text-purple-400",
    description: "Pull revenue from Instagram Insights and monetization",
    oauthUrl: "https://www.facebook.com/v20.0/dialog/oauth",
    scope: "instagram_basic,instagram_manage_insights,pages_read_engagement",
    redirectUri: "https://zerithum-copy-36d43903.base44.app/authcallback",
    requiresApiKey: false,
    clientId: "YOUR_META_APP_ID"
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: Music,
    color: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
    description: "Track Creator Fund earnings and video insights",
    oauthUrl: "https://www.tiktok.com/v2/auth/authorize/",
    scope: "video.list,user.info.basic,video.insights",
    redirectUri: "https://zerithum-copy-36d43903.base44.app/authcallback",
    requiresApiKey: false,
    clientKey: "YOUR_TIKTOK_CLIENT_KEY"
  }
];

export default function ConnectedPlatforms() {
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [disconnectPlatform, setDisconnectPlatform] = useState(null);
  const [selectedHistoryPlatform, setSelectedHistoryPlatform] = useState(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [connectingPlatform, setConnectingPlatform] = useState(null);
  const [syncingPlatform, setSyncingPlatform] = useState(null);
  const [validatingKey, setValidatingKey] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const queryClient = useQueryClient();

  const { data: connectedPlatforms = [], isLoading } = useQuery({
    queryKey: ["connectedPlatforms"],
    queryFn: async () => {
      // Fetch only current user's connections
      const user = await base44.auth.me();
      return base44.entities.ConnectedPlatform.filter({ user_id: user.id });
    },
  });

  const { data: syncHistory = [] } = useQuery({
    queryKey: ["syncHistory"],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.SyncHistory.filter({ user_id: user.id }, "-sync_started_at", 50);
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (id) => base44.entities.ConnectedPlatform.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["connectedPlatforms"]);
      toast.success("Platform disconnected successfully");
      setDisconnectPlatform(null);
    },
  });

  const connectMutation = useMutation({
    mutationFn: (data) => base44.entities.ConnectedPlatform.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["connectedPlatforms"]);
      setShowConnectDialog(false);
      setSelectedPlatform(null);
      setApiKey("");
      setConnectingPlatform(null);
      setValidatingKey(false);
      setShowConfetti(true);
      toast.success("Platform connected successfully! ✓");
      setTimeout(() => setShowConfetti(false), 3000);
    },
    onError: (error) => {
      setConnectingPlatform(null);
      setValidatingKey(false);
      toast.error("Failed to connect platform. Please retry.");
    }
  });

  const syncMutation = useMutation({
    mutationFn: async (platformId) => {
      const connection = connectedPlatforms.find(p => p.id === platformId);
      
      // Update to syncing status
      await base44.entities.ConnectedPlatform.update(platformId, {
        sync_status: "syncing"
      });
      
      // Simulate data fetch from platform API
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Random success/failure for demo (90% success rate)
      const success = Math.random() > 0.1;
      
      if (!success) {
        throw new Error("Sync failed");
      }
      
      return base44.entities.ConnectedPlatform.update(platformId, {
        last_synced_at: new Date().toISOString(),
        sync_status: "active",
        error_message: null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["connectedPlatforms"]);
      setSyncingPlatform(null);
      toast.success("Sync completed successfully! ✓");
    },
    onError: (error, platformId) => {
      // Update to error status
      const connection = connectedPlatforms.find(p => p.id === platformId);
      if (connection) {
        base44.entities.ConnectedPlatform.update(platformId, {
          sync_status: "error",
          error_message: "Failed to sync data. Please check your connection and try again."
        });
      }
      queryClient.invalidateQueries(["connectedPlatforms"]);
      setSyncingPlatform(null);
      toast.error("Sync failed. Please retry or reconnect the platform.");
    }
  });

  const initiateOAuthFlow = (platform) => {
    if (platform.requiresApiKey) {
      setSelectedPlatform(platform);
      setShowConnectDialog(true);
      return;
    }

    setConnectingPlatform(platform.id);
    
    let params;
    
    if (platform.id === "tiktok") {
      params = new URLSearchParams({
        client_key: platform.clientKey,
        scope: platform.scope,
        response_type: 'code',
        redirect_uri: platform.redirectUri,
        state: platform.id
      });
    } else {
      params = new URLSearchParams({
        client_id: platform.clientId || platform.id,
        redirect_uri: platform.redirectUri,
        response_type: 'code',
        scope: platform.scope || '',
        state: platform.id,
        access_type: platform.id === 'youtube' ? 'offline' : undefined,
        prompt: platform.id === 'youtube' ? 'consent' : undefined
      });
    }

    // Redirect to OAuth URL
    window.location.href = `${platform.oauthUrl}?${params.toString()}`;
  };

  const handleApiKeyConnect = async () => {
    if (!apiKey.trim()) {
      toast.error("Please enter your API key");
      return;
    }

    setValidatingKey(true);
    setConnectingPlatform(selectedPlatform.id);
    
    try {
      // Validate API key
      if (selectedPlatform.id === "gumroad") {
        const response = await fetch(`${selectedPlatform.validationUrl}?access_token=${apiKey}`);
        
        if (!response.ok) {
          throw new Error("Invalid API key");
        }
      }
      
      // Key is valid, save connection
      connectMutation.mutate({
        platform: selectedPlatform.id,
        oauth_token: apiKey,
        sync_status: "active",
        connected_at: new Date().toISOString(),
        last_synced_at: new Date().toISOString()
      });
    } catch (error) {
      setConnectingPlatform(null);
      setValidatingKey(false);
      toast.error("Invalid API key. Please check and try again.");
    }
  };

  const handleSync = useCallback(async (connection) => {
    if (!connection) return;

    setSyncingPlatform(connection.id);
    
    try {
      await base44.functions.invoke('syncPlatformData', {
        connectionId: connection.id,
        platform: connection.platform
      });
      
      queryClient.invalidateQueries(['connectedPlatforms']);
      queryClient.invalidateQueries(['syncHistory']);
      setShowConfetti(true);
      toast.success('Sync completed successfully!');
      setTimeout(() => setShowConfetti(false), 3000);
    } catch (error) {
      toast.error('Sync failed. Please try again.');
    } finally {
      setSyncingPlatform(null);
    }
  }, [queryClient]);

  const handleViewHistory = useCallback((connection) => {
    setSelectedHistoryPlatform(connection);
    setShowHistoryDialog(true);
  }, []);

  const handleDisconnect = useCallback((connection, platform) => {
    setDisconnectPlatform({ id: connection.id, name: platform.name });
  }, []);

  const connectedIds = connectedPlatforms.map(p => p.platform);
  const availablePlatforms = PLATFORMS.filter(p => !connectedIds.includes(p.id));

  return (
    <div className="max-w-4xl mx-auto">
      <SuccessConfetti trigger={showConfetti} />
      
      <MotivationalQuote className="mb-6" />

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Connected Platforms</h1>
          <p className="text-white/40 mt-1 text-sm">Manage your revenue sources</p>
        </div>
        {availablePlatforms.length > 0 && (
          <Button
            onClick={() => setShowConnectDialog(true)}
            className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 hover:from-indigo-600 hover:to-purple-700 transition-all text-sm h-9"
          >
            <Plus className="w-3.5 h-3.5 mr-2" />
            Connect Platform
          </Button>
        )}
      </motion.div>

      {/* Connected Platforms */}
      {connectingPlatform && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="rounded-xl p-4 mb-6 bg-indigo-500/10 border border-indigo-500/30 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            <div>
              <p className="font-semibold text-indigo-400 text-sm">Connecting Platform...</p>
              <p className="text-xs text-indigo-300/80">Establishing secure connection</p>
            </div>
          </div>
        </motion.div>
      )}

      {isLoading ? (
        <div className="card-modern rounded-xl p-8 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-white/30 mx-auto" />
          <p className="text-white/40 mt-4 text-sm">Loading platforms...</p>
        </div>
      ) : connectedPlatforms.length === 0 ? (
        <div className="card-modern rounded-xl p-12 text-center">
          <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
            <ExternalLink className="w-8 h-8 text-white/30" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No platforms connected</h3>
          <p className="text-white/40 mb-6 text-sm">Connect your first platform to start tracking revenue</p>
          <Button
            onClick={() => setShowConnectDialog(true)}
            className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Connect Platform
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
            {connectedPlatforms.map((connection) => {
              const platform = PLATFORMS.find(p => p.id === connection.platform);
              if (!platform) return null;

              return (
                <ConnectedPlatformRow
                  key={connection.id}
                  connection={connection}
                  platform={platform}
                  isSyncing={syncingPlatform === connection.id}
                  onViewHistory={handleViewHistory}
                  onSync={handleSync}
                  onDisconnect={handleDisconnect}
                  isDisconnecting={disconnectMutation.isPending}
                />
              );
            })}
          </div>
      )}

      {/* Connect Dialog */}
      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent className="card-modern rounded-2xl border max-w-2xl !fixed !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2" style={{ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">
              {selectedPlatform ? `Connect ${selectedPlatform.name}` : "Connect Platform"}
            </DialogTitle>
            <DialogDescription className="text-white/40 text-sm">
              {selectedPlatform 
                ? "Enter your API key to securely connect" 
                : "Choose a platform to sync your revenue data"}
            </DialogDescription>
          </DialogHeader>

          {selectedPlatform?.requiresApiKey ? (
            <div className="space-y-4 mt-4">
              <div className="rounded-lg p-4 flex items-center gap-3 bg-white/[0.02] border border-white/[0.05]">
                <div className={cn(
                  "w-11 h-11 rounded-lg flex items-center justify-center border",
                  selectedPlatform.color
                )}>
                  {React.createElement(selectedPlatform.icon, { className: "w-5 h-5" })}
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">{selectedPlatform.name}</h4>
                  <p className="text-xs text-white/40">{selectedPlatform.description}</p>
                </div>
              </div>

              <div>
                <Label htmlFor="apiKey" className="text-white/60 mb-2 block text-sm">API Key</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={`Enter your ${selectedPlatform.name} API key`}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-lg"
                  />
                </div>
                <p className="text-xs text-white/30 mt-2">
                  Find your API key in {selectedPlatform.name} Settings → Advanced
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedPlatform(null);
                    setApiKey("");
                  }}
                  className="flex-1 rounded-lg border-white/10 text-white/70 hover:bg-white/5"
                  disabled={connectingPlatform || validatingKey}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleApiKeyConnect}
                  disabled={connectingPlatform || validatingKey || !apiKey.trim()}
                  className="flex-1 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                >
                  {(connectingPlatform || validatingKey) ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {validatingKey ? "Validating..." : "Connecting..."}
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Connect
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pointer-events-auto">
              {availablePlatforms.map((platform) => {
                const Icon = platform.icon;
                return (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => initiateOAuthFlow(platform)}
                    disabled={connectingPlatform}
                    className="rounded-lg p-4 flex flex-col items-center gap-3 text-center bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center border flex-shrink-0",
                      platform.color
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white text-sm mb-1">{platform.name}</h4>
                      <p className="text-xs text-white/40 line-clamp-2">{platform.description}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-indigo-400">
                      <span>Connect</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PlatformSyncHistory
        platform={selectedHistoryPlatform}
        open={showHistoryDialog}
        onOpenChange={setShowHistoryDialog}
      />

      <Dialog open={!!disconnectPlatform} onOpenChange={(open) => !open && setDisconnectPlatform(null)}>
        <DialogContent className="card-modern rounded-2xl border max-w-md !fixed !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2" style={{ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">Disconnect {disconnectPlatform?.name}?</DialogTitle>
            <DialogDescription className="text-white/60">
              This will stop syncing revenue data from {disconnectPlatform?.name}. Your existing history will be preserved.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="ghost"
              onClick={() => setDisconnectPlatform(null)}
              className="rounded-lg border-white/10 text-white/70 hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={() => disconnectMutation.mutate(disconnectPlatform.id)}
              disabled={disconnectMutation.isPending}
              className="rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20"
            >
              {disconnectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Disconnect"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sync History */}
      {syncHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-modern rounded-xl p-6 mt-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center">
                <History className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Sync History</h3>
                <p className="text-xs text-white/40">Recent synchronization activity</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {syncHistory.slice(0, 10).map((sync) => {
              const platform = PLATFORMS.find(p => p.id === sync.platform);
              if (!platform) return null;
              const Icon = platform.icon;
              const duration = sync.duration_ms ? `${(sync.duration_ms / 1000).toFixed(1)}s` : 'N/A';

              return (
                <div
                  key={sync.id}
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
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
