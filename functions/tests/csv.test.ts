
import { describe, it, expect } from 'vitest';
import { escapeCsv } from '../utils/csv.ts';

describe('escapeCsv', () => {
  it('should handle null and undefined', () => {
    expect(escapeCsv(null)).toBe('');
    expect(escapeCsv(undefined)).toBe('');
  });

  it('should return simple strings as is', () => {
    expect(escapeCsv('hello')).toBe('hello');
    expect(escapeCsv('123')).toBe('123');
  });

  it('should escape strings with commas by wrapping in quotes', () => {
    expect(escapeCsv('hello,world')).toBe('"hello,world"');
  });

  it('should escape strings with quotes by doubling them and wrapping in quotes', () => {
    expect(escapeCsv('hello"world')).toBe('"hello""world"');
    expect(escapeCsv('"hello"')).toBe('"""hello"""');
  });

  it('should escape strings with newlines', () => {
    expect(escapeCsv('hello\nworld')).toBe('"hello\nworld"');
    expect(escapeCsv('hello\rworld')).toBe('"hello\rworld"');
  });

  it('should prevent formula injection for =', () => {
    expect(escapeCsv('=1+1')).toBe(`"'=1+1"`);
  });

  it('should prevent formula injection for +', () => {
    expect(escapeCsv('+123')).toBe(`"'+123"`);
  });

  it('should prevent formula injection for -', () => {
    expect(escapeCsv('-123')).toBe(`"'-123"`);
  });

  it('should prevent formula injection for @', () => {
    expect(escapeCsv('@SUM(1,2)')).toBe(`"'@SUM(1,2)"`);
  });

  it('should handle mixed cases (injection char + special chars)', () => {
    expect(escapeCsv('=1+1,2')).toBe(`"'=1+1,2"`);
    expect(escapeCsv('+12"3')).toBe(`"'+12""3"`);
  });
});
