export interface Plan {
  name: string;
  price: number;
  period: string;
}

const PLANS: Record<string, Plan[]> = {
  monthly: [
    { name: "Free", price: 0, period: "month" },
    { name: "Creator Pro", price: 49, period: "month" },
    { name: "Creator Max", price: 199, period: "month" }
  ],
  annual: [
    { name: "Free", price: 0, period: "month" },
    { name: "Creator Pro", price: 39, period: "month" },
    { name: "Creator Max", price: 159, period: "month" }
  ]
};

export function getPlanDetails(planName: string, billingPeriod: string): { price: number; currency: string } {
  const periodPlans = PLANS[billingPeriod];

  if (!periodPlans) {
    throw new Error(`Invalid billing period: ${billingPeriod}`);
  }

  const plan = periodPlans.find(p => p.name === planName);

  if (!plan) {
    throw new Error(`Invalid plan name: ${planName}`);
  }

  return {
    price: plan.price,
    currency: 'USD'
  };
}
