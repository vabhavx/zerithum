import { createClient } from 'npm:@supabase/supabase-js@2';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { logAudit } from './utils/audit.ts';
import {
    generateOTPCode,
    checkRateLimit,
    RATE_LIMITS,
    SECURITY_ACTIONS,
    extractClientInfo,
    sanitizeErrorMessage
} from './logic/security.ts';
import { escapeHtml } from './utils/html.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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

        // Send email with OTP using base44 SDK
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

        try {
            // Use base44 SDK to send email
            const base44 = createClientFromRequest(req);

            const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .code-box { background: #f8fafc; border: 2px dashed #f97316; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #f97316; font-family: monospace; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 20px 0; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 ${escapeHtml(purposeTitles[purpose])} Verification</h1>
    </div>
    <div class="content">
      <p>Hi there,</p>

      <p>You requested to <strong>${escapeHtml(purposeDescriptions[purpose])}</strong>. Use the verification code below to confirm this action:</p>

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
  </div>
</body>
</html>
            `;

            await base44.asServiceRole.integrations.Core.SendEmail({
                from_name: 'Zerithum Security',
                to: user.email,
                subject: `Your Zerithum Verification Code: ${code}`,
                body: emailBody
            });

            console.log(`[OTP] Email sent to ${user.email} for ${purpose}`);
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            // Delete the stored code if email fails
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
