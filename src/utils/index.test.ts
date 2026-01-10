import { describe, it, expect } from 'vitest';
import { createPageUrl } from './index';

describe('createPageUrl', () => {
  it('should prefix with slash and replace spaces with dashes', () => {
    expect(createPageUrl('My Page')).toBe('/My-Page');
  });

  it('should handle single word', () => {
    expect(createPageUrl('Home')).toBe('/Home');
  });
});
