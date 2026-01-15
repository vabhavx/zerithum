import { timingSafeEqual } from 'node:crypto';

export function constantTimeCompare(a: string, b: string): boolean {
  try {
    // We need to encode strings to Uint8Array
    const encoder = new TextEncoder();
    const aBuf = encoder.encode(a);
    const bBuf = encoder.encode(b);

    // timingSafeEqual requires buffers of equal length
    if (aBuf.length !== bBuf.length) {
      return false;
    }

    return timingSafeEqual(aBuf, bBuf);
  } catch (e) {
    // Fallback should not be needed with node:crypto but good for safety
    if (a.length !== b.length) {
      return false;
    }
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }
}

export function validateCronSecret(authHeader: string | null, secret: string | undefined): boolean {
  if (!secret) {
    // Log error but don't expose it to the caller
    console.error("CRON_SECRET environment variable is not set");
    return false;
  }
  if (!authHeader) {
    return false;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return false;
  }

  const token = parts[1];
  return constantTimeCompare(token, secret);
}
