import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  validateData,
  validatePartial,
  createValidator,
  sanitizeString,
  sanitizeEmail,
  sanitizeCurrency,
  EmailSchema,
  PasswordSchema,
  CurrencySchema
} from './validation';

describe('Validation Utilities', () => {
  describe('validateData', () => {
    const testSchema = z.object({
      name: z.string().min(2, 'Name too short'),
      age: z.number().min(18, 'Must be an adult')
    });

    it('returns success and valid data for correct inputs', () => {
      const input = { name: 'Alice', age: 30 };
      const result = validateData(testSchema, input);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(input);
      expect(result.errors).toBeNull();
    });

    it('returns failure and formatted errors for incorrect inputs', () => {
      const input = { name: 'A', age: 16 };
      const result = validateData(testSchema, input);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.errors).toEqual({
        name: 'Name too short',
        age: 'Must be an adult'
      });
    });

    it('returns nested formatted errors correctly', () => {
      const nestedSchema = z.object({
        user: z.object({
          email: z.string().email('Invalid email')
        })
      });
      const input = { user: { email: 'invalid' } };
      const result = validateData(nestedSchema, input);

      expect(result.success).toBe(false);
      expect(result.errors).toEqual({
        'user.email': 'Invalid email'
      });
    });

    it('throws non-Zod errors', () => {
      const explodingSchema = {
        parse: () => { throw new Error('System failure'); }
      };

      expect(() => validateData(explodingSchema, {})).toThrow('System failure');
    });
  });

  describe('validatePartial', () => {
    const testSchema = z.object({
      name: z.string().min(2, 'Name too short'),
      age: z.number().min(18, 'Must be an adult')
    });

    it('allows missing fields', () => {
      const input = { name: 'Bob' };
      const result = validatePartial(testSchema, input);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(input);
      expect(result.errors).toBeNull();
    });

    it('still validates provided fields', () => {
      const input = { name: 'B' }; // Too short
      const result = validatePartial(testSchema, input);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.errors).toEqual({
        name: 'Name too short'
      });
    });
  });

  describe('createValidator', () => {
    const testSchema = z.object({
      id: z.number()
    });

    it('returns a function that validates data', () => {
      const validator = createValidator(testSchema);

      const successResult = validator({ id: 1 });
      expect(successResult.success).toBe(true);

      const failResult = validator({ id: 'one' });
      expect(failResult.success).toBe(false);
      expect(failResult.errors).toHaveProperty('id');
    });
  });
});

describe('Sanitization Utilities', () => {
  describe('sanitizeString', () => {
    it('removes angle brackets from strings', () => {
      expect(sanitizeString('Hello <b>World</b>!')).toBe('Hello bWorld/b!');
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
    });

    it('trims whitespace', () => {
      expect(sanitizeString('  Spaces  ')).toBe('Spaces');
    });

    it('truncates to maxLength', () => {
      expect(sanitizeString('1234567890', 5)).toBe('12345');
    });

    it('returns empty string for non-string inputs', () => {
      expect(sanitizeString(null)).toBe('');
      expect(sanitizeString(undefined)).toBe('');
      expect(sanitizeString(123)).toBe('');
      expect(sanitizeString({})).toBe('');
    });
  });

  describe('sanitizeEmail', () => {
    it('lowercases and trims email', () => {
      expect(sanitizeEmail('  User@Example.COM  ')).toBe('user@example.com');
    });

    it('returns empty string for non-string inputs', () => {
      expect(sanitizeEmail(null)).toBe('');
      expect(sanitizeEmail(123)).toBe('');
    });
  });

  describe('sanitizeCurrency', () => {
    it('parses valid numeric strings and numbers', () => {
      expect(sanitizeCurrency('10.55')).toBe(10.55);
      expect(sanitizeCurrency(10.55)).toBe(10.55);
    });

    it('rounds to 2 decimal places', () => {
      expect(sanitizeCurrency(10.555)).toBe(10.56);
      expect(sanitizeCurrency('10.554')).toBe(10.55);
    });

    it('returns 0 for invalid numbers', () => {
      expect(sanitizeCurrency('invalid')).toBe(0);
      expect(sanitizeCurrency(null)).toBe(0);
      expect(sanitizeCurrency(undefined)).toBe(0);
      expect(sanitizeCurrency({})).toBe(0);
    });
  });
});

describe('Common Schemas', () => {
  describe('EmailSchema', () => {
    it('validates correct emails', () => {
      expect(EmailSchema.safeParse('test@example.com').success).toBe(true);
    });

    it('rejects invalid emails', () => {
      expect(EmailSchema.safeParse('not-an-email').success).toBe(false);
      expect(EmailSchema.safeParse('').success).toBe(false);
    });
  });

  describe('PasswordSchema', () => {
    it('validates correct passwords (min 12, lowercase, uppercase, number, special char)', () => {
      expect(PasswordSchema.safeParse('Abcdef123456!').success).toBe(true);
    });

    it('rejects missing requirements', () => {
      expect(PasswordSchema.safeParse('short1!A').success).toBe(false); // < 12 chars
      expect(PasswordSchema.safeParse('nouppercase1!').success).toBe(false);
      expect(PasswordSchema.safeParse('NOLOWERCASE1!').success).toBe(false);
      expect(PasswordSchema.safeParse('NoSpecialChar123').success).toBe(false);
      expect(PasswordSchema.safeParse('NoNumberAtAll!').success).toBe(false);
    });
  });

  describe('CurrencySchema', () => {
    it('validates positive amounts within limit', () => {
      expect(CurrencySchema.safeParse(0).success).toBe(true);
      expect(CurrencySchema.safeParse(100.5).success).toBe(true);
      expect(CurrencySchema.safeParse(999999999.99).success).toBe(true);
    });

    it('rejects negative amounts', () => {
      expect(CurrencySchema.safeParse(-1).success).toBe(false);
    });

    it('rejects amounts over maximum', () => {
      expect(CurrencySchema.safeParse(1000000000).success).toBe(false);
    });
  });
});
