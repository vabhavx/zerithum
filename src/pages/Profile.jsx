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
  { value: "identity", label: "Personal Info", icon: User },
  { value: "security", label: "Security", icon: ShieldCheck },
  { value: "connections", label: "Connected Platforms", icon: Link2 },
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
      toast.success("Profile updated");
    },
    onError: () => {
      toast.error("Update failed");
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (id) => base44.entities.ConnectedPlatform.delete(id),
    onSuccess: () => {
      toast.success("Platform disconnected");
      setDisconnectPlatform(null);
      queryClient.invalidateQueries({ queryKey: ["connectedPlatforms"] });
    },
    onError: () => {
      toast.error("Disconnection failed");
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
    <PageTransition className="mx-auto w-full max-w-[1200px]">
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
      <header className="mb-8 flex flex-col gap-4 border-b border-gray-200 pb-6 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Profile</h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Manage your account, security settings, and connected platforms.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => base44.auth.logout()}
          className="h-9 border-gray-200 text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </header>

      {/* Status Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <AnimatedItem delay={0.1}>
          <InteractiveMetricCard
            title="Account Health"
            value={`${securityScore}/100`}
            sub="Profile completeness"
            tone={securityScore > 80 ? "teal" : securityScore > 50 ? "orange" : "red"}
          />
        </AnimatedItem>

        <AnimatedItem delay={0.2}>
          <InteractiveMetricCard
            title="Active Platforms"
            value={connectedStats.active.toString()}
            sub={`${connectedStats.total} total connected`}
            tone="green"
          />
        </AnimatedItem>

        <AnimatedItem delay={0.3}>
          <InteractiveMetricCard
            title="Issues"
            value={connectedStats.errors.toString()}
            sub={connectedStats.errors > 0 ? "Requires attention" : "No issues"}
            tone={connectedStats.errors > 0 ? "red" : "neutral"}
          />
        </AnimatedItem>
      </div>

      {/* Navigation Tabs */}
      <AnimatedItem delay={0.4} className="mb-6">
        <div className="flex overflow-x-auto border-b border-gray-200 pb-px scrollbar-hide">
          <div className="flex gap-0">
            {SECTION_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveSection(tab.value)}
                  className={`group relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${activeSection === tab.value ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
                    }`}
                >
                  {activeSection === tab.value && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  <Icon className="h-4 w-4 relative z-10" />
                  <span className="relative z-10">{tab.label}</span>
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
                <div className="mb-6 border-b border-gray-100 pb-4">
                  <h2 className="text-base font-semibold text-gray-900">Personal Information</h2>
                  <p className="text-xs text-gray-500 mt-1">Update your display name and review your email address.</p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:max-w-4xl">
                  <div className="space-y-2">
                    <Label htmlFor="full-name" className="text-xs font-medium text-gray-600">
                      Display Name
                    </Label>
                    <div className="group relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300 group-focus-within:text-gray-500" />
                      <Input
                        id="full-name"
                        value={form.full_name}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, full_name: event.target.value }))
                        }
                        className="h-10 border-gray-200 bg-white pl-10 text-gray-900 transition-all focus-visible:border-gray-400 focus-visible:ring-0"
                        placeholder="Enter your name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-medium text-gray-600">
                      Email Address
                    </Label>
                    <div className="group relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                      <Input
                        id="email"
                        value={form.email}
                        readOnly
                        className="h-10 border-gray-100 bg-gray-50 pl-10 text-gray-500 cursor-not-allowed"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <span className="text-[10px] text-gray-400">Read only</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <Button
                    type="button"
                    onClick={saveProfile}
                    disabled={updateProfileMutation.isPending}
                    className="h-9 bg-indigo-600 px-5 text-white text-sm hover:bg-indigo-700"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save changes
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
                <div className="mb-6 border-b border-gray-100 pb-4">
                  <h2 className="text-base font-semibold text-gray-900">Security Settings</h2>
                  <p className="text-xs text-gray-500 mt-1">Manage your password and session security.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:max-w-4xl">
                  <button
                    type="button"
                    onClick={() => setPasswordOpen(true)}
                    className="group flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 text-left transition-all hover:border-gray-300 hover:shadow-sm"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 text-gray-400 group-hover:bg-gray-100 group-hover:text-gray-600">
                      <KeyRound className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Change password</p>
                      <p className="text-xs text-gray-500 mt-0.5">Update your account password</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSignOutAllOpen(true)}
                    className="group flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 text-left transition-all hover:border-gray-300 hover:shadow-sm"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 text-gray-400 group-hover:bg-gray-100 group-hover:text-gray-600">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Sign out all devices</p>
                      <p className="text-xs text-gray-500 mt-0.5">Revoke all active sessions</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteAccountOpen(true)}
                    className="group flex items-center gap-4 rounded-lg border border-red-100 bg-red-50/30 p-4 text-left transition-all hover:border-red-200 hover:bg-red-50 md:col-span-2"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-400">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-600">Delete account</p>
                      <p className="text-xs text-red-400 mt-0.5">Permanently delete your account and all data</p>
                    </div>
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
                <div className="mb-6 flex flex-col gap-4 border-b border-gray-100 pb-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Connected Platforms</h2>
                    <p className="text-xs text-gray-500 mt-1">View and manage your connected data sources.</p>
                  </div>

                  <div className="relative w-full md:w-64">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-300" />
                    <Input
                      value={platformSearch}
                      onChange={(event) => setPlatformSearch(event.target.value)}
                      placeholder="Filter platforms..."
                      className="h-9 border-gray-200 bg-white pl-9 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:border-gray-400 focus-visible:ring-0"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredPlatforms.length === 0 && (
                    <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-center">
                      <p className="text-sm text-gray-400">No platforms match your filter.</p>
                    </div>
                  )}

                  {filteredPlatforms.map((platform) => (
                    <motion.div
                      layout
                      key={platform.id}
                      className="group flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-gray-300 hover:shadow-sm md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${platform.sync_status === 'active' ? 'bg-emerald-500' :
                            platform.sync_status === 'error' ? 'bg-red-500' :
                              'bg-amber-500'
                          }`} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {PLATFORM_NAMES[platform.platform] || platform.platform}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                            <span className={
                              platform.sync_status === 'active' ? 'text-emerald-600' :
                                platform.sync_status === 'error' ? 'text-red-600' : 'text-amber-600'
                            }>{statusLabel(platform.sync_status)}</span>
                            <span className="text-gray-300">·</span>
                            <span>Last sync: {platform.last_synced_at ? format(new Date(platform.last_synced_at), "MMM d, h:mm a") : "Never"}</span>
                          </div>
                        </div>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setDisconnectPlatform(platform)}
                        className="h-8 text-xs text-gray-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Link2 className="mr-1.5 h-3 w-3" />
                        Disconnect
                      </Button>
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
