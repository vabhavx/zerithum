import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { base44 } from "@/api/supabaseClient";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const PLANS = {
  monthly: [
    { name: "Free", price: 0, bestFor: "Solo creators starting out", limit: "Up to 2 connected platforms", features: ["Unified revenue dashboard", "Basic transaction and expense tracking", "Manual exports"], cta: "Start free", featured: false },
    { name: "Creator Pro", price: 49, bestFor: "Creators running a serious business", limit: "Up to 5 connected platforms", features: ["Automated platform sync", "Reconciliation alerts", "Tax estimator and accountant-ready exports"], cta: "Upgrade to Pro", featured: true },
    { name: "Creator Max", price: 199, bestFor: "Teams with multiple brands", limit: "Unlimited platforms", features: ["Unlimited connections", "Advanced anomaly controls", "Priority support"], cta: "Upgrade to Max", featured: false },
  ],
  annual: [
    { name: "Free", price: 0, bestFor: "Solo creators starting out", limit: "Up to 2 connected platforms", features: ["Unified revenue dashboard", "Basic transaction and expense tracking", "Manual exports"], cta: "Start free", featured: false },
    { name: "Creator Pro", price: 39, strikePrice: 49, bestFor: "Creators running a serious business", limit: "Up to 5 connected platforms", features: ["Automated platform sync", "Reconciliation alerts", "Tax estimator and accountant-ready exports"], cta: "Upgrade to Pro", featured: true },
    { name: "Creator Max", price: 159, strikePrice: 199, bestFor: "Teams with multiple brands", limit: "Unlimited platforms", features: ["Unlimited connections", "Advanced anomaly controls", "Priority support"], cta: "Upgrade to Max", featured: false },
  ],
};

const COMPARISON = [
  { label: "Connected platforms", free: "2", pro: "5", max: "Unlimited" },
  { label: "Reconciliation", free: "Basic", pro: "Advanced", max: "Advanced" },
  { label: "Anomaly alerts", free: "No", pro: "Yes", max: "Yes" },
  { label: "Tax exports", free: "Manual", pro: "Automated", max: "Automated" },
  { label: "Support", free: "Community", pro: "Email", max: "Priority" },
];

const FAQS = [
  { question: "Can I start for free?", answer: "Yes. The Free plan does not require a card and is a good way to set up your workflow before upgrading." },
  { question: "Can I cancel anytime?", answer: "Yes. You can cancel whenever you want. Your data remains available for export during your access window." },
  { question: "Do you store my platform passwords?", answer: "No. Connections use OAuth or secure tokens. You can revoke access from the source platform at any time." },
  { question: "What does annual billing change?", answer: "Annual billing reduces monthly cost while keeping the same feature set." },
];

function estimateBestPlan(monthlyRevenue) {
  if (monthlyRevenue < 3000) return "Free";
  if (monthlyRevenue < 25000) return "Creator Pro";
  return "Creator Max";
}

function PlanCard({ plan, billingPeriod, processingPayment, onSelect, isRecommended }) {
  return (
    <div className={`flex flex-col p-6 h-full rounded-xl border transition-all duration-300 bg-white ${isRecommended ? "border-gray-900 ring-1 ring-gray-900 shadow-lg" : plan.featured ? "border-gray-300 shadow-md" : "border-gray-200"}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
          <p className="mt-1 text-sm text-gray-500 leading-relaxed min-h-[40px]">{plan.bestFor}</p>
        </div>
        {isRecommended && (
          <motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-medium text-white">Recommended</motion.span>
        )}
      </div>
      <div className="mb-6">
        <div className="flex items-end gap-2">
          <p className="font-mono-financial text-4xl font-bold text-gray-900 tracking-tight">${plan.price}</p>
          <p className="pb-1.5 text-sm text-gray-400 font-medium">/month</p>
          {plan.strikePrice && (<p className="pb-1.5 text-sm text-gray-300 line-through">${plan.strikePrice}</p>)}
        </div>
        <p className="mt-1.5 text-xs text-gray-400 font-medium tracking-wide uppercase">{billingPeriod === "annual" ? "Billed annually" : "Billed monthly"}</p>
      </div>
      <div className="mb-6 rounded-lg border border-gray-100 bg-gray-50 px-4 py-2.5"><p className="text-sm font-medium text-gray-600 text-center">{plan.limit}</p></div>
      <ul className="mb-8 space-y-3 flex-grow">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm text-gray-600">
            <div className="mt-0.5 rounded-full bg-emerald-50 p-0.5 flex-shrink-0"><Check className="h-3.5 w-3.5 text-emerald-600" /></div>
            <span className="leading-tight">{feature}</span>
          </li>
        ))}
      </ul>
      <Button type="button" onClick={() => onSelect(plan)} disabled={processingPayment === plan.name} className={`h-11 w-full text-sm font-medium transition-all duration-200 ${isRecommended || plan.featured ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"}`}>
        {processingPayment === plan.name ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing</>) : plan.cta}
      </Button>
    </div>
  );
}

export default function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState("monthly");
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(null);
  const [user, setUser] = useState(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState(10000);

  useEffect(() => { const loadUser = async () => { try { const currentUser = await base44.auth.me(); setUser(currentUser); } catch { setUser(null); } }; loadUser(); }, []);
  useEffect(() => { const params = new URLSearchParams(window.location.search); const payment = params.get("payment"); if (payment === "success") { toast.success("Payment completed successfully"); window.history.replaceState({}, "", "/pricing"); } if (payment === "cancelled") { toast.error("Payment was cancelled"); window.history.replaceState({}, "", "/pricing"); } }, []);

  const handlePlanSelect = async (plan) => {
    if (plan.price === 0) { window.location.href = "/"; return; }
    if (!user) { toast.error("Please sign in before subscribing"); base44.auth.redirectToLogin(window.location.pathname); return; }
    setProcessingPayment(plan.name);
    try {
      const response = await base44.functions.invoke("createSkydoPayment", { planName: plan.name, amount: plan.price, currency: "USD", billingPeriod });
      if (!response?.data?.success || !response?.data?.payment_url) throw new Error("Invalid payment response");
      window.location.href = response.data.payment_url;
    } catch { toast.error("Could not start payment. Please try again."); setProcessingPayment(null); }
  };

  const plans = PLANS[billingPeriod];
  const recommendation = useMemo(() => estimateBestPlan(monthlyRevenue), [monthlyRevenue]);

  return (
    <div className="min-h-screen py-12 lg:py-20 bg-white">
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 md:text-5xl lg:text-6xl mb-4">Pricing</h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-500">Transparent pricing that scales with your creative business. No hidden fees.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="mb-16 flex flex-col items-center gap-8">
          <div className="relative inline-flex h-12 items-center rounded-full bg-gray-100 p-1">
            <div className={`absolute h-10 w-32 rounded-full bg-indigo-600 transition-all duration-300 ease-spring ${billingPeriod === "monthly" ? "left-1" : "left-[132px]"}`} />
            <button type="button" onClick={() => setBillingPeriod("monthly")} className={`relative z-10 w-32 h-full rounded-full text-sm font-medium transition-colors duration-200 ${billingPeriod === "monthly" ? "text-white" : "text-gray-500 hover:text-gray-700"}`}>Monthly</button>
            <button type="button" onClick={() => setBillingPeriod("annual")} className={`relative z-10 w-32 h-full rounded-full text-sm font-medium transition-colors duration-200 ${billingPeriod === "annual" ? "text-white" : "text-gray-500 hover:text-gray-700"}`}>Annual (save)</button>
          </div>

          <div className="w-full max-w-xl rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-end justify-between">
              <div><label className="text-sm font-medium text-gray-900">Monthly Revenue Estimate</label><p className="text-xs text-gray-400 mt-1">Slide to see our recommendation for your scale</p></div>
              <p className="font-mono-financial text-2xl font-bold text-gray-900">${monthlyRevenue.toLocaleString()}</p>
            </div>
            <input type="range" min={500} max={100000} step={500} value={monthlyRevenue} onChange={(e) => setMonthlyRevenue(Number(e.target.value))} className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-100 accent-gray-900 hover:bg-gray-200 transition-colors" />
            <div className="mt-2 flex justify-between text-xs text-gray-300 font-mono"><span>$500</span><span>$100k+</span></div>
          </div>
        </motion.div>

        <div className="mb-20 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          <AnimatePresence mode="wait">
            {plans.map((plan, index) => (
              <motion.div key={`${plan.name}-${billingPeriod}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.1 + 0.2 }} className="h-full">
                <PlanCard plan={plan} billingPeriod={billingPeriod} processingPayment={processingPayment} onSelect={handlePlanSelect} isRecommended={plan.name === recommendation} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }} className="mb-16">
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50 p-6"><h2 className="text-lg font-semibold text-gray-900">Feature Comparison</h2><p className="mt-1 text-sm text-gray-500">A detailed look at what's included.</p></div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead><tr className="border-b border-gray-100 text-left bg-gray-50"><th className="px-6 py-4 font-medium text-gray-400 uppercase tracking-wider text-xs">Feature</th><th className="px-6 py-4 font-medium text-gray-900">Free</th><th className="px-6 py-4 font-semibold text-gray-900">Pro</th><th className="px-6 py-4 font-medium text-gray-900">Max</th></tr></thead>
                <tbody className="divide-y divide-gray-100">{COMPARISON.map((row) => (<tr key={row.label} className="hover:bg-gray-50 transition-colors"><td className="px-6 py-4 text-gray-600 font-medium">{row.label}</td><td className="px-6 py-4 text-gray-400">{row.free}</td><td className="px-6 py-4 text-gray-900 font-medium">{row.pro}</td><td className="px-6 py-4 text-gray-400">{row.max}</td></tr>))}</tbody>
              </table>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }}>
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 bg-gray-50 p-6"><h2 className="text-lg font-semibold text-gray-900">Frequently Asked Questions</h2><p className="mt-1 text-sm text-gray-500">Common questions about billing and subscriptions.</p></div>
            <div className="divide-y divide-gray-100">
              {FAQS.map((faq, index) => {
                const open = expandedFaq === index;
                return (
                  <div key={faq.question}>
                    <button type="button" onClick={() => setExpandedFaq(open ? null : index)} className="flex w-full items-center justify-between gap-4 p-6 text-left transition-colors hover:bg-gray-50">
                      <span className="text-sm font-medium text-gray-900">{faq.question}</span>
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180 text-gray-900" : ""}`} />
                    </button>
                    <AnimatePresence>{open && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden"><div className="px-6 pb-6 pt-0 text-sm text-gray-500 leading-relaxed">{faq.answer}</div></motion.div>)}</AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
