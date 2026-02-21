import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Plug,
  RefreshCw,
  ShieldCheck,
  Unplug,
} from "lucide-react";
import { base44 } from "@/api/supabaseClient";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PLATFORMS } from "@/lib/platforms";

function statusTone(status) {
  if (status === "active") return "border-[#56C5D0]/40 bg-[#56C5D0]/10 text-[#56C5D0]";
  if (status === "syncing") return "border-white/30 bg-white/10 text-white";
  if (status === "error") return "border-[#F06C6C]/40 bg-[#F06C6C]/10 text-[#F06C6C]";
  return "border-[#F0A562]/40 bg-[#F0A562]/10 text-[#F0A562]";
}

function statusLabel(status) {
  if (status === "active") return "Synced";
  if (status === "syncing") return "Syncing";
  if (status === "error") return "Needs attention";
  if (status === "stale") return "Stale";
  return status || "Unknown";
}

function MetricCard({ label, value, helper, tone = "neutral" }) {
  const toneClass =
    tone === "teal"
      ? "text-[#56C5D0]"
      : tone === "orange"
        ? "text-[#F0A562]"
        : tone === "red"
          ? "text-[#F06C6C]"
          : "text-[#F5F5F5]";

  return (
    <div className="rounded-xl border border-white/10 bg-[#111114] p-4">
      <p className="text-xs uppercase tracking-wide text-white/60">{label}</p>
      <p className={`mt-2 font-mono-financial text-2xl font-semibold ${toneClass}`}>{value}</p>
      <p className="mt-1 text-xs text-white/60">{helper}</p>
    </div>
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

  const {
    data: connectedPlatforms = [],
    isLoading,
    refetch: refetchPlatforms,
    isFetching,
  } = useQuery({
    queryKey: ["connectedPlatforms"],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.ConnectedPlatform.filter({ user_id: user.id });
    },
    staleTime: 1000 * 60 * 2,
  });

  const { data: syncHistory = [], refetch: refetchHistory } = useQuery({
    queryKey: ["syncHistory"],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.SyncHistory.filter({ user_id: user.id }, "-sync_started_at", 100);
    },
    staleTime: 1000 * 30,
  });

  const connectMutation = useMutation({
    mutationFn: (payload) => base44.entities.ConnectedPlatform.create(payload),
    onSuccess: () => {
      toast.success("Platform connected");
      setCredentialsOpen(false);
      setSelectedPlatform(null);
      setApiKey("");
      setShopName("");
      setConnectingId(null);
      queryClient.invalidateQueries({ queryKey: ["connectedPlatforms"] });
    },
    onError: () => {
      toast.error("Could not connect platform");
      setConnectingId(null);
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (id) => base44.entities.ConnectedPlatform.delete(id),
    onSuccess: () => {
      toast.success("Platform disconnected");
      setDisconnectTarget(null);
      queryClient.invalidateQueries({ queryKey: ["connectedPlatforms"] });
    },
    onError: () => {
      toast.error("Could not disconnect platform");
    },
  });

  const connectedById = useMemo(
    () => new Set(connectedPlatforms.map((platform) => platform.platform)),
    [connectedPlatforms]
  );

  const availablePlatforms = useMemo(
    () => PLATFORMS.filter((platform) => !connectedById.has(platform.id)),
    [connectedById]
  );

  const stats = useMemo(() => {
    const active = connectedPlatforms.filter((platform) => platform.sync_status === "active").length;
    const syncing = connectedPlatforms.filter((platform) => platform.sync_status === "syncing").length;
    const errors = connectedPlatforms.filter((platform) => platform.sync_status === "error").length;

    const lastSyncDate = connectedPlatforms
      .map((platform) => platform.last_synced_at)
      .filter(Boolean)
      .map((entry) => new Date(entry))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((left, right) => right.getTime() - left.getTime())[0];

    return {
      total: connectedPlatforms.length,
      active,
      syncing,
      errors,
      lastSyncDate: lastSyncDate || null,
    };
  }, [connectedPlatforms]);

  const syncConnection = async (connection, forceFullSync = false) => {
    setSyncingId(connection.id);

    try {
      const response = await base44.functions.invoke("syncPlatformData", {
        connectionId: connection.id,
        platform: connection.platform,
        forceFullSync,
      });

      if (response?.data?.success) {
        toast.success(
          forceFullSync
            ? `Full sync complete (${response.data.transactionCount || 0} transactions)`
            : response.data.message || "Sync completed"
        );
      } else {
        toast.success("Sync request submitted");
      }

      queryClient.invalidateQueries({ queryKey: ["connectedPlatforms"] });
      queryClient.invalidateQueries({ queryKey: ["syncHistory"] });
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message || "Sync failed");
    } finally {
      setSyncingId(null);
    }
  };

  const beginConnect = (platform) => {
    if (platform.requiresApiKey || platform.requiresShopName) {
      setSelectedPlatform(platform);
      setCredentialsOpen(true);
      return;
    }

    setConnectingId(platform.id);

    const csrfToken = crypto.randomUUID();
    sessionStorage.setItem("oauth_state", csrfToken);
    document.cookie = `oauth_state=${csrfToken}; path=/; max-age=300; SameSite=Lax; Secure`;
    const stateValue = `${platform.id}:${csrfToken}`;

    let params;

    if (platform.id === "tiktok") {
      params = new URLSearchParams({
        client_key: platform.clientKey,
        scope: platform.scope,
        response_type: "code",
        redirect_uri: platform.redirectUri,
        state: stateValue,
      });
    } else {
      params = new URLSearchParams({
        client_id: platform.clientId || platform.id,
        redirect_uri: platform.redirectUri,
        response_type: "code",
        scope: platform.scope || "",
        state: stateValue,
        access_type: platform.id === "youtube" ? "offline" : undefined,
        prompt: platform.id === "youtube" ? "consent" : undefined,
      });
    }

    window.location.href = `${platform.oauthUrl}?${params.toString()}`;
  };

  const handleCredentialConnect = async () => {
    if (!selectedPlatform) return;

    if (selectedPlatform.requiresShopName && !shopName.trim()) {
      toast.error("Enter your Shopify store name");
      return;
    }

    if (selectedPlatform.requiresApiKey && !apiKey.trim()) {
      toast.error("Enter your API key");
      return;
    }

    setConnectingId(selectedPlatform.id);

    try {
      if (selectedPlatform.id === "gumroad") {
        const response = await fetch(`${selectedPlatform.validationUrl}?access_token=${apiKey}`);
        if (!response.ok) throw new Error("Invalid API key");
      }

      if (selectedPlatform.id === "substack") {
        const response = await fetch(selectedPlatform.validationUrl, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!response.ok) throw new Error("Invalid API key");
      }

      if (selectedPlatform.id === "shopify") {
        const csrfToken = crypto.randomUUID();
        sessionStorage.setItem("oauth_state", csrfToken);
        document.cookie = `oauth_state=${csrfToken}; path=/; max-age=300; SameSite=Lax; Secure`;
        const stateValue = `shopify:${csrfToken}`;

        const params = new URLSearchParams({
          client_id: selectedPlatform.clientId,
          scope: selectedPlatform.scope,
          redirect_uri: selectedPlatform.redirectUri,
          state: stateValue,
        });

        window.location.href = `https://${shopName}.myshopify.com/admin/oauth/authorize?${params.toString()}`;
        return;
      }

      connectMutation.mutate({
        platform: selectedPlatform.id,
        oauth_token: apiKey,
        sync_status: "active",
        connected_at: new Date().toISOString(),
        last_synced_at: new Date().toISOString(),
      });
    } catch {
      toast.error("Could not validate provided credentials");
      setConnectingId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] rounded-2xl border border-white/10 bg-[#0A0A0A] p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#F5F5F5]">Connected platforms</h1>
          <p className="mt-1 text-sm text-white/70">
            Manage source connections, sync state, and evidence for data reliability.
          </p>
          <p className="mt-2 text-xs text-white/60">
            Last sync: {stats.lastSyncDate ? format(stats.lastSyncDate, "MMM d, yyyy h:mm a") : "No sync history"}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            refetchPlatforms();
            refetchHistory();
          }}
          disabled={isFetching}
          className="h-9 border-white/20 bg-transparent text-[#F5F5F5] hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#56C5D0]"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </header>

      <section className="mb-6 rounded-lg border border-[#56C5D0]/30 bg-[#56C5D0]/10 p-4">
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 text-[#56C5D0]" />
          <p className="text-sm text-white/85">
            Use this page as your connection control center. Keep errors at zero before exports.
          </p>
        </div>
      </section>

      <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Connected" value={String(stats.total)} helper="Active data sources" />
        <MetricCard label="Healthy" value={String(stats.active)} helper="Currently synced" tone="teal" />
        <MetricCard label="Syncing" value={String(stats.syncing)} helper="In progress" tone="orange" />
        <MetricCard label="Errors" value={String(stats.errors)} helper="Needs review" tone={stats.errors > 0 ? "red" : "teal"} />
      </section>

      <section className="mb-6 rounded-xl border border-white/10 bg-[#111114]">
        <div className="border-b border-white/10 p-4">
          <h2 className="text-lg font-semibold text-[#F5F5F5]">Connected accounts</h2>
          <p className="mt-1 text-sm text-white/70">Sync each source frequently for accurate financial reporting.</p>
        </div>

        <div className="space-y-3 p-4">
          {connectedPlatforms.length === 0 && (
            <div className="rounded-lg border border-white/10 bg-[#15151A] p-6 text-center text-sm text-white/70">
              {isLoading ? "Loading connected sources..." : "No connected platforms yet."}
            </div>
          )}

          {connectedPlatforms.map((connection) => {
            const platform = PLATFORMS.find((item) => item.id === connection.platform);
            const Icon = platform?.icon;
            const syncing = syncingId === connection.id || connection.sync_status === "syncing";

            return (
              <div
                key={connection.id}
                className="rounded-lg border border-white/10 bg-[#15151A] p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#101014]">
                      {Icon ? <Icon className="h-4 w-4 text-white/70" /> : <Plug className="h-4 w-4 text-white/70" />}
                    </div>

                    <div>
                      <p className="text-sm font-medium text-[#F5F5F5]">{platform?.name || connection.platform}</p>
                      <p className="mt-1 text-xs text-white/60">
                        Connected {connection.connected_at ? format(new Date(connection.connected_at), "MMM d, yyyy") : "-"}
                        {connection.last_synced_at && (
                          <>
                            {" "}• Last sync {format(new Date(connection.last_synced_at), "MMM d, yyyy h:mm a")}
                          </>
                        )}
                      </p>
                      {connection.error_message && (
                        <p className="mt-1 text-xs text-[#F06C6C]">{connection.error_message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-md border px-2 py-1 text-xs ${statusTone(connection.sync_status)}`}>
                      {statusLabel(connection.sync_status)}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={syncing}
                      onClick={() => syncConnection(connection, false)}
                      className="h-8 border-white/20 bg-transparent px-3 text-xs text-[#F5F5F5] hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#56C5D0]"
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
                      onClick={() => syncConnection(connection, true)}
                      className="h-8 border-white/20 bg-transparent px-3 text-xs text-[#F5F5F5] hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#56C5D0]"
                    >
                      Full sync
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setDisconnectTarget(connection)}
                      className="h-8 border-[#F06C6C]/40 bg-transparent px-3 text-xs text-[#F06C6C] hover:bg-[#F06C6C]/10 focus-visible:ring-2 focus-visible:ring-[#F06C6C]"
                    >
                      <Unplug className="mr-1.5 h-3.5 w-3.5" />
                      Disconnect
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-6 rounded-xl border border-white/10 bg-[#111114]">
        <div className="border-b border-white/10 p-4">
          <h2 className="text-lg font-semibold text-[#F5F5F5]">Available platforms</h2>
          <p className="mt-1 text-sm text-white/70">Connect additional sources to improve reporting confidence.</p>
        </div>

        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {availablePlatforms.map((platform) => {
            const Icon = platform.icon;
            const connecting = connectingId === platform.id;

            return (
              <div key={platform.id} className="rounded-lg border border-white/10 bg-[#15151A] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-[#101014]">
                    <Icon className="h-4 w-4 text-white/70" />
                  </div>
                  <p className="text-sm font-medium text-[#F5F5F5]">{platform.name}</p>
                </div>

                <p className="mb-3 text-sm text-white/70">{platform.description}</p>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => beginConnect(platform)}
                  disabled={connecting}
                  className="h-8 w-full bg-[#56C5D0] text-xs font-medium text-[#0A0A0A] hover:bg-[#48AAB5] focus-visible:ring-2 focus-visible:ring-[#56C5D0]"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Connecting
                    </>
                  ) : (
                    <>
                      <Plug className="mr-1.5 h-3.5 w-3.5" />
                      Connect
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-[#111114]">
        <div className="border-b border-white/10 p-4">
          <h2 className="text-lg font-semibold text-[#F5F5F5]">Recent sync evidence</h2>
          <p className="mt-1 text-sm text-white/70">Latest sync runs for audit and troubleshooting.</p>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-[#D8D8D8]">Date</TableHead>
              <TableHead className="text-[#D8D8D8]">Platform</TableHead>
              <TableHead className="text-right text-[#D8D8D8]">Transactions</TableHead>
              <TableHead className="text-right text-[#D8D8D8]">Duration</TableHead>
              <TableHead className="text-right text-[#D8D8D8]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {syncHistory.length === 0 && (
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableCell colSpan={5} className="py-8 text-center text-sm text-white/60">
                  No sync history recorded yet.
                </TableCell>
              </TableRow>
            )}

            {syncHistory.slice(0, 12).map((sync) => (
              <TableRow key={sync.id} className="border-white/10 hover:bg-white/[0.02]">
                <TableCell className="text-sm text-white/75">
                  {sync.sync_started_at ? format(new Date(sync.sync_started_at), "MMM d, yyyy h:mm a") : "-"}
                </TableCell>
                <TableCell className="text-sm text-[#F5F5F5]">
                  {PLATFORMS.find((item) => item.id === sync.platform)?.name || sync.platform || "Unknown"}
                </TableCell>
                <TableCell className="text-right font-mono-financial text-white/80">
                  {sync.transactions_synced || 0}
                </TableCell>
                <TableCell className="text-right font-mono-financial text-white/80">
                  {typeof sync.duration_ms === "number" ? `${(sync.duration_ms / 1000).toFixed(1)}s` : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <span className={`rounded-md border px-2 py-1 text-xs ${statusTone(sync.status)}`}>
                    {statusLabel(sync.status)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <Dialog open={credentialsOpen} onOpenChange={setCredentialsOpen}>
        <DialogContent className="max-w-md rounded-xl border border-white/10 bg-[#111114] text-[#F5F5F5]">
          <DialogHeader>
            <DialogTitle>Connect {selectedPlatform?.name || "platform"}</DialogTitle>
            <DialogDescription className="text-white/65">
              Enter required connection details to complete setup.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {selectedPlatform?.requiresShopName && (
              <div>
                <Label htmlFor="shop-name" className="mb-2 block text-sm text-white/80">
                  Shopify store name
                </Label>
                <Input
                  id="shop-name"
                  value={shopName}
                  onChange={(event) => setShopName(event.target.value)}
                  placeholder="your-store"
                  className="h-9 border-white/15 bg-[#15151A] text-[#F5F5F5] focus-visible:ring-2 focus-visible:ring-[#56C5D0]"
                />
              </div>
            )}

            {selectedPlatform?.requiresApiKey && (
              <div>
                <Label htmlFor="api-key" className="mb-2 block text-sm text-white/80">
                  API key
                </Label>
                <Input
                  id="api-key"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder="Enter API key"
                  className="h-9 border-white/15 bg-[#15151A] text-[#F5F5F5] focus-visible:ring-2 focus-visible:ring-[#56C5D0]"
                />
              </div>
            )}

            <Button
              type="button"
              onClick={handleCredentialConnect}
              disabled={connectMutation.isPending}
              className="h-9 w-full bg-[#56C5D0] text-[#0A0A0A] hover:bg-[#48AAB5] focus-visible:ring-2 focus-visible:ring-[#56C5D0]"
            >
              {connectMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(disconnectTarget)} onOpenChange={(open) => !open && setDisconnectTarget(null)}>
        <DialogContent className="max-w-sm rounded-xl border border-white/10 bg-[#111114] text-[#F5F5F5]">
          <DialogHeader>
            <DialogTitle>Disconnect platform</DialogTitle>
            <DialogDescription className="text-white/65">
              This will stop future sync from {PLATFORMS.find((item) => item.id === disconnectTarget?.platform)?.name || disconnectTarget?.platform || "this source"}.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDisconnectTarget(null)}
              className="h-8 border-white/20 bg-transparent text-[#F5F5F5] hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => disconnectTarget && disconnectMutation.mutate(disconnectTarget.id)}
              disabled={disconnectMutation.isPending}
              className="h-8 bg-[#F06C6C] text-white hover:bg-[#E45F5F]"
            >
              {disconnectMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Disconnecting
                </>
              ) : (
                "Disconnect"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {stats.errors > 0 && (
        <section className="mt-6 rounded-lg border border-[#F0A562]/35 bg-[#F0A562]/10 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-[#F0A562]" />
            <p className="text-sm text-white/85">
              {stats.errors} connection error{stats.errors > 1 ? "s" : ""} detected. Resolve these before sharing financial exports.
            </p>
          </div>
        </section>
      )}

      {stats.errors === 0 && stats.total > 0 && (
        <section className="mt-6 rounded-lg border border-[#56C5D0]/35 bg-[#56C5D0]/10 p-4">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#56C5D0]" />
            <p className="text-sm text-white/85">All connected platforms currently report healthy sync status.</p>
          </div>
        </section>
      )}
    </div>
  );
}
