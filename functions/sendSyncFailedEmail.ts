import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { sendSyncFailedEmailLogic, EmailContext } from './logic/email.ts';
import { validateCronSecret } from './utils/security.ts';
import { logAudit } from './utils/audit.ts';

Deno.serve(async (req, info) => {
  // 0. Security Check
  const cronSecret = Deno.env.get('CRON_SECRET');
  const authHeader = req.headers.get('Authorization');

  if (!validateCronSecret(authHeader, cronSecret)) {
    logAudit({
      action: 'sendSyncFailedEmail',
      status: 'failure',
      details: { error: 'Unauthorized', ip: info.remoteAddr.hostname || 'unknown' }
    });
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: any;
  try {
    // 1. Safe JSON parsing
    try {
      // Deno/Vite environment issue: cloning req fails if stream consumed.
      // Just read once. If logic needs separation, assign to variable.
      body = await req.json();
    } catch (e) {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    
    // 2. Create Context
    const ctx: EmailContext = {
      getUser: async (userId: string) => {
        const users = await base44.asServiceRole.entities.User.filter({ id: userId });
        return users && users.length > 0 ? users[0] : null;
      },
      sendEmail: async (to: string, subject: string, emailBody: string) => {
        await base44.asServiceRole.integrations.Core.SendEmail({
          from_name: 'Zerithum',
          to: to,
          subject: subject,
          body: emailBody
        });
      }
    };

    // 3. Invoke Logic
    const result = await sendSyncFailedEmailLogic(ctx, body);
    
    return Response.json(result);
  } catch (error: any) {
    // 4. Secure Error Handling
    console.error('Sync failed email error:', error);

    // Distinguish between known logic errors and internal errors if needed
    // logic/email.ts throws generic Errors for validation.
    if (error.message === 'User not found' || error.message.startsWith('Invalid')) {
       return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
