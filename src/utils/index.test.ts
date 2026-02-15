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

  it('should handle multiple spaces correctly', () => {
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
});
