
export const PURPOSE_DESCRIPTIONS: Record<string, string> = {
    password_change: 'change your password',
    delete_account: 'delete your account',
    revoke_sessions: 'sign out from all devices'
};

export const PURPOSE_TITLES: Record<string, string> = {
    password_change: 'Password Change',
    delete_account: 'Account Deletion',
    revoke_sessions: 'Sign Out All Devices'
};

export function getVerificationEmailHtml(code: string, purpose: string): string {
    const title = PURPOSE_TITLES[purpose] || 'Verification';
    const description = PURPOSE_DESCRIPTIONS[purpose] || 'perform this action';

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .code-box { background: #f8fafc; border: 2px dashed #f97316; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #f97316; font-family: monospace; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 20px 0; font-size: 14px; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 ${title} Verification</h1>
    </div>
    <div class="content">
      <p>Hi there,</p>
      <p>You requested to <strong>${description}</strong>. Use the verification code below to confirm this action:</p>
      <div class="code-box">
        <div class="code">${code}</div>
      </div>
      <p><strong>This code expires in 10 minutes.</strong></p>
      <div class="warning">
        ⚠️ If you didn't request this, please ignore this email and your account will remain secure.
      </div>
      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        — The Zerithum Team
      </p>
    </div>
    <div class="footer">
      This is an automated security email from Zerithum.
    </div>
  </div>
</body>
</html>
    `;
}
