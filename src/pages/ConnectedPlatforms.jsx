import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  AlertTriangle, CheckCircle2, Loader2, Plug, RefreshCw, Search, ShieldCheck, Unplug
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/supabaseClient";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard, containerVariants, itemVariants } from "@/components/ui/glass-card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PLATFORMS } from "@/lib/platforms";
import BankConnectionCard from "@/components/BankConnectionCard";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "active", label: "Healthy" },
  { value: "syncing", label: "Syncing" },
  { value: "error", label: "Errors" },
  { value: "stale", label: "Stale" },
];

function statusTone(s) {
  if (s === "active") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (s === "syncing") return "border-blue-200 bg-blue-50 text-blue-700";
  if (s === "error") return "border-red-200 bg-red-50 text-red-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}
function statusLabel(s) {
  if (s === "active") return "Synced";
  if (s === "syncing") return "Syncing";
  if (s === "error") return "Needs attention";
  if (s === "stale") return "Stale";
  return s || "Unknown";
}

function MetricCard({ label, value, helper, tone = "neutral", icon: Icon }) {
  const tc = tone === "red" ? "text-red-600" : tone === "orange" ? "text-amber-600" : "text-gray-900";
  const ic = tone === "red" ? "bg-red-50 text-red-600" : tone === "teal" ? "bg-gray-100 text-gray-900" : "bg-gray-50 text-gray-400";
  return (
    <GlassCard hoverEffect className="group p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
          <p className={`mt-2 font-mono-financial text-3xl font-bold tracking-tight ${tc}`}>{value}</p>
        </div>
        {Icon && <div className={`rounded-lg p-2 transition-colors ${ic}`}><Icon className="h-5 w-5" /></div>}
      </div>
      <p className="mt-2 text-xs text-gray-500">{helper}</p>
    </GlassCard>
  );
}

export default function ConnectedPlatforms() {
  const queryClient = useQueryClient();
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [shopName, setShopName] = useState("");
  const [disconnectTarget, setDisconnectTarget] = useState(null);
  const [syncingId, setSyncingId] = useState(null);
  const [connectingId, setConnectingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const { data: connectedPlatforms = [], isLoading, refetch: refetchPlatforms, isFetching } = useQuery({
    queryKey: ["connectedPlatforms"],
    queryFn: async () => { const user = await base44.auth.me(); return base44.entities.ConnectedPlatform.filter({ user_id: user.id }, '-connected_at'); },
    staleTime: 1000 * 60 * 2,
  });
  const { data: bankConnection, isLoading: bankLoading } = useQuery({
    queryKey: ["bankConnection"],
    queryFn: async () => {
      const user = await base44.auth.me();
      const connections = await base44.entities.BankConnection.filter({ user_id: user.id });
      // Return the first active/reauth connection, or null
      return connections.find((c) => c.status !== "disconnected") || null;
    },
    staleTime: 1000 * 60 * 2,
  });
  const { data: bankAccounts = [] } = useQuery({
    queryKey: ["bankAccounts"],
    queryFn: async () => {
      if (!bankConnection?.id) return [];
      const user = await base44.auth.me();
      return base44.entities.BankAccount.filter({ user_id: user.id, bank_connection_id: bankConnection.id });
    },
    enabled: !!bankConnection?.id,
    staleTime: 1000 * 60 * 2,
  });

  const { data: syncHistory = [], refetch: refetchHistory } = useQuery({
    queryKey: ["syncHistory"],
    queryFn: async () => { const user = await base44.auth.me(); return base44.entities.SyncHistory.filter({ user_id: user.id }, "-sync_started_at", 100); },
    staleTime: 1000 * 30,
  });

  const connectMutation = useMutation({
    mutationFn: (payload) => base44.entities.ConnectedPlatform.create(payload),
    onSuccess: () => { toast.success("Platform connected"); setCredentialsOpen(false); setSelectedPlatform(null); setApiKey(""); setShopName(""); setConnectingId(null); queryClient.invalidateQueries({ queryKey: ["connectedPlatforms"] }); },
    onError: () => { toast.error("Could not connect platform"); setConnectingId(null); },
  });
  const disconnectMutation = useMutation({
    mutationFn: (id) => base44.entities.ConnectedPlatform.delete(id),
    onSuccess: () => { toast.success("Platform disconnected"); setDisconnectTarget(null); queryClient.invalidateQueries({ queryKey: ["connectedPlatforms"] }); },
    onError: () => { toast.error("Could not disconnect platform"); },
  });

  const connectedById = useMemo(() => new Set(connectedPlatforms.map((p) => p.platform)), [connectedPlatforms]);
  const availablePlatforms = useMemo(() => PLATFORMS.filter((p) => !connectedById.has(p.id)), [connectedById]);
  const platformMap = useMemo(() => new Map(PLATFORMS.map((p) => [p.id, p])), []);

  const stats = useMemo(() => {
    const active = connectedPlatforms.filter((p) => p.sync_status === "active").length;
    const syncing = connectedPlatforms.filter((p) => p.sync_status === "syncing").length;
    const errors = connectedPlatforms.filter((p) => p.sync_status === "error").length;
    const lastSyncDate = connectedPlatforms.map((p) => p.last_synced_at).filter(Boolean).map((e) => new Date(e)).filter((d) => !Number.isNaN(d.getTime())).sort((a, b) => b.getTime() - a.getTime())[0];
    return { total: connectedPlatforms.length, active, syncing, errors, lastSyncDate: lastSyncDate || null, healthScore: connectedPlatforms.length > 0 ? Math.max(0, ((active + syncing * 0.5) / connectedPlatforms.length) * 100) : 0 };
  }, [connectedPlatforms]);

  const preparedSearchStrings = useMemo(() => connectedPlatforms.map((c) => { const p = platformMap.get(c.platform); return [p?.name, c.platform, c.error_message].filter(Boolean).join(" ").toLowerCase(); }), [connectedPlatforms, platformMap]);
  const filteredConnections = useMemo(() => { const q = search.trim().toLowerCase(); return connectedPlatforms.filter((c, i) => { if (statusFilter !== "all" && c.sync_status !== statusFilter) return false; if (!q) return true; return preparedSearchStrings[i].includes(q); }); }, [connectedPlatforms, statusFilter, search, preparedSearchStrings]);

  const syncConnection = async (connection, forceFullSync = false) => {
    setSyncingId(connection.id);
    try {
      const response = await base44.functions.invoke("syncPlatformData", { connectionId: connection.id, platform: connection.platform, forceFullSync });
      if (response?.success) { toast.success(forceFullSync ? `Full sync complete (${response.transactionCount || 0} transactions)` : response.message || "Sync completed"); } else { toast.success("Sync request submitted"); }
      queryClient.invalidateQueries({ queryKey: ["connectedPlatforms"] }); queryClient.invalidateQueries({ queryKey: ["syncHistory"] });
    } catch (error) { toast.error(error?.response?.data?.error || error?.message || "Sync failed"); } finally { setSyncingId(null); }
  };

  const beginConnect = async (platform) => {
    if (connectedById.has(platform.id)) { toast.error(`${platform.name} is already connected.`); return; }

    // Entitlement pre-check (advisory only — DB trigger + server edge function enforce)
    try {
      const subStatus = await base44.functions.invoke('getSubscriptionStatus');
      const maxP = subStatus?.entitlements?.max_platforms ?? 0;
      const usedP = subStatus?.platforms_used ?? 0;
      if (maxP > 0 && usedP >= maxP) {
        toast.error(`Platform limit reached (${usedP}/${maxP}). Upgrade your plan to connect more.`, { duration: 5000 });
        return;
      }
    } catch (error) {
      console.warn("Entitlement pre-check unavailable, proceeding:", error?.message);
    }

    if (platform.requiresApiKey || platform.requiresShopName) { setSelectedPlatform(platform); setCredentialsOpen(true); return; }
    setConnectingId(platform.id);
    const csrfToken = crypto.randomUUID(); localStorage.setItem("oauth_state", csrfToken); document.cookie = `oauth_state=${csrfToken}; path=/; max-age=300; SameSite=Lax; Secure`; const stateValue = `${platform.id}:${csrfToken}`;
    let params;
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const baseOrigin = isLocal ? window.location.origin : 'https://zerithum.com';
    const redirectUri = baseOrigin + (platform.redirectUri || "/authcallback");
    if (platform.id === "tiktok") { params = new URLSearchParams({ client_key: platform.clientKey, scope: platform.scope, response_type: "code", redirect_uri: redirectUri, state: stateValue }); }
    else { params = new URLSearchParams({ client_id: platform.clientId || platform.id, redirect_uri: redirectUri, response_type: "code", scope: platform.scope || "", state: stateValue, access_type: platform.id === "youtube" ? "offline" : undefined, prompt: platform.id === "youtube" ? "consent" : undefined }); }
    window.location.href = `${platform.oauthUrl}?${params.toString()}`;
  };

  const handleCredentialConnect = async () => {
    if (!selectedPlatform) return;
    if (selectedPlatform.requiresShopName && !shopName.trim()) { toast.error("Enter your Shopify store name"); return; }
    if (selectedPlatform.requiresApiKey && !apiKey.trim()) { toast.error("Enter your API key"); return; }
    setConnectingId(selectedPlatform.id);
    try {
      if (selectedPlatform.id === "gumroad") { const r = await fetch(`${selectedPlatform.validationUrl}?access_token=${apiKey}`); if (!r.ok) throw new Error("Invalid API key"); }
      if (selectedPlatform.id === "substack") { const r = await fetch(selectedPlatform.validationUrl, { headers: { Authorization: `Bearer ${apiKey}` } }); if (!r.ok) throw new Error("Invalid API key"); }
      if (selectedPlatform.id === "shopify") {
        const csrfToken = crypto.randomUUID(); localStorage.setItem("oauth_state", csrfToken); localStorage.setItem("shopify_shop_name", shopName.trim()); document.cookie = `oauth_state=${csrfToken}; path=/; max-age=300; SameSite=Lax; Secure`;
        const stateValue = `shopify:${shopName.trim()}:${csrfToken}`;
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const baseOrigin = isLocal ? window.location.origin : 'https://zerithum.com';
        const redirectUri = baseOrigin + (selectedPlatform.redirectUri || "/authcallback");
        const params = new URLSearchParams({ client_id: selectedPlatform.clientId, scope: selectedPlatform.scope, redirect_uri: redirectUri, state: stateValue });
        window.location.href = `https://${shopName.trim()}.myshopify.com/admin/oauth/authorize?${params.toString()}`; return;
      }
      connectMutation.mutate({ platform: selectedPlatform.id, oauth_token: apiKey, sync_status: "active", connected_at: new Date().toISOString(), last_synced_at: new Date().toISOString() });
    } catch { toast.error("Could not validate provided credentials"); setConnectingId(null); }
  };

  return (
    <div className="relative min-h-screen">
      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="relative mx-auto w-full max-w-[1400px]">
        <motion.header variants={itemVariants} className="mb-6 flex flex-col gap-4 border-b border-gray-200 pb-6 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Connected Platforms</h1>
            <p className="mt-1.5 text-sm text-gray-500">Manage data sources, sync status, and connection health.</p>
            <p className="mt-1 text-xs text-gray-400">Last sync: {stats.lastSyncDate ? format(stats.lastSyncDate, "MMM d, yyyy h:mm a") : "No sync history"}</p>
          </div>
          <Button type="button" variant="outline" onClick={() => { refetchPlatforms(); refetchHistory(); }} disabled={isFetching} className="h-9 border-gray-200 text-gray-600 hover:bg-gray-50">
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </motion.header>

        <motion.section variants={itemVariants} className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 text-gray-400" /><p className="text-sm text-gray-600">Filter by status or search platform names to troubleshoot quickly before exports.</p></div>
        </motion.section>

        <motion.section variants={containerVariants} className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Connected" value={String(stats.total)} helper="Active data sources" icon={Plug} />
          <MetricCard label="Healthy" value={String(stats.active)} helper="Currently synced" tone="green" icon={CheckCircle2} />
          <MetricCard label="Syncing" value={String(stats.syncing)} helper="In progress" tone="amber" icon={RefreshCw} />
          <MetricCard label="Errors" value={String(stats.errors)} helper="Needs review" tone={stats.errors > 0 ? "red" : "teal"} icon={AlertTriangle} />
        </motion.section>

        <motion.section variants={itemVariants} className="mb-6">
          <BankConnectionCard
            connection={bankConnection}
            accounts={bankAccounts}
            isLoading={bankLoading}
          />
        </motion.section>

        <GlassCard className="mb-6 p-4">
          <div className="mb-3 flex flex-wrap gap-1">
            {STATUS_FILTERS.map((item) => (<button key={item.value} type="button" onClick={() => setStatusFilter(item.value)} className={`rounded-md px-4 py-1.5 text-xs font-medium transition-all ${statusFilter === item.value ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"}`}><span>{item.label}</span></button>))}
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search connected platforms" className="h-9 border-gray-200 bg-white pl-9 text-gray-900 placeholder:text-gray-300 focus-visible:border-gray-400 focus-visible:ring-0" /></div>
            <div><p className="mb-1 text-xs text-gray-500">Connection health</p><div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, Math.max(0, stats.healthScore))}%` }} transition={{ duration: 1 }} className="h-full rounded-full bg-indigo-500" /></div><p className="mt-1 text-xs text-gray-400">{stats.healthScore.toFixed(0)}% stable</p></div>
          </div>
        </GlassCard>

        <GlassCard className="mb-6">
          <div className="border-b border-gray-100 p-4"><h2 className="text-sm font-semibold text-gray-900">Connected accounts</h2><p className="mt-1 text-xs text-gray-500">Live filtered list with direct sync controls.</p></div>
          <div className="space-y-3 p-4">
            {filteredConnections.length === 0 && (<div className="rounded-lg border border-gray-100 bg-gray-50 p-6 text-center text-sm text-gray-400">{isLoading ? "Loading connected sources..." : "No connections match current filters."}</div>)}
            <AnimatePresence mode="popLayout">
              {filteredConnections.map((connection) => {
                const platform = platformMap.get(connection.platform); const Icon = platform?.icon; const syncing = syncingId === connection.id || connection.sync_status === "syncing";
                return (
                  <motion.div key={connection.id} layout initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }} className="group rounded-lg border border-gray-100 bg-white p-4 hover:border-gray-200 hover:shadow-sm transition-all">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="relative mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
                          <div className={`absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white ${connection.sync_status === 'active' ? 'bg-emerald-500' : connection.sync_status === 'error' ? 'bg-red-500' : connection.sync_status === 'syncing' ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`} />
                          {Icon ? <Icon className="h-5 w-5 text-gray-600" /> : <Plug className="h-5 w-5 text-gray-600" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{platform?.name || connection.platform}</p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                            <span>Connected {connection.connected_at ? format(new Date(connection.connected_at), "MMM d") : "-"}</span>
                            {connection.last_synced_at && (<><span className="h-1 w-1 rounded-full bg-gray-200" /><span>Synced {format(new Date(connection.last_synced_at), "h:mm a")}</span></>)}
                          </div>
                          {connection.error_message && (<p className="mt-1 text-xs text-red-600">{connection.error_message}</p>)}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                        <span className={`rounded-md border px-2 py-1 text-xs font-medium ${statusTone(connection.sync_status)}`}>{statusLabel(connection.sync_status)}</span>
                        <Button type="button" size="sm" variant="outline" disabled={syncing} onClick={() => syncConnection(connection, false)} className="h-8 border-gray-200 px-3 text-xs text-gray-600 hover:bg-gray-50">{syncing ? (<><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Syncing</>) : "Sync"}</Button>
                        <Button type="button" size="sm" variant="outline" disabled={syncing} onClick={() => syncConnection(connection, true)} className="h-8 border-gray-200 px-3 text-xs text-gray-600 hover:bg-gray-50">Full sync</Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => setDisconnectTarget(connection)} className="h-8 border-red-200 px-3 text-xs text-red-600 hover:bg-red-50"><Unplug className="mr-1.5 h-3.5 w-3.5" />Disconnect</Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </GlassCard>

        <GlassCard className="mb-6">
          <div className="border-b border-gray-100 p-4"><h2 className="text-sm font-semibold text-gray-900">Available platforms</h2><p className="mt-1 text-xs text-gray-500">Connect additional sources to improve data completeness.</p></div>
          <motion.div variants={containerVariants} className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {availablePlatforms.map((platform) => {
              const Icon = platform.icon; const connecting = connectingId === platform.id;
              return (
                <motion.div key={platform.id} variants={itemVariants} whileHover={{ scale: 1.01 }} className="rounded-lg border border-gray-100 bg-white p-4 transition-all hover:border-gray-200 hover:shadow-sm">
                  <div className="mb-3 flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-gray-50"><Icon className="h-4 w-4 text-gray-600" /></div><p className="text-sm font-medium text-gray-900">{platform.name}</p></div>
                  <p className="mb-4 text-xs text-gray-500 leading-relaxed min-h-[32px]">{platform.description}</p>
                  <Button type="button" size="sm" onClick={() => beginConnect(platform)} disabled={connecting} className="h-8 w-full bg-indigo-600 text-xs font-medium text-white hover:bg-indigo-700">{connecting ? (<><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Connecting</>) : (<><Plug className="mr-1.5 h-3.5 w-3.5" />Connect</>)}</Button>
                </motion.div>
              );
            })}
          </motion.div>
        </GlassCard>

        <GlassCard>
          <div className="flex flex-col gap-2 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="text-sm font-semibold text-gray-900">Recent sync history</h2><p className="mt-1 text-xs text-gray-500">Expand when you need run-level details.</p></div>
            <button type="button" onClick={() => setShowHistory((p) => !p)} className="h-8 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors">{showHistory ? "Hide history" : "Show history"}</button>
          </div>
          <AnimatePresence>
            {showHistory && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <Table className="w-full">
                  <TableHeader><TableRow className="border-gray-100 hover:bg-transparent"><TableHead className="text-xs font-medium text-gray-500">Date</TableHead><TableHead className="text-xs font-medium text-gray-500">Platform</TableHead><TableHead className="text-right text-xs font-medium text-gray-500">Transactions</TableHead><TableHead className="text-right text-xs font-medium text-gray-500">Duration</TableHead><TableHead className="text-right text-xs font-medium text-gray-500">Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {syncHistory.length === 0 && (<TableRow className="border-gray-100"><TableCell colSpan={5} className="py-8 text-center text-sm text-gray-400">No sync history recorded yet.</TableCell></TableRow>)}
                    {syncHistory.slice(0, 15).map((sync) => (
                      <TableRow key={sync.id} className="border-gray-100 hover:bg-gray-50/50">
                        <TableCell className="text-sm text-gray-500">{sync.sync_started_at ? format(new Date(sync.sync_started_at), "MMM d, yyyy h:mm a") : "-"}</TableCell>
                        <TableCell className="text-sm text-gray-900">{PLATFORMS.find((i) => i.id === sync.platform)?.name || sync.platform || "Unknown"}</TableCell>
                        <TableCell className="text-right font-mono-financial text-gray-700">{sync.transactions_synced || 0}</TableCell>
                        <TableCell className="text-right font-mono-financial text-gray-700">{typeof sync.duration_ms === "number" ? `${(sync.duration_ms / 1000).toFixed(1)}s` : "-"}</TableCell>
                        <TableCell className="text-right"><span className={`rounded-md border px-2 py-1 text-xs ${statusTone(sync.status)}`}>{statusLabel(sync.status)}</span></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

        <Dialog open={credentialsOpen} onOpenChange={setCredentialsOpen}>
          <DialogContent className="max-w-md rounded-xl border border-gray-200 bg-white text-gray-900">
            <DialogHeader><DialogTitle>Connect {selectedPlatform?.name || "platform"}</DialogTitle><DialogDescription className="text-gray-500">Enter required connection details to complete setup.</DialogDescription></DialogHeader>
            <div className="space-y-4 pt-2">
              {selectedPlatform?.requiresShopName && (<div><Label htmlFor="shop-name" className="mb-2 block text-sm text-gray-600">Shopify store name</Label><Input id="shop-name" value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="your-store" className="h-9 border-gray-200 bg-white text-gray-900 focus-visible:border-gray-400 focus-visible:ring-0" /></div>)}
              {selectedPlatform?.requiresApiKey && (<div><Label htmlFor="api-key" className="mb-2 block text-sm text-gray-600">API key</Label><Input id="api-key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Enter API key" className="h-9 border-gray-200 bg-white text-gray-900 focus-visible:border-gray-400 focus-visible:ring-0" /></div>)}
              <Button type="button" onClick={handleCredentialConnect} disabled={connectMutation.isPending} className="h-9 w-full bg-indigo-600 text-white hover:bg-indigo-700">{connectMutation.isPending ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Connecting</>) : "Continue"}</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!disconnectTarget} onOpenChange={(open) => !open && setDisconnectTarget(null)}>
          <DialogContent className="max-w-sm rounded-xl border border-gray-200 bg-white text-gray-900">
            <DialogHeader><DialogTitle>Disconnect {PLATFORMS.find(p => p.id === disconnectTarget?.platform)?.name || "platform"}?</DialogTitle><DialogDescription className="text-gray-500">Your earnings history stays safe. You can reconnect anytime.</DialogDescription></DialogHeader>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setDisconnectTarget(null)} className="h-9 border-gray-200 text-gray-600 hover:bg-gray-50">Cancel</Button>
              <Button type="button" onClick={() => disconnectMutation.mutate(disconnectTarget?.id)} disabled={disconnectMutation.isPending} className="h-9 bg-red-600 text-white hover:bg-red-700">{disconnectMutation.isPending ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Disconnecting</>) : "Disconnect"}</Button>
            </div>
          </DialogContent>
        </Dialog>

        {stats.errors > 0 && (<motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4"><div className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" /><p className="text-sm text-amber-800">{stats.errors} connection error{stats.errors > 1 ? "s" : ""} detected. Resolve before sharing exports.</p></div></motion.section>)}
        {stats.errors === 0 && stats.total > 0 && (<motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4"><div className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" /><p className="text-sm text-emerald-800">All connected platforms currently report healthy sync status.</p></div></motion.section>)}
      </motion.div>
    </div>
  );
}
