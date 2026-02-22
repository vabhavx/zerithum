import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateOTPCode } from '../logic/security';

describe('generateOTPCode Bias Fix', () => {
    const originalCrypto = global.crypto;

    beforeEach(() => {
        // We need to mock crypto.getRandomValues
        // Since it modifies the array in place, we need a custom implementation
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should reject values in the biased range', () => {
        const biasedValue = 4294900000; // >= 4294800000 (limit)
        const safeValue = 123456;

        let callCount = 0;
        const getRandomValuesMock = vi.fn().mockImplementation((typedArray: Uint32Array) => {
            if (callCount === 0) {
                typedArray[0] = biasedValue;
            } else {
                typedArray[0] = safeValue;
            }
            callCount++;
            return typedArray;
        });

        vi.spyOn(crypto, 'getRandomValues').mockImplementation(getRandomValuesMock);

        const code = generateOTPCode();

        // Vulnerable code would accept the first value:
        // 4294900000 % 900000 = 100000
        // 100000 + 100000 = 200000

        // Secure code should reject the first value and take the second:
        // 123456 % 900000 = 123456
        // 123456 + 100000 = 223456

        // Since we haven't fixed it yet, we expect 200000.
        // Once fixed, we expect 223456.

        expect(code).toBe('223456');
    });
});
