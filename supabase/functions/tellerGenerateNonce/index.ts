/**
 * Teller Generate Nonce
 * Auth required — generates a cryptographic nonce for Teller Connect enrollment.
 * The nonce is stored server-side and used to verify enrollment signatures.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/utils/cors.ts';
import { logAudit } from '../_shared/utils/audit.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const tellerAppId = Deno.env.get('TELLER_APP_ID')!;

const NONCE_EXPIRY_MINUTES = 10;

Deno.serve(async (req) => {
    const corsHeaders = getCorsHeaders(req);

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Authenticate
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            global: { headers: { Authorization: authHeader } },
        });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
        }

        const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);

        // Generate nonce
        const nonce = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + NONCE_EXPIRY_MINUTES * 60 * 1000).toISOString();

        // Store nonce
        const { error: insertError } = await serviceSupabase
            .from('teller_nonces')
            .insert({
                user_id: user.id,
                nonce,
                expires_at: expiresAt,
                consumed: false,
            });

        if (insertError) {
            console.error('[TellerNonce] Insert error:', insertError);
            return Response.json({ error: 'Failed to generate nonce' }, { status: 500, headers: corsHeaders });
        }

        await logAudit(null, {
            action: 'teller_nonce_generated',
            actor_id: user.id,
            resource_type: 'teller_nonce',
            status: 'success',
        });

        return Response.json(
            {
                nonce,
                applicationId: tellerAppId,
                environment: 'development',
            },
            { headers: corsHeaders }
        );
    } catch (error: any) {
        console.error('[TellerNonce] Error:', error);
        return Response.json(
            { error: 'Internal error' },
            { status: 500, headers: getCorsHeaders(req) }
        );
    }
});
