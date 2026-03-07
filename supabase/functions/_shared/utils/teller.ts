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
