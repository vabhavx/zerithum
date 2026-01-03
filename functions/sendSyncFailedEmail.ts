import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userId, platform, errorMessage } = await req.json();
    
    const user = await base44.asServiceRole.entities.User.filter({ id: userId });
    if (!user || user.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    
    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .error-box { background: #fef2f2; border: 2px solid #ef4444; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .cta-button { display: inline-block; background: #ef4444; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ ${platform} Sync Failed</h1>
    </div>
    <div class="content">
      <p>Hi ${user[0].full_name || 'there'},</p>
      
      <p>We encountered an issue syncing your ${platform} account.</p>
      
      <div class="error-box">
        <strong>What happened:</strong><br/>
        ${errorMessage || 'Connection timeout or authentication expired.'}
      </div>
      
      <p><strong>Quick fix:</strong></p>
      <ol>
        <li>Go to Connected Platforms</li>
        <li>Disconnect ${platform}</li>
        <li>Reconnect with fresh credentials</li>
      </ol>
      
      <a href="https://zerithum-copy-36d43903.base44.app/ConnectedPlatforms" class="cta-button">Fix Now →</a>
      
      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        Still having trouble? Reply to this email and we'll help you out.
      </p>
    </div>
  </div>
</body>
</html>
    `;
    
    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'Zerithum',
      to: user[0].email,
      subject: `⚠️ ${platform} sync failed - action needed`,
      body: emailBody
    });
    
    return Response.json({ success: true });
  } catch (error) {
    console.error('Sync failed email error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});