
export const PLANS = {
  monthly: [
    {
      name: "Free",
      price: 0,
      currency: "USD",
      period: "month",
    },
    {
      name: "Creator Pro",
      price: 49,
      currency: "USD",
      period: "month",
    },
    {
      name: "Creator Max",
      price: 199,
      currency: "USD",
      period: "month",
    }
  ],
  annual: [
    {
      name: "Free",
      price: 0,
      currency: "USD",
      period: "month",
    },
    {
      name: "Creator Pro",
      price: 39,
      currency: "USD",
      period: "month",
    },
    {
      name: "Creator Max",
      price: 159,
      currency: "USD",
      period: "month",
    }
  ]
};

export function getPlanDetails(planName: string, billingPeriod: string) {
  if (!PLANS[billingPeriod]) {
    throw new Error(`Invalid billing period: ${billingPeriod}`);
  }

  const plan = PLANS[billingPeriod].find((p: any) => p.name === planName);

  if (!plan) {
    throw new Error(`Invalid plan name: ${planName}`);
  }

  return plan;
}
