import { describe, it, expect } from 'vitest';
import { getPlanDetails } from '../logic/paymentLogic';

describe('Payment Logic', () => {
  describe('getPlanDetails', () => {
    it('returns correct details for Monthly Free plan', () => {
      const details = getPlanDetails('Free', 'monthly');
      expect(details).toEqual({
        amount: 0,
        currency: 'USD',
        description: 'Free - monthly subscription'
      });
    });

    it('returns correct details for Monthly Creator Pro plan', () => {
      const details = getPlanDetails('Creator Pro', 'monthly');
      expect(details).toEqual({
        amount: 49,
        currency: 'USD',
        description: 'Creator Pro - monthly subscription'
      });
    });

    it('returns correct details for Annual Creator Pro plan', () => {
      const details = getPlanDetails('Creator Pro', 'annual');
      expect(details).toEqual({
        amount: 39,
        currency: 'USD',
        description: 'Creator Pro - annual subscription'
      });
    });

    it('throws error for invalid billing period', () => {
      expect(() => getPlanDetails('Free', 'weekly')).toThrow('Invalid billing period: weekly');
    });

    it('throws error for invalid plan name', () => {
      expect(() => getPlanDetails('Super Pro', 'monthly')).toThrow('Invalid plan name: Super Pro');
    });
  });
});
