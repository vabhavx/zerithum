// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import {
  sanitizeInput,
  sanitizeEmail,
  sanitizeUrl
} from './security';

describe('Security Utilities', () => {

  describe('sanitizeInput', () => {
    it('returns empty string for non-string inputs', () => {
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput(undefined)).toBe('');
      expect(sanitizeInput(123)).toBe('');
      expect(sanitizeInput({})).toBe('');
      expect(sanitizeInput([])).toBe('');
    });

    it('trims leading and trailing whitespace', () => {
      expect(sanitizeInput('   hello world   ')).toBe('hello world');
    });

    it('truncates to maxLength', () => {
      const longString = 'a'.repeat(10050);
      const sanitized = sanitizeInput(longString);
      expect(sanitized.length).toBe(10000); // Default maxLength is 10000
    });

    it('truncates to custom maxLength', () => {
      const string = 'hello world';
      const sanitized = sanitizeInput(string, { maxLength: 5 });
      expect(sanitized).toBe('hello');
    });

    it('strips dangerous patterns by default', () => {
      const payloads = [
        '<script>alert("xss")</script>',
        'javascript:alert(1)',
        '<div onclick="alert(1)">click me</div>',
        '<iframe src="evil.com"></iframe>',
        '<object data="evil.swf"></object>',
        '<embed src="evil.swf">',
      ];

      payloads.forEach(payload => {
        const sanitized = sanitizeInput(payload);
        // Script tags completely stripped, attributes stripped, etc.
        // E.g., '<script>alert("xss")</script>' -> ''
        // '<div onclick="alert(1)">click me</div>' -> '&lt;div &gt;click me&lt;&#x2F;div&gt;'
        expect(sanitized).not.toContain('<script');
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toContain('onclick=');
        expect(sanitized).not.toContain('<iframe');
        expect(sanitized).not.toContain('<object');
        expect(sanitized).not.toContain('<embed');
      });
    });

    it('escapes HTML entities by default', () => {
      const payload = '<div>"Hello" & \'World\'/</div>';
      const sanitized = sanitizeInput(payload);
      expect(sanitized).toBe('&lt;div&gt;&quot;Hello&quot; &amp; &#x27;World&#x27;&#x2F;&lt;&#x2F;div&gt;');
    });

    it('does not strip scripts or escape HTML when allowHTML is true', () => {
      // According to the code: if allowHTML is true, stripScripts is effectively ignored (if stripScripts && !allowHTML)
      // And escaping is bypassed (!allowHTML).
      const payload = '<script>alert("xss")</script><div>"Hello"</div>';
      const sanitized = sanitizeInput(payload, { allowHTML: true });
      expect(sanitized).toBe('<script>alert("xss")</script><div>"Hello"</div>');
    });

    it('strips scripts but leaves HTML when stripScripts is true and allowHTML is false (default)', () => {
      const payload = '<script>alert(1)</script><b>Bold</b>';
      const sanitized = sanitizeInput(payload);
      // Script stripped, then HTML escaped
      expect(sanitized).toBe('&lt;b&gt;Bold&lt;&#x2F;b&gt;');
    });

    it('does not strip scripts but escapes HTML when stripScripts is false and allowHTML is false', () => {
      const payload = '<script>alert(1)</script>';
      const sanitized = sanitizeInput(payload, { stripScripts: false });
      expect(sanitized).toBe('&lt;script&gt;alert(1)&lt;&#x2F;script&gt;');
    });
  });

  describe('sanitizeEmail', () => {
    it('returns empty string for non-string inputs', () => {
      expect(sanitizeEmail(null)).toBe('');
      expect(sanitizeEmail(123)).toBe('');
    });

    it('returns sanitized lowercased trimmed email for valid email', () => {
      expect(sanitizeEmail('  Test@Example.com  ')).toBe('test@example.com');
    });

    it('returns empty string for invalid email', () => {
      expect(sanitizeEmail('invalid-email')).toBe('');
      expect(sanitizeEmail('test@')).toBe('');
      expect(sanitizeEmail('@example.com')).toBe('');
      expect(sanitizeEmail('test@example')).toBe(''); // Missing TLD based on the regex
    });
  });

  describe('sanitizeUrl', () => {
    it('returns empty string for non-string inputs', () => {
      expect(sanitizeUrl(null)).toBe('');
      expect(sanitizeUrl(123)).toBe('');
    });

    it('returns the URL for valid allowed protocols', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com/');
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com/');
    });

    it('returns empty string for disallowed protocols', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('');
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
      expect(sanitizeUrl('ftp://example.com')).toBe(''); // Not in default allowed protocols
    });

    it('allows custom allowed protocols', () => {
      expect(sanitizeUrl('ftp://example.com', ['ftp:'])).toBe('ftp://example.com/');
    });

    it('returns empty string for invalid URLs', () => {
      expect(sanitizeUrl('not-a-valid-url')).toBe('');
    });
  });

});
