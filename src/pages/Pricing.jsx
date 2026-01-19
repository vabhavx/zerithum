import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, ChevronDown, ChevronUp, Shield, Clock, TrendingUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const PLANS = {
  monthly: [
    {
      name: "Free",
      price: 0,
      period: "month",
      badge: null,
      bestFor: "Getting organized",
      features: [
        "Unified dashboard for connected platforms",
        "Basic revenue tracking",
        "Manual exports"
      ],
      limits: "Up to 2 connected platforms",
      cta: "Start free",
      popular: false
    },
    {
      name: "Creator Pro",
      price: 49,
      period: "month",
      badge: "Most popular",
      bestFor: "Serious creators",
      features: [
        "Automatic revenue sync across platforms",
        "Bank deposit matching and reconciliation alerts",
        "Tax categories + export-ready reports"
      ],
      limits: "Up to 5 connected platforms",
      cta: "Upgrade to Pro",
      popular: true
    },
    {
      name: "Creator Max",
      price: 199,
      period: "month",
      badge: null,
      bestFor: "Multi-brand operators",
      features: [
        "Unlimited platforms",
        "Advanced reconciliation controls and anomaly rules",
        "Priority support + accountant-ready exports"
      ],
      limits: "Unlimited platforms",
      cta: "Go Max",
      popular: false
    }
  ],
  annual: [
    {
      name: "Free",
      price: 0,
      period: "month",
      badge: null,
      bestFor: "Getting organized",
      features: [
        "Unified dashboard for connected platforms",
        "Basic revenue tracking",
        "Manual exports"
      ],
      limits: "Up to 2 connected platforms",
      cta: "Start free",
      popular: false
    },
    {
      name: "Creator Pro",
      price: 39,
      period: "month",
      originalPrice: 49,
      badge: "Most popular",
      bestFor: "Serious creators",
      features: [
        "Automatic revenue sync across platforms",
        "Bank deposit matching and reconciliation alerts",
        "Tax categories + export-ready reports"
      ],
      limits: "Up to 5 connected platforms",
      cta: "Upgrade to Pro",
      popular: true
    },
    {
      name: "Creator Max",
      price: 159,
      period: "month",
      originalPrice: 199,
      badge: null,
      bestFor: "Multi-brand operators",
      features: [
        "Unlimited platforms",
        "Advanced reconciliation controls and anomaly rules",
        "Priority support + accountant-ready exports"
      ],
      limits: "Unlimited platforms",
      cta: "Go Max",
      popular: false
    }
  ]
};

const COMPARISON_FEATURES = [
  { name: "Unified revenue dashboard", free: true, pro: true, max: true },
  { name: "Platform connections", free: "2", pro: "5", max: "Unlimited" },
  { name: "Reconciliation and payout matching", free: false, pro: true, max: true },
  { name: "Anomaly alerts", free: false, pro: true, max: true },
  { name: "Tax export", free: "Manual", pro: "Automated", max: "Automated" },
  { name: "Forecasting", free: "Coming soon", pro: true, max: true },
  { name: "Support level", free: "Community", pro: "Email", max: "Priority" }
];

const FAQS = [
  {
    question: "What does Zerithum connect to?",
    answer: "Zerithum connects to YouTube, Patreon, Stripe, Gumroad, Instagram, and TikTok. We're constantly adding new platform integrations based on creator demand."
  },
  {
    question: "How does reconciliation work?",
    answer: "Zerithum automatically matches your platform revenue to bank deposits, accounting for fees and hold periods. We flag discrepancies and provide detailed reports so you always know where your money is."
  },
  {
    question: "Do I need to connect my bank?",
    answer: "Bank connection is optional. It enables automatic reconciliation between platform earnings and actual deposits. You can use Zerithum for revenue tracking without connecting your bank."
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes! Cancel anytime with no questions asked. Your data remains accessible for 30 days after cancellation, and you can export everything before leaving."
  },
  {
    question: "Do you store my credentials?",
    answer: "No. We use OAuth for secure platform connections. Your credentials are never stored on our servers. All connections use encrypted tokens that you can revoke anytime."
  },
  {
    question: "When will more integrations launch?",
    answer: "We're actively working on Shopify, Substack, and Twitch integrations. Join our waitlist to get early access and vote on which platforms we add next."
  }
];

const VALUE_BLOCKS = [
  {
    title: "Reconciliation accuracy",
    description: "Advanced matching algorithms ensure your revenue and deposits align.",
    metric: "Target 95%+ match rate",
    icon: Shield
  },
  {
    title: "Time saved",
    description: "Automated sync and reconciliation eliminates manual spreadsheet work.",
    metric: "Save hours each month on payout tracking",
    icon: Clock
  },
  {
    title: "Clarity",
    description: "Complete visibility into gross revenue, platform fees, and net payouts.",
    metric: "See gross, fees, and net per platform",
    icon: TrendingUp
  }
];

export default function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState("monthly");
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.log('User not logged in');
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    // Check for payment status in URL
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success') {
      toast.success('Payment successful! Your subscription is now active.');
      window.history.replaceState({}, '', '/pricing');
    } else if (paymentStatus === 'cancelled') {
      toast.error('Payment cancelled. Please try again.');
      window.history.replaceState({}, '', '/pricing');
    }
  }, []);

  const trackEvent = (eventName, data = {}) => {
    // Track events using Base44 analytics
    console.log(`Event: ${eventName}`, data);
  };

  React.useEffect(() => {
    trackEvent("pricing_viewed");
  }, []);

  const handlePlanSelect = async (plan) => {
    trackEvent(`plan_selected_${plan.name.toLowerCase().replace(" ", "_")}`);
    
    if (plan.price === 0) {
      // Free plan - redirect to dashboard
      window.location.href = '/';
      return;
    }

    if (!user) {
      toast.error('Please log in to subscribe');
      base44.auth.redirectToLogin(window.location.pathname);
      return;
    }

    setProcessingPayment(plan.name);

    try {
      const response = await base44.functions.invoke('createSkydoPayment', {
        planName: plan.name,
        amount: plan.price,
        currency: 'USD',
        billingPeriod: billingPeriod
      });

      if (response.data.success && response.data.payment_url) {
        // Redirect to Skydo payment page
        window.location.href = response.data.payment_url;
      } else {
        throw new Error('Failed to create payment link');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment. Please try again.');
      setProcessingPayment(null);
    }
  };

  const handleCTA = (ctaType) => {
    trackEvent(`cta_${ctaType}_clicked`);
  };

  const plans = PLANS[billingPeriod];

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
              One dashboard for creator revenue,<br />payouts, and reconciliation
            </h1>
            <p className="text-lg md:text-xl text-white/60 max-w-3xl mx-auto leading-relaxed">
              Connect YouTube, Patreon, Gumroad, Stripe, and more. Zerithum pulls revenue automatically, 
              matches it to deposits, flags anomalies, and exports tax-ready reports.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button
                size="lg"
                onClick={() => handlePlanSelect(plans[0])}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-lg px-8 h-14 rounded-xl hover:from-indigo-600 hover:to-purple-700 w-full sm:w-auto"
              >
                Start free
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => handleCTA("book_demo")}
                className="border-white/20 text-white hover:bg-white/5 text-lg px-8 h-14 rounded-xl w-full sm:w-auto"
              >
                Book a demo
              </Button>
            </div>
            <p className="text-sm text-white/40 pt-2">
              Secure payments powered by Skydo • Cancel anytime • No card required for Free
            </p>
          </motion.div>
        </div>
      </section>

      {/* Plan Toggle */}
      <section className="py-8 px-6">
        <div className="max-w-7xl mx-auto flex justify-center">
          <div className="inline-flex items-center gap-3 p-1.5 rounded-xl bg-white/5 border border-white/10">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={cn(
                "px-6 py-2.5 rounded-lg text-sm font-medium transition-all",
                billingPeriod === "monthly"
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:text-white/80"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={cn(
                "px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                billingPeriod === "annual"
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:text-white/80"
              )}
            >
              Annual
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "card-modern rounded-2xl p-8 relative",
                plan.popular && "ring-2 ring-indigo-500/50"
              )}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold">
                    {plan.badge}
                  </span>
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-sm text-white/50">{plan.bestFor}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <NumberFlow
                    value={plan.price}
                    format={{
                      style: "currency",
                      currency: "USD",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }}
                    transformTiming={{
                      duration: 500,
                      easing: "ease-out",
                    }}
                    willChange
                    className="text-5xl font-bold text-white"
                  />
                  <span className="text-white/40">/{plan.period}</span>
                </div>
                {plan.originalPrice && (
                  <div className="text-sm text-white/40 line-through mt-1">
                    ${plan.originalPrice}/month
                  </div>
                )}
              </div>

              <Button
                onClick={() => handlePlanSelect(plan)}
                disabled={processingPayment === plan.name}
                className={cn(
                  "w-full mb-6 h-12 rounded-xl",
                  plan.popular
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700"
                    : "bg-white/5 text-white hover:bg-white/10 border border-white/10"
                )}
              >
                {processingPayment === plan.name ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  plan.cta
                )}
              </Button>

              <div className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-white/70">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-white/5">
                <p className="text-xs text-white/40">{plan.limits}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-16 px-6 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Compare plans
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4 text-white/60 font-medium text-sm">Feature</th>
                  <th className="text-center py-4 px-4 text-white font-semibold">Free</th>
                  <th className="text-center py-4 px-4 text-white font-semibold bg-indigo-500/5 rounded-t-xl">
                    Creator Pro
                  </th>
                  <th className="text-center py-4 px-4 text-white font-semibold">Creator Max</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_FEATURES.map((feature, index) => (
                  <tr key={index} className="border-b border-white/5">
                    <td className="py-4 px-4 text-white/70 text-sm">{feature.name}</td>
                    <td className="py-4 px-4 text-center">
                      {typeof feature.free === "boolean" ? (
                        feature.free ? (
                          <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                        ) : (
                          <span className="text-white/20">—</span>
                        )
                      ) : (
                        <span className="text-sm text-white/50">{feature.free}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center bg-indigo-500/5">
                      {typeof feature.pro === "boolean" ? (
                        feature.pro ? (
                          <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                        ) : (
                          <span className="text-white/20">—</span>
                        )
                      ) : (
                        <span className="text-sm text-white/50">{feature.pro}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {typeof feature.max === "boolean" ? (
                        feature.max ? (
                          <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                        ) : (
                          <span className="text-white/20">—</span>
                        )
                      ) : (
                        <span className="text-sm text-white/50">{feature.max}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Why Zerithum */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Why Zerithum
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {VALUE_BLOCKS.map((block, index) => {
              const Icon = block.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="card-modern rounded-2xl p-8"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center mb-6">
                    <Icon className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{block.title}</h3>
                  <p className="text-white/60 mb-4">{block.description}</p>
                  <p className="text-sm font-semibold text-indigo-400">{block.metric}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 bg-white/[0.02]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Frequently asked questions
          </h2>
          
          <div className="space-y-4">
            {FAQS.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card-modern rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-white font-medium pr-4">{faq.question}</span>
                  {expandedFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-white/40 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white/40 flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-5 text-white/60 text-sm leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-modern rounded-2xl p-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Stop guessing where your money went
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                onClick={() => handlePlanSelect(plans[0])}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-lg px-8 h-14 rounded-xl hover:from-indigo-600 hover:to-purple-700 w-full sm:w-auto"
              >
                Start free
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => handleCTA("book_demo")}
                className="border-white/20 text-white hover:bg-white/5 text-lg px-8 h-14 rounded-xl w-full sm:w-auto"
              >
                Book a demo
              </Button>
            </div>
            <p className="text-xs text-white/30 mt-4">
              Powered by Skydo secure payment gateway
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69589d721ccc18cb36d43903/c4bbf87fd_image.png" 
                alt="Zerithum"
                className="h-7 w-auto object-contain"
              />
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <a href="/pricing" className="text-white/50 hover:text-white transition-colors">Pricing</a>
              <a href="#" className="text-white/50 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-white/50 hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-white/50 hover:text-white transition-colors">Refund Policy</a>
              <a href="mailto:support@zerithum.com" className="text-white/50 hover:text-white transition-colors">
                support@zerithum.com
              </a>
            </div>
          </div>
          <div className="text-center mt-8 text-sm text-white/30">
            © {new Date().getFullYear()} Zerithum. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}