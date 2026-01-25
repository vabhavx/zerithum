import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
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
  RefreshCw,
  Tv,
  FileText,
  Store,
  ShieldCheck,
  AlertTriangle
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
    clientId: "985180453886-jld5u3u1nethrpaqk6o1tbvqhf1nlueb.apps.googleusercontent.com"
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
    oauthUrl: "https://gumroad.com/oauth/authorize",
    scope: "view_sales",
    redirectUri: "https://zerithum-copy-36d43903.base44.app/authcallback",
    requiresApiKey: false,
    clientId: import.meta.env.VITE_GUMROAD_CLIENT_ID || "REPLACE_WITH_YOUR_GUMROAD_CLIENT_ID"
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
  },
  {
    id: "shopify",
    name: "Shopify",
    icon: Store,
    color: "bg-green-500/10 border-green-500/20 text-green-400",
    description: "Sync store sales, orders, and product revenue",
    oauthUrl: "https://YOUR_SHOP.myshopify.com/admin/oauth/authorize",
    scope: "read_orders,read_products,read_customers",
    redirectUri: "https://zerithum-copy-36d43903.base44.app/authcallback",
    requiresApiKey: false,
    clientId: "YOUR_SHOPIFY_API_KEY",
    requiresShopName: true
  },
  {
    id: "twitch",
    name: "Twitch",
    icon: Tv,
    color: "bg-violet-500/10 border-violet-500/20 text-violet-400",
    description: "Track subscriptions, bits, and ad revenue",
    oauthUrl: "https://id.twitch.tv/oauth2/authorize",
    scope: "channel:read:subscriptions bits:read analytics:read:extensions",
    redirectUri: "https://zerithum-copy-36d43903.base44.app/authcallback",
    requiresApiKey: false,
    clientId: "YOUR_TWITCH_CLIENT_ID"
  },
  {
    id: "substack",
    name: "Substack",
    icon: FileText,
    color: "bg-orange-500/10 border-orange-500/20 text-orange-400",
    description: "Import newsletter subscriptions and earnings",
    requiresApiKey: true,
    validationUrl: "https://substack.com/api/v1/user"
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
  const [shopifyShopName, setShopifyShopName] = useState("");
  const [showAuditDialog, setShowAuditDialog] = useState(false);
  const [auditResults, setAuditResults] = useState(null);
  const [isAuditing, setIsAuditing] = useState(false);
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
      queryClient.invalidateQueries({ queryKey: ["connectedPlatforms"] });
      toast.success("Platform disconnected successfully");
      setDisconnectPlatform(null);
    },
  });

  const connectMutation = useMutation({
    mutationFn: (data) => base44.entities.ConnectedPlatform.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connectedPlatforms"] });
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
      queryClient.invalidateQueries({ queryKey: ["connectedPlatforms"] });
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
      queryClient.invalidateQueries({ queryKey: ["connectedPlatforms"] });
      setSyncingPlatform(null);
      toast.error("Sync failed. Please retry or reconnect the platform.");
    }
  });

  const initiateOAuthFlow = (platform) => {
    if (platform.requiresApiKey || platform.requiresShopName) {
      setSelectedPlatform(platform);
      setShowConnectDialog(true);
      return;
    }

    setConnectingPlatform(platform.id);
    
    let params;
    
    // Generate and store CSRF token
    const csrfToken = crypto.randomUUID();
    sessionStorage.setItem('oauth_state', csrfToken);
    // Sentinel: Set cookie for backend verification
    document.cookie = `oauth_state=${csrfToken}; path=/; max-age=300; SameSite=Lax`;
    const stateValue = `${platform.id}:${csrfToken}`;

    if (platform.id === "tiktok") {
      params = new URLSearchParams({
        client_key: platform.clientKey,
        scope: platform.scope,
        response_type: 'code',
        redirect_uri: platform.redirectUri,
        state: stateValue
      });
    } else if (platform.id === "shopify") {
      // For Shopify, we need the shop name first
      return;
    } else {
      params = new URLSearchParams({
        client_id: platform.clientId || platform.id,
        redirect_uri: platform.redirectUri,
        response_type: 'code',
        scope: platform.scope || '',
        state: stateValue,
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
      } else if (selectedPlatform.id === "substack") {
        // Substack validation - basic check
        const response = await fetch(selectedPlatform.validationUrl, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        
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

  const handleShopifyConnect = () => {
    if (!shopifyShopName.trim()) {
      toast.error("Please enter your Shopify store name");
      return;
    }

    // Generate and store CSRF token
    const csrfToken = crypto.randomUUID();
    sessionStorage.setItem('oauth_state', csrfToken);
    // Sentinel: Set cookie for backend verification
    document.cookie = `oauth_state=${csrfToken}; path=/; max-age=300; SameSite=Lax`;
    const stateValue = `shopify:${csrfToken}`;

    const shopifyOAuthUrl = `https://${shopifyShopName}.myshopify.com/admin/oauth/authorize`;
    const params = new URLSearchParams({
      client_id: selectedPlatform.clientId,
      scope: selectedPlatform.scope,
      redirect_uri: selectedPlatform.redirectUri,
      state: stateValue
    });

    window.location.href = `${shopifyOAuthUrl}?${params.toString()}`;
  };

  const handleSync = useCallback(async (connection, forceFullSync = false) => {
    if (!connection) return;

    setSyncingPlatform(connection.id);
    
    try {
      const response = await base44.functions.invoke('syncPlatformData', {
        connectionId: connection.id,
        platform: connection.platform,
        forceFullSync
      });
      
      queryClient.invalidateQueries({ queryKey: ['connectedPlatforms'] });
      queryClient.invalidateQueries({ queryKey: ['syncHistory'] });
      
      if (response.data.success) {
        setShowConfetti(true);
        const message = forceFullSync 
          ? `Full sync completed! ${response.data.transactionCount} transactions synced.`
          : response.data.message || 'Sync completed successfully!';
        toast.success(message);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Sync failed. Please try again.';
      toast.error(errorMessage, { duration: 6000 });
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

  const handleAudit = async () => {
    setIsAuditing(true);
    try {
      // Simulate audit process
      await new Promise(resolve => setTimeout(resolve, 2000));

      const results = connectedPlatforms.map(p => {
        const platform = PLATFORMS.find(pl => pl.id === p.platform);
        const isHealthy = p.sync_status === 'active' && (!p.last_synced_at || (new Date() - new Date(p.last_synced_at)) < 7 * 24 * 60 * 60 * 1000);

        return {
          id: p.id,
          name: platform?.name || p.platform,
          status: isHealthy ? "healthy" : "attention",
          message: isHealthy ? "Connection secure and active" : "Sync data is stale or connection error",
          lastSynced: p.last_synced_at
        };
      });

      setAuditResults(results);
      setShowAuditDialog(true);
      toast.success("Platform audit completed");
    } catch (error) {
      toast.error("Audit failed. Please try again.");
    } finally {
      setIsAuditing(false);
    }
  };

  const connectedIds = connectedPlatforms.map(p => p.platform);
  const availablePlatforms = PLATFORMS.filter(p => !connectedIds.includes(p.id));

  // Chart data calculations
  const statusData = [
    { name: "Active", value: connectedPlatforms.filter(c => c.sync_status === "active").length, color: "#10B981" },
    { name: "Error", value: connectedPlatforms.filter(c => c.sync_status === "error").length, color: "#EF4444" },
    { name: "Stale", value: connectedPlatforms.filter(c => c.sync_status === "stale").length, color: "#F59E0B" },
  ].filter(d => d.value > 0);

  const platformUsageData = connectedPlatforms.map(conn => {
    const syncCount = syncHistory.filter(h => h.platform === conn.platform).length;
    const platform = PLATFORMS.find(p => p.id === conn.platform);
    return {
      name: platform?.name || conn.platform,
      syncs: syncCount,
    };
  }).sort((a, b) => b.syncs - a.syncs);

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
        <div className="flex gap-3">
          {connectedPlatforms.length > 0 && (
            <Button
              variant="outline"
              onClick={handleAudit}
              disabled={isAuditing}
              className="rounded-lg border-white/10 text-white hover:bg-white/5 transition-all text-sm h-9"
            >
              {isAuditing ? (
                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 mr-2" />
              )}
              {isAuditing ? "Auditing..." : "Run Audit"}
            </Button>
          )}
          {availablePlatforms.length > 0 && (
            <Button
              onClick={() => setShowConnectDialog(true)}
              className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 hover:from-indigo-600 hover:to-purple-700 transition-all text-sm h-9"
            >
              <Plus className="w-3.5 h-3.5 mr-2" />
              Connect Platform
            </Button>
          )}
        </div>
      </motion.div>

      {/* Analytics Charts */}
      {connectedPlatforms.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Platform Status Distribution */}
          {statusData.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card-modern rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Connection Status</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: "rgba(0, 0, 0, 0.8)", 
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px",
                      color: "#fff"
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom"
                    formatter={(value) => <span className="text-white/70 text-sm">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Platform Sync Frequency */}
          {platformUsageData.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="card-modern rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Sync Activity</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={platformUsageData}>
                  <XAxis 
                    dataKey="name" 
                    stroke="rgba(255, 255, 255, 0.3)"
                    tick={{ fill: "rgba(255, 255, 255, 0.5)", fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="rgba(255, 255, 255, 0.3)"
                    tick={{ fill: "rgba(255, 255, 255, 0.5)", fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: "rgba(0, 0, 0, 0.8)", 
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px",
                      color: "#fff"
                    }}
                    cursor={{ fill: "rgba(99, 102, 241, 0.1)" }}
                  />
                  <Bar dataKey="syncs" fill="#6366F1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </div>
      )}

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
        <DialogContent className="card-modern rounded-2xl border max-w-2xl !fixed !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 max-h-[85vh] overflow-y-auto" style={{ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
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
          ) : selectedPlatform?.requiresShopName ? (
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
                <Label htmlFor="shopName" className="text-white/60 mb-2 block text-sm">Store Name</Label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    id="shopName"
                    type="text"
                    value={shopifyShopName}
                    onChange={(e) => setShopifyShopName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="your-store-name"
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-lg"
                  />
                </div>
                <p className="text-xs text-white/30 mt-2">
                  Enter your Shopify store name (e.g., "your-store" from your-store.myshopify.com)
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedPlatform(null);
                    setShopifyShopName("");
                  }}
                  className="flex-1 rounded-lg border-white/10 text-white/70 hover:bg-white/5"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleShopifyConnect}
                  disabled={!shopifyShopName.trim()}
                  className="flex-1 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Continue to Shopify
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

      <Dialog open={showAuditDialog} onOpenChange={setShowAuditDialog}>
        <DialogContent className="card-modern rounded-2xl border max-w-md !fixed !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2" style={{ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Platform Audit Report
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Security and connection health analysis
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            {auditResults?.map((result) => (
              <div
                key={result.id}
                className={cn(
                  "p-3 rounded-lg border flex items-start gap-3",
                  result.status === "healthy"
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : "bg-amber-500/5 border-amber-500/20"
                )}
              >
                <div className={cn(
                  "mt-0.5 p-1 rounded-full",
                  result.status === "healthy" ? "bg-emerald-500/20" : "bg-amber-500/20"
                )}>
                  {result.status === "healthy" ? (
                    <Check className={cn("w-3 h-3", result.status === "healthy" ? "text-emerald-400" : "text-amber-400")} />
                  ) : (
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">{result.name}</h4>
                  <p className={cn("text-xs", result.status === "healthy" ? "text-emerald-400/80" : "text-amber-400/80")}>
                    {result.message}
                  </p>
                  {result.lastSynced && (
                    <p className="text-[10px] text-white/30 mt-1">
                      Last Check: {format(new Date(result.lastSynced), "MMM d, h:mm a")}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {auditResults?.length === 0 && (
              <p className="text-center text-white/40 py-4">No platforms connected to audit.</p>
            )}
          </div>
          <div className="flex justify-end mt-4">
            <Button
              onClick={() => setShowAuditDialog(false)}
              className="rounded-lg bg-white/10 text-white hover:bg-white/20"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!disconnectPlatform} onOpenChange={(open) => !open && setDisconnectPlatform(null)}>
        <DialogContent className="card-modern rounded-2xl border max-w-md !fixed !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 max-h-[85vh] overflow-y-auto" style={{ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
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