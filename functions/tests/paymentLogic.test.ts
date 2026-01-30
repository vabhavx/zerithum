import { describe, it, expect } from 'vitest';
import { getPlanDetails } from '../logic/paymentLogic';

describe('getPlanDetails', () => {
  it('should return correct details for Creator Pro monthly', () => {
    const plan = getPlanDetails('Creator Pro', 'monthly');
    expect(plan).toEqual({
      name: "Creator Pro",
      price: 49,
      currency: "USD",
      period: "month",
    });
  });

  it('should return correct details for Creator Max annual', () => {
    const plan = getPlanDetails('Creator Max', 'annual');
    expect(plan).toEqual({
      name: "Creator Max",
      price: 159,
      currency: "USD",
      period: "month",
    });
  });

  it('should throw error for invalid billing period', () => {
    expect(() => getPlanDetails('Creator Pro', 'weekly')).toThrow('Invalid billing period: weekly');
  });

  it('should throw error for invalid plan name', () => {
    expect(() => getPlanDetails('Super Secret Plan', 'monthly')).toThrow('Invalid plan name: Super Secret Plan');
  });
});
