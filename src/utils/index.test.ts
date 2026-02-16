import { describe, it, expect } from 'vitest';
import { createPageUrl } from './index';

describe('createPageUrl', () => {
  it.each([
    ['single word', 'About', '/About'],
    ['multiple words with spaces', 'Contact Us', '/Contact-Us'],
    ['multiple spaces', 'Hello World Test', '/Hello-World-Test'],
    ['empty string', '', '/'],
    ['leading and trailing spaces', '  test  ', '/--test--'],
    ['mixed case', 'MixedCasePage', '/MixedCasePage'],
    ['numbers', 'Page123', '/Page123'],
    ['special characters', 'Page?Query=1', '/Page?Query=1'],
    ['consecutive spaces', 'Hello  World', '/Hello--World'],
    ['no spaces', 'NoSpaces', '/NoSpaces'],
    ['forward slashes', 'Settings/Profile', '/Settings/Profile'],
    ['URL unsafe characters', 'You&Me', '/You&Me'],
    ['tabs and newlines (preserved)', 'Tab\tNewline\n', '/Tab\tNewline\n'],
  ])('should handle %s: "%s" -> "%s"', (_, input, expected) => {
    expect(createPageUrl(input)).toBe(expected);
  });
});
