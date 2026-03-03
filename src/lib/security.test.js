import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isSafeRedirect } from './security';

describe('isSafeRedirect', () => {
  beforeEach(() => {
    // Mock window.location.origin
    vi.stubGlobal('location', {
      origin: 'https://app.zerithum.com'
    });
  });

  it('should return true for relative paths starting with /', () => {
    expect(isSafeRedirect('/dashboard')).toBe(true);
    expect(isSafeRedirect('/settings/profile')).toBe(true);
    expect(isSafeRedirect('/')).toBe(true);
  });

  it('should return false for protocol-relative URLs', () => {
    expect(isSafeRedirect('//evil.com')).toBe(false);
    expect(isSafeRedirect('//google.com/search')).toBe(false);
  });

  it('should return true for absolute URLs with the same origin', () => {
    expect(isSafeRedirect('https://app.zerithum.com/dashboard')).toBe(true);
    expect(isSafeRedirect('https://app.zerithum.com/')).toBe(true);
  });

  it('should return false for absolute URLs with different origins', () => {
    expect(isSafeRedirect('https://evil.com')).toBe(false);
    expect(isSafeRedirect('https://google.com')).toBe(false);
    expect(isSafeRedirect('http://app.zerithum.com/dashboard')).toBe(false); // Different protocol
  });

  it('should return false for invalid URLs or non-string inputs', () => {
    expect(isSafeRedirect('not-a-url')).toBe(false);
    expect(isSafeRedirect('')).toBe(false);
    expect(isSafeRedirect(null)).toBe(false);
    expect(isSafeRedirect(undefined)).toBe(false);
    expect(isSafeRedirect({})).toBe(false);
  });

  it('should return false for javascript: URLs', () => {
    expect(isSafeRedirect('javascript:alert(1)')).toBe(false);
  });
});
