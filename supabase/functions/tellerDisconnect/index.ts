/**
 * Teller Disconnect
 * Auth required — disconnects a bank connection.
 * Bank transactions are preserved for audit trail.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/utils/cors.ts';
import { logAudit } from '../_shared/utils/audit.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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

        const body = await req.json();
        const { connectionId } = body;

        if (!connectionId) {
            return Response.json({ error: 'connectionId is required' }, { status: 400, headers: corsHeaders });
        }

        // Verify ownership and update status
        const { data: connection, error: updateError } = await serviceSupabase
            .from('bank_connections')
            .update({
                status: 'disconnected',
                error_message: null,
            })
            .eq('id', connectionId)
            .eq('user_id', user.id)
            .select()
            .maybeSingle();

        if (updateError || !connection) {
            return Response.json({ error: 'Bank connection not found' }, { status: 404, headers: corsHeaders });
        }

        await logAudit(null, {
            action: 'teller_disconnected',
            actor_id: user.id,
            resource_id: connectionId,
            resource_type: 'bank_connection',
            status: 'success',
            details: {
                enrollment_id: connection.teller_enrollment_id,
                institution: connection.institution_name,
            },
        });

        return Response.json(
            { success: true },
            { headers: corsHeaders }
        );
    } catch (error: any) {
        console.error('[TellerDisconnect] Error:', error);
        return Response.json(
            { error: 'Internal error' },
            { status: 500, headers: getCorsHeaders(req) }
        );
    }
});
