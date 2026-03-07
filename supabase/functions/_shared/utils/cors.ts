export const CORS_HEADERS = 'authorization, x-client-info, apikey, content-type';
export const CORS_METHODS = 'POST, OPTIONS';

export function getCorsHeaders(req: Request) {
    const origin = req.headers.get('Origin');
    const allowedOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173',
        'https://zerithum.com',
        'https://www.zerithum.com',
        'https://zerithum.vercel.app'
    ];

    // Check environment variable for base URL
    const envBaseUrl = Deno.env.get('VITE_BASE44_APP_BASE_URL');
    if (envBaseUrl && !allowedOrigins.includes(envBaseUrl)) {
        allowedOrigins.push(envBaseUrl);
    }

    let allowOrigin = 'null';

    // Only allow *.base44.app subdomain (legacy Base44 internal tooling)
    const isAllowedSubdomain = origin && (
        /^https:\/\/([a-zA-Z0-9-]+\.)*base44\.app$/.test(origin)
    );

    if (origin && (allowedOrigins.includes(origin) || isAllowedSubdomain)) {
        allowOrigin = origin;
    }

    return {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Headers': CORS_HEADERS,
        'Access-Control-Allow-Methods': CORS_METHODS,
    };
}
