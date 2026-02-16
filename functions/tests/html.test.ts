import { describe, it, expect } from 'vitest';
import { escapeHtml } from '../utils/html';

describe('HTML Utils', () => {
  describe('escapeHtml', () => {
    it('should return empty string for non-string input', () => {
      // @ts-expect-error - testing runtime safety
      expect(escapeHtml(null)).toBe('');
      // @ts-expect-error - testing runtime safety
      expect(escapeHtml(undefined)).toBe('');
      // @ts-expect-error - testing runtime safety
      expect(escapeHtml(123)).toBe('');
      // @ts-expect-error - testing runtime safety
      expect(escapeHtml({})).toBe('');
    });

    it('should return the same string if no special characters are present', () => {
      expect(escapeHtml('hello world')).toBe('hello world');
      expect(escapeHtml('1234567890')).toBe('1234567890');
      expect(escapeHtml('')).toBe('');
    });

    it('should escape &', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('should escape <', () => {
      expect(escapeHtml('<div>')).toBe('&lt;div&gt;');
    });

    it('should escape >', () => {
      expect(escapeHtml('foo > bar')).toBe('foo &gt; bar');
    });

    it('should escape "', () => {
      expect(escapeHtml('class="test"')).toBe('class=&quot;test&quot;');
    });

    it('should escape \'', () => {
      expect(escapeHtml("It's me")).toBe('It&#039;s me');
    });

    it('should escape mixed special characters correctly', () => {
      const input = '<script>alert("XSS") & \'more\'</script>';
      const expected = '&lt;script&gt;alert(&quot;XSS&quot;) &amp; &#039;more&#039;&lt;/script&gt;';
      expect(escapeHtml(input)).toBe(expected);
    });
  });
});
