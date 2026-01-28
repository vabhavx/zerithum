import { describe, it, expect } from 'vitest';
import { getPlanDetails } from '../logic/paymentLogic';

describe('getPlanDetails', () => {
  it('should return correct price for Creator Pro monthly', () => {
    const details = getPlanDetails('Creator Pro', 'monthly');
    expect(details.price).toBe(49);
    expect(details.currency).toBe('USD');
  });

  it('should return correct price for Creator Max annual', () => {
    const details = getPlanDetails('Creator Max', 'annual');
    expect(details.price).toBe(159);
    expect(details.currency).toBe('USD');
  });

  it('should throw error for invalid billing period', () => {
    expect(() => getPlanDetails('Creator Pro', 'daily')).toThrow('Invalid billing period: daily');
  });

  it('should throw error for invalid plan name', () => {
    expect(() => getPlanDetails('Super Plan', 'monthly')).toThrow('Invalid plan name: Super Plan');
  });

  it('should return 0 for Free plan', () => {
     const details = getPlanDetails('Free', 'monthly');
     expect(details.price).toBe(0);
  });
});
