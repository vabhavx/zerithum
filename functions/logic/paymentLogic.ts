export interface PlanDetails {
  name: string;
  price: number;
  currency: string;
  period: string;
}

type Plan = { name: string; price: number };
type Plans = { [key: string]: Plan[] };

const PLANS: Plans = {
  monthly: [
    { name: "Free", price: 0 },
    { name: "Creator Pro", price: 49 },
    { name: "Creator Max", price: 199 }
  ],
  annual: [
    { name: "Free", price: 0 },
    { name: "Creator Pro", price: 39 },
    { name: "Creator Max", price: 159 }
  ]
};

export function getPlanDetails(planName: string, billingPeriod: string = 'monthly'): PlanDetails {
  if (!['monthly', 'annual'].includes(billingPeriod)) {
    throw new Error('Invalid billing period');
  }

  const periodPlans = PLANS[billingPeriod];
  const plan = periodPlans.find((p) => p.name === planName);

  if (!plan) {
    throw new Error('Invalid plan name');
  }

  return {
    name: plan.name,
    price: plan.price,
    currency: 'USD',
    period: 'month'
  };
}
