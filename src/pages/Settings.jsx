import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  User,
  ShieldCheck,
  Database,
  CreditCard,
  LogOut,
  Loader2,
  ChevronRight,
  Activity
} from "lucide-react";
import { base44 } from "@/api/supabaseClient";
import { toast } from "sonner";

import { OAUTH_PROVIDERS } from "@/lib/auth";

import UpdatePasswordModal from "@/components/security/UpdatePasswordModal";
import SignOutAllDevicesModal from "@/components/security/SignOutAllDevicesModal";
import DeleteAccountModal from "@/components/security/DeleteAccountModal";
import DisconnectPlatformModal from "@/components/security/DisconnectPlatformModal";

import SettingsGeneral from "@/components/settings/SettingsGeneral";
import SettingsSecurity from "@/components/settings/SettingsSecurity";
import SettingsIntegrations from "@/components/settings/SettingsIntegrations";
import SettingsBilling from "@/components/settings/SettingsBilling";
import { cn } from "@/lib/utils";

const CURRENT_TAX_YEAR = new Date().getFullYear();

const TABS = [
  { id: "general", label: "Identity & Tax", icon: User },
  { id: "security", label: "Security & Access", icon: ShieldCheck },
  { id: "sources", label: "Data Sources", icon: Database },
  { id: "billing", label: "Billing & Compliance", icon: CreditCard },
];

export default function Settings() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "general";

  // Local state for modals
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [signOutAllOpen, setSignOutAllOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [disconnectPlatform, setDisconnectPlatform] = useState(null);

  // Local state for forms
  const [profileForm, setProfileForm] = useState({ full_name: "", timezone: "UTC", currency: "USD" });
  const [taxForm, setTaxForm] = useState({ filing_status: "single", state: "CA", country: "US" });
  const [platformSearch, setPlatformSearch] = useState("");

  // Data fetching
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ["settings", "user"],
    queryFn: () => base44.auth.me(),
    staleTime: 1000 * 60 * 2,
  });

  const userId = user?.id;
  const userProvider = user?.app_metadata?.provider || '';
  const userProviders = user?.app_metadata?.providers || [];
  const hasPasswordAuth = (userProvider === 'email' || userProviders.includes('email')) && !OAUTH_PROVIDERS.includes(userProvider);

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

  // Effects
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

  // Mutations
  const profileMutation = useMutation({
    mutationFn: (payload) => base44.auth.updateMe(payload),
    onSuccess: () => {
      toast.success("Identity settings updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["settings", "user"] });
    },
    onError: () => toast.error("Failed to save profile settings."),
  });

  const taxProfileMutation = useMutation({
    mutationFn: async (payload) => {
      if (taxProfile?.id) {
        return base44.entities.TaxProfile.update(taxProfile.id, payload);
      }
      return base44.entities.TaxProfile.create({ ...payload, tax_year: CURRENT_TAX_YEAR });
    },
    onSuccess: () => {
      toast.success(`Tax profile updated for ${CURRENT_TAX_YEAR}.`);
      queryClient.invalidateQueries({ queryKey: ["settings", "taxProfile"] });
    },
    onError: () => toast.error("Failed to save tax defaults."),
  });

  const disconnectMutation = useMutation({
    mutationFn: (id) => base44.entities.ConnectedPlatform.delete(id),
    onSuccess: () => {
      toast.success("Platform securely disconnected.");
      setDisconnectPlatform(null);
      queryClient.invalidateQueries({ queryKey: ["settings", "connectedPlatforms"] });
    },
    onError: () => toast.error("Unable to disconnect platform."),
  });

  // Computed
  const connectedStats = useMemo(() => {
    const active = connectedPlatforms.filter((item) => item.sync_status === "active" || item.sync_status === "synced").length;
    const errors = connectedPlatforms.filter((item) => item.sync_status === "error").length;
    return { total: connectedPlatforms.length, active, errors };
  }, [connectedPlatforms]);

  const filteredPlatforms = useMemo(() => {
    const query = platformSearch.trim().toLowerCase();
    if (!query) return connectedPlatforms;
    return connectedPlatforms.filter((platform) => {
      const haystack = `${platform.platform} ${platform.sync_status || ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [connectedPlatforms, platformSearch]);

  const accountReadinessScore = useMemo(() => {
    let score = 30;
    if (profileForm.full_name?.trim().length >= 2) score += 20;
    if (user?.email) score += 10;
    if (profileForm.timezone) score += 10;
    if (profileForm.currency) score += 10;
    if (connectedStats.active > 0) score += 10;
    if (taxForm.filing_status && taxForm.state) score += 10;
    score -= connectedStats.errors * 5;
    return Math.max(0, Math.min(100, score));
  }, [profileForm, user?.email, connectedStats, taxForm]);

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

  // Actions
  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

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

  if (isLoadingUser) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-4" />
        <p className="text-sm font-medium text-gray-500 tracking-tight">Initializing Command Centre...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl mt-12 rounded-2xl border border-red-100 bg-red-50 p-8 text-center ring-1 ring-inset ring-red-100 shadow-sm">
        <ShieldCheck className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-lg font-bold text-red-900 tracking-tight">Authentication Required</h2>
        <p className="mt-2 text-sm font-medium text-red-700">You need an active session to access the Command Centre.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-8 pb-12">
      {/* Modals */}
      <UpdatePasswordModal open={passwordOpen} onOpenChange={setPasswordOpen} />
      <SignOutAllDevicesModal open={signOutAllOpen} onOpenChange={setSignOutAllOpen} />
      <DeleteAccountModal open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen} />
      <DisconnectPlatformModal
        open={Boolean(disconnectPlatform)}
        onOpenChange={(open) => !open && setDisconnectPlatform(null)}
        platformName={disconnectPlatform?.platform || ""}
        onConfirm={() => disconnectMutation.mutate(disconnectPlatform.id)}
        isPending={disconnectMutation.isPending}
      />

      {/* Hero Header */}
      <header className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm ring-1 ring-black/5 flex flex-col md:flex-row md:items-end justify-between gap-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-indigo-600 mb-3">
            <Activity className="h-4 w-4" />
            <span className="text-xs font-bold tracking-widest uppercase">Command Centre</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">System Control</h1>
          <p className="mt-3 text-base text-gray-500 max-w-xl">
            Centralized architecture for identity, security policies, and financial integration telemetry.
          </p>
        </div>

        <div className="relative z-10 flex flex-col items-end gap-3">
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100 shadow-inner">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Readiness Score</p>
              <p className="text-xl font-black text-gray-900 leading-none mt-1">{accountReadinessScore}<span className="text-sm font-semibold text-gray-400">/100</span></p>
            </div>
            <div className="h-10 w-10 flex-shrink-0 relative">
              <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                <path strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" className="stroke-gray-200" strokeWidth="3" fill="none" />
                <path strokeDasharray={`${accountReadinessScore}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" className="stroke-indigo-600 transition-all duration-1000 ease-out" strokeWidth="3" fill="none" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr] gap-8 items-start">

        {/* Sidebar Navigation */}
        <nav className="flex flex-col gap-1.5 md:sticky md:top-6">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "group relative flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-inset ring-indigo-500/20"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("h-5 w-5", isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600")} />
                  {tab.label}
                </div>
                {isActive && (
                  <motion.div layoutId="nav-indicator" className="flex items-center">
                    <ChevronRight className="h-4 w-4 text-indigo-400" />
                  </motion.div>
                )}
              </button>
            );
          })}

          <div className="my-4 h-px bg-gray-200" />

          <button
            onClick={() => base44.auth.logout()}
            className="group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-600 transition-all hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-5 w-5 text-gray-400 group-hover:text-red-500" />
            Sign Out
          </button>
        </nav>

        {/* Dynamic Content Area */}
        <main className="min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              {activeTab === "general" && (
                <SettingsGeneral
                  user={user}
                  profileForm={profileForm}
                  setProfileForm={setProfileForm}
                  taxProfile={taxProfile}
                  taxForm={taxForm}
                  setTaxForm={setTaxForm}
                  isFetchingTaxProfile={isFetchingTaxProfile}
                  hasProfileChanges={hasProfileChanges}
                  hasTaxChanges={hasTaxChanges}
                  saveProfileAndAccounting={saveProfileAndAccounting}
                  profileMutationPending={profileMutation.isPending}
                  saveTaxDefaults={saveTaxDefaults}
                  taxProfileMutationPending={taxProfileMutation.isPending}
                />
              )}
              {activeTab === "security" && (
                <SettingsSecurity
                  hasPasswordAuth={hasPasswordAuth}
                  setPasswordOpen={setPasswordOpen}
                  setSignOutAllOpen={setSignOutAllOpen}
                  setDeleteAccountOpen={setDeleteAccountOpen}
                />
              )}
              {activeTab === "sources" && (
                <SettingsIntegrations
                  platformSearch={platformSearch}
                  setPlatformSearch={setPlatformSearch}
                  filteredPlatforms={filteredPlatforms}
                  isFetchingPlatforms={isFetchingPlatforms}
                  setDisconnectPlatform={setDisconnectPlatform}
                />
              )}
              {activeTab === "billing" && (
                <SettingsBilling user={user} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
