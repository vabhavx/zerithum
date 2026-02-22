import { describe, it, expect } from 'vitest';
import {
  clamp,
  toNonNegativeNumber,
  formatCurrency,
  formatPercent,
  calculateProgressiveTax,
  getQuarterSchedule,
  getConfidenceLabel,
  getConfidenceTone,
  getUncertaintyBand,
} from './taxUtils';

describe('taxUtils', () => {
  describe('clamp', () => {
    it('should clamp value between min and max', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('toNonNegativeNumber', () => {
    it('should parse valid numbers', () => {
      expect(toNonNegativeNumber('123')).toBe(123);
      expect(toNonNegativeNumber(123)).toBe(123);
    });

    it('should return 0 for negative numbers', () => {
      expect(toNonNegativeNumber('-123')).toBe(0);
      expect(toNonNegativeNumber(-123)).toBe(0);
    });

    it('should return 0 for invalid inputs', () => {
      expect(toNonNegativeNumber('abc')).toBe(0);
      expect(toNonNegativeNumber(null)).toBe(0);
      expect(toNonNegativeNumber(undefined)).toBe(0);
    });
  });

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      // Intl.NumberFormat might behave slightly differently across environments (spaces), so we check essential parts
      const result = formatCurrency(1234.56);
      expect(result).toContain('1,234.56');
      expect(result).toContain('$');
    });

    it('should handle 0', () => {
        const result = formatCurrency(0);
        expect(result).toContain('0.00');
    });
  });

  describe('formatPercent', () => {
    it('should format percentage correctly', () => {
      expect(formatPercent(0.1234)).toBe('12.34%');
    });

    it('should handle 0', () => {
      expect(formatPercent(0)).toBe('0.00%');
    });
  });

  describe('calculateProgressiveTax', () => {
    const brackets = [
      { upTo: 10000, rate: 0.1 },
      { upTo: 20000, rate: 0.2 },
      { upTo: Infinity, rate: 0.3 },
    ];

    it('should return 0 for 0 or negative income', () => {
      expect(calculateProgressiveTax(0, brackets)).toBe(0);
      expect(calculateProgressiveTax(-100, brackets)).toBe(0);
    });

    it('should calculate tax for first bracket', () => {
      // 5000 * 0.1 = 500
      expect(calculateProgressiveTax(5000, brackets)).toBe(500);
    });

    it('should calculate tax for second bracket', () => {
      // 10000 * 0.1 + 5000 * 0.2 = 1000 + 1000 = 2000
      expect(calculateProgressiveTax(15000, brackets)).toBe(2000);
    });

    it('should calculate tax for third bracket', () => {
      // 10000 * 0.1 + 10000 * 0.2 + 10000 * 0.3 = 1000 + 2000 + 3000 = 6000
      expect(calculateProgressiveTax(30000, brackets)).toBe(6000);
    });
  });

  describe('getQuarterSchedule', () => {
    it('should return correct schedule for a given year', () => {
      const year = 2023;
      const schedule = getQuarterSchedule(year);

      expect(schedule).toHaveLength(4);
      expect(schedule[0].id).toBe('q1');
      expect(schedule[0].period).toBe('Jan 1 - Mar 31, 2023');
      expect(schedule[0].dueDate).toEqual(new Date(2023, 3, 15)); // Apr 15

      expect(schedule[3].id).toBe('q4');
      expect(schedule[3].period).toBe('Sep 1 - Dec 31, 2023');
      expect(schedule[3].dueDate).toEqual(new Date(2024, 0, 15)); // Jan 15 next year
    });
  });

  describe('getConfidenceLabel', () => {
    it('should return correct labels', () => {
      expect(getConfidenceLabel(85)).toBe('High');
      expect(getConfidenceLabel(60)).toBe('Medium');
      expect(getConfidenceLabel(40)).toBe('Low');
    });
  });

  describe('getConfidenceTone', () => {
    it('should return correct color classes', () => {
      expect(getConfidenceTone(85)).toContain('text-[#56C5D0]');
      expect(getConfidenceTone(60)).toContain('text-[#F0A562]');
      expect(getConfidenceTone(40)).toContain('text-[#F06C6C]');
    });
  });

  describe('getUncertaintyBand', () => {
    it('should calculate uncertainty band correctly', () => {
      const result = getUncertaintyBand({
        confidenceScore: 80,
        daysHistory: 100,
        platformsConnected: 2,
        includeOtherIncome: false,
      });

      // (100 - 80) * 0.0006 = 20 * 0.0006 = 0.012
      // historyPenalty = 0 (100 > 90)
      // platformPenalty = 0 (2 > 0)
      // otherIncomePenalty = 0
      // 0.02 + 0.012 = 0.032
      expect(result).toBeCloseTo(0.032);
    });

    it('should apply penalties', () => {
       const result = getUncertaintyBand({
        confidenceScore: 40,
        daysHistory: 30,
        platformsConnected: 0,
        includeOtherIncome: true,
      });
      // (100 - 40) * 0.0006 = 0.036
      // historyPenalty = 0.015
      // platformPenalty = 0.01
      // otherIncomePenalty = 0.006
      // 0.02 + 0.036 + 0.015 + 0.01 + 0.006 = 0.087
      expect(result).toBeCloseTo(0.087);
    });

    it('should clamp result between 0.02 and 0.12', () => {
        const resultLow = getUncertaintyBand({
            confidenceScore: 100,
            daysHistory: 100,
            platformsConnected: 2,
            includeOtherIncome: false,
        });
        // 0.02 + 0 = 0.02
        expect(resultLow).toBe(0.02);

        // Hypothetical very bad score
         const resultHigh = getUncertaintyBand({
            confidenceScore: 0,
            daysHistory: 0,
            platformsConnected: 0,
            includeOtherIncome: true,
        });
        // 0.02 + 0.06 + 0.015 + 0.01 + 0.006 = 0.111
        // Wait, max is 0.12. Let's make it go over.
        // Actually 0.111 is < 0.12.
        // Let's modify penalties manually to test clamp max if possible?
        // Logic: clamp(0.02 + ..., 0.02, 0.12).
        // Max possible: 0.02 + (100*0.0006 = 0.06) + 0.015 + 0.01 + 0.006 = 0.111.
        // It seems 0.12 is unreachable with current constants?
        // 0.02 + 0.06 = 0.08. + 0.031 = 0.111.
        // It seems the max clamp is effectively unused but safe.
        expect(resultHigh).toBeCloseTo(0.111);
    });
  });
});
