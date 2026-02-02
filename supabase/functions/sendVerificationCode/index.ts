import { createClient } from 'npm:@supabase/supabase-js@2';
import { logAudit } from '../_shared/utils/audit.ts';
import {
    generateOTPCode,
    checkRateLimit,
    RATE_LIMITS,
    SECURITY_ACTIONS,
    extractClientInfo,
    sanitizeErrorMessage
} from '../_shared/logic/security.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY');

async function sendEmailViaResend(to: string, subject: string, html: string): Promise<boolean> {
    if (!resendApiKey) {
        console.error('RESEND_API_KEY not configured - email will not be sent');
        // For development, just log the code and return success
        console.log(`[DEV MODE] Would send email to ${to}: ${subject}`);
        return true;
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'Zerithum Security <security@zerithum.com>',
                to: [to],
                subject,
                html
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Resend API error:', errorText);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Failed to send email via Resend:', error);
        return false;
    }
}

Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    let user: any = null;
    const clientInfo = extractClientInfo(req);

    try {
        // Create client with user's token for auth
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            global: { headers: { Authorization: authHeader } }
        });

        // Get authenticated user
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser) {
            return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
        }
        user = authUser;

        // Parse request body
        let body: { purpose: string };
        try {
            body = await req.json();
        } catch {
            return Response.json({ error: 'Invalid JSON body' }, { status: 400, headers: corsHeaders });
        }

        const { purpose } = body;
        if (!['password_change', 'delete_account', 'revoke_sessions'].includes(purpose)) {
            return Response.json({ error: 'Invalid purpose' }, { status: 400, headers: corsHeaders });
        }

        // Rate limiting
        const rateLimitKey = `otp_send:${user.id}`;
        const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.SEND_OTP);

        if (!rateLimitResult.allowed) {
            await logAudit(null, {
                action: SECURITY_ACTIONS.RATE_LIMIT_EXCEEDED,
                actor_id: user.id,
                status: 'warning',
                details: {
                    action_type: 'send_otp',
                    purpose,
                    ...clientInfo
                }
            });

            return Response.json({
                error: 'Too many verification code requests. Please wait before trying again.',
                retryAfter: Math.ceil((rateLimitResult.resetAt.getTime() - Date.now()) / 1000)
            }, { status: 429, headers: corsHeaders });
        }

        // Create admin client for service operations
        const adminClient = createClient(supabaseUrl, supabaseServiceKey);

        // Generate OTP
        const code = generateOTPCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store verification code
        const { error: insertError } = await adminClient
            .from('verification_codes')
            .insert({
                user_id: user.id,
                email: user.email,
                code,
                purpose,
                expires_at: expiresAt.toISOString()
            });

        if (insertError) {
            console.error('Failed to store verification code:', insertError);
            throw new Error('Failed to generate verification code');
        }

        // Prepare email content
        const purposeDescriptions: Record<string, string> = {
            password_change: 'change your password',
            delete_account: 'delete your account',
            revoke_sessions: 'sign out from all devices'
        };

        const purposeTitles: Record<string, string> = {
            password_change: 'Password Change',
            delete_account: 'Account Deletion',
            revoke_sessions: 'Sign Out All Devices'
        };

        const emailHtml = `
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
      <h1>🔐 ${purposeTitles[purpose]} Verification</h1>
    </div>
    <div class="content">
      <p>Hi there,</p>
      <p>You requested to <strong>${purposeDescriptions[purpose]}</strong>. Use the verification code below to confirm this action:</p>
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

        // Send email
        const emailSent = await sendEmailViaResend(
            user.email,
            `Your Zerithum Verification Code: ${code}`,
            emailHtml
        );

        if (!emailSent && resendApiKey) {
            // Only fail if Resend is configured but failed
            // Delete the stored code
            await adminClient
                .from('verification_codes')
                .delete()
                .eq('user_id', user.id)
                .eq('code', code);
            throw new Error('Failed to send verification email. Please try again.');
        }

        // Audit log
        await logAudit(null, {
            action: SECURITY_ACTIONS.OTP_SENT,
            actor_id: user.id,
            status: 'success',
            details: {
                purpose,
                email_masked: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
                ...clientInfo
            }
        });

        return Response.json({
            ok: true,
            message: 'Verification code sent to your email',
            expiresIn: 600 // 10 minutes in seconds
        }, { headers: corsHeaders });

    } catch (error: any) {
        console.error('sendVerificationCode error:', error);

        await logAudit(null, {
            action: SECURITY_ACTIONS.OTP_SEND_FAILED,
            actor_id: user?.id,
            status: 'failure',
            details: {
                error: sanitizeErrorMessage(error),
                ...clientInfo
            }
        });

        return Response.json({
            error: error.message || sanitizeErrorMessage(error)
        }, { status: 500, headers: corsHeaders });
    }
});
