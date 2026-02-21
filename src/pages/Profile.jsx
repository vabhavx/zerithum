import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  KeyRound,
  Link2,
  LogOut,
  Mail,
  Save,
  Search,
  ShieldCheck,
  User,
  Terminal,
  Activity,
  Server,
  Fingerprint,
  Cpu,
  Lock,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/supabaseClient";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageTransition, AnimatedItem } from "@/components/ui/PageTransition";
import { GlassCard, InteractiveMetricCard } from "@/components/ui/glass-card";
import UpdatePasswordModal from "@/components/security/UpdatePasswordModal";
import SignOutAllDevicesModal from "@/components/security/SignOutAllDevicesModal";
import DeleteAccountModal from "@/components/security/DeleteAccountModal";
import DisconnectPlatformModal from "@/components/security/DisconnectPlatformModal";

const PLATFORM_NAMES = {
  youtube: "YouTube",
  patreon: "Patreon",
  stripe: "Stripe",
  gumroad: "Gumroad",
  tiktok: "TikTok",
  shopify: "Shopify",
  substack: "Substack",
};

const SECTION_TABS = [
  { value: "identity", label: "Identity Protocol", icon: Fingerprint },
  { value: "security", label: "Security Controls", icon: Lock },
  { value: "connections", label: "Uplink Status", icon: Server },
];

function statusLabel(status) {
  if (status === "active") return "Synced";
  if (status === "error") return "Needs attention";
  if (status === "syncing") return "Syncing";
  if (status === "stale") return "Stale";
  return status || "Unknown";
}

export default function Profile() {
  const queryClient = useQueryClient();
  const { user, checkAppState } = useAuth();

  const [form, setForm] = useState({ full_name: "", email: "" });
  const [disconnectPlatform, setDisconnectPlatform] = useState(null);
  const [platformSearch, setPlatformSearch] = useState("");
  const [activeSection, setActiveSection] = useState("identity");

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [signOutAllOpen, setSignOutAllOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);

  useEffect(() => {
    setForm({
      full_name: user?.full_name || "",
      email: user?.email || "",
    });
  }, [user]);

  const { data: connectedPlatforms = [], isFetching: isFetchingPlatforms } = useQuery({
    queryKey: ["connectedPlatforms", "profile"],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.ConnectedPlatform.filter(
        { user_id: currentUser.id },
        "-connected_at",
        100
      );
    },
    staleTime: 1000 * 60 * 2,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (payload) => base44.auth.updateMe(payload),
    onSuccess: async () => {
      await checkAppState();
      toast.success("Identity record updated");
    },
    onError: () => {
      toast.error("Update failed: System error");
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (id) => base44.entities.ConnectedPlatform.delete(id),
    onSuccess: () => {
      toast.success("Uplink terminated");
      setDisconnectPlatform(null);
      queryClient.invalidateQueries({ queryKey: ["connectedPlatforms"] });
    },
    onError: () => {
      toast.error("Termination failed");
    },
  });

  const connectedStats = useMemo(() => {
    const active = connectedPlatforms.filter((platform) => platform.sync_status === "active").length;
    const errors = connectedPlatforms.filter((platform) => platform.sync_status === "error").length;

    return {
      total: connectedPlatforms.length,
      active,
      errors,
    };
  }, [connectedPlatforms]);

  const securityScore = useMemo(() => {
    const hasName = form.full_name.trim().length > 1 ? 25 : 0;
    const hasEmail = form.email.includes("@") ? 20 : 0;
    const connectionScore = Math.min(30, connectedStats.active * 10);
    const errorPenalty = connectedStats.errors * 8;
    return Math.max(0, Math.min(100, hasName + hasEmail + connectionScore - errorPenalty + 25));
  }, [form.full_name, form.email, connectedStats.active, connectedStats.errors]);

  const filteredPlatforms = useMemo(() => {
    const query = platformSearch.trim().toLowerCase();
    if (!query) return connectedPlatforms;

    return connectedPlatforms.filter((platform) => {
      const platformName = PLATFORM_NAMES[platform.platform] || platform.platform;
      const text = `${platformName} ${platform.sync_status}`.toLowerCase();
      return text.includes(query);
    });
  }, [connectedPlatforms, platformSearch]);

  const saveProfile = () => {
    updateProfileMutation.mutate({ full_name: form.full_name || "" });
  };

  const confirmDisconnect = () => {
    if (!disconnectPlatform) return;
    disconnectMutation.mutate(disconnectPlatform.id);
  };

  return (
    <PageTransition className="mx-auto w-full max-w-[1200px] p-6 lg:p-8">
      <UpdatePasswordModal open={passwordOpen} onOpenChange={setPasswordOpen} />
      <SignOutAllDevicesModal open={signOutAllOpen} onOpenChange={setSignOutAllOpen} />
      <DeleteAccountModal open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen} />
      <DisconnectPlatformModal
        open={Boolean(disconnectPlatform)}
        onOpenChange={(open) => !open && setDisconnectPlatform(null)}
        platformName={
          disconnectPlatform
            ? PLATFORM_NAMES[disconnectPlatform.platform] || disconnectPlatform.platform
            : ""
        }
        onConfirm={confirmDisconnect}
        isPending={disconnectMutation.isPending}
      />

      {/* Header */}
      <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-[#F5F5F5] uppercase">System Identity</h1>
            <div className="flex items-center gap-1.5 rounded-full border border-[#56C5D0]/30 bg-[#56C5D0]/10 px-3 py-1 text-[10px] font-medium tracking-wider text-[#56C5D0]">
              <div className="h-1.5 w-1.5 rounded-full bg-[#56C5D0] animate-pulse" />
              ENCRYPTED SESSION ACTIVE
            </div>
          </div>
          <p className="mt-2 text-base text-white/70 font-light">
            Manage authentication protocols and system uplinks.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => base44.auth.logout()}
          className="h-10 border-[#F06C6C]/40 bg-[#F06C6C]/5 text-[#F06C6C] hover:bg-[#F06C6C]/10 hover:text-[#F06C6C] focus-visible:ring-2 focus-visible:ring-[#F06C6C]"
        >
          <LogOut className="mr-2 h-4 w-4" />
          TERMINATE SESSION
        </Button>
      </header>

      {/* System Status Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <AnimatedItem delay={0.1}>
          <InteractiveMetricCard
            title="Security Integrity"
            value={`${securityScore}/100`}
            sub="System Hardening Level"
            tone={securityScore > 80 ? "teal" : securityScore > 50 ? "orange" : "red"}
            glowEffect
            variant="hud"
          />
        </AnimatedItem>

        <AnimatedItem delay={0.2}>
          <InteractiveMetricCard
            title="Active Uplinks"
            value={connectedStats.active.toString()}
            sub={`Total Sources: ${connectedStats.total}`}
            tone="teal"
            variant="hud"
          />
        </AnimatedItem>

        <AnimatedItem delay={0.3}>
          <InteractiveMetricCard
            title="System Alerts"
            value={connectedStats.errors.toString()}
            sub="Requires Immediate Attention"
            tone={connectedStats.errors > 0 ? "red" : "neutral"}
            variant="hud"
          />
        </AnimatedItem>
      </div>

      {/* Navigation Tabs */}
      <AnimatedItem delay={0.4} className="mb-6">
        <div className="flex overflow-x-auto border-b border-white/10 pb-1 scrollbar-hide">
          <div className="flex gap-1">
            {SECTION_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveSection(tab.value)}
                  className={`group relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all duration-300 ${
                    activeSection === tab.value ? "text-[#56C5D0]" : "text-white/60 hover:text-white"
                  }`}
                >
                  {activeSection === tab.value && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 rounded-t-lg border-b-2 border-[#56C5D0] bg-[#56C5D0]/5"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  <Icon className="h-4 w-4 relative z-10" />
                  <span className="relative z-10 uppercase tracking-wide">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </AnimatedItem>

      {/* Main Content Panels */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {activeSection === "identity" && (
            <motion.div
              key="identity"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <GlassCard variant="panel" className="p-6 md:p-8">
                <div className="mb-8 flex items-center gap-3 border-b border-white/10 pb-4">
                  <div className="rounded-lg bg-[#56C5D0]/20 p-2">
                    <Terminal className="h-5 w-5 text-[#56C5D0]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#F5F5F5]">Identity Parameters</h2>
                    <p className="text-xs text-white/50 font-mono">Workspace identification configuration.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:max-w-4xl">
                  <div className="space-y-2">
                    <Label htmlFor="full-name" className="text-xs uppercase tracking-wider text-[#56C5D0]/80">
                      Display Name
                    </Label>
                    <div className="group relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 group-focus-within:text-[#56C5D0]" />
                      <Input
                        id="full-name"
                        value={form.full_name}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, full_name: event.target.value }))
                        }
                        className="h-11 border-white/10 bg-[#0A0A0A] pl-10 font-mono text-[#F5F5F5] transition-all focus-visible:border-[#56C5D0]/50 focus-visible:ring-0"
                        placeholder="ENTER_NAME"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs uppercase tracking-wider text-[#56C5D0]/80">
                      Primary Contact
                    </Label>
                    <div className="group relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                      <Input
                        id="email"
                        value={form.email}
                        readOnly
                        className="h-11 border-white/5 bg-[#0A0A0A]/50 pl-10 font-mono text-white/60 cursor-not-allowed"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <span className="text-[10px] text-white/30 font-mono">LOCKED</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <Button
                    type="button"
                    onClick={saveProfile}
                    disabled={updateProfileMutation.isPending}
                    className="group h-11 bg-[#56C5D0] px-6 text-[#0A0A0A] hover:bg-[#48AAB5] focus-visible:ring-2 focus-visible:ring-[#56C5D0]"
                  >
                    <Save className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                    <span className="font-mono font-medium tracking-tight">EXECUTE UPDATE</span>
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {activeSection === "security" && (
            <motion.div
              key="security"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <GlassCard variant="panel" className="p-6 md:p-8">
                <div className="mb-8 flex items-center gap-3 border-b border-white/10 pb-4">
                  <div className="rounded-lg bg-[#F0A562]/20 p-2">
                    <Cpu className="h-5 w-5 text-[#F0A562]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#F5F5F5]">Security Protocols</h2>
                    <p className="text-xs text-white/50 font-mono">Authentication and session management.</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:max-w-4xl">
                  <button
                    type="button"
                    onClick={() => setPasswordOpen(true)}
                    className="group relative flex items-center justify-between overflow-hidden rounded-lg border border-white/10 bg-[#0A0A0A] p-5 transition-all hover:border-[#56C5D0]/40 hover:bg-[#56C5D0]/5"
                  >
                    <div className="relative z-10 flex items-center gap-4">
                      <div className="rounded-md bg-white/5 p-2 transition-colors group-hover:bg-[#56C5D0]/20">
                        <KeyRound className="h-5 w-5 text-white/70 group-hover:text-[#56C5D0]" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-[#F5F5F5]">Rotate Access Key</p>
                        <p className="text-xs text-white/50 font-mono mt-0.5">UPDATE_PASSWORD</p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSignOutAllOpen(true)}
                    className="group relative flex items-center justify-between overflow-hidden rounded-lg border border-white/10 bg-[#0A0A0A] p-5 transition-all hover:border-[#F0A562]/40 hover:bg-[#F0A562]/5"
                  >
                    <div className="relative z-10 flex items-center gap-4">
                      <div className="rounded-md bg-white/5 p-2 transition-colors group-hover:bg-[#F0A562]/20">
                        <ShieldCheck className="h-5 w-5 text-white/70 group-hover:text-[#F0A562]" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-[#F5F5F5]">Purge Sessions</p>
                        <p className="text-xs text-white/50 font-mono mt-0.5">REVOKE_ALL_DEVICES</p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteAccountOpen(true)}
                    className="group relative flex items-center justify-between overflow-hidden rounded-lg border border-[#F06C6C]/30 bg-[#F06C6C]/5 p-5 transition-all hover:bg-[#F06C6C]/10 md:col-span-2"
                  >
                    <div className="relative z-10 flex items-center gap-4">
                      <div className="rounded-md bg-[#F06C6C]/20 p-2">
                        <AlertTriangle className="h-5 w-5 text-[#F06C6C]" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-[#F06C6C]">Self Destruct</p>
                        <p className="text-xs text-[#F06C6C]/70 font-mono mt-0.5">DELETE_ACCOUNT_PERMANENTLY</p>
                      </div>
                    </div>
                    <div className="absolute right-0 top-0 h-full w-1 bg-[#F06C6C]/50 opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {activeSection === "connections" && (
            <motion.div
              key="connections"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <GlassCard variant="panel" className="p-6 md:p-8">
                <div className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-[#56C5D0]/20 p-2">
                      <Activity className="h-5 w-5 text-[#56C5D0]" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-[#F5F5F5]">Uplink Status</h2>
                      <p className="text-xs text-white/50 font-mono">Real-time data synchronization feeds.</p>
                    </div>
                  </div>

                  <div className="relative w-full md:w-64">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/45" />
                    <Input
                      value={platformSearch}
                      onChange={(event) => setPlatformSearch(event.target.value)}
                      placeholder="FILTER_UPLINKS..."
                      className="h-9 border-white/10 bg-[#0A0A0A] pl-9 font-mono text-xs text-[#F5F5F5] placeholder:text-white/30 focus-visible:border-[#56C5D0]/50"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredPlatforms.length === 0 && (
                    <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.02] text-center">
                      <p className="text-sm text-white/50">No uplinks match query protocols.</p>
                    </div>
                  )}

                  {filteredPlatforms.map((platform) => (
                    <motion.div
                      layout
                      key={platform.id}
                      className="group relative flex flex-col gap-4 rounded-lg border border-white/5 bg-[#0A0A0A]/60 p-4 transition-all hover:border-white/10 hover:bg-[#0A0A0A] md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`mt-1 h-2 w-2 rounded-full shadow-[0_0_8px] ${
                          platform.sync_status === 'active' ? 'bg-[#56C5D0] shadow-[#56C5D0]/50' :
                          platform.sync_status === 'error' ? 'bg-[#F06C6C] shadow-[#F06C6C]/50' :
                          'bg-[#F0A562] shadow-[#F0A562]/50'
                        }`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-[#F5F5F5]">
                              {PLATFORM_NAMES[platform.platform] || platform.platform}
                            </p>
                            <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/40 uppercase">
                              ID: {platform.id.slice(0, 8)}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-xs font-mono text-white/50">
                            <span>STATUS: <span className={
                              platform.sync_status === 'active' ? 'text-[#56C5D0]' :
                              platform.sync_status === 'error' ? 'text-[#F06C6C]' : 'text-[#F0A562]'
                            }>{statusLabel(platform.sync_status).toUpperCase()}</span></span>
                            <span>|</span>
                            <span>SYNC: {platform.last_synced_at ? format(new Date(platform.last_synced_at), "HH:mm:ss ddMMMyy") : "PENDING"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setDisconnectPlatform(platform)}
                          className="h-8 border border-transparent bg-white/5 text-xs text-white/60 hover:border-[#F06C6C]/30 hover:bg-[#F06C6C]/10 hover:text-[#F06C6C]"
                        >
                          <Link2 className="mr-2 h-3 w-3" />
                          TERMINATE
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
