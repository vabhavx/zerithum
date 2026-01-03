import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
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
  AlertCircle
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
      queryClient.invalidateQueries(["currentUser"]);
      toast.success("Profile updated successfully");
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (id) => base44.entities.ConnectedPlatform.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["connectedPlatforms"]);
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
    <div className="max-w-4xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-white tracking-tight">Profile Settings</h1>
        <p className="text-white/40 mt-1 text-sm">Manage your account and preferences</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-6">
        {/* Basic Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-modern rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
              <User className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Basic Information</h3>
              <p className="text-xs text-white/40">Update your profile details</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-white/60 mb-2 block text-sm">Full Name</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <Label className="text-white/60 mb-2 block text-sm">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  value={formData.email}
                  disabled
                  className="pl-10 bg-white/[0.02] border-white/5 text-white/40 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-white/30 mt-1">Email cannot be changed</p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <div className="flex-1 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-emerald-400">Role: {user?.role || 'user'}</span>
              </div>
              <div className="flex-1 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-blue-400">Member since {user?.created_date ? format(new Date(user.created_date), 'MMM yyyy') : 'N/A'}</span>
              </div>
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={updateProfileMutation.isPending}
              className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white h-10"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </motion.div>

        {/* Connected Platforms */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-modern rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-white/10 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-emerald-400" />
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

        {/* Notification Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-modern rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-white/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Notification Preferences</h3>
              <p className="text-xs text-white/40">Control what emails you receive</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/5">
              <div>
                <p className="text-white text-sm font-medium">Weekly Revenue Reports</p>
                <p className="text-white/40 text-xs mt-1">Get a summary of your earnings every week</p>
              </div>
              <Switch
                checked={notifications.email_weekly_report}
                onCheckedChange={(checked) => 
                  setNotifications({ ...notifications, email_weekly_report: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/5">
              <div>
                <p className="text-white text-sm font-medium">Tax Reminders</p>
                <p className="text-white/40 text-xs mt-1">Quarterly tax payment due date reminders</p>
              </div>
              <Switch
                checked={notifications.email_tax_reminders}
                onCheckedChange={(checked) => 
                  setNotifications({ ...notifications, email_tax_reminders: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/5">
              <div>
                <p className="text-white text-sm font-medium">Platform Sync Notifications</p>
                <p className="text-white/40 text-xs mt-1">Get notified when data syncs complete</p>
              </div>
              <Switch
                checked={notifications.email_platform_sync}
                onCheckedChange={(checked) => 
                  setNotifications({ ...notifications, email_platform_sync: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/5">
              <div>
                <p className="text-white text-sm font-medium">AI Insights</p>
                <p className="text-white/40 text-xs mt-1">Receive AI-generated financial insights</p>
              </div>
              <Switch
                checked={notifications.email_insights}
                onCheckedChange={(checked) => 
                  setNotifications({ ...notifications, email_insights: checked })
                }
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}