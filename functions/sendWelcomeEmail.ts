import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userId, userEmail, userName } = await req.json();

    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .content { background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .steps { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .step { margin: 15px 0; display: flex; align-items: start; }
    .step-number { background: #6366f1; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; flex-shrink: 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to Zerithum!</h1>
    </div>
    <div class="content">
      <p>Hi ${userName || 'there'},</p>
      
      <p>Welcome to Zerithum - the creator finance platform that finally makes sense of your multi-platform revenue.</p>
      
      <p>You're minutes away from consolidating all your earnings in one place.</p>
      
      <a href="https://zerithum-copy-36d43903.base44.app/ConnectedPlatforms" class="cta-button">Get Started →</a>
      
      <div class="steps">
        <h3 style="margin-top: 0; color: #111;">Quick Start Guide</h3>
        
        <div class="step">
          <div class="step-number">1</div>
          <div>
            <strong>Connect Your Platforms</strong><br/>
            Link YouTube, Patreon, Stripe, or any revenue source in 30 seconds.
          </div>
        </div>
        
        <div class="step">
          <div class="step-number">2</div>
          <div>
            <strong>Auto-Sync Your Earnings</strong><br/>
            Zerithum syncs your data automatically. First sync takes ~1 hour.
          </div>
        </div>
        
        <div class="step">
          <div class="step-number">3</div>
          <div>
            <strong>Track, Reconcile, Export</strong><br/>
            Get AI-powered insights, tax reports, and full revenue visibility.
          </div>
        </div>
      </div>
      
      <p><strong>Need help?</strong> Reply to this email or check our <a href="#">FAQ</a>.</p>
      
      <p>Let's go 🚀</p>
      
      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        - The Zerithum Team
      </p>
    </div>
    <div class="footer">
      <p>Zerithum - Creator Finance Intelligence</p>
      <p style="font-size: 12px; color: #999;">You received this because you signed up for Zerithum.</p>
    </div>
  </div>
</body>
</html>
    `;

    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'Zerithum',
      to: userEmail,
      subject: 'Welcome to Zerithum! 🎉 Consolidate your creator earnings in minutes',
      body: emailBody
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Welcome email error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});