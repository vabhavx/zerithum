import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { encrypt } from './utils/encryption.ts';
import { exchangeOAuthTokens } from './logic/exchangeOAuthTokensLogic.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch (e) {
      body = {};
    }
    const { code, platform } = body;

    const result = await exchangeOAuthTokens(
      {
        envGet: (key) => Deno.env.get(key),
        fetch: fetch,
        logError: console.error,
        encrypt: encrypt,
        base44: base44
      },
      user,
      code,
      platform
    );

    return Response.json(result.body, { status: result.status });

  } catch (error) {
    console.error('Token exchange error:', error);
    // Sentinel: Don't leak error message to client
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
