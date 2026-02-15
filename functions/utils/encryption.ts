
// Basic AES-GCM encryption/decryption
// Format: v1:{iv_base64}:{ciphertext_base64}

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;

// Lazy-loaded key to avoid blocking startup if not needed immediately
let cryptoKey: CryptoKey | null = null;

async function getKey(): Promise<CryptoKey> {
  if (cryptoKey) return cryptoKey;

  const keyString = Deno.env.get('ENCRYPTION_KEY');
  if (!keyString) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }

  // Key must be 32 bytes (64 hex chars) or similar strong random string.
  // For simplicity, let's assume it's a hex string.
  // If it's not hex, we could hash it to get 32 bytes.
  // Let's assume it's a hex string representing 32 bytes.

  let keyBuffer: ArrayBuffer;
  try {
    // Try to parse as hex
    if (/^[0-9a-fA-F]{64}$/.test(keyString)) {
        const match = keyString.match(/.{1,2}/g);
        if (!match) throw new Error("Invalid hex key");
        keyBuffer = new Uint8Array(match.map(byte => parseInt(byte, 16)));
    } else {
        // Fallback: SHA-256 hash of the string to ensure 32 bytes
        const encoder = new TextEncoder();
        const data = encoder.encode(keyString);
        keyBuffer = await crypto.subtle.digest('SHA-256', data);
    }
  } catch (e) {
      throw new Error(`Failed to process ENCRYPTION_KEY: ${e.message}`);
  }

  cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    ALGORITHM,
    false,
    ['encrypt', 'decrypt']
  );

  return cryptoKey;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function encrypt(text: string): Promise<string> {
  if (!text) return text;

  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv: iv,
    },
    key,
    data
  );

  return `v1:${arrayBufferToBase64(iv.buffer)}:${arrayBufferToBase64(ciphertext)}`;
}

export async function decrypt(text: string): Promise<string> {
  if (!text) return text;

  // Check for v1 prefix
  if (!text.startsWith('v1:')) {
    // Legacy support: return plain text
    return text;
  }

  const parts = text.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format');
  }

  const iv = base64ToArrayBuffer(parts[1]);
  const ciphertext = base64ToArrayBuffer(parts[2]);
  const key = await getKey();

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv,
      },
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (e) {
    console.error('Decryption failed:', e);
    throw new Error('Failed to decrypt token');
  }
}
