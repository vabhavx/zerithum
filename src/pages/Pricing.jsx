import React, { useState } from "react";
import { Check, Shield, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PLANS = {
  monthly: [
    {
      name: "Free",
      price: 0,
      features: ["Unified dashboard", "2 platforms", "Manual exports"],
      cta: "Start Free",
      popular: false
    },
    {
      name: "Creator Pro",
      price: 49,
      features: ["All platforms", "Auto-reconciliation", "Tax categorization", "Audit logs"],
      cta: "Upgrade",
      popular: true
    },
    {
      name: "Enterprise",
      price: 199,
      features: ["Unlimited platforms", "Priority Support", "API Access", "SLA"],
      cta: "Contact Sales",
      popular: false
    }
  ]
};

export default function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState("monthly");
  const plans = PLANS[billingPeriod];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="py-20 text-center border-b border-border">
          <h1 className="text-4xl md:text-5xl font-serif mb-4">Transparent Pricing</h1>
          <p className="text-muted-foreground font-mono">INVEST IN YOUR FINANCIAL INFRASTRUCTURE</p>
      </div>

      {/* Pricing Table */}
      <div className="max-w-6xl mx-auto py-16 px-6">
          <div className="grid md:grid-cols-3 gap-px bg-border border border-border">
              {plans.map((plan, index) => (
                  <div key={index} className={cn("bg-background p-8 flex flex-col", plan.popular && "bg-muted/5 relative")}>
                      {plan.popular && (
                          <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 uppercase tracking-widest">
                              Recommended
                          </div>
                      )}
                      <h3 className="text-xl font-serif font-bold mb-2">{plan.name}</h3>
                      <div className="text-4xl font-mono mb-1 font-medium">${plan.price}</div>
                      <div className="text-xs text-muted-foreground mb-8 uppercase tracking-wider">Per Month</div>

                      <ul className="flex-1 space-y-4 mb-8">
                          {plan.features.map((feature, i) => (
                              <li key={i} className="flex items-start gap-3 text-sm">
                                  <Check className="w-4 h-4 text-primary mt-0.5" />
                                  <span>{feature}</span>
                              </li>
                          ))}
                      </ul>

                      <Button className={cn("w-full rounded-none h-12 uppercase tracking-widest font-mono text-xs", plan.popular ? "bg-foreground text-background hover:bg-foreground/90" : "bg-transparent border border-foreground text-foreground hover:bg-foreground hover:text-background")}>
                          {plan.cta}
                      </Button>
                  </div>
              ))}
          </div>
      </div>

      {/* Feature Grid */}
      <div className="max-w-6xl mx-auto pb-20 px-6">
          <div className="grid md:grid-cols-3 gap-8">
              {[
                  { title: "Audit Grade", desc: "99.9% reconciliation accuracy or we refund your subscription.", icon: Shield },
                  { title: "Time Reclaimed", desc: "Save 15+ hours per month on manual spreadsheet entry.", icon: Clock },
                  { title: "Revenue Clarity", desc: "See exactly how much you lose to fees and holds.", icon: TrendingUp }
              ].map((item, i) => (
                  <div key={i} className="border border-border p-6">
                      <item.icon className="w-6 h-6 mb-4 text-muted-foreground" />
                      <h3 className="font-serif font-bold text-lg mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
}
