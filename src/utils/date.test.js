import { describe, it, expect } from 'vitest';
import { format, formatDistanceToNow } from 'date-fns';

describe('Date Utilities (date-fns)', () => {
  it('should format dates correctly', () => {
    const date = new Date('2023-01-01T12:00:00Z');
    // Using UTC date, but format will use local time zone which might differ.
    // However, we just want to ensure the function runs.
    const formatted = format(date, 'MMM d, yyyy');
    expect(formatted).toMatch(/Jan 1, 2023/);
  });

  it('should format distance to now correctly', () => {
    const now = new Date();
    const past = new Date(now.getTime() - 1000 * 60 * 5); // 5 minutes ago
    const distance = formatDistanceToNow(past, { addSuffix: true });
    expect(distance).toBe('5 minutes ago');
  });
});
