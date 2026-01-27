
export const PLANS: Record<string, Record<string, number>> = {
  monthly: {
    "Free": 0,
    "Creator Pro": 49,
    "Creator Max": 199
  },
  annual: {
    "Free": 0,
    "Creator Pro": 39,
    "Creator Max": 159
  }
};

export interface PlanDetails {
  amount: number;
  currency: string;
  description: string;
}

export function getPlanDetails(planName: string, billingPeriod: string): PlanDetails {
  const periodPlans = PLANS[billingPeriod];
  if (!periodPlans) {
    throw new Error(`Invalid billing period: ${billingPeriod}`);
  }

  const price = periodPlans[planName];
  if (price === undefined) {
    throw new Error(`Invalid plan name: ${planName}`);
  }

  // Ensure amount is valid (non-negative)
  if (price < 0) {
    throw new Error('Invalid price configuration');
  }

  return {
    amount: price,
    currency: 'USD',
    description: `${planName} - ${billingPeriod} subscription`
  };
}
