import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Globe2,
  KeyRound,
  Link2,
  Loader2,
  LogOut,
  Mail,
  Save,
  Search,
  ShieldCheck,
  User,
} from "lucide-react";
import { base44 } from "@/api/supabaseClient";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import UpdatePasswordModal from "@/components/security/UpdatePasswordModal";
import SignOutAllDevicesModal from "@/components/security/SignOutAllDevicesModal";
import DeleteAccountModal from "@/components/security/DeleteAccountModal";
import DisconnectPlatformModal from "@/components/security/DisconnectPlatformModal";
import { cn } from "@/lib/utils";
import { createPageUrl } from "@/utils";
import { STATE_OPTIONS } from "@/lib/taxConstants";
import { OAUTH_PROVIDERS } from "@/lib/auth";

const CURRENT_TAX_YEAR = new Date().getFullYear();

const PLATFORM_NAMES = {
  youtube: "YouTube",
  patreon: "Patreon",
  stripe: "Stripe",
  gumroad: "Gumroad",
  tiktok: "TikTok",
  shopify: "Shopify",
  substack: "Substack",
  twitch: "Twitch",
  paypal: "PayPal",
  paddle: "Paddle",
  lemonsqueezy: "Lemon Squeezy",
  razorpay: "Razorpay",
};

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "INR", label: "INR - Indian Rupee" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "SGD", label: "SGD - Singapore Dollar" },
];

const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "UTC" },
  { value: "America/Los_Angeles", label: "Pacific Time (US)" },
  { value: "America/Denver", label: "Mountain Time (US)" },
  { value: "America/Chicago", label: "Central Time (US)" },
  { value: "America/New_York", label: "Eastern Time (US)" },
  { value: "Europe/London", label: "London" },
  { value: "Asia/Kolkata", label: "India Standard Time" },
  { value: "Asia/Singapore", label: "Singapore" },
];

const TAX_FILING_STATUS_OPTIONS = [
  { value: "single", label: "Single" },
  { value: "married_filing_jointly", label: "Married Filing Jointly" },
  { value: "married_filing_separately", label: "Married Filing Separately" },
  { value: "head_of_household", label: "Head of Household" },
];

function statusLabel(status) {
  if (status === "active" || status === "synced") return "Healthy";
  if (status === "syncing") return "Syncing";
  if (status === "error") return "Needs attention";
  if (status === "pending") return "Pending";
  return status || "Unknown";
}

function statusTone(status) {
  if (status === "active" || status === "synced") return { dot: "bg-emerald-500", text: "text-emerald-700" };
  if (status === "syncing") return { dot: "bg-blue-500", text: "text-blue-700" };
  if (status === "error") return { dot: "bg-red-500", text: "text-red-700" };
  return { dot: "bg-amber-500", text: "text-amber-700" };
}

function planLabel(planTier) {
  if (planTier === "enterprise") return "Enterprise";
  if (planTier === "pro") return "Pro";
  return "Free";
}

export default function Settings() {
  const queryClient = useQueryClient();
  const [profileForm, setProfileForm] = useState({ full_name: "", timezone: "UTC", currency: "USD" });
  const [taxForm, setTaxForm] = useState({ filing_status: "single", state: "CA", country: "US" });
  const [platformSearch, setPlatformSearch] = useState("");
  const [disconnectPlatform, setDisconnectPlatform] = useState(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [signOutAllOpen, setSignOutAllOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ["settings", "user"],
    queryFn: () => base44.auth.me(),
    staleTime: 1000 * 60 * 2,
  });

  const userId = user?.id;
  const userProvider = user?.app_metadata?.provider || '';
  const userProviders = user?.app_metadata?.providers || [];

  const hasPasswordAuth = (userProvider === 'email' || userProviders.includes('email')) &&
    !OAUTH_PROVIDERS.includes(userProvider);

  const { data: connectedPlatforms = [], isFetching: isFetchingPlatforms } = useQuery({
    queryKey: ["settings", "connectedPlatforms", userId],
    queryFn: () => base44.entities.ConnectedPlatform.filter({ user_id: userId }, "-connected_at", 100),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 2,
  });

  const { data: taxProfile, isFetching: isFetchingTaxProfile } = useQuery({
    queryKey: ["settings", "taxProfile", userId, CURRENT_TAX_YEAR],
    queryFn: async () => {
      const records = await base44.entities.TaxProfile.filter(
        { user_id: userId, tax_year: CURRENT_TAX_YEAR },
        "-updated_at",
        1
      );
      return records[0] || null;
    },
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 2,
  });

  useEffect(() => {
    if (!user) return;
    setProfileForm({
      full_name: user.full_name || "",
      timezone: user.timezone || "UTC",
      currency: user.currency || "USD",
    });
  }, [user]);

  useEffect(() => {
    if (!taxProfile) {
      setTaxForm({ filing_status: "single", state: "CA", country: "US" });
      return;
    }
    setTaxForm({
      filing_status: taxProfile.filing_status || "single",
      state: taxProfile.state || "CA",
      country: taxProfile.country || "US",
    });
  }, [taxProfile]);

  const profileMutation = useMutation({
    mutationFn: (payload) => base44.auth.updateMe(payload),
    onSuccess: () => {
      toast.success("Profile and accounting defaults saved.");
      queryClient.invalidateQueries({ queryKey: ["settings", "user"] });
    },
    onError: () => {
      toast.error("Failed to save profile settings.");
    },
  });

  const taxProfileMutation = useMutation({
    mutationFn: async (payload) => {
      if (taxProfile?.id) {
        return base44.entities.TaxProfile.update(taxProfile.id, payload);
      }
      return base44.entities.TaxProfile.create({ ...payload, tax_year: CURRENT_TAX_YEAR });
    },
    onSuccess: () => {
      toast.success("Tax defaults saved.");
      queryClient.invalidateQueries({ queryKey: ["settings", "taxProfile"] });
    },
    onError: () => {
      toast.error("Failed to save tax defaults.");
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (id) => base44.entities.ConnectedPlatform.delete(id),
    onSuccess: () => {
      toast.success("Platform disconnected.");
      setDisconnectPlatform(null);
      queryClient.invalidateQueries({ queryKey: ["settings", "connectedPlatforms"] });
    },
    onError: () => {
      toast.error("Unable to disconnect platform.");
    },
  });

  const connectedStats = useMemo(() => {
    const active = connectedPlatforms.filter((item) => item.sync_status === "active" || item.sync_status === "synced").length;
    const errors = connectedPlatforms.filter((item) => item.sync_status === "error").length;
    return {
      total: connectedPlatforms.length,
      active,
      errors,
    };
  }, [connectedPlatforms]);

  const accountReadinessScore = useMemo(() => {
    let score = 30;
    if (profileForm.full_name.trim().length >= 2) score += 20;
    if (user?.email) score += 10;
    if (profileForm.timezone) score += 10;
    if (profileForm.currency) score += 10;
    if (connectedStats.active > 0) score += 10;
    if (taxForm.filing_status && taxForm.state) score += 10;
    score -= connectedStats.errors * 5;
    return Math.max(0, Math.min(100, score));
  }, [profileForm.full_name, profileForm.timezone, profileForm.currency, user?.email, connectedStats.active, connectedStats.errors, taxForm.filing_status, taxForm.state]);

  const filteredPlatforms = useMemo(() => {
    const query = platformSearch.trim().toLowerCase();
    if (!query) return connectedPlatforms;
    return connectedPlatforms.filter((platform) => {
      const platformName = PLATFORM_NAMES[platform.platform] || platform.platform;
      const haystack = `${platformName} ${platform.sync_status || ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [connectedPlatforms, platformSearch]);

  const hasProfileChanges = useMemo(() => {
    if (!user) return false;
    return (
      (user.full_name || "") !== profileForm.full_name ||
      (user.timezone || "UTC") !== profileForm.timezone ||
      (user.currency || "USD") !== profileForm.currency
    );
  }, [user, profileForm]);

  const hasTaxChanges = useMemo(() => {
    const current = {
      filing_status: taxProfile?.filing_status || "single",
      state: taxProfile?.state || "CA",
      country: taxProfile?.country || "US",
    };
    return (
      current.filing_status !== taxForm.filing_status ||
      current.state !== taxForm.state ||
      current.country !== taxForm.country
    );
  }, [taxProfile, taxForm]);

  const saveProfileAndAccounting = () => {
    profileMutation.mutate({
      full_name: profileForm.full_name.trim(),
      timezone: profileForm.timezone,
      currency: profileForm.currency,
    });
  };

  const saveTaxDefaults = () => {
    taxProfileMutation.mutate({
      filing_status: taxForm.filing_status,
      state: taxForm.state,
      country: taxForm.country,
      tax_year: CURRENT_TAX_YEAR,
    });
  };

  const confirmDisconnect = () => {
    if (!disconnectPlatform) return;
    disconnectMutation.mutate(disconnectPlatform.id);
  };

  if (isLoadingUser) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" />
          <p className="mt-3 text-sm text-gray-500">Loading account settings...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-5xl rounded-2xl border border-red-100 bg-red-50 p-8">
        <p className="text-sm font-medium text-red-700">You need an active session to view settings.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1220px] space-y-6">
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

      <header className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Account & Settings Center</h1>
            <p className="mt-1.5 text-sm text-gray-500">
              Universal profile, accounting defaults, security controls, and compliance settings.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => base44.auth.logout()}
            className="h-9 border-gray-200 text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Readiness Score</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{accountReadinessScore}/100</p>
          <p className="mt-1 text-xs text-gray-500">Enterprise baseline completion</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Connected Sources</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{connectedStats.total}</p>
          <p className="mt-1 text-xs text-gray-500">{connectedStats.active} healthy connections</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Sync Issues</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{connectedStats.errors}</p>
          <p className="mt-1 text-xs text-gray-500">
            {connectedStats.errors > 0 ? "Action recommended" : "No issues detected"}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Plan</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{planLabel(user.plan_tier)}</p>
          <p className="mt-1 text-xs text-gray-500">Billing and access controls</p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-gray-50">
                <User className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Identity & Accounting Defaults</h2>
                <p className="text-xs text-gray-500">Single profile and financial baseline used across dashboards and exports.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-xs font-medium text-gray-600">Display Name</Label>
                <Input
                  id="full_name"
                  value={profileForm.full_name}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, full_name: event.target.value }))}
                  className="h-10 border-gray-200 bg-white text-gray-900"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium text-gray-600">Email Address</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                  <Input
                    id="email"
                    value={user.email || ""}
                    readOnly
                    className="h-10 border-gray-100 bg-gray-50 pl-9 text-gray-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-600">Timezone</Label>
                <Select
                  value={profileForm.timezone}
                  onValueChange={(value) => setProfileForm((prev) => ({ ...prev, timezone: value }))}
                >
                  <SelectTrigger className="h-10 border-gray-200 bg-white text-sm text-gray-900">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-600">Default Currency</Label>
                <Select
                  value={profileForm.currency}
                  onValueChange={(value) => setProfileForm((prev) => ({ ...prev, currency: value }))}
                >
                  <SelectTrigger className="h-10 border-gray-200 bg-white text-sm text-gray-900">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                type="button"
                onClick={saveProfileAndAccounting}
                disabled={!hasProfileChanges || profileMutation.isPending}
                className="h-9 bg-indigo-600 px-5 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {profileMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save identity defaults
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-gray-50">
                <CalendarClock className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Tax Profile Defaults ({CURRENT_TAX_YEAR})</h2>
                <p className="text-xs text-gray-500">Used as baseline in tax estimation and filing-ready reports.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2 md:col-span-2">
                <Label className="text-xs font-medium text-gray-600">Filing Status</Label>
                <Select
                  value={taxForm.filing_status}
                  onValueChange={(value) => setTaxForm((prev) => ({ ...prev, filing_status: value }))}
                >
                  <SelectTrigger className="h-10 border-gray-200 bg-white text-sm text-gray-900">
                    <SelectValue placeholder="Select filing status" />
                  </SelectTrigger>
                  <SelectContent>
                    {TAX_FILING_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-600">State</Label>
                <Select
                  value={taxForm.state}
                  onValueChange={(value) => setTaxForm((prev) => ({ ...prev, state: value }))}
                >
                  <SelectTrigger className="h-10 border-gray-200 bg-white text-sm text-gray-900">
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-600">Country</Label>
                <Select
                  value={taxForm.country}
                  onValueChange={(value) => setTaxForm((prev) => ({ ...prev, country: value }))}
                >
                  <SelectTrigger className="h-10 border-gray-200 bg-white text-sm text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {isFetchingTaxProfile ? "Refreshing latest tax profile..." : `Last synced tax defaults for ${CURRENT_TAX_YEAR}.`}
              </p>
              <Button
                type="button"
                onClick={saveTaxDefaults}
                disabled={!hasTaxChanges || taxProfileMutation.isPending}
                className="h-9 bg-indigo-600 px-5 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {taxProfileMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save tax defaults
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-gray-50">
                <ShieldCheck className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Security & Session Controls</h2>
                <p className="text-xs text-gray-500">Credential safety, session revocation, and account lifecycle controls.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {hasPasswordAuth ? (
                <button
                  type="button"
                  onClick={() => setPasswordOpen(true)}
                  className="group flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 text-left transition-colors hover:border-gray-300"
                >
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-gray-500">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Change password</p>
                    <p className="text-xs text-gray-500">Update account credentials</p>
                  </div>
                </button>
              ) : (
                <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-left">
                  <div className="rounded-lg border border-gray-200 bg-white p-2.5 text-gray-400">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Password</p>
                    <p className="text-xs text-gray-500">Managed by Google</p>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setSignOutAllOpen(true)}
                className="group flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 text-left transition-colors hover:border-gray-300"
              >
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-gray-500">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Sign out all devices</p>
                  <p className="text-xs text-gray-500">Revoke every active session</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDeleteAccountOpen(true)}
                className="group flex items-center gap-4 rounded-lg border border-red-200 bg-red-50/40 p-4 text-left transition-colors hover:border-red-300 hover:bg-red-50 md:col-span-2"
              >
                <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-700">Delete account</p>
                  <p className="text-xs text-red-500">Permanent data deletion and access revocation</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Connected Data Sources</h2>
                <p className="text-xs text-gray-500">Integration health and quick disconnect controls.</p>
              </div>
              <Link
                to={createPageUrl("ConnectedPlatforms")}
                className="inline-flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                Manage
                <ExternalLink className="ml-1 h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="relative mb-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-300" />
              <Input
                value={platformSearch}
                onChange={(event) => setPlatformSearch(event.target.value)}
                placeholder="Filter connected platforms..."
                className="h-9 border-gray-200 bg-white pl-9 text-sm"
              />
            </div>

            {isFetchingPlatforms ? (
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-center">
                <Loader2 className="mx-auto h-4 w-4 animate-spin text-gray-400" />
                <p className="mt-2 text-xs text-gray-500">Refreshing platform status...</p>
              </div>
            ) : filteredPlatforms.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
                <p className="text-sm text-gray-500">No connected sources found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPlatforms.map((platform) => {
                  const tone = statusTone(platform.sync_status);
                  return (
                    <div
                      key={platform.id}
                      className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn("h-2 w-2 rounded-full", tone.dot)} />
                          <p className="truncate text-sm font-medium text-gray-900">
                            {PLATFORM_NAMES[platform.platform] || platform.platform}
                          </p>
                        </div>
                        <p className={cn("mt-1 text-xs font-medium", tone.text)}>
                          {statusLabel(platform.sync_status)}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          Last sync:{" "}
                          {platform.last_synced_at
                            ? format(new Date(platform.last_synced_at), "MMM d, yyyy · h:mm a")
                            : "Never"}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setDisconnectPlatform(platform)}
                        className="h-8 shrink-0 text-xs text-gray-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <Link2 className="mr-1.5 h-3 w-3" />
                        Disconnect
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2.5">
              <CreditCard className="h-4 w-4 text-gray-500" />
              <h2 className="text-base font-semibold text-gray-900">Billing & Plan Controls</h2>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-wider text-gray-500">Current Tier</p>
              <div className="mt-1 flex items-center gap-2">
                <p className="text-lg font-semibold text-gray-900">{planLabel(user.plan_tier)}</p>
                <span className="rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-gray-600 ring-1 ring-gray-200">
                  {user.plan_tier || "free"}
                </span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link to={createPageUrl("Subscription")}>
                <Button variant="outline" className="h-9 w-full border-gray-200 text-gray-700 hover:bg-gray-50">
                  Manage subscription
                </Button>
              </Link>
              <Link to={createPageUrl("Pricing")}>
                <Button variant="outline" className="h-9 w-full border-gray-200 text-gray-700 hover:bg-gray-50">
                  View pricing catalog
                </Button>
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2.5">
              <Globe2 className="h-4 w-4 text-gray-500" />
              <h2 className="text-base font-semibold text-gray-900">Compliance & Reporting</h2>
            </div>
            <div className="space-y-2">
              <Link
                to={createPageUrl("TaxEstimator")}
                className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
              >
                <span>Tax Estimator Defaults</span>
                <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
              </Link>
              <Link
                to={createPageUrl("TaxReports")}
                className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
              >
                <span>Tax Reports Dashboard</span>
                <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
              </Link>
              <Link
                to={createPageUrl("TaxExport")}
                className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
              >
                <span>Tax Reports & Exports</span>
                <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
              </Link>
              <Link
                to={createPageUrl("Security")}
                className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
              >
                <span>Security Architecture</span>
                <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
              </Link>
              <Link
                to={createPageUrl("Privacy")}
                className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
              >
                <span>Privacy & Data Policy</span>
                <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
          <div>
            <p className="text-sm font-semibold text-emerald-900">Unified profile is now the source of truth</p>
            <p className="mt-1 text-xs text-emerald-700">
              Identity, accounting defaults, tax defaults, security posture, and integration health are consolidated in this single page.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
