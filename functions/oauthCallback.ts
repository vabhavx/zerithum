import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { handleOAuthCallback, OAuthContext } from './logic/oauthCallbackLogic.ts';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const ctx: OAuthContext = {
    envGet: (key) => Deno.env.get(key),
    fetch: fetch,
    base44: base44,
    logger: {
      error: console.error
    }
  };

  const url = new URL(req.url);
  const cookieHeader = req.headers.get('cookie');

  const result = await handleOAuthCallback(ctx, url, cookieHeader);

  const headers = new Headers(result.headers);
  let body = result.body;

  if (typeof body === 'object') {
    body = JSON.stringify(body);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }

  return new Response(body, {
    status: result.statusCode,
    headers: headers
  });
});
