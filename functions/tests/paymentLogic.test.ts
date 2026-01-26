import { describe, it, expect } from 'vitest';
import { getPlanDetails } from '../logic/paymentLogic';

describe('getPlanDetails', () => {
  it('should return correct details for monthly Creator Pro', () => {
    const details = getPlanDetails('Creator Pro', 'monthly');
    expect(details).toEqual({
      name: 'Creator Pro',
      price: 49,
      currency: 'USD',
      period: 'month'
    });
  });

  it('should return correct details for annual Creator Pro', () => {
    const details = getPlanDetails('Creator Pro', 'annual');
    expect(details).toEqual({
      name: 'Creator Pro',
      price: 39,
      currency: 'USD',
      period: 'month'
    });
  });

  it('should return correct details for monthly Creator Max', () => {
    const details = getPlanDetails('Creator Max', 'monthly');
    expect(details).toEqual({
      name: 'Creator Max',
      price: 199,
      currency: 'USD',
      period: 'month'
    });
  });

  it('should return correct details for annual Creator Max', () => {
    const details = getPlanDetails('Creator Max', 'annual');
    expect(details).toEqual({
      name: 'Creator Max',
      price: 159,
      currency: 'USD',
      period: 'month'
    });
  });

  it('should throw error for invalid billing period', () => {
    expect(() => getPlanDetails('Creator Pro', 'daily')).toThrow('Invalid billing period');
  });

  it('should throw error for invalid plan name', () => {
    expect(() => getPlanDetails('Super Pro', 'monthly')).toThrow('Invalid plan name');
  });

  it('should default to monthly if billing period is missing', () => {
    const details = getPlanDetails('Creator Pro');
    expect(details).toEqual({
      name: 'Creator Pro',
      price: 49,
      currency: 'USD',
      period: 'month'
    });
  });
});
