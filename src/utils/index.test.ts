import { describe, it, expect } from 'vitest';
import { createPageUrl } from './index';

describe('createPageUrl', () => {
    it('should prepend a slash and replace spaces with hyphens', () => {
        expect(createPageUrl('Home Page')).toBe('/Home-Page');
    });

    it('should handle strings without spaces', () => {
        expect(createPageUrl('About')).toBe('/About');
    });

    it('should handle empty strings', () => {
        expect(createPageUrl('')).toBe('/');
    });

    it('should replace multiple spaces with multiple hyphens', () => {
        // Documenting current behavior: / /g replaces each space individually
        expect(createPageUrl('foo  bar')).toBe('/foo--bar');
    });

    it('should handle leading and trailing spaces', () => {
        // Documenting current behavior
        expect(createPageUrl(' foo ')).toBe('/-foo-');
    });

    it('should preserve case', () => {
        expect(createPageUrl('MyPage')).toBe('/MyPage');
    });

    it('should preserve special characters', () => {
        expect(createPageUrl('FAQs?')).toBe('/FAQs?');
        expect(createPageUrl('News/Events')).toBe('/News/Events');
    });
});
