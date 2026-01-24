
import { describe, it, expect } from 'vitest';
import { escapeCsv } from '../utils/csv.ts';

describe('escapeCsv', () => {
  it('should handle null and undefined', () => {
    expect(escapeCsv(null)).toBe('');
    expect(escapeCsv(undefined)).toBe('');
  });

  it('should handle numbers', () => {
    expect(escapeCsv(123)).toBe('123');
    expect(escapeCsv(123.45)).toBe('123.45');
    expect(escapeCsv(-123)).toBe('-123');
    expect(escapeCsv(0)).toBe('0');
  });

  it('should escape simple strings', () => {
    expect(escapeCsv('hello')).toBe('hello');
    expect(escapeCsv('test value')).toBe('test value');
  });

  it('should escape strings with commas', () => {
    expect(escapeCsv('hello, world')).toBe('"hello, world"');
  });

  it('should escape strings with quotes', () => {
    expect(escapeCsv('hello "world"')).toBe('"hello ""world"""');
  });

  it('should escape strings with newlines', () => {
    expect(escapeCsv('hello\nworld')).toBe('"hello\nworld"');
    expect(escapeCsv('hello\r\nworld')).toBe('"hello\r\nworld"');
  });

  it('should prevent CSV injection (Formula Injection)', () => {
    expect(escapeCsv('=1+1')).toBe("'=1+1");
    expect(escapeCsv('+1+1')).toBe("'+1+1");
    expect(escapeCsv('-1+1')).toBe("'-1+1");
    // Contains comma, so it gets quoted after escaping
    expect(escapeCsv('@SUM(1,1)')).toBe(`"'@SUM(1,1)"`);
    expect(escapeCsv('\t123')).toBe("'\t123");
    // Contains \r, so it gets quoted after escaping
    expect(escapeCsv('\r123')).toBe(`"'\r123"`);
  });

  it('should handle CSV injection AND quoting', () => {
    // Starts with = and contains comma
    expect(escapeCsv('=SUM(1,2)')).toBe(`"'=SUM(1,2)"`);
  });

  it('should escape negative number STRINGS but not numbers', () => {
    expect(escapeCsv(-100)).toBe('-100'); // number type -> safe
    expect(escapeCsv('-100')).toBe("'-100"); // string type -> potentially unsafe, escaped
  });
});
