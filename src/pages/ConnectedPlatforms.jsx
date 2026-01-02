import React, { useState, useEffect } from "react";
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
  ExternalLink,
  Loader2,
  Key
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
    color: "bg-red-50 text-red-600 border-red-200",
    description: "Connect your YouTube channel to track ad revenue and memberships",
    oauthUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    scope: "https://www.googleapis.com/auth/adsense.readonly",
    redirectUri: "https://zerithum.com/auth/callback/google",
    requiresApiKey: false
  },
  {
    id: "patreon",
    name: "Patreon",
    icon: Users,
    color: "bg-rose-50 text-rose-600 border-rose-200",
    description: "Sync your Patreon pledges and membership revenue",
    oauthUrl: "https://www.patreon.com/oauth2/authorize",
    redirectUri: "https://zerithum.com/auth/callback/patreon",
    requiresApiKey: false
  },
  {
    id: "stripe",
    name: "Stripe",
    icon: CircleDollarSign,
    color: "bg-violet-50 text-violet-600 border-violet-200",
    description: "Import payments, subscriptions, and product sales",
    oauthUrl: "https://connect.stripe.com/oauth/authorize",
    redirectUri: "https://zerithum.com/auth/callback/stripe",
    requiresApiKey: false
  },
  {
    id: "gumroad",
    name: "Gumroad",
    icon: ShoppingBag,
    color: "bg-pink-50 text-pink-600 border-pink-200",
    description: "Track your digital product sales and memberships",
    requiresApiKey: true
  }
];

export default function ConnectedPlatforms() {
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [gumroadApiKey, setGumroadApiKey] = useState("");
  const [connectingPlatform, setConnectingPlatform] = useState(null);
  const [syncingPlatform, setSyncingPlatform] = useState(null);
  const queryClient = useQueryClient();

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const platform = urlParams.get('platform');
    
    if (code && platform) {
      handleOAuthCallback(platform, code);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const { data: connectedPlatforms = [], isLoading } = useQuery({
    queryKey: ["connectedPlatforms"],
    queryFn: () => base44.entities.ConnectedPlatform.list("-connected_at"),
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
      setGumroadApiKey("");
      setConnectingPlatform(null);
      toast.success("Platform connected successfully!");
    },
    onError: () => {
      setConnectingPlatform(null);
      toast.error("Failed to connect platform");
    }
  });

  const syncMutation = useMutation({
    mutationFn: async (platformId) => {
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 2000));
      const platform = connectedPlatforms.find(p => p.id === platformId);
      return base44.entities.ConnectedPlatform.update(platformId, {
        last_synced_at: new Date().toISOString(),
        sync_status: "active"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["connectedPlatforms"]);
      setSyncingPlatform(null);
      toast.success("Sync completed successfully!");
    },
    onError: () => {
      setSyncingPlatform(null);
      toast.error("Sync failed. Please try again.");
    }
  });

  const handleOAuthCallback = async (platform, code) => {
    setConnectingPlatform(platform);
    
    // In a real app, you'd exchange the code for a token on the backend
    // For now, we'll simulate it
    setTimeout(() => {
      connectMutation.mutate({
        platform: platform,
        oauth_token: code, // In real app, this would be the access token
        sync_status: "active",
        connected_at: new Date().toISOString(),
        last_synced_at: new Date().toISOString()
      });
    }, 1000);
  };

  const initiateOAuthFlow = (platform) => {
    if (platform.requiresApiKey) {
      setSelectedPlatform(platform);
      setShowConnectDialog(true);
      return;
    }

    setConnectingPlatform(platform.id);
    
    const params = new URLSearchParams({
      client_id: 'your_client_id', // In real app, this comes from config
      redirect_uri: platform.redirectUri,
      response_type: 'code',
      scope: platform.scope || '',
      state: platform.id
    });

    // Redirect to OAuth provider
    window.location.href = `${platform.oauthUrl}?${params.toString()}`;
  };

  const handleGumroadConnect = () => {
    if (!gumroadApiKey.trim()) {
      toast.error("Please enter your Gumroad API key");
      return;
    }

    setConnectingPlatform("gumroad");
    
    connectMutation.mutate({
      platform: "gumroad",
      oauth_token: gumroadApiKey,
      sync_status: "active",
      connected_at: new Date().toISOString(),
      last_synced_at: new Date().toISOString()
    });
  };

  const handleSync = (platformId) => {
    setSyncingPlatform(platformId);
    syncMutation.mutate(platformId);
  };

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
      {connectingPlatform && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="clay rounded-2xl p-5 mb-6 bg-gradient-to-r from-violet-50/80 to-indigo-50/80 border border-violet-200/50"
        >
          <div className="flex items-center gap-4">
            <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
            <div>
              <p className="font-semibold text-violet-800">Connecting Platform...</p>
              <p className="text-sm text-violet-600">Please wait while we establish the connection</p>
            </div>
          </div>
        </motion.div>
      )}

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
        <AnimatePresence mode="popLayout">
          <div className="space-y-4">
            {connectedPlatforms.map((connection) => {
              const platform = PLATFORMS.find(p => p.id === connection.platform);
              if (!platform) return null;
              const Icon = platform.icon;
              const isSyncing = syncingPlatform === connection.id;

              return (
                <motion.div
                  key={connection.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="clay rounded-2xl p-5 clay-hover transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center border relative",
                      platform.color
                    )}>
                      <Icon className="w-6 h-6" />
                      {connection.sync_status === "active" && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-white"
                        >
                          <Check className="w-3 h-3 text-white" />
                        </motion.div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-800">{platform.name}</h3>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={cn(
                            "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs",
                            connection.sync_status === "active" && "bg-emerald-50 text-emerald-700 border border-emerald-200",
                            connection.sync_status === "error" && "bg-red-50 text-red-700 border border-red-200",
                            connection.sync_status === "stale" && "bg-amber-50 text-amber-700 border border-amber-200"
                          )}
                        >
                          {getStatusIcon(connection.sync_status)}
                          <span>{getStatusLabel(connection.sync_status)}</span>
                        </motion.div>
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
                        onClick={() => handleSync(connection.id)}
                        disabled={isSyncing}
                        className="text-slate-400 hover:text-violet-600 transition-colors"
                      >
                        <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-red-600 transition-colors"
                        onClick={() => {
                          if (window.confirm(`Disconnect ${platform.name}? This will stop syncing revenue data.`)) {
                            disconnectMutation.mutate(connection.id);
                          }
                        }}
                        disabled={disconnectMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}

      {/* Connect Dialog */}
      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent className="clay rounded-3xl border-0 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">
              {selectedPlatform ? `Connect ${selectedPlatform.name}` : "Connect a Platform"}
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              {selectedPlatform 
                ? "Enter your API credentials to connect" 
                : "Choose a platform to connect and start syncing your revenue data"}
            </DialogDescription>
          </DialogHeader>

          {selectedPlatform?.requiresApiKey ? (
            <div className="space-y-4 mt-4">
              <div className="clay-sm rounded-2xl p-4 flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center border",
                  selectedPlatform.color
                )}>
                  {React.createElement(selectedPlatform.icon, { className: "w-5 h-5" })}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">{selectedPlatform.name}</h4>
                  <p className="text-sm text-slate-500">{selectedPlatform.description}</p>
                </div>
              </div>

              <div>
                <Label htmlFor="apiKey" className="text-slate-600 mb-2 block">API Key</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="apiKey"
                    type="password"
                    value={gumroadApiKey}
                    onChange={(e) => setGumroadApiKey(e.target.value)}
                    placeholder="Enter your Gumroad API key"
                    className="pl-10 clay-sm rounded-xl border-0 bg-white/50"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Find your API key in your Gumroad Settings → Advanced
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedPlatform(null);
                    setGumroadApiKey("");
                  }}
                  className="flex-1 rounded-xl"
                  disabled={connectingPlatform}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGumroadConnect}
                  disabled={connectingPlatform || !gumroadApiKey.trim()}
                  className="flex-1 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white"
                >
                  {connectingPlatform ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
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
            <div className="space-y-3 mt-4">
              {availablePlatforms.map((platform) => {
                const Icon = platform.icon;
                return (
                  <motion.button
                    key={platform.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => initiateOAuthFlow(platform)}
                    disabled={connectingPlatform}
                    className={cn(
                      "w-full clay-sm rounded-2xl p-4 flex items-center gap-4 text-left",
                      "hover:clay transition-all duration-200",
                      connectingPlatform && "opacity-50 cursor-not-allowed"
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
                    <ExternalLink className="w-5 h-5 text-slate-400" />
                  </motion.button>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}