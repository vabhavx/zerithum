import { Shield, Clock, TrendingUp } from "lucide-react";

export const PLANS = {
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

export const COMPARISON_FEATURES = [
  { name: "Unified revenue dashboard", free: true, pro: true, max: true },
  { name: "Platform connections", free: "2", pro: "5", max: "Unlimited" },
  { name: "Reconciliation and payout matching", free: false, pro: true, max: true },
  { name: "Anomaly alerts", free: false, pro: true, max: true },
  { name: "Tax export", free: "Manual", pro: "Automated", max: "Automated" },
  { name: "Forecasting", free: "Coming soon", pro: true, max: true },
  { name: "Support level", free: "Community", pro: "Email", max: "Priority" }
];

export const FAQS = [
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

export const VALUE_BLOCKS = [
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
