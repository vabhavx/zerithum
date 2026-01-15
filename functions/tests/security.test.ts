
import { describe, it, expect, vi } from 'vitest';
import { validateCronSecret, constantTimeCompare } from '../utils/security';

describe('constantTimeCompare', () => {
  it('should return true for identical strings', () => {
    expect(constantTimeCompare('secret', 'secret')).toBe(true);
  });

  it('should return false for different lengths', () => {
    expect(constantTimeCompare('secret', 'secre')).toBe(false);
  });

  it('should return false for different contents', () => {
    expect(constantTimeCompare('secret', 's3cret')).toBe(false);
  });
});

describe('validateCronSecret', () => {
  const SECRET = 'my-secret-key';

  it('should return true for valid Bearer token', () => {
    expect(validateCronSecret(`Bearer ${SECRET}`, SECRET)).toBe(true);
  });

  it('should return false if secret is undefined', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(validateCronSecret(`Bearer ${SECRET}`, undefined)).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith("CRON_SECRET environment variable is not set");
    consoleSpy.mockRestore();
  });

  it('should return false if header is null', () => {
    expect(validateCronSecret(null, SECRET)).toBe(false);
  });

  it('should return false if header format is invalid', () => {
    expect(validateCronSecret(SECRET, SECRET)).toBe(false); // Missing Bearer
    expect(validateCronSecret(`Basic ${SECRET}`, SECRET)).toBe(false); // Wrong scheme
    expect(validateCronSecret('Bearer', SECRET)).toBe(false); // Missing token
    expect(validateCronSecret(`Bearer ${SECRET} extra`, SECRET)).toBe(false); // Extra parts
  });

  it('should return false if token does not match', () => {
    expect(validateCronSecret('Bearer wrong-key', SECRET)).toBe(false);
  });
});
