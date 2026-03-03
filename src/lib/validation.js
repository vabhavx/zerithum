/**
 * Validation Utilities
 * Form validation schemas and helpers
 */

import { z } from 'zod';

// ============================================================================
// Common Schemas
// ============================================================================

export const EmailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address');

export const PasswordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/\d/, 'Password must contain a number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain a special character');

export const CurrencySchema = z
  .number()
  .min(0, 'Amount must be positive')
  .max(999999999.99, 'Amount exceeds maximum');

export const DateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)');

export const URLSchema = z
  .string()
  .url('Invalid URL')
  .refine(
    (url) => url.startsWith('https://'),
    'URL must use HTTPS'
  );

// ============================================================================
// Entity Schemas
// ============================================================================

export const ExpenseSchema = z.object({
  amount: CurrencySchema,
  expense_date: DateSchema,
  merchant: z.string().min(1, 'Merchant is required').max(255),
  category: z.enum([
    'software',
    'hardware',
    'office',
    'travel',
    'meals',
    'marketing',
    'professional_services',
    'other',
  ]),
  description: z.string().max(1000).optional(),
  is_tax_deductible: z.boolean().default(false),
  deduction_percentage: z.number().min(0).max(100).default(100),
  receipt_url: URLSchema.optional().nullable(),
  payment_method: z.enum(['credit_card', 'debit_card', 'cash', 'bank_transfer', 'other']),
  notes: z.string().max(2000).optional(),
});

export const TransactionSchema = z.object({
  platform: z.enum(['youtube', 'patreon', 'stripe', 'gumroad', 'instagram', 'tiktok', 'shopify', 'substack']),
  amount: CurrencySchema,
  transaction_date: DateSchema,
  description: z.string().min(1).max(500),
  category: z.string().min(1),
  currency: z.string().length(3).default('USD'),
});

export const TaxProfileSchema = z.object({
  filing_status: z.enum(['single', 'married_joint', 'married_separate', 'head_household']),
  state: z.string().length(2),
  expected_annual_revenue: CurrencySchema,
  expense_rate: z.number().min(0).max(100),
  include_other_income: z.boolean().default(false),
  other_income: CurrencySchema.optional(),
});

export const UserProfileSchema = z.object({
  full_name: z.string().min(1).max(100),
  email: EmailSchema,
  timezone: z.string().min(1),
  currency_preference: z.string().length(3).default('USD'),
});

// ============================================================================
// Validation Helpers
// ============================================================================

export function validateData(schema, data) {
  try {
    const valid = schema.parse(data);
    return { success: true, data: valid, errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.reduce((acc, err) => {
        const path = err.path.join('.');
        acc[path] = err.message;
        return acc;
      }, {});
      return { success: false, data: null, errors };
    }
    throw error;
  }
}

export function validatePartial(schema, data) {
  return validateData(schema.partial(), data);
}

export function createValidator(schema) {
  return (data) => validateData(schema, data);
}

// ============================================================================
// Sanitization
// ============================================================================

export function sanitizeString(value, maxLength = 1000) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[<>]/g, '')
    .slice(0, maxLength)
    .trim();
}

export function sanitizeEmail(email) {
  if (typeof email !== 'string') return '';
  return email.toLowerCase().trim();
}

export function sanitizeCurrency(amount) {
  const num = parseFloat(amount);
  if (isNaN(num)) return 0;
  return Math.round(num * 100) / 100; // 2 decimal places
}

// ============================================================================
// React Hook
// ============================================================================

import { useState, useCallback } from 'react';

export function useFormValidation(schema, initialValues = {}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = useCallback(() => {
    const result = validateData(schema, values);
    setErrors(result.errors || {});
    return result.success;
  }, [values, schema]);

  const validateField = useCallback((field) => {
    const fieldSchema = schema.shape?.[field];
    if (!fieldSchema) return true;

    try {
      fieldSchema.parse(values[field]);
      setErrors(prev => ({ ...prev, [field]: undefined }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({ ...prev, [field]: error.errors[0]?.message }));
      }
      return false;
    }
  }, [values, schema]);

  const setValue = useCallback((field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      validateField(field);
    }
  }, [touched, validateField]);

  const touchField = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field);
  }, [validateField]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    setValue,
    touchField,
    validate,
    validateField,
    reset,
    isValid: Object.keys(errors).length === 0,
  };
}
