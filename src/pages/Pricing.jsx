import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Loader2, Calculator, TrendingUp, Clock, DollarSign } from "lucide-react";
import { base44 } from "@/api/supabaseClient";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PLANS = {
  monthly: [
    {
      name: "Free",
      price: 0,
      bestFor: "Solo creators starting out",
      limit: "Up to 2 connected platforms",
      features: [
        "Unified revenue dashboard",
        "Basic transaction and expense tracking",
        "Manual exports",
      ],
      cta: "Start free",
      featured: false,
    },
    {
      name: "Creator Pro",
      price: 49,
      bestFor: "Creators running a serious business",
      limit: "Up to 5 connected platforms",
      features: [
        "Automated platform sync",
        "Reconciliation alerts",
        "Tax estimator and accountant-ready exports",
      ],
      cta: "Upgrade to Pro",
      featured: true,
    },
    {
      name: "Creator Max",
      price: 199,
      bestFor: "Teams with multiple brands",
      limit: "Unlimited platforms",
      features: [
        "Unlimited connections",
        "Advanced anomaly controls",
        "Priority support",
      ],
      cta: "Upgrade to Max",
      featured: false,
    },
  ],
  annual: [
    {
      name: "Free",
      price: 0,
      bestFor: "Solo creators starting out",
      limit: "Up to 2 connected platforms",
      features: [
        "Unified revenue dashboard",
        "Basic transaction and expense tracking",
        "Manual exports",
      ],
      cta: "Start free",
      featured: false,
    },
    {
      name: "Creator Pro",
      price: 39,
      strikePrice: 49,
      bestFor: "Creators running a serious business",
      limit: "Up to 5 connected platforms",
      features: [
        "Automated platform sync",
        "Reconciliation alerts",
        "Tax estimator and accountant-ready exports",
      ],
      cta: "Upgrade to Pro",
      featured: true,
    },
    {
      name: "Creator Max",
      price: 159,
      strikePrice: 199,
      bestFor: "Teams with multiple brands",
      limit: "Unlimited platforms",
      features: [
        "Unlimited connections",
        "Advanced anomaly controls",
        "Priority support",
      ],
      cta: "Upgrade to Max",
      featured: false,
    },
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
  {
    question: "Can I start for free?",
    answer:
      "Yes. The Free plan does not require a card and is a good way to set up your workflow before upgrading.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. You can cancel whenever you want. Your data remains available for export during your access window.",
  },
  {
    question: "Do you store my platform passwords?",
    answer:
      "No. Connections use OAuth or secure tokens. You can revoke access from the source platform at any time.",
  },
  {
    question: "What does annual billing change?",
    answer:
      "Annual billing reduces monthly cost while keeping the same feature set.",
  },
];

function estimateBestPlan(monthlyRevenue) {
  if (monthlyRevenue < 3000) return "Free";
  if (monthlyRevenue < 25000) return "Creator Pro";
  return "Creator Max";
}

function PlanCard({ plan, billingPeriod, processingPayment, onSelect, isRecommended }) {
  return (
    <div
      className={`rounded-xl border p-5 transition ${
        isRecommended
          ? "border-[#56C5D0]/50 bg-[#56C5D0]/12"
          : plan.featured
            ? "border-[#56C5D0]/40 bg-[#56C5D0]/8"
            : "border-white/10 bg-[#111114]"
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-[#F5F5F5]">{plan.name}</h3>
          <p className="mt-1 text-sm text-white/70">{plan.bestFor}</p>
        </div>
        {isRecommended && (
          <span className="rounded-md border border-[#56C5D0]/45 bg-[#56C5D0]/15 px-2 py-1 text-xs text-[#56C5D0]">
            Recommended
          </span>
        )}
      </div>

      <div className="mb-4">
        <div className="flex items-end gap-2">
          <p className="font-mono-financial text-3xl font-semibold text-[#F5F5F5]">${plan.price}</p>
          <p className="pb-1 text-sm text-white/60">/month</p>
          {plan.strikePrice && (
            <p className="pb-1 text-sm text-white/45 line-through">${plan.strikePrice}</p>
          )}
        </div>
        <p className="mt-1 text-xs text-white/60">
          {billingPeriod === "annual" ? "Billed annually" : "Billed monthly"}
        </p>
      </div>

      <p className="mb-4 rounded-md border border-white/10 bg-[#15151A] px-3 py-2 text-sm text-white/75">
        {plan.limit}
      </p>

      <ul className="mb-5 space-y-2">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-white/80">
            <Check className="mt-0.5 h-4 w-4 text-[#56C5D0]" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        type="button"
        onClick={() => onSelect(plan)}
        disabled={processingPayment === plan.name}
        className={`h-9 w-full ${
          isRecommended || plan.featured
            ? "bg-[#56C5D0] text-[#0A0A0A] hover:bg-[#48AAB5]"
            : "bg-white/10 text-[#F5F5F5] hover:bg-white/15"
        }`}
      >
        {processingPayment === plan.name ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing
          </>
        ) : (
          plan.cta
        )}
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
  const [viewMode, setViewMode] = useState("plans");

  // ROI Calculator State
  const [adminHours, setAdminHours] = useState(5);
  const [hourlyRate, setHourlyRate] = useState(50);
  const [accountantCost, setAccountantCost] = useState(250);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch {
        setUser(null);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");

    if (payment === "success") {
      toast.success("Payment completed successfully");
      window.history.replaceState({}, "", "/pricing");
    }

    if (payment === "cancelled") {
      toast.error("Payment was cancelled");
      window.history.replaceState({}, "", "/pricing");
    }
  }, []);

  // Smart Defaults Logic
  useEffect(() => {
    // Estimate hourly rate based on revenue (assuming ~2000 work hours/year)
    const estimatedHourlyRate = Math.max(20, Math.round((monthlyRevenue * 12) / 2000));
    setHourlyRate(estimatedHourlyRate);

    // Estimate admin burden based on scale
    if (monthlyRevenue < 5000) setAdminHours(3);
    else if (monthlyRevenue < 20000) setAdminHours(6);
    else setAdminHours(12);

    // Estimate accountant cost
    if (monthlyRevenue < 5000) setAccountantCost(0);
    else if (monthlyRevenue < 20000) setAccountantCost(150);
    else setAccountantCost(500);
  }, [monthlyRevenue]);

  const handlePlanSelect = async (plan) => {
    if (plan.price === 0) {
      window.location.href = "/";
      return;
    }

    if (!user) {
      toast.error("Please sign in before subscribing");
      base44.auth.redirectToLogin(window.location.pathname);
      return;
    }

    setProcessingPayment(plan.name);

    try {
      const response = await base44.functions.invoke("createSkydoPayment", {
        planName: plan.name,
        amount: plan.price,
        currency: "USD",
        billingPeriod,
      });

      if (!response?.data?.success || !response?.data?.payment_url) {
        throw new Error("Invalid payment response");
      }

      window.location.href = response.data.payment_url;
    } catch {
      toast.error("Could not start payment. Please try again.");
      setProcessingPayment(null);
    }
  };

  const plans = PLANS[billingPeriod];
  const recommendation = useMemo(() => estimateBestPlan(monthlyRevenue), [monthlyRevenue]);
  const recommendedPlanObj = plans.find((p) => p.name === recommendation);

  const roiMetrics = useMemo(() => {
    // Zerithum efficiency assumption: reduces manual work by 85%
    const hoursSavedPerMonth = adminHours * 4.33 * 0.85;
    const valueOfTimeSaved = hoursSavedPerMonth * hourlyRate;
    const totalMonthlyBenefit = valueOfTimeSaved + accountantCost;

    // Cost of the recommended plan
    const cost = recommendedPlanObj ? recommendedPlanObj.price : 0;

    // ROI Calculation
    const netBenefit = totalMonthlyBenefit - cost;
    const roiMultiplier = cost > 0 ? (netBenefit / cost) * 100 : 0; // %
    const annualBenefit = netBenefit * 12;

    // Chart Data Generation (Cumulative over 12 months)
    const chartData = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      return {
        month: `M${month}`,
        investment: cost * month,
        return: totalMonthlyBenefit * month,
        net: (totalMonthlyBenefit - cost) * month,
      };
    });

    return {
      hoursSavedPerMonth: Math.round(hoursSavedPerMonth),
      valueOfTimeSaved: Math.round(valueOfTimeSaved),
      totalMonthlyBenefit: Math.round(totalMonthlyBenefit),
      netBenefit: Math.round(netBenefit),
      roiMultiplier: Math.round(roiMultiplier),
      annualBenefit: Math.round(annualBenefit),
      chartData,
      cost,
    };
  }, [adminHours, hourlyRate, accountantCost, recommendedPlanObj]);

  return (
    <div className="mx-auto w-full max-w-[1400px] rounded-2xl border border-white/10 bg-[#0A0A0A] p-6 lg:p-8">
      <header className="mb-8 border-b border-white/10 pb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-[#F5F5F5]">Pricing</h1>
        <p className="mt-2 max-w-3xl text-sm text-white/70">
          Interactive pricing with recommendation controls so creators can choose confidently.
        </p>
      </header>

      <section className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-white/10 bg-[#111114] p-1">
          <button
            type="button"
            onClick={() => setBillingPeriod("monthly")}
            className={`h-8 rounded-md px-4 text-sm transition ${
              billingPeriod === "monthly"
                ? "bg-white/15 text-[#F5F5F5]"
                : "text-white/60 hover:text-[#F5F5F5]"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingPeriod("annual")}
            className={`h-8 rounded-md px-4 text-sm transition ${
              billingPeriod === "annual"
                ? "bg-white/15 text-[#F5F5F5]"
                : "text-white/60 hover:text-[#F5F5F5]"
            }`}
          >
            Annual (save)
          </button>
        </div>

        <div className="inline-flex rounded-lg border border-white/10 bg-[#111114] p-1">
          <button
            type="button"
            onClick={() => setViewMode("plans")}
            className={`h-8 rounded-md px-3 text-sm transition ${
              viewMode === "plans"
                ? "bg-white/15 text-[#F5F5F5]"
                : "text-white/60 hover:text-[#F5F5F5]"
            }`}
          >
            Plan view
          </button>
          <button
            type="button"
            onClick={() => setViewMode("calculator")}
            className={`flex items-center gap-2 h-8 rounded-md px-3 text-sm transition ${
              viewMode === "calculator"
                ? "bg-white/15 text-[#F5F5F5]"
                : "text-white/60 hover:text-[#F5F5F5]"
            }`}
          >
            <Calculator className="h-3.5 w-3.5" />
            ROI calculator
          </button>
        </div>
      </section>

      <section className="mb-8 rounded-xl border border-white/10 bg-[#111114] p-4">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#F5F5F5]">Monthly creator revenue estimate</p>
            <p className="text-xs text-white/60">Used only to suggest the most practical plan for your scale.</p>
          </div>
          <p className="font-mono-financial text-xl font-semibold text-[#56C5D0]">
            ${monthlyRevenue.toLocaleString()}
          </p>
        </div>
        <input
          type="range"
          min={500}
          max={100000}
          step={500}
          value={monthlyRevenue}
          onChange={(event) => setMonthlyRevenue(Number(event.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-[#56C5D0]"
        />
        <p className="mt-2 text-xs text-white/70">
          Suggested plan: <span className="font-medium text-[#56C5D0]">{recommendation}</span>
        </p>
      </section>

      {viewMode === "plans" && (
        <section className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.name}
              plan={plan}
              billingPeriod={billingPeriod}
              processingPayment={processingPayment}
              onSelect={handlePlanSelect}
              isRecommended={plan.name === recommendation}
            />
          ))}
        </section>
      )}

      {viewMode === "calculator" && (
        <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-12 animate-in fade-in zoom-in-95 duration-300">
          {/* Left Column: Inputs */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-xl border border-white/10 bg-[#111114] p-5">
              <div className="mb-4 flex items-center gap-2 text-[#56C5D0]">
                <Clock className="h-5 w-5" />
                <h3 className="font-semibold text-[#F5F5F5]">Time Investment</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="mb-2 flex justify-between">
                    <label className="text-sm text-white/70">Admin hours / week</label>
                    <span className="font-mono text-sm text-[#F5F5F5]">{adminHours}h</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={40}
                    step={1}
                    value={adminHours}
                    onChange={(e) => setAdminHours(Number(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-[#56C5D0]"
                  />
                  <p className="mt-1 text-xs text-white/50">Time spent on invoices, categorization, and spreadhseets.</p>
                </div>

                <div>
                  <div className="mb-2 flex justify-between">
                    <label className="text-sm text-white/70">Hourly Value</label>
                    <span className="font-mono text-sm text-[#F5F5F5]">${hourlyRate}/hr</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={500}
                    step={10}
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-[#56C5D0]"
                  />
                  <p className="mt-1 text-xs text-white/50">What is your time worth?</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#111114] p-5">
              <div className="mb-4 flex items-center gap-2 text-[#56C5D0]">
                <DollarSign className="h-5 w-5" />
                <h3 className="font-semibold text-[#F5F5F5]">Hard Costs</h3>
              </div>

              <div>
                <div className="mb-2 flex justify-between">
                  <label className="text-sm text-white/70">Accountant / Bookkeeper (monthly)</label>
                  <span className="font-mono text-sm text-[#F5F5F5]">${accountantCost}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={2000}
                  step={50}
                  value={accountantCost}
                  onChange={(e) => setAccountantCost(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-[#56C5D0]"
                />
                <p className="mt-1 text-xs text-white/50">Savings from automated categorization and exports.</p>
              </div>
            </div>
          </div>

          {/* Right Column: Results & Visualization */}
          <div className="lg:col-span-8 space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-[#15151A] p-4">
                <p className="text-sm font-medium text-white/60">Annual Value Unlocked</p>
                <p className="mt-2 font-mono-financial text-2xl font-bold text-[#56C5D0]">
                  ${roiMetrics.annualBenefit.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-white/50">Net benefit after subscription cost</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#15151A] p-4">
                <p className="text-sm font-medium text-white/60">Hours Reclaimed / Year</p>
                <p className="mt-2 font-mono-financial text-2xl font-bold text-[#F5F5F5]">
                  {(roiMetrics.hoursSavedPerMonth * 12).toLocaleString()}h
                </p>
                <p className="mt-1 text-xs text-white/50">~{roiMetrics.hoursSavedPerMonth} hours/month</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#15151A] p-4">
                <p className="text-sm font-medium text-white/60">ROI Multiplier</p>
                <p className="mt-2 font-mono-financial text-2xl font-bold text-[#56C5D0]">
                  {roiMetrics.roiMultiplier.toLocaleString()}%
                </p>
                <p className="mt-1 text-xs text-white/50">Return on {recommendedPlanObj?.name}</p>
              </div>
            </div>

            {/* Chart */}
            <div className="h-[350px] w-full rounded-xl border border-white/10 bg-[#111114] p-4">
              <div className="mb-6 flex items-center justify-between">
                 <h3 className="font-semibold text-[#F5F5F5] flex items-center gap-2">
                   <TrendingUp className="h-4 w-4 text-[#56C5D0]" />
                   Cumulative Value vs. Cost
                 </h3>
                 <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-[#56C5D0]" />
                      <span className="text-white/70">Value Generated</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-red-500/50" />
                      <span className="text-white/70">Cost</span>
                    </div>
                 </div>
              </div>

              <ResponsiveContainer width="100%" height="85%">
                <AreaChart data={roiMetrics.chartData}>
                  <defs>
                    <linearGradient id="colorReturn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#56C5D0" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#56C5D0" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="#666"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#666"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value, name) => [
                      `$${value.toLocaleString()}`,
                      name === 'return' ? 'Total Value' : name === 'investment' ? 'Cost' : 'Net'
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="return"
                    stroke="#56C5D0"
                    fillOpacity={1}
                    fill="url(#colorReturn)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="investment"
                    stroke="#ef4444"
                    fillOpacity={1}
                    fill="url(#colorCost)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      <section className="mb-8 rounded-xl border border-white/10 bg-[#111114]">
        <div className="border-b border-white/10 p-4">
          <h2 className="text-lg font-semibold text-[#F5F5F5]">Feature comparison</h2>
          <p className="mt-1 text-sm text-white/70">Straight comparison of what each plan includes.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="px-4 py-3 font-medium text-white/75">Feature</th>
                <th className="px-4 py-3 font-medium text-white/75">Free</th>
                <th className="px-4 py-3 font-medium text-white/75">Pro</th>
                <th className="px-4 py-3 font-medium text-white/75">Max</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.label} className="border-b border-white/10 last:border-0">
                  <td className="px-4 py-3 text-white/85">{row.label}</td>
                  <td className="px-4 py-3 text-white/70">{row.free}</td>
                  <td className="px-4 py-3 text-white/70">{row.pro}</td>
                  <td className="px-4 py-3 text-white/70">{row.max}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-[#111114]">
        <div className="border-b border-white/10 p-4">
          <h2 className="text-lg font-semibold text-[#F5F5F5]">Frequently asked questions</h2>
          <p className="mt-1 text-sm text-white/70">Clear answers for common buying decisions.</p>
        </div>

        <div className="divide-y divide-white/10">
          {FAQS.map((faq, index) => {
            const open = expandedFaq === index;
            return (
              <div key={faq.question} className="p-4">
                <button
                  type="button"
                  onClick={() => setExpandedFaq(open ? null : index)}
                  className="flex w-full items-center justify-between gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#56C5D0]"
                >
                  <span className="text-sm font-medium text-[#F5F5F5]">{faq.question}</span>
                  <ChevronDown className={`h-4 w-4 text-white/60 transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
                {open && <p className="mt-3 text-sm text-white/75">{faq.answer}</p>}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
