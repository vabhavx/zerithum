import { describe, it, expect } from 'vitest';
import { escapeCsv } from '../utils/csv.ts';

describe('escapeCsv', () => {
  it('should return empty string for null or undefined', () => {
    expect(escapeCsv(null)).toBe('');
    expect(escapeCsv(undefined)).toBe('');
  });

  it('should return string as is if safe', () => {
    expect(escapeCsv('safe string')).toBe('safe string');
    expect(escapeCsv('123')).toBe('123');
  });

  it('should escape quotes', () => {
    expect(escapeCsv('hello "world"')).toBe('"hello ""world"""');
  });

  it('should escape commas', () => {
    expect(escapeCsv('hello,world')).toBe('"hello,world"');
  });

  it('should escape newlines', () => {
    expect(escapeCsv('hello\nworld')).toBe('"hello\nworld"');
  });

  it('should prevent formula injection starting with =', () => {
    expect(escapeCsv('=1+1')).toBe("'=1+1");
  });

  it('should prevent formula injection starting with +', () => {
    expect(escapeCsv('+1+1')).toBe("'+1+1");
  });

  it('should prevent formula injection starting with -', () => {
    expect(escapeCsv('-1+1')).toBe("'-1+1");
  });

  it('should prevent formula injection starting with @', () => {
    // Contains comma so it gets quoted
    expect(escapeCsv('@SUM(1,1)')).toBe(`"'@SUM(1,1)"`);
  });

  it('should prevent formula injection starting with @ (no comma)', () => {
    expect(escapeCsv('@SUM(1 1)')).toBe("'@SUM(1 1)");
  });

  it('should handle formula injection characters inside quotes/commas', () => {
    expect(escapeCsv('=1,2')).toBe(`"'=1,2"`); // Prepends ' then wraps in quotes
    // explanation: =1,2 -> '=1,2 (injection check) -> "'=1,2" (comma check)
  });

  it('should escape correctly combined injection and quotes', () => {
     // =cmd|' /C calc'!A0
     const val = "=cmd|' /C calc'!A0";
     // Should become '=cmd|' /C calc'!A0
     // Since it contains | and ' (not , or "), it doesn't need wrapping unless we decide to wrap everything?
     // My code only wraps if contains " , \n \r
     expect(escapeCsv(val)).toBe("'=cmd|' /C calc'!A0");
  });
});
