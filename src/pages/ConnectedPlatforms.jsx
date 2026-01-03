import React, { useState, useEffect } from "react";
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
  AlertCircle,
  Clock,
  RefreshCw,
  Trash2,
  ExternalLink,
  Loader2,
  Key,
  History,
  ChevronDown,
  ChevronUp
} from "lucide-react";
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
import { motion, AnimatePresence } from "framer-motion";
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
    clientId: "985180453886-8qbvanuid2ifpdoq84culbg4gta83rbn.apps.googleusercontent.com"
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
  const [apiKey, setApiKey] = useState("");
  const [connectingPlatform, setConnectingPlatform] = useState(null);
  const [syncingPlatform, setSyncingPlatform] = useState(null);
  const [validatingKey, setValidatingKey] = useState(false);
  const [showHistory, setShowHistory] = useState({});
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
      toast.success("Platform connected successfully! ✓");
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

  const handleSync = async (platformId) => {
    const connection = connectedPlatforms.find(p => p.id === platformId);
    if (!connection) return;

    setSyncingPlatform(platformId);
    
    try {
      await base44.functions.invoke('syncPlatformData', {
        connectionId: platformId,
        platform: connection.platform
      });
      
      queryClient.invalidateQueries(['connectedPlatforms']);
      toast.success('Sync completed successfully!');
    } catch (error) {
      toast.error('Sync failed. Please try again.');
    } finally {
      setSyncingPlatform(null);
    }
  };

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

  const connectedIds = connectedPlatforms.map(p => p.platform);
  const availablePlatforms = PLATFORMS.filter(p => !connectedIds.includes(p.id));

  return (
    <div className="max-w-4xl mx-auto">
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
              const Icon = platform.icon;
              const isSyncing = syncingPlatform === connection.id;

              return (
                <motion.div
                  key={connection.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card-modern rounded-xl p-5 cursor-default"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center border relative",
                      platform.color
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
                        <h3 className="font-semibold text-white text-sm">{platform.name}</h3>
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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSync(connection.id)}
                        disabled={isSyncing || connection.sync_status === "syncing"}
                        className="text-white/40 hover:text-indigo-400 hover:bg-white/5 transition-colors h-8 w-8"
                      >
                        <RefreshCw className={cn("w-3.5 h-3.5", (isSyncing || connection.sync_status === "syncing") && "animate-spin")} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors h-8 w-8"
                        onClick={() => {
                          if (window.confirm(`Disconnect ${platform.name}? This will stop syncing revenue data.`)) {
                            disconnectMutation.mutate(connection.id);
                          }
                        }}
                        disabled={disconnectMutation.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
      )}

      {/* Connect Dialog */}
      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent className="card-modern rounded-2xl border max-w-2xl">
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
                    className="rounded-lg p-4 flex flex-col items-center gap-3 text-center bg-white/[0.02] border border-white/[0.05] cursor-pointer"
                    style={{ pointerEvents: connectingPlatform ? 'none' : 'auto', opacity: connectingPlatform ? 0.5 : 1 }}
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
    </div>
  );
}