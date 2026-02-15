import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { encrypt, decrypt } from './utils/encryption.ts';
import { refreshAccessTokenLogic } from './logic/refreshAccessTokenLogic.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body = {};
    try {
      body = await req.json();
    } catch (e) {
      // Body might be empty or invalid JSON
    }

    // Create context with real implementations
    const ctx = {
        base44,
        env: {
            get: (key: string) => Deno.env.get(key)
        },
        fetch: globalThis.fetch.bind(globalThis),
        encrypt,
        decrypt
    };

    const result = await refreshAccessTokenLogic(ctx, user, body);

    return Response.json(result.body, { status: result.status });

  } catch (error: any) {
    console.error('Token refresh error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
