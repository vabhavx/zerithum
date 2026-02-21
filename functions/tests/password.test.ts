import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validatePassword } from '../logic/security.ts';

describe('validatePassword', () => {
    beforeEach(() => {
        vi.resetAllMocks();

        // Mock crypto.subtle.digest for SHA-1
        // 'password123456' SHA-1: 7110EDA4D09E062AA5E4A390B0A572AC0D2C0220

        const mockDigest = vi.fn().mockImplementation(async (algorithm, data) => {
            const password = new TextDecoder().decode(data);
            if (password === 'password123456') {
                return new Uint8Array([
                    0x71, 0x10, 0xED, 0xA4, 0xD0, 0x9E, 0x06, 0x2A, 0xA5, 0xE4,
                    0xA3, 0x90, 0xB0, 0xA5, 0x72, 0xAC, 0x0D, 0x2C, 0x02, 0x20
                ]).buffer;
            }
            return new Uint8Array(20).buffer; // Default empty hash
        });

        vi.stubGlobal('crypto', {
            subtle: {
                digest: mockDigest
            },
            getRandomValues: vi.fn()
        });

        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            text: async () => 'DA4D09E062AA5E4A390B0A572AC0D2C0220:10\n1D2C0220:5' // Correct suffix for 'password123456'
        }));
    });

    it('should reject passwords shorter than 12 characters', async () => {
        const result = await validatePassword('short');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Password must be at least 12 characters');
    });

    it('should reject pwned passwords', async () => {
        const result = await validatePassword('password123456');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('This password has appeared in a data breach. Please choose a different, more unique password');
    });

    it('should accept strong unique passwords', async () => {
        // Mock fetch to return no match for this password
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            text: async () => 'ABCDEF0123456789ABCDEF0123456789ABC:1'
        }));

        const result = await validatePassword('A!v3ryStr0ngP@ssw0rd!');
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.strength).toBe('strong');
    });

    it('should calculate strength correctly', async () => {
        // Mock fetch to return no match
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            text: async () => ''
        }));

        expect((await validatePassword('onlylowercase12')).strength).toBe('medium');
        expect((await validatePassword('OnlylowercaseWithUpper')).strength).toBe('medium');
        expect((await validatePassword('OnlylowercaseWithUpper1')).strength).toBe('strong');
        expect((await validatePassword('OnlylowercaseWithUpper1!')).strength).toBe('strong');
    });

    it('should fail open if HIBP API is down', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: false
        }));

        const result = await validatePassword('password123456');
        expect(result.valid).toBe(true); // Should pass if API is down
    });
});
