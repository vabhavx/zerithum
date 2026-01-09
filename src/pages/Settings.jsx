import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { 
  User, 
  Shield, 
  Bell,
  Save,
  Loader2,
  Check,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SUBSCRIPTION_TIERS = {
  free: { 
    name: "Free", 
    price: "$0",
    period: "/month",
    features: ["Basic dashboard", "2 platforms", "Monthly exports"] 
  },
  creator_pro: { 
    name: "Creator Pro", 
    price: "$49",
    period: "/month",
    features: ["All platforms", "Weekly exports", "AI insights", "Priority support"],
    popular: true
  },
  creator_max: { 
    name: "Creator Max", 
    price: "$199",
    period: "/month",
    features: ["Everything in Pro", "API access", "Custom reports", "Dedicated support"] 
  }
};

export default function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    subscription_tier: "free",
    notifications_enabled: true,
    email_frequency: "weekly"
  });

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setFormData({
        full_name: currentUser.full_name || "",
        subscription_tier: currentUser.subscription_tier || "free",
        notifications_enabled: currentUser.notifications_enabled !== false,
        email_frequency: currentUser.email_frequency || "weekly"
      });
      setLoading(false);
    };
    loadUser();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({
        full_name: formData.full_name,
        subscription_tier: formData.subscription_tier,
        notifications_enabled: formData.notifications_enabled,
        email_frequency: formData.email_frequency
      });
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card-modern rounded-xl p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-white/30 mx-auto" />
          <p className="text-white/40 mt-4">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-white/40 mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile Section */}
      <div className="card-modern rounded-xl p-6 lg:p-8 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
            <User className="w-5 h-5 text-violet-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Profile</h2>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name" className="text-white/60 mb-2 block">Full Name</Label>
              <Input
                id="name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30"
                placeholder="Your name"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-white/60 mb-2 block">Email</Label>
              <Input
                id="email"
                value={user?.email || ""}
                disabled
                className="rounded-xl bg-white/5 border-white/10 text-white/40"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Authentication Section */}
      <div className="card-modern rounded-xl p-6 lg:p-8 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Authentication</h2>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-white/40 mb-4">
            Connect additional login methods for faster access
          </p>
          
          <div className="rounded-xl p-4 flex items-center justify-between bg-white/[0.02] border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-white/20">
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div>
                <p className="font-medium text-white">Google</p>
                <p className="text-sm text-white/40">Sign in with your Google account</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="rounded-xl border-white/10 text-white/70 hover:bg-white/5"
              onClick={() => base44.auth.redirectToLogin()}
            >
              Connect
            </Button>
          </div>

          <div className="rounded-xl p-4 flex items-center justify-between bg-white/[0.02] border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#FF424D] flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <div>
                <p className="font-medium text-white">Patreon</p>
                <p className="text-sm text-white/40">Sign in with your Patreon account</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="rounded-xl border-white/10 text-white/70 hover:bg-white/5"
              onClick={() => base44.auth.redirectToLogin()}
            >
              Connect
            </Button>
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="card-modern rounded-xl p-6 lg:p-8 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-white/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-amber-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Notifications</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl p-4 bg-white/[0.02] border border-white/10">
            <div>
              <p className="font-medium text-white">Email Notifications</p>
              <p className="text-sm text-white/40">Receive updates about your revenue</p>
            </div>
            <Switch
              checked={formData.notifications_enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, notifications_enabled: checked })}
            />
          </div>

          {formData.notifications_enabled && (
            <div>
              <Label className="text-white/60 mb-2 block">Email Frequency</Label>
              <Select 
                value={formData.email_frequency} 
                onValueChange={(value) => setFormData({ ...formData, email_frequency: value })}
              >
                <SelectTrigger className="rounded-xl bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily Digest</SelectItem>
                  <SelectItem value="weekly">Weekly Summary</SelectItem>
                  <SelectItem value="monthly">Monthly Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Subscription Section */}
      <div className="card-modern rounded-xl p-6 lg:p-8 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Subscription & Pricing</h2>
            <p className="text-white/40 text-xs">Choose the plan that fits your needs</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => {
            const isActive = formData.subscription_tier === key;
            const isPro = tier.popular;
            
            return (
              <div key={key} className="relative">
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <div className="px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold">
                      Popular
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setFormData({ ...formData, subscription_tier: key })}
                  className={cn(
                    "w-full rounded-xl p-5 text-left transition-all border",
                    isActive 
                      ? "bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-indigo-500/40 ring-2 ring-indigo-500/50" 
                      : "bg-white/[0.02] border-white/10 hover:bg-white/[0.04] hover:border-white/20",
                    isPro && "border-indigo-500/30"
                  )}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-white text-base mb-1">{tier.name}</h4>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-white">{tier.price}</span>
                        <span className="text-white/40 text-sm">{tier.period}</span>
                      </div>
                    </div>
                    {isActive && (
                      <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <ul className="space-y-2 mb-4">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="text-xs text-white/60 flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {!isActive && (
                    <div className={cn(
                      "text-xs font-medium text-center py-2 rounded-lg border",
                      isPro 
                        ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0"
                        : "bg-white/5 text-white/70 border-white/10"
                    )}>
                      {key === 'free' ? 'Current Plan' : 'Upgrade'}
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 px-8 hover:from-indigo-600 hover:to-purple-700"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}