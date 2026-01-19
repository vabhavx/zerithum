
import { describe, it, expect } from 'vitest';
import { escapeCsv } from '../utils/csv.ts';

describe('escapeCsv', () => {
  it('handles null and undefined', () => {
    expect(escapeCsv(null)).toBe('');
    expect(escapeCsv(undefined)).toBe('');
  });

  it('escapes standard strings without special chars', () => {
    expect(escapeCsv('hello')).toBe('hello');
    expect(escapeCsv('123')).toBe('123');
  });

  it('escapes strings with commas', () => {
    expect(escapeCsv('hello,world')).toBe('"hello,world"');
  });

  it('escapes strings with quotes', () => {
    expect(escapeCsv('hello "world"')).toBe('"hello ""world"""');
  });

  it('escapes strings with newlines', () => {
    expect(escapeCsv('hello\nworld')).toBe('"hello\nworld"');
  });

  it('prevents formula injection (starts with =)', () => {
    expect(escapeCsv('=1+1')).toBe("'=1+1");
  });

  it('prevents formula injection (starts with +)', () => {
    expect(escapeCsv('+1+1')).toBe("'+1+1");
  });

  it('prevents formula injection (starts with -)', () => {
    expect(escapeCsv('-1+1')).toBe("'-1+1");
  });

  it('prevents formula injection (starts with @)', () => {
    // 1. Prepend ' -> '@SUM(1)
    // 2. No special chars -> returns '@SUM(1)
    expect(escapeCsv('@SUM(1)')).toBe("'@SUM(1)");
  });

  it('handles combination of injection and special chars', () => {
    // =SUM(1,2)
    // 1. Prepend ' -> '=SUM(1,2)
    // 2. Contains comma -> Wrap in quotes -> "'=SUM(1,2)"
    expect(escapeCsv('=SUM(1,2)')).toBe(`"'=SUM(1,2)"`);
  });

  it('handles quotes and injection', () => {
    // =cmd"test"
    // 1. Prepend ' -> '=cmd"test"
    // 2. Contains quote -> Wrap and escape -> "'=cmd""test"""
    expect(escapeCsv('=cmd"test"')).toBe(`"'=cmd""test"""`);
  });
});
