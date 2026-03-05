import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/supabaseClient";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const PLANS = {
  monthly: [
    {
      name: "Starter",
      id: "starter",
      price: 9,
      bestFor: "Solo creators starting out",
      limit: "Up to 3 connected platforms",
      features: [
        "Unified revenue dashboard",
        "Basic transaction and expense tracking",
        "Manual exports",
        "Email support",
      ],
      cta: "Get Starter",
      featured: false,
    },
    {
      name: "Pro",
      id: "pro",
      price: 20,
      bestFor: "For serious creators who refuse to leave money on the table",
      limit: "Up to 5 connected platforms",
      features: [
        "Automated platform sync",
        "Reconciliation alerts",
        "Tax estimator and accountant-ready exports",
        "AI-powered insights",
        "Dedicated primary customer support",
        "White-glove onboarding & setup",
        "Exclusive community access",
      ],
      cta: "Get Pro",
      featured: true,
    },
  ],
};

const COMPARISON = [
  { label: "Connected platforms", starter: "3", pro: "5" },
  { label: "Reconciliation", starter: "Basic", pro: "Advanced" },
  { label: "Anomaly alerts", starter: "No", pro: "Yes" },
  { label: "Tax exports", starter: "Manual", pro: "Automated" },
  { label: "AI insights", starter: "No", pro: "Yes" },
  { label: "Support", starter: "Email", pro: "Priority" },
];

const FAQS = [
  { question: "Can I start with a free trial?", answer: "We don't offer a free tier, but you can cancel anytime within the first billing cycle." },
  { question: "Can I cancel anytime?", answer: "Yes. You can cancel whenever you want. Your access continues until the end of the billing period." },
  { question: "Do you store my platform passwords?", answer: "No. Connections use OAuth or secure tokens. You can revoke access from the source platform at any time." },
  { question: "What payment methods are accepted?", answer: "We accept payments through PayPal. You can use any payment method linked to your PayPal account." },
  { question: "Can I switch plans?", answer: "Yes. You can upgrade or downgrade at any time from the Billing page." },
];

function PlanCard({ plan, user, onSelect, processingPayment }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!user) {
      toast.error("Please sign in before subscribing");
      base44.auth.redirectToLogin(window.location.pathname);
      return;
    }
    navigate("/Billing");
  };

  return (
    <div className={`flex flex-col p-6 h-full rounded-xl border transition-all duration-300 bg-white ${plan.featured ? "border-gray-900 ring-1 ring-gray-900 shadow-lg" : "border-gray-200"}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
          <p className="mt-1 text-sm text-gray-500 leading-relaxed min-h-[40px]">{plan.bestFor}</p>
        </div>
        {plan.featured && (
          <motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-medium text-white">
            Recommended
          </motion.span>
        )}
      </div>
      <div className="mb-6">
        <div className="flex items-end gap-2">
          <p className="font-mono-financial text-4xl font-bold text-gray-900 tracking-tight">${plan.price}</p>
          <p className="pb-1.5 text-sm text-gray-400 font-medium">/month</p>
        </div>
        <p className="mt-1.5 text-xs text-gray-400 font-medium tracking-wide uppercase">Billed monthly via PayPal</p>
      </div>
      <div className="mb-6 rounded-lg border border-gray-100 bg-gray-50 px-4 py-2.5">
        <p className="text-sm font-medium text-gray-600 text-center">{plan.limit}</p>
      </div>
      <ul className="mb-8 space-y-3 flex-grow">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm text-gray-600">
            <div className="mt-0.5 rounded-full bg-emerald-50 p-0.5 flex-shrink-0">
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <span className="leading-tight">{feature}</span>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        onClick={handleClick}
        className={`h-11 w-full text-sm font-medium transition-all duration-200 ${plan.featured
          ? "bg-indigo-600 text-white hover:bg-indigo-700"
          : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
          }`}
      >
        {plan.cta}
      </Button>
    </div>
  );
}

export default function Pricing() {
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const plans = PLANS.monthly;

  return (
    <div className="min-h-screen py-12 lg:py-20 bg-white">
      <div className="mx-auto w-full max-w-[1000px] px-4 sm:px-6 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 md:text-5xl lg:text-6xl mb-4">Pricing</h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-500">Simple, transparent pricing for your creative business. Powered by PayPal.</p>
        </motion.div>

        <div className="mb-20 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          <AnimatePresence mode="wait">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 + 0.2 }}
                className="h-full"
              >
                <PlanCard plan={plan} user={user} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Feature Comparison */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }} className="mb-16">
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50 p-6">
              <h2 className="text-lg font-semibold text-gray-900">Feature Comparison</h2>
              <p className="mt-1 text-sm text-gray-500">A detailed look at what's included.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left bg-gray-50">
                    <th className="px-6 py-4 font-medium text-gray-400 uppercase tracking-wider text-xs">Feature</th>
                    <th className="px-6 py-4 font-medium text-gray-900">Starter ($9)</th>
                    <th className="px-6 py-4 font-semibold text-gray-900">Pro ($20)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {COMPARISON.map((row) => (
                    <tr key={row.label} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-600 font-medium">{row.label}</td>
                      <td className="px-6 py-4 text-gray-400">{row.starter}</td>
                      <td className="px-6 py-4 text-gray-900 font-medium">{row.pro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* FAQs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }}>
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 bg-gray-50 p-6">
              <h2 className="text-lg font-semibold text-gray-900">Frequently Asked Questions</h2>
              <p className="mt-1 text-sm text-gray-500">Common questions about billing and subscriptions.</p>
            </div>
            <div className="divide-y divide-gray-100">
              {FAQS.map((faq, index) => {
                const open = expandedFaq === index;
                return (
                  <div key={faq.question}>
                    <button
                      type="button"
                      onClick={() => setExpandedFaq(open ? null : index)}
                      className="flex w-full items-center justify-between gap-4 p-6 text-left transition-colors hover:bg-gray-50"
                    >
                      <span className="text-sm font-medium text-gray-900">{faq.question}</span>
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180 text-gray-900" : ""}`} />
                    </button>
                    <AnimatePresence>
                      {open && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-6 pt-0 text-sm text-gray-500 leading-relaxed">{faq.answer}</div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
