export const CORS_HEADERS = 'authorization, x-client-info, apikey, content-type';
export const CORS_METHODS = 'POST, OPTIONS';

export function getCorsHeaders(req: Request) {
    const origin = req.headers.get('Origin');
    const allowedOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173',
        'https://app.base44.com',
        'https://base44.com',
        'https://zerithum.com',
        'https://www.zerithum.com'
    ];

    // Check environment variable for base URL
    const envBaseUrl = Deno.env.get('VITE_BASE44_APP_BASE_URL');
    if (envBaseUrl && !allowedOrigins.includes(envBaseUrl)) {
        allowedOrigins.push(envBaseUrl);
    }

    let allowOrigin = 'null';

    if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.base44.app') || origin.endsWith('.vercel.app'))) {
        allowOrigin = origin;
    }

    return {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Headers': CORS_HEADERS,
        'Access-Control-Allow-Methods': CORS_METHODS,
    };
}
