import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  User, 
  Settings,
  Bell, 
  Shield,
  Database,
  Link2,
  Save,
  Loader2,
  LogOut,
  Trash2,
  Check,
  AlertTriangle,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
  const [activeTab, setActiveTab] = useState("general");

  // --- Data Fetching ---
  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: connectedPlatforms = [] } = useQuery({
    queryKey: ["connectedPlatforms"],
    queryFn: () => base44.entities.ConnectedPlatform.list("-connected_at"),
  });

  // --- Local Preferences State ---
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem("user_preferences");
    return saved ? JSON.parse(saved) : {
      currency: "USD",
      dateFormat: "MMM d, yyyy",
      density: "comfortable",
      widgets: {
        revenue: true,
        transactions: true,
      }
    };
  });

  useEffect(() => {
    localStorage.setItem("user_preferences", JSON.stringify(preferences));
  }, [preferences]);

  // --- Form State ---
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
      });
    }
  }, [user]);

  // --- Mutations ---
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

  // --- Handlers ---
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

  const handleExportData = () => {
    const data = {
      user,
      connectedPlatforms,
      preferences,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zerithum-export-${format(new Date(), "yyyy-MM-dd")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Data export started");
  };

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-white/30" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-10">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-indigo-500/20">
            {user?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{user?.full_name || "User Profile"}</h1>
            <div className="flex items-center gap-2 text-white/40 text-sm mt-1">
              <span>{user?.email}</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="capitalize">{user?.role || "Member"}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/60">
             Member since {user?.created_date ? format(new Date(user.created_date), 'MMM yyyy') : 'N/A'}
           </div>
        </div>
      </motion.div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="bg-white/5 border border-white/10 p-1 h-auto flex-nowrap w-max md:w-full justify-start md:justify-start gap-1">
            <TabsTrigger value="general" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white px-4 py-2 h-9">
              <User className="w-4 h-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="integrations" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white px-4 py-2 h-9">
              <Link2 className="w-4 h-4 mr-2" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="preferences" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white px-4 py-2 h-9">
              <Settings className="w-4 h-4 mr-2" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white px-4 py-2 h-9">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white px-4 py-2 h-9">
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="data" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white px-4 py-2 h-9">
              <Database className="w-4 h-4 mr-2" />
              Data Zone
            </TabsTrigger>
          </TabsList>
        </div>

        {/* --- Tab Content: General --- */}
        <TabsContent value="general" className="mt-0">
          <div className="grid gap-6 max-w-2xl">
            <Card className="bg-transparent border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Personal Information</CardTitle>
                <CardDescription className="text-white/40">Manage your public profile details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white/60">Full Name</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60">Email Address</Label>
                  <Input
                    value={formData.email}
                    disabled
                    className="bg-white/[0.02] border-white/5 text-white/40 cursor-not-allowed"
                  />
                  <p className="text-xs text-white/30">Contact support to change your email</p>
                </div>
              </CardContent>
              <CardFooter className="border-t border-white/5 pt-6">
                <Button
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                  className="ml-auto bg-indigo-500 hover:bg-indigo-600 text-white"
                >
                  {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* --- Tab Content: Integrations --- */}
        <TabsContent value="integrations" className="mt-0">
          <div className="grid gap-6 max-w-2xl">
            <Card className="bg-transparent border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Connected Platforms</CardTitle>
                <CardDescription className="text-white/40">Manage your revenue sources and data syncs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {connectedPlatforms.length === 0 ? (
                  <div className="text-center py-8 rounded-lg border border-dashed border-white/10">
                    <p className="text-white/40 text-sm">No platforms connected yet</p>
                    <Button variant="link" className="text-indigo-400 mt-2">Connect a Platform</Button>
                  </div>
                ) : (
                  connectedPlatforms.map((platform) => (
                    <div
                      key={platform.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                          <Link2 className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">
                            {PLATFORM_NAMES[platform.platform] || platform.platform}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={cn(
                              "w-2 h-2 rounded-full",
                              platform.sync_status === "active" ? "bg-emerald-500" : "bg-amber-500"
                            )} />
                            <p className="text-white/40 text-xs">
                              {platform.sync_status === "active" ? "Syncing Active" : platform.sync_status}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDisconnect(platform)}
                        className="text-white/40 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- Tab Content: Preferences --- */}
        <TabsContent value="preferences" className="mt-0">
          <div className="grid gap-6 max-w-2xl">
            <Card className="bg-transparent border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Regional Settings</CardTitle>
                <CardDescription className="text-white/40">Customize how data is displayed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white/60">Currency Display</Label>
                    <Select
                      value={preferences.currency}
                      onValueChange={(val) => setPreferences({...preferences, currency: val})}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="JPY">JPY (¥)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/60">Date Format</Label>
                    <Select
                      value={preferences.dateFormat}
                      onValueChange={(val) => setPreferences({...preferences, dateFormat: val})}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MMM d, yyyy">Oct 24, 2023</SelectItem>
                        <SelectItem value="dd/MM/yyyy">24/10/2023</SelectItem>
                        <SelectItem value="yyyy-MM-dd">2023-10-24</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-transparent border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Interface Customization</CardTitle>
                <CardDescription className="text-white/40">Adjust the look and feel of your dashboard</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-white">Information Density</Label>
                    <p className="text-white/40 text-xs">Compact view shows more data on screen</p>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
                    <button
                      onClick={() => setPreferences({...preferences, density: "comfortable"})}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                        preferences.density === "comfortable" ? "bg-indigo-500 text-white shadow-sm" : "text-white/40 hover:text-white"
                      )}
                    >
                      Comfortable
                    </button>
                    <button
                      onClick={() => setPreferences({...preferences, density: "compact"})}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                        preferences.density === "compact" ? "bg-indigo-500 text-white shadow-sm" : "text-white/40 hover:text-white"
                      )}
                    >
                      Compact
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-white/60 block mb-2">Visible Dashboard Widgets</Label>
                  {Object.entries(preferences.widgets).map(([key, enabled]) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                      <span className="text-sm text-white capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <Switch
                        checked={enabled}
                        onCheckedChange={(checked) => setPreferences({
                          ...preferences,
                          widgets: { ...preferences.widgets, [key]: checked }
                        })}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- Tab Content: Notifications --- */}
        <TabsContent value="notifications" className="mt-0">
          <div className="grid gap-6 max-w-2xl">
            <Card className="bg-transparent border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Email Preferences</CardTitle>
                <CardDescription className="text-white/40">Manage what emails you receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* These are placeholders for the actual state connection, simulating 'Full Freedom' */}
                {['Weekly Reports', 'Tax Reminders', 'Platform Sync', 'Product Updates'].map((item) => (
                  <div key={item} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="text-sm text-white">{item}</span>
                    <Switch defaultChecked />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- Tab Content: Security --- */}
        <TabsContent value="security" className="mt-0">
          <div className="grid gap-6 max-w-2xl">
            <Card className="bg-transparent border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Authentication</CardTitle>
                <CardDescription className="text-white/40">Manage your login methods</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                      <span className="text-black font-bold text-xs">G</span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Google Account</p>
                      <p className="text-white/40 text-xs">Connected as {user?.email}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="bg-transparent border-white/10 text-white/60" disabled>
                    Connected
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-transparent border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Active Sessions</CardTitle>
                <CardDescription className="text-white/40">Manage devices logged into your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <div>
                      <p className="text-white text-sm font-medium">Current Session</p>
                      <p className="text-emerald-400/60 text-xs">Chrome on macOS · Now</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5 opacity-60">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-white/20" />
                    <div>
                      <p className="text-white text-sm font-medium">iPhone 13</p>
                      <p className="text-white/40 text-xs">Safari on iOS · 2 days ago</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-500/10 h-8">
                    Revoke
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- Tab Content: Data Zone --- */}
        <TabsContent value="data" className="mt-0">
          <div className="grid gap-6 max-w-2xl">
             <Card className="bg-transparent border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Your Data</CardTitle>
                <CardDescription className="text-white/40">Export your personal data and history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/5">
                  <div className="space-y-1">
                    <p className="text-white font-medium text-sm">Export Data Archive</p>
                    <p className="text-white/40 text-xs">Download a JSON copy of your profile, settings, and platform links.</p>
                  </div>
                  <Button onClick={handleExportData} variant="outline" className="bg-transparent border-white/10 text-white hover:bg-white/5">
                    <Download className="w-4 h-4 mr-2" />
                    Export JSON
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-500/5 border-red-500/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <CardTitle className="text-red-500">Danger Zone</CardTitle>
                </div>
                <CardDescription className="text-red-500/60">Irreversible account actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-white font-medium text-sm">Delete Account</p>
                    <p className="text-white/40 text-xs">Permanently remove your account and all associated data.</p>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20 border">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-[#0A0A0A] border-white/10 text-white">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-white/60">
                          This action cannot be undone. This will permanently delete your
                          account and remove your data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/5">Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => toast.error("Account deletion requested (Mock)")}>
                          Delete Account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}