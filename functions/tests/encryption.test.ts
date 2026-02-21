import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Encryption Utils', () => {
  const TEST_KEY = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f'; // 32 bytes hex

  beforeEach(() => {
    vi.stubGlobal('Deno', {
      env: {
        get: (key: string) => {
          if (key === 'ENCRYPTION_KEY') return TEST_KEY;
          return undefined;
        }
      }
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('should encrypt and decrypt correctly', async () => {
    const { encrypt, decrypt } = await import('../utils/encryption.ts');

    const original = 'my-secret-token';
    const encrypted = await encrypt(original);

    expect(encrypted).not.toBe(original);
    expect(encrypted).toMatch(/^v1:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$/);

    const decrypted = await decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it('should decrypt legacy tokens correctly using decryptLegacy', async () => {
    const { decryptLegacy } = await import('../utils/encryption.ts');
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const legacy = 'legacy-plain-token';
    const result = await decryptLegacy(legacy);

    expect(result).toBe(legacy);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Legacy plain-text token encountered'));
  });

  it('should THROW for legacy tokens using strict decrypt', async () => {
    const { decrypt } = await import('../utils/encryption.ts');

    const legacy = 'legacy-plain-token';
    await expect(decrypt(legacy)).rejects.toThrow('Invalid token format: Not encrypted');
  });

  it('decryptLegacy should also decrypt new tokens', async () => {
      const { encrypt, decryptLegacy } = await import('../utils/encryption.ts');
      const original = 'secret';
      const encrypted = await encrypt(original);
      const decrypted = await decryptLegacy(encrypted);
      expect(decrypted).toBe(original);
  });

  it('should handle empty strings', async () => {
    const { encrypt, decrypt, decryptLegacy } = await import('../utils/encryption.ts');

    expect(await encrypt('')).toBe('');
    expect(await decrypt('')).toBe('');
    expect(await decryptLegacy('')).toBe('');
  });

  it('should throw error if ENCRYPTION_KEY is missing', async () => {
    vi.stubGlobal('Deno', {
      env: {
        get: () => undefined
      }
    });

    // reset module to clear cached key if it was set by previous tests (it was)
    vi.resetModules();
    const { encrypt } = await import('../utils/encryption.ts');

    await expect(encrypt('test')).rejects.toThrow('ENCRYPTION_KEY environment variable is not set');
  });
});
