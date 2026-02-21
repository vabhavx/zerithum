import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
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
  { value: "identity", label: "Identity" },
  { value: "security", label: "Security" },
  { value: "connections", label: "Connections" },
];

function statusTone(status) {
  if (status === "active") return "border-[#56C5D0]/35 bg-[#56C5D0]/10 text-[#56C5D0]";
  if (status === "error") return "border-[#F06C6C]/35 bg-[#F06C6C]/10 text-[#F06C6C]";
  if (status === "syncing") return "border-white/30 bg-white/10 text-white";
  return "border-[#F0A562]/35 bg-[#F0A562]/10 text-[#F0A562]";
}

function statusLabel(status) {
  if (status === "active") return "Synced";
  if (status === "error") return "Needs attention";
  if (status === "syncing") return "Syncing";
  if (status === "stale") return "Stale";
  return status || "Unknown";
}

function Card({ title, subtitle, children }) {
  return (
    <section className="rounded-xl border border-white/10 bg-[#111114]">
      <div className="border-b border-white/10 p-4">
        <h2 className="text-lg font-semibold text-[#F5F5F5]">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-white/70">{subtitle}</p>}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
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

  const { data: connectedPlatforms = [] } = useQuery({
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
      toast.error("Could not update profile");
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
      toast.error("Could not disconnect platform");
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
    <div className="mx-auto w-full max-w-[1200px] rounded-2xl border border-white/10 bg-[#0A0A0A] p-6 lg:p-8">
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

      <header className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-6 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#F5F5F5]">Profile & security</h1>
          <p className="mt-1 text-sm text-white/70">
            Interactive account controls with clear security posture and connection status.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => base44.auth.logout()}
          className="h-9 border-[#F06C6C]/40 bg-transparent text-[#F06C6C] hover:bg-[#F06C6C]/10 focus-visible:ring-2 focus-visible:ring-[#F06C6C]"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </header>

      <section className="mb-6 rounded-xl border border-white/10 bg-[#111114] p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-white/70">Security posture score</span>
          <span className="font-mono-financial text-[#56C5D0]">{securityScore}/100</span>
        </div>
        <div className="h-2 rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[#56C5D0] transition-all"
            style={{ width: `${securityScore}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-white/60">
          Score uses profile completeness and platform connection health.
        </p>
      </section>

      <section className="mb-6 flex flex-wrap gap-2">
        {SECTION_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveSection(tab.value)}
            className={`h-8 rounded-md border px-3 text-sm transition ${
              activeSection === tab.value
                ? "border-[#56C5D0]/45 bg-[#56C5D0]/10 text-[#56C5D0]"
                : "border-white/20 bg-transparent text-white/70 hover:bg-white/10"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </section>

      {activeSection === "identity" && (
        <Card title="Identity" subtitle="Basic profile details used across your workspace.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="full-name" className="mb-2 block text-sm text-white/80">
                Full name
              </Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                <Input
                  id="full-name"
                  value={form.full_name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, full_name: event.target.value }))
                  }
                  className="h-9 border-white/15 bg-[#15151A] pl-9 text-[#F5F5F5] focus-visible:ring-2 focus-visible:ring-[#56C5D0]"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="mb-2 block text-sm text-white/80">
                Email
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                <Input
                  id="email"
                  value={form.email}
                  readOnly
                  className="h-9 border-white/15 bg-[#15151A] pl-9 text-white/70"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              onClick={saveProfile}
              disabled={updateProfileMutation.isPending}
              className="h-9 bg-[#56C5D0] text-[#0A0A0A] hover:bg-[#48AAB5] focus-visible:ring-2 focus-visible:ring-[#56C5D0]"
            >
              <Save className="mr-2 h-4 w-4" />
              Save changes
            </Button>
          </div>
        </Card>
      )}

      {activeSection === "security" && (
        <Card title="Security" subtitle="Control login credentials and active sessions.">
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setPasswordOpen(true)}
              className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-[#15151A] p-3 text-left hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#56C5D0]"
            >
              <div>
                <p className="text-sm font-medium text-[#F5F5F5]">Change password</p>
                <p className="mt-1 text-xs text-white/65">Update account password for security.</p>
              </div>
              <KeyRound className="h-4 w-4 text-white/50" />
            </button>

            <button
              type="button"
              onClick={() => setSignOutAllOpen(true)}
              className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-[#15151A] p-3 text-left hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#56C5D0]"
            >
              <div>
                <p className="text-sm font-medium text-[#F5F5F5]">Sign out all devices</p>
                <p className="mt-1 text-xs text-white/65">End all active sessions except your current one.</p>
              </div>
              <ShieldCheck className="h-4 w-4 text-white/50" />
            </button>

            <button
              type="button"
              onClick={() => setDeleteAccountOpen(true)}
              className="flex w-full items-center justify-between rounded-lg border border-[#F06C6C]/35 bg-[#F06C6C]/10 p-3 text-left hover:bg-[#F06C6C]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F06C6C]"
            >
              <div>
                <p className="text-sm font-medium text-[#F5F5F5]">Delete account</p>
                <p className="mt-1 text-xs text-white/70">Permanent action. Use only if you are sure.</p>
              </div>
              <AlertTriangle className="h-4 w-4 text-[#F06C6C]" />
            </button>
          </div>
        </Card>
      )}

      {activeSection === "connections" && (
        <Card title="Connected platforms" subtitle="Sources currently linked to your account.">
          <div className="mb-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md border border-white/10 bg-[#15151A] p-2">
              <p className="font-mono-financial text-lg font-semibold text-[#F5F5F5]">{connectedStats.total}</p>
              <p className="text-[11px] text-white/60">Total</p>
            </div>
            <div className="rounded-md border border-[#56C5D0]/30 bg-[#56C5D0]/10 p-2">
              <p className="font-mono-financial text-lg font-semibold text-[#56C5D0]">{connectedStats.active}</p>
              <p className="text-[11px] text-white/60">Healthy</p>
            </div>
            <div className="rounded-md border border-[#F06C6C]/30 bg-[#F06C6C]/10 p-2">
              <p className="font-mono-financial text-lg font-semibold text-[#F06C6C]">{connectedStats.errors}</p>
              <p className="text-[11px] text-white/60">Errors</p>
            </div>
          </div>

          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
            <Input
              value={platformSearch}
              onChange={(event) => setPlatformSearch(event.target.value)}
              placeholder="Search connected platforms"
              className="h-9 border-white/15 bg-[#15151A] pl-9 text-[#F5F5F5]"
            />
          </div>

          <div className="space-y-2">
            {filteredPlatforms.length === 0 && (
              <p className="rounded-md border border-white/10 bg-[#15151A] p-3 text-sm text-white/65">
                No platforms match this search.
              </p>
            )}

            {filteredPlatforms.map((platform) => (
              <div key={platform.id} className="rounded-md border border-white/10 bg-[#15151A] p-3">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-[#F5F5F5]">
                      {PLATFORM_NAMES[platform.platform] || platform.platform}
                    </p>
                    <p className="mt-1 text-xs text-white/65">
                      Connected {platform.connected_at ? format(new Date(platform.connected_at), "MMM d, yyyy") : "-"}
                    </p>
                  </div>

                  <span className={`rounded-md border px-2 py-1 text-xs ${statusTone(platform.sync_status)}`}>
                    {statusLabel(platform.sync_status)}
                  </span>
                </div>

                {platform.last_synced_at && (
                  <p className="mb-2 text-xs text-white/60">
                    Last sync: {format(new Date(platform.last_synced_at), "MMM d, yyyy h:mm a")}
                  </p>
                )}

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setDisconnectPlatform(platform)}
                  className="h-7 border-white/20 bg-transparent px-2 text-xs text-[#F5F5F5] hover:bg-white/10"
                >
                  <Link2 className="mr-1.5 h-3.5 w-3.5" />
                  Disconnect
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
