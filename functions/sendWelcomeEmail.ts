import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { sendWelcomeEmailLogic, WelcomeEmailContext } from './logic/welcomeEmail.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userId, userEmail, userName } = await req.json();

    const ctx: WelcomeEmailContext = {
      sendEmail: async (to, subject, body) => {
        await base44.asServiceRole.integrations.Core.SendEmail({
          from_name: 'Zerithum',
          to,
          subject,
          body
        });
      }
    };

    await sendWelcomeEmailLogic(ctx, { userId, userEmail, userName });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Welcome email error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
