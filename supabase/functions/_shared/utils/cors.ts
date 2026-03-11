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

    let allowOrigin = 'null';

    if (origin && allowedOrigins.includes(origin)) {
        allowOrigin = origin;
    }

    return {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Headers': CORS_HEADERS,
        'Access-Control-Allow-Methods': CORS_METHODS,
    };
}
