// ============================================================================
// TELLER.IO UTILITIES
// mTLS HTTP client, Ed25519 signature verification, and API helpers
// ============================================================================

const TELLER_API_BASE = 'https://api.teller.io';

// --------------------------------------------------------------------------
// mTLS HTTP Client
// Uses Deno.createHttpClient with PEM cert+key from environment variables.
// --------------------------------------------------------------------------

let _httpClient: Deno.HttpClient | null = null;

function getTellerHttpClient(): Deno.HttpClient {
    if (_httpClient) return _httpClient;

    const certChain = Deno.env.get('TELLER_CERTIFICATE');
    const privateKey = Deno.env.get('TELLER_PRIVATE_KEY');

    if (!certChain || !privateKey) {
        throw new Error('TELLER_CERTIFICATE and TELLER_PRIVATE_KEY must be set');
    }

    _httpClient = Deno.createHttpClient({
        certChain,
        privateKey,
    });

    return _httpClient;
}

// --------------------------------------------------------------------------
// Teller API Request Helper
// All Teller API calls require mTLS + HTTP Basic Auth (token as username).
// --------------------------------------------------------------------------

export async function tellerFetch(
    path: string,
    accessToken: string,
    options: { method?: string; body?: unknown } = {}
): Promise<any> {
    const client = getTellerHttpClient();
    const { method = 'GET', body } = options;

    const headers: Record<string, string> = {
        'Authorization': 'Basic ' + btoa(accessToken + ':'),
        'Content-Type': 'application/json',
    };

    const fetchOptions: RequestInit & { client: Deno.HttpClient } = {
        method,
        headers,
        client,
    };

    if (body && method !== 'GET') {
        fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(`${TELLER_API_BASE}${path}`, fetchOptions);

    if (response.status === 401) {
        throw new TellerAuthError('Teller access token is invalid or enrollment is disconnected');
    }

    if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Teller API ${response.status}: ${text || response.statusText}`);
    }

    return response.json();
}

// --------------------------------------------------------------------------
// Custom error for auth failures (triggers reauth_required status)
// --------------------------------------------------------------------------

export class TellerAuthError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TellerAuthError';
    }
}

// --------------------------------------------------------------------------
// Ed25519 Signature Verification
// Verifies signatures returned by Teller Connect using the Token Signing Key.
//
// Teller signs a message = nonce + data. The public key is Ed25519 in
// raw base64 format. We import it and verify via Web Crypto.
// --------------------------------------------------------------------------

let _verifyKey: CryptoKey | null = null;

async function getVerifyKey(): Promise<CryptoKey> {
    if (_verifyKey) return _verifyKey;

    const keyBase64 = Deno.env.get('TELLER_TOKEN_SIGNING_KEY');
    if (!keyBase64) {
        throw new Error('TELLER_TOKEN_SIGNING_KEY is not set');
    }

    // Decode base64 to raw 32-byte Ed25519 public key
    const binaryStr = atob(keyBase64);
    const keyBytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
        keyBytes[i] = binaryStr.charCodeAt(i);
    }

    _verifyKey = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'Ed25519' },
        false,
        ['verify']
    );

    return _verifyKey;
}

/**
 * Verify a Teller Connect enrollment signature.
 *
 * @param signature - Base64-encoded Ed25519 signature from Teller Connect
 * @param data - The data that was signed (typically the nonce)
 * @returns true if signature is valid
 */
export async function verifyTellerSignature(
    signature: string,
    data: string
): Promise<boolean> {
    try {
        const key = await getVerifyKey();

        // Decode base64 signature
        const sigBinary = atob(signature);
        const sigBytes = new Uint8Array(sigBinary.length);
        for (let i = 0; i < sigBinary.length; i++) {
            sigBytes[i] = sigBinary.charCodeAt(i);
        }

        // Encode the data to verify
        const encoder = new TextEncoder();
        const dataBytes = encoder.encode(data);

        return await crypto.subtle.verify(
            'Ed25519',
            key,
            sigBytes,
            dataBytes
        );
    } catch (error) {
        console.error('[Teller] Signature verification error:', error);
        return false;
    }
}

// --------------------------------------------------------------------------
// Webhook Signature Verification (HMAC-SHA256)
//
// Teller signs webhooks per: https://teller.io/docs/api/webhooks
//   Header: Teller-Signature: t=<unix_timestamp>,v1=<hex_signature>[,v1=<hex_sig2>]
//   signed_message = "<timestamp>.<raw_json_body>"
//   signature = HMAC-SHA256(signing_secret, signed_message)
//
// During key rotation Teller sends multiple v1= signatures (old + new key).
// We accept if ANY v1 signature matches.
// --------------------------------------------------------------------------

export async function verifyWebhookSignature(
    payload: string,
    signatureHeader: string
): Promise<boolean> {
    try {
        const secret = Deno.env.get('TELLER_WEBHOOK_SECRET');
        if (!secret) {
            console.error('[Teller] TELLER_WEBHOOK_SECRET is not set — webhook verification disabled');
            return false;
        }

        // Parse header: "t=1234567890,v1=abc123,v1=def456"
        const parts = signatureHeader.split(',');
        let timestamp = '';
        const signatures: string[] = [];

        for (const part of parts) {
            const [key, value] = part.split('=', 2);
            if (key === 't') {
                timestamp = value;
            } else if (key === 'v1' && value) {
                signatures.push(value);
            }
        }

        if (!timestamp || signatures.length === 0) {
            console.error('[Teller] Malformed Teller-Signature header');
            return false;
        }

        // Reject if timestamp is older than 5 minutes (replay protection)
        const timestampAge = Math.abs(Date.now() / 1000 - parseInt(timestamp, 10));
        if (timestampAge > 300) {
            console.error(`[Teller] Webhook timestamp too old: ${timestampAge}s`);
            return false;
        }

        // Compute expected signature: HMAC-SHA256(secret, "timestamp.body")
        const signedMessage = `${timestamp}.${payload}`;
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(signedMessage));
        const computed = Array.from(new Uint8Array(mac))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        // Accept if any v1 signature matches (supports key rotation)
        for (const sig of signatures) {
            if (sig.length !== computed.length) continue;
            let mismatch = 0;
            for (let i = 0; i < computed.length; i++) {
                mismatch |= computed.charCodeAt(i) ^ sig.charCodeAt(i);
            }
            if (mismatch === 0) return true;
        }

        console.error('[Teller] No matching webhook signature found');
        return false;
    } catch (error) {
        console.error('[Teller] Webhook signature verification error:', error);
        return false;
    }
}

// --------------------------------------------------------------------------
// Teller API convenience methods
// --------------------------------------------------------------------------

export async function listAccounts(accessToken: string): Promise<any[]> {
    return tellerFetch('/accounts', accessToken);
}

export async function getAccountTransactions(
    accessToken: string,
    accountId: string
): Promise<any[]> {
    return tellerFetch(`/accounts/${accountId}/transactions`, accessToken);
}

export async function getAccountBalances(
    accessToken: string,
    accountId: string
): Promise<any> {
    return tellerFetch(`/accounts/${accountId}/balances`, accessToken);
}
