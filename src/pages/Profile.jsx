import React, { useState } from "react";
import { base44 } from "@/api/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  User,
  Mail,
  Bell,
  Link2,
  Save,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Shield,
  ShieldCheck,
  History,
  Lock,
  KeyRound
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PLATFORM_NAMES = {
  youtube: 'YouTube',
  patreon: 'Patreon',
  stripe: 'Stripe',
  gumroad: 'Gumroad',
  instagram: 'Instagram',
  tiktok: 'TikTok'
};

export default function Profile() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: connectedPlatforms = [] } = useQuery({
    queryKey: ["connectedPlatforms"],
    queryFn: () => base44.entities.ConnectedPlatform.list("-connected_at"),
  });

  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
  });

  const [notifications, setNotifications] = useState({
    email_weekly_report: true,
    email_tax_reminders: true,
    email_platform_sync: false,
    email_insights: true,
  });

  React.useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
      });
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast.success("Profile updated successfully");
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (id) => base44.entities.ConnectedPlatform.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connectedPlatforms"] });
      toast.success("Platform disconnected");
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      full_name: formData.full_name,
    });
  };

  const handleDisconnect = (platform) => {
    if (window.confirm(`Disconnect ${PLATFORM_NAMES[platform.platform]}? This will stop syncing data.`)) {
      disconnectMutation.mutate(platform.id);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent tracking-tight">Profile & Security</h1>
            <p className="text-white/40 mt-1 text-sm flex items-center gap-2">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Data Encrypted & Isolated
            </p>
          </div>
          <Button
            variant="outline"
            className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            onClick={() => base44.auth.logout()}
          >
            Sign Out
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6">
        {/* Basic Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-modern rounded-xl p-6 border-l-4 border-l-zteal-400"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-zteal-400/10 border border-zteal-400/20 flex items-center justify-center">
              <User className="w-5 h-5 text-zteal-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Identity</h3>
              <p className="text-xs text-white/40">Personal details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-white/60 mb-2 block text-sm">Full Name</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="bg-white/5 border-white/10 text-white focus:border-zteal-400/50"
                  placeholder="Enter your full name"
                />
              </div>
              <Button
                onClick={handleSaveProfile}
                disabled={updateProfileMutation.isPending}
                className="w-full rounded-lg bg-zteal-400 hover:bg-zteal-500 text-white h-10 font-medium"
              >
                <Save className="w-4 h-4 mr-2" />
                Update Profile
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-white/60 mb-2 block text-sm">Email Address</Label>
                <div className="relative opacity-75">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    value={formData.email}
                    disabled
                    className="pl-10 bg-white/[0.02] border-white/5 text-white/40 cursor-not-allowed font-mono text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-xs text-white/40 block mb-1">Account Role</span>
                  <div className="flex items-center gap-2 text-white font-medium text-sm">
                    <Shield className="w-3 h-3 text-zteal-400" />
                    {user?.role || 'User'}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-xs text-white/40 block mb-1">Joined</span>
                  <div className="flex items-center gap-2 text-white font-medium text-sm">
                    <History className="w-3 h-3 text-zteal-400" />
                    {user?.created_at ? format(new Date(user.created_at), 'MMM yyyy') : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Security Section (New) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card-modern rounded-xl p-6 border-l-4 border-l-orange-400"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-orange-400/10 border border-orange-400/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Security & Access</h3>
              <p className="text-xs text-white/40">Protect your financial data</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/5 mb-4">
            <div className="flex items-start gap-4">
              <div className="mt-1">
                <KeyRound className="w-5 h-5 text-white/40" />
              </div>
              <div>
                <h4 className="text-white font-medium text-sm">Update Password</h4>
                <p className="text-white/40 text-xs mt-1">Change your login password securely.</p>
              </div>
            </div>
            <Button variant="outline" className="text-white border-white/10 hover:bg-white/5">
              Change
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/5">
            <div className="flex items-start gap-4">
              <div className="mt-1">
                <AlertCircle className="w-5 h-5 text-white/40" />
              </div>
              <div>
                <h4 className="text-white font-medium text-sm">Active Sessions</h4>
                <p className="text-white/40 text-xs mt-1">You are currently logged in on this device.</p>
              </div>
            </div>
            <Button variant="ghost" className="text-orange-400 hover:text-orange-300 hover:bg-orange-400/10">
              Sign out all devices
            </Button>
          </div>
        </motion.div>

        {/* Connected Platforms */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-modern rounded-xl p-6 border-l-4 border-l-blue-400"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-400/10 border border-blue-400/20 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Connected Platforms</h3>
              <p className="text-xs text-white/40">Manage your revenue sources</p>
            </div>
          </div>

          {connectedPlatforms.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6 text-white/30" />
              </div>
              <p className="text-white/40 text-sm">No platforms connected yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {connectedPlatforms.map((platform) => (
                <div
                  key={platform.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">
                      {PLATFORM_NAMES[platform.platform] || platform.platform}
                    </p>
                    <p className="text-white/40 text-xs mt-1">
                      Connected {format(new Date(platform.connected_at), "MMM d, yyyy")}
                      {platform.last_synced_at && (
                        <> · Last synced {format(new Date(platform.last_synced_at), "MMM d, h:mm a")}</>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "px-2 py-1 rounded-md text-xs font-medium",
                      platform.sync_status === "active" && "bg-emerald-500/10 text-emerald-400",
                      platform.sync_status === "error" && "bg-red-500/10 text-red-400",
                      platform.sync_status === "syncing" && "bg-blue-500/10 text-blue-400"
                    )}>
                      {platform.sync_status}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDisconnect(platform)}
                      disabled={disconnectMutation.isPending}
                      className="text-white/40 hover:text-red-400 hover:bg-red-500/10 h-8 w-8"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl p-6 border border-red-500/20 bg-red-500/5"
        >
          <h3 className="text-lg font-bold text-red-500 mb-2">Danger Zone</h3>
          <p className="text-red-400/60 text-sm mb-6">Irreversible actions regarding your account.</p>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium text-sm">Delete Account</p>
              <p className="text-white/40 text-xs mt-1">Permanently delete your account and all financial data.</p>
            </div>
            <Button variant="destructive" className="bg-red-500 hover:bg-red-600 text-white border-none">
              Delete Account
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}