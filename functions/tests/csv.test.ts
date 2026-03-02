import { describe, it, expect } from 'vitest';
import { escapeCsv } from '../utils/csv';

describe('CSV Utils', () => {
  describe('escapeCsv', () => {
    it('should handle null and undefined', () => {
      expect(escapeCsv(null)).toBe('');
      expect(escapeCsv(undefined)).toBe('');
    });

    it('should handle numbers', () => {
      expect(escapeCsv(123)).toBe('123');
      expect(escapeCsv(0)).toBe('0');
      // -123.45 starts with - so it's potentially unsafe
      // it gets prepended with ' -> '-123.45
      // then it's wrapped in quotes -> "'-123.45"
      expect(escapeCsv(-123.45)).toBe("\"'-123.45\"");
    });

    it('should handle simple strings', () => {
      expect(escapeCsv('hello')).toBe('hello');
      expect(escapeCsv('hello world')).toBe('hello world');
    });

    it('should escape double quotes', () => {
      // "He said ""hello"""
      // stringValue = He said "hello"
      // contains quote, so it gets wrapped.
      // escaped = He said ""hello""
      // return "He said ""hello"""
      expect(escapeCsv('He said "hello"')).toBe('"He said ""hello"""');
    });

    it('should wrap in quotes if it contains a comma', () => {
      expect(escapeCsv('hello, world')).toBe('"hello, world"');
    });

    it('should wrap in quotes if it contains a newline', () => {
      expect(escapeCsv('line 1\nline 2')).toBe('"line 1\nline 2"');
      expect(escapeCsv('line 1\rline 2')).toBe('"line 1\rline 2"');
    });

    it('should mitigate CSV injection characters at the start and wrap in quotes', () => {
      // In the implementation:
      /*
      if (potentiallyUnsafe) {
        escaped = `'${escaped}`;
      }
      if (/[",\n\r]/.test(stringValue) || potentiallyUnsafe) {
        return `"${escaped}"`;
      }
      */
      expect(escapeCsv('=1+2')).toBe("\"'=1+2\"");
      expect(escapeCsv('+something')).toBe("\"'+something\"");
      expect(escapeCsv('-123')).toBe("\"'-123\"");
      expect(escapeCsv('@admin')).toBe("\"'@admin\"");
    });

    it('should handle multiple special conditions', () => {
      // Starts with +, contains comma and quote
      // stringValue = +Check, "me"
      // potentiallyUnsafe = true
      // escaped = '+Check, ""me""
      // return "'+Check, ""me"""
      expect(escapeCsv('+Check, "me"')).toBe('"\'+Check, ""me"""');
    });
  });
});
