import { describe, it, expect } from 'vitest';
import { createPageUrl } from './index';

describe('createPageUrl', () => {
  it('should create a simple URL for a single word page name', () => {
    const pageName = 'About';
    const expectedUrl = '/About';
    expect(createPageUrl(pageName)).toBe(expectedUrl);
  });

  it('should replace spaces with hyphens', () => {
    const pageName = 'Contact Us';
    const expectedUrl = '/Contact-Us';
    expect(createPageUrl(pageName)).toBe(expectedUrl);
  });

  it('should handle multiple spaces correctly by replacing each with a hyphen', () => {
    const pageName = 'Hello World Test';
    const expectedUrl = '/Hello-World-Test';
    expect(createPageUrl(pageName)).toBe(expectedUrl);
  });

  it('should handle empty string', () => {
    const pageName = '';
    const expectedUrl = '/';
    expect(createPageUrl(pageName)).toBe(expectedUrl);
  });

  it('should handle leading and trailing spaces by replacing them with hyphens', () => {
    const pageName = '  test  ';
    const expectedUrl = '/--test--';
    expect(createPageUrl(pageName)).toBe(expectedUrl);
  });

  it('should preserve case', () => {
    const pageName = 'MixedCasePage';
    const expectedUrl = '/MixedCasePage';
    expect(createPageUrl(pageName)).toBe(expectedUrl);
  });

  it('should handle numbers', () => {
    const pageName = 'Page123';
    const expectedUrl = '/Page123';
    expect(createPageUrl(pageName)).toBe(expectedUrl);
  });

  it('should preserve special characters', () => {
    const pageName = 'Page?Query=1';
    const expectedUrl = '/Page?Query=1';
    expect(createPageUrl(pageName)).toBe(expectedUrl);
  });

  it('should handle consecutive spaces as multiple hyphens', () => {
    const pageName = 'Hello  World';
    const expectedUrl = '/Hello--World';
    expect(createPageUrl(pageName)).toBe(expectedUrl);
  });

  it('should handle strings with no spaces correctly', () => {
    const pageName = 'NoSpaces';
    const expectedUrl = '/NoSpaces';
    expect(createPageUrl(pageName)).toBe(expectedUrl);
  });

  it('should preserve forward slashes', () => {
    const pageName = 'Settings/Profile';
    const expectedUrl = '/Settings/Profile';
    expect(createPageUrl(pageName)).toBe(expectedUrl);
  });

  it('should preserve URL unsafe characters', () => {
    const pageName = 'You&Me';
    const expectedUrl = '/You&Me';
    expect(createPageUrl(pageName)).toBe(expectedUrl);
  });

  it('should preserve tabs and newlines (only replaces spaces)', () => {
    const pageName = 'Tab\tNewline\n';
    const expectedUrl = '/Tab\tNewline\n';
    expect(createPageUrl(pageName)).toBe(expectedUrl);
  });
});
