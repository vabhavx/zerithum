import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { categorizeExpenseLogic } from './logic/categorizeExpenseLogic.ts';

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
    } catch {
        // Body is empty or malformed, default to empty object
    }

    const ctx = { base44 };
    const result = await categorizeExpenseLogic(ctx, body);

    return Response.json(result.body, { status: result.status });

  } catch (error: any) {
    console.error('Categorization error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
