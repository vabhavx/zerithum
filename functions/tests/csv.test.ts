
import { describe, it, expect } from 'vitest';
import { escapeCsv } from '../utils/csv';

describe('escapeCsv', () => {
  it('should handle null and undefined', () => {
    expect(escapeCsv(null)).toBe('');
    expect(escapeCsv(undefined)).toBe('');
  });

  it('should return simple strings as is', () => {
    expect(escapeCsv('hello')).toBe('hello');
    expect(escapeCsv('123')).toBe('123');
  });

  it('should escape strings with commas', () => {
    expect(escapeCsv('hello, world')).toBe('"hello, world"');
  });

  it('should escape strings with double quotes', () => {
    expect(escapeCsv('hello "world"')).toBe('"hello ""world"""');
  });

  it('should escape strings with newlines', () => {
    expect(escapeCsv('hello\nworld')).toBe('"hello\nworld"');
  });

  it('should prevent formula injection for strings starting with =', () => {
    // =1+1 -> '=1+1. Since it contains ', it doesn't trigger quote requirement unless we decide ' is a special char for quoting (it's not in CSV, only " is).
    // Wait, my logic says `needsQuotes = /[",\n\r]/.test(stringField)`.
    // `'=1+1` contains `'`, `=`, `1`, `+`. None of these match `[",\n\r]`.
    // So it should return `'=1+1`.
    expect(escapeCsv('=1+1')).toBe("'=1+1");
  });

  it('should prevent formula injection for strings starting with +', () => {
    expect(escapeCsv('+123')).toBe("'+123");
  });

  it('should prevent formula injection for strings starting with -', () => {
    expect(escapeCsv('-123')).toBe("'-123");
  });

  it('should prevent formula injection for strings starting with @', () => {
    expect(escapeCsv('@SUM(1,1)')).toBe("\"'@SUM(1,1)\"");
  });

  it('should handle injection mixed with quotes', () => {
    // =cmd|' /C calc'!A0
    // Becomes: '=cmd|' /C calc'!A0
    // No comma, no double quote.
    // Result: "'=cmd|' /C calc'!A0"
    expect(escapeCsv("=cmd|' /C calc'!A0")).toBe("'=cmd|' /C calc'!A0");
  });

  it('should handle injection mixed with commas', () => {
    // =SUM(1, 2)
    // Becomes: '=SUM(1, 2)
    // Has comma.
    // Result: "'=SUM(1, 2)"
    expect(escapeCsv('=SUM(1, 2)')).toBe('"\'' + '=SUM(1, 2)"');
  });
});
