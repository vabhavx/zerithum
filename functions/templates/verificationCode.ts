import { renderEmailLayout } from './layout.ts';

export type VerificationPurpose = 'password_change' | 'delete_account' | 'revoke_sessions';

const PURPOSE_TITLES: Record<VerificationPurpose, string> = {
    password_change: 'Password Change',
    delete_account: 'Account Deletion',
    revoke_sessions: 'Sign Out All Devices'
};

const PURPOSE_DESCRIPTIONS: Record<VerificationPurpose, string> = {
    password_change: 'change your password',
    delete_account: 'delete your account',
    revoke_sessions: 'sign out from all devices'
};

export function getVerificationEmailHtml(purpose: VerificationPurpose, code: string): string {
    const title = PURPOSE_TITLES[purpose];
    const description = PURPOSE_DESCRIPTIONS[purpose];

    const content = `
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
    `;

    const additionalStyles = `
      .code-box { background: #f8fafc; border: 2px dashed #f97316; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
      .code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #f97316; font-family: monospace; }
      .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 20px 0; font-size: 14px; }
    `;

    return renderEmailLayout({
      title: `🔐 ${title} Verification`,
      content,
      footerContent: 'This is an automated security email from Zerithum.',
      additionalStyles,
      // Uses default orange gradient
    });
}
