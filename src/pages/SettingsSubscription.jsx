import React, { useState, useEffect } from "react";
import { base44 } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Crown } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function SettingsSubscription() {
  const [user, setUser] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error("User not authenticated");
    }
  };

  const plans = [
    {
      id: "free",
      name: "Free",
      price: "$0",
      period: "/month",
      description: "Perfect for getting started",
      features: [
        "2 platform connections",
        "30-day history",
        "Basic dashboard",
        "Email support",
      ],
      limitations: [
        "No reconciliation",
        "No tax export",
        "Limited analytics",
      ],
      cta: "Current Plan",
      color: "#5E5240",
      icon: null,
    },
    {
      id: "pro",
      name: "Creator Pro",
      price: "$49",
      period: "/month",
      annual: "$490/year (save $98)",
      description: "Most popular for serious creators",
      features: [
        "5 platform connections",
        "Unlimited history",
        "Bank reconciliation",
        "Tax exports (1099-K ready)",
        "AI insights",
        "Priority support",
        "Advanced analytics",
      ],
      limitations: [],
      cta: "Upgrade to Pro",
      color: "#208D9E",
      icon: Sparkles,
      popular: true,
    },
    {
      id: "max",
      name: "Creator Max",
      price: "$199",
      period: "/month",
      description: "Best for agencies & teams",
      features: [
        "Unlimited platforms",
        "White-label dashboard",
        "Accountant API access",
        "Multi-user access",
        "Custom integrations",
        "Dedicated support",
        "Quarterly tax planning",
      ],
      limitations: [],
      cta: "Upgrade to Max",
      color: "#C0152F",
      icon: Crown,
    },
  ];

  const handleUpgrade = (planId) => {
    // Mock upgrade flow
    toast({
      title: "Redirecting to Checkout",
      description: `Processing upgrade to ${planId}...`,
    });

    // In production, integrate with Stripe/Paddle
    setTimeout(() => {
      toast({
        title: "Upgrade Successful!",
        description: `You're now on ${planId} plan.`,
      });
    }, 2000);
  };

  const currentPlan = user?.plan_tier || "free";

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-[#5E5240] mb-2">Choose Your Plan</h1>
        <p className="text-[#5E5240]/60">Scale your creator business with the right tools</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = currentPlan === plan.id;
          const isUpgrade = currentPlan === "free" && plan.id !== "free";

          return (
            <div
              key={plan.id}
              className={`clay-card relative ${plan.popular ? "ring-2 ring-[#208D9E]" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-[#208D9E] text-white px-4 py-1 rounded-full text-xs font-semibold">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                {Icon && (
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center" style={{ background: `${plan.color}15` }}>
                    <Icon className="w-6 h-6" style={{ color: plan.color }} />
                  </div>
                )}
                <h3 className="text-xl font-bold text-[#5E5240] mb-1">{plan.name}</h3>
                <p className="text-xs text-[#5E5240]/60 mb-4">{plan.description}</p>
                <div className="mb-2">
                  <span className="text-4xl font-bold" style={{ color: plan.color }}>{plan.price}</span>
                  <span className="text-[#5E5240]/60">{plan.period}</span>
                </div>
                {plan.annual && (
                  <p className="text-xs text-[#208D9E] font-semibold">{plan.annual}</p>
                )}
              </div>

              <div className="space-y-3 mb-6">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#208D9E] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-[#5E5240]">{feature}</span>
                  </div>
                ))}
                {plan.limitations.map((limitation, idx) => (
                  <div key={idx} className="flex items-start gap-2 opacity-50">
                    <span className="text-sm text-[#5E5240]/60">✗ {limitation}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => handleUpgrade(plan.id)}
                disabled={isCurrent}
                className={`w-full ${
                  isCurrent
                    ? "bg-[#5E5240]/10 text-[#5E5240] cursor-not-allowed"
                    : isUpgrade || plan.id === "pro" || plan.id === "max"
                    ? "btn-primary"
                    : "btn-secondary"
                }`}
              >
                {isCurrent ? "Current Plan" : plan.cta}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Billing Info */}
      {user && currentPlan !== "free" && (
        <div className="clay-card max-w-2xl mx-auto">
          <h3 className="text-lg font-bold text-[#5E5240] mb-4">Billing Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-[#5E5240]/60">Current Plan:</span>
              <span className="font-semibold text-[#5E5240] capitalize">{currentPlan}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5E5240]/60">Next Billing Date:</span>
              <span className="font-semibold text-[#5E5240]">
                {user.subscription_expires || "Jan 15, 2026"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5E5240]/60">Payment Method:</span>
              <span className="font-semibold text-[#5E5240]">•••• 4242</span>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button className="btn-secondary">Update Payment Method</Button>
            <Button className="btn-secondary">View Invoice History</Button>
          </div>
        </div>
      )}
    </div>
  );
}