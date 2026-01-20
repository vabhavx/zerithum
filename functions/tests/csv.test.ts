
import { describe, it, expect } from 'vitest';
import { escapeCsv } from '../utils/csv.ts';

describe('escapeCsv', () => {
  it('handles null/undefined/empty', () => {
    expect(escapeCsv(null)).toBe('');
    expect(escapeCsv(undefined)).toBe('');
    expect(escapeCsv('')).toBe('');
  });

  it('passes through safe simple strings', () => {
    expect(escapeCsv('hello')).toBe('hello');
    expect(escapeCsv('123')).toBe('123');
  });

  it('escapes commas by wrapping in quotes', () => {
    expect(escapeCsv('hello, world')).toBe('"hello, world"');
  });

  it('escapes quotes by doubling them and wrapping in quotes', () => {
    expect(escapeCsv('hello "world"')).toBe('"hello ""world"""');
  });

  it('escapes newlines', () => {
    expect(escapeCsv('hello\nworld')).toBe('"hello\nworld"');
  });

  it('prevents formula injection for =', () => {
    expect(escapeCsv('=1+1')).toBe("'=1+1");
  });

  it('prevents formula injection for +', () => {
    expect(escapeCsv('+1+1')).toBe("'+1+1");
  });

  it('prevents formula injection for -', () => {
    expect(escapeCsv('-1+1')).toBe("'-1+1");
  });

  it('prevents formula injection for @', () => {
    // Contains comma, so it gets quoted as well
    expect(escapeCsv('@SUM(1,1)')).toBe(`"'@SUM(1,1)"`);
  });

  it('handles combination of injection and special chars', () => {
    // Starts with = and contains ,
    // Should prepend ' then wrap in quotes because of ,
    // Value: =1,2
    // Injection protection: '=1,2
    // CSV escaping: "'=1,2"
    expect(escapeCsv('=1,2')).toBe(`"'=1,2"`);
  });
});
