
import { escapeHtml } from '../utils/html.ts';

export { escapeHtml };

export interface EmailContext {
  getUser: (userId: string) => Promise<{ id: string; email: string; full_name?: string } | null>;
  sendEmail: (to: string, subject: string, body: string) => Promise<void>;
}

export async function sendSyncFailedEmailLogic(
  ctx: EmailContext,
  params: { userId: string; platform: string; errorMessage: string }
) {
  const { userId, platform, errorMessage } = params;

  if (!userId || typeof userId !== 'string') {
    throw new Error("Invalid userId");
  }
  if (!platform || typeof platform !== 'string') {
    throw new Error("Invalid platform");
  }

  const user = await ctx.getUser(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const sanitizedError = errorMessage ? escapeHtml(errorMessage) : 'Connection timeout or authentication expired.';
  const sanitizedPlatform = escapeHtml(platform);

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
      <h1>⚠️ ${sanitizedPlatform} Sync Failed</h1>
    </div>
    <div class="content">
      <p>Hi ${escapeHtml(user.full_name || 'there')},</p>

      <p>We encountered an issue syncing your ${sanitizedPlatform} account.</p>

      <div class="error-box">
        <strong>What happened:</strong><br/>
        ${sanitizedError}
      </div>

      <p><strong>Quick fix:</strong></p>
      <ol>
        <li>Go to Connected Platforms</li>
        <li>Disconnect ${sanitizedPlatform}</li>
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

  await ctx.sendEmail(user.email, `⚠️ ${sanitizedPlatform} sync failed - action needed`, emailBody);

  return { success: true };
}
