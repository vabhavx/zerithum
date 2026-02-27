import { describe, it, expect } from 'vitest';
import { getPlanDetails } from '../logic/paymentLogic';

describe('paymentLogic', () => {
  describe('getPlanDetails', () => {
    // Happy paths
    it('should return correct details for Free monthly plan', () => {
      const result = getPlanDetails('Free', 'monthly');
      expect(result).toEqual({ price: 0, currency: 'USD' });
    });

    it('should return correct details for Creator Pro monthly plan', () => {
      const result = getPlanDetails('Creator Pro', 'monthly');
      expect(result).toEqual({ price: 49, currency: 'USD' });
    });

    it('should return correct details for Creator Max monthly plan', () => {
      const result = getPlanDetails('Creator Max', 'monthly');
      expect(result).toEqual({ price: 199, currency: 'USD' });
    });

    it('should return correct details for Free annual plan', () => {
      const result = getPlanDetails('Free', 'annual');
      expect(result).toEqual({ price: 0, currency: 'USD' });
    });

    it('should return correct details for Creator Pro annual plan', () => {
      const result = getPlanDetails('Creator Pro', 'annual');
      expect(result).toEqual({ price: 39, currency: 'USD' });
    });

    it('should return correct details for Creator Max annual plan', () => {
      const result = getPlanDetails('Creator Max', 'annual');
      expect(result).toEqual({ price: 159, currency: 'USD' });
    });

    // Error cases
    it('should throw error for invalid billing period', () => {
      expect(() => getPlanDetails('Free', 'weekly')).toThrow('Invalid billing period: weekly');
    });

    it('should throw error for invalid plan name', () => {
      expect(() => getPlanDetails('Enterprise', 'monthly')).toThrow('Invalid plan name: Enterprise');
    });

    it('should be case sensitive for plan name', () => {
      expect(() => getPlanDetails('free', 'monthly')).toThrow('Invalid plan name: free');
    });

    it('should be case sensitive for billing period', () => {
      expect(() => getPlanDetails('Free', 'Monthly')).toThrow('Invalid billing period: Monthly');
    });
  });
});
