import React, { useState, useEffect } from "react";
import { base44 } from "@/api/supabaseClient";
import { 
  User, 
  Shield, 
  Bell,
  Save,
  Loader2,
  Check
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
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const SUBSCRIPTION_TIERS = {
  free: { 
    name: "Free Tier",
    price: "$0",
    features: ["Basic dashboard", "2 platforms"]
  },
  creator_pro: { 
    name: "Pro License",
    price: "$49",
    features: ["All platforms", "Audit Logs", "Priority support"],
  },
  creator_max: { 
    name: "Enterprise",
    price: "$199",
    features: ["API Access", "Custom Reports", "SLA"]
  }
};

export default function Settings() {
  const { toast } = useToast();
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
      await base44.auth.updateMe(formData);
      toast({ title: "Settings saved", description: "Your profile has been updated." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-serif text-foreground">System Configuration</h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">USER PREFERENCES & ACCESS CONTROL</p>
      </div>

      {/* Profile Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
              <h3 className="font-serif text-lg mb-2">Profile Information</h3>
              <p className="text-xs text-muted-foreground">Public facing details and identity management.</p>
          </div>
          <div className="md:col-span-2 space-y-6">
              <div className="space-y-2">
                  <Label className="text-xs font-mono uppercase tracking-wider">Full Name</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="rounded-none bg-background border-border"
                  />
              </div>
              <div className="space-y-2">
                  <Label className="text-xs font-mono uppercase tracking-wider">Email Address</Label>
                  <Input
                    value={user?.email || ""}
                    disabled
                    className="rounded-none bg-muted border-border"
                  />
              </div>
          </div>
      </div>

      <div className="border-t border-border"></div>

      {/* Subscription Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
          <div className="md:col-span-1">
              <h3 className="font-serif text-lg mb-2">Licensing</h3>
              <p className="text-xs text-muted-foreground">Manage your subscription tier.</p>
          </div>
          <div className="md:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => {
                    const isActive = formData.subscription_tier === key;
                    return (
                    <div
                        key={key}
                        onClick={() => setFormData({ ...formData, subscription_tier: key })}
                        className={cn(
                            "border p-4 cursor-pointer transition-colors",
                            isActive ? "border-primary bg-muted/20" : "border-border hover:border-primary/50"
                        )}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-serif font-bold">{tier.name}</span>
                            {isActive && <Check className="w-4 h-4 text-primary" />}
                        </div>
                        <div className="text-2xl font-mono mb-4">{tier.price}<span className="text-xs text-muted-foreground">/mo</span></div>
                        <ul className="space-y-1">
                            {tier.features.map(f => (
                                <li key={f} className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <div className="w-1 h-1 bg-muted-foreground rounded-full"></div> {f}
                                </li>
                            ))}
                        </ul>
                    </div>
                    );
                })}
              </div>
          </div>
      </div>

      <div className="border-t border-border"></div>

      {/* Notifications */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
          <div className="md:col-span-1">
              <h3 className="font-serif text-lg mb-2">Notifications</h3>
              <p className="text-xs text-muted-foreground">Alert preferences.</p>
          </div>
          <div className="md:col-span-2 space-y-6">
              <div className="flex items-center justify-between border border-border p-4">
                  <div>
                      <div className="font-medium text-sm">Email Alerts</div>
                      <div className="text-xs text-muted-foreground">Receive weekly summaries</div>
                  </div>
                  <Switch
                    checked={formData.notifications_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, notifications_enabled: checked })}
                  />
              </div>
          </div>
      </div>

      <div className="flex justify-end pt-8">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="rounded-none h-10 px-8"
        >
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
