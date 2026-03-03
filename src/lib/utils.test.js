import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cn, formatMoney } from './utils'

describe('cn', () => {
  it('should merge class names correctly', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2')
  })

  it('should handle conditional classes', () => {
    expect(cn('class1', false && 'class2', 'class3')).toBe('class1 class3')
    expect(cn('class1', true && 'class2', 'class3')).toBe('class1 class2 class3')
    expect(cn('class1', null, undefined, 'class3')).toBe('class1 class3')
  })

  it('should handle tailwind conflicts', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
    expect(cn('px-2 py-1', 'p-4')).toBe('p-4')
  })

  it('should handle arrays and objects', () => {
    expect(cn(['class1', 'class2'])).toBe('class1 class2')
    expect(cn({ 'class1': true, 'class2': false })).toBe('class1')
    expect(cn(['class1'], { 'class2': true })).toBe('class1 class2')
  })

  it('should handle empty inputs', () => {
      expect(cn()).toBe('')
      expect(cn(null)).toBe('')
      expect(cn(undefined)).toBe('')
  })
})

describe('isIframe', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should be true when window.self !== window.top', async () => {
    vi.stubGlobal('window', { self: 'foo', top: 'bar' })
    const { isIframe } = await import('./utils')
    expect(isIframe).toBe(true)
  })

  it('should be false when window.self === window.top', async () => {
    const mockWindow = { }
    mockWindow.self = mockWindow
    mockWindow.top = mockWindow

    vi.stubGlobal('window', mockWindow)
    const { isIframe } = await import('./utils')
    expect(isIframe).toBe(false)
  })
})

describe('formatMoney', () => {
  it('should format money with default 2 decimal places', () => {
    const result = formatMoney(1234.56).replace(/\u00A0/g, ' ');
    expect(result).toBe('$1,234.56');
  });

  it('should format money with specified 0 decimal places', () => {
    const result = formatMoney(1234.56, 0).replace(/\u00A0/g, ' ');
    expect(result).toBe('$1,235'); // Rounds up
  });

  it('should format money with specified 3 decimal places', () => {
    const result = formatMoney(1234.5678, 3).replace(/\u00A0/g, ' ');
    expect(result).toBe('$1,234.568'); // Rounds up
  });

  it('should handle 0 correctly', () => {
    const result = formatMoney(0).replace(/\u00A0/g, ' ');
    expect(result).toBe('$0.00');
  });

  it('should handle null/undefined correctly', () => {
    const resultNull = formatMoney(null).replace(/\u00A0/g, ' ');
    const resultUndefined = formatMoney(undefined).replace(/\u00A0/g, ' ');
    expect(resultNull).toBe('$0.00');
    expect(resultUndefined).toBe('$0.00');
  });

  it('should handle negative numbers correctly', () => {
    const result = formatMoney(-1234.56).replace(/\u00A0/g, ' ');
    // Intl.NumberFormat might use a minus sign or parentheses
    expect(result).toContain('1,234.56');
    expect(result).toContain('-');
  });
});
