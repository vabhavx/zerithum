
import { escapeHtml } from '../utils/html.ts';
import { renderEmailLayout } from '../templates/layout.ts';

export interface WelcomeEmailContext {
  sendEmail: (to: string, subject: string, body: string) => Promise<void>;
}

export async function sendWelcomeEmailLogic(
  ctx: WelcomeEmailContext,
  params: { userId: string; userEmail: string; userName?: string }
) {
  const { userId, userEmail, userName } = params;

  if (!userId) throw new Error('Invalid userId');
  if (!userEmail) throw new Error('Invalid userEmail');

  const safeUserName = escapeHtml(userName || 'there');

  const content = `
      <p>Hi ${safeUserName},</p>

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
  `;

  const additionalStyles = `
    .cta-button { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .steps { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .step { margin: 15px 0; display: flex; align-items: start; }
    .step-number { background: #6366f1; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; flex-shrink: 0; }
  `;

  const footerContent = `
    <p>Zerithum - Creator Finance Intelligence</p>
    <p style="font-size: 12px; color: #999;">You received this because you signed up for Zerithum.</p>
  `;

  const emailBody = renderEmailLayout({
    title: '🎉 Welcome to Zerithum!',
    content,
    footerContent,
    headerGradient: { from: '#6366f1', to: '#8b5cf6' },
    additionalStyles
  });

  await ctx.sendEmail(userEmail, 'Welcome to Zerithum! 🎉 Consolidate your creator earnings in minutes', emailBody);
}
