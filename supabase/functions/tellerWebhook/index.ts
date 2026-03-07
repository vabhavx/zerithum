/**
 * Teller Webhook
 * Public endpoint — handles Teller webhook events:
 * - transactions.processed: triggers re-sync for the enrollment
 * - enrollment.disconnected: marks connection as reauth_required
 *
 * Webhook URL: https://pfhsqgkenjiugnegzcvx.supabase.co/functions/v1/tellerWebhook
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { logAudit } from '../_shared/utils/audit.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
    // Webhooks are always POST
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);
        const body = await req.json();

        const eventId = body.id;
        const eventType = body.type;
        const payload = body.payload || body;

        if (!eventType) {
            return new Response('Missing event type', { status: 400 });
        }

        // Idempotency check: skip if already processed
        if (eventId) {
            const { data: existing } = await serviceSupabase
                .from('webhook_events')
                .select('id')
                .eq('event_id', eventId)
                .maybeSingle();

            if (existing) {
                return Response.json({ status: 'already_processed' }, { status: 200 });
            }

            // Record event
            await serviceSupabase
                .from('webhook_events')
                .insert({
                    event_id: eventId,
                    provider: 'teller',
                    event_type: eventType,
                    payload: body,
                    processed_at: new Date().toISOString(),
                });
        }

        // Route by event type
        switch (eventType) {
            case 'transactions.processed': {
                const enrollmentId = payload.enrollment_id;
                if (!enrollmentId) break;

                // Find the connection and mark it for sync
                // The frontend will detect this and trigger a sync
                const { data: connection } = await serviceSupabase
                    .from('bank_connections')
                    .select('id, user_id')
                    .eq('teller_enrollment_id', enrollmentId)
                    .eq('status', 'active')
                    .maybeSingle();

                if (connection) {
                    await logAudit(null, {
                        action: 'teller_webhook_received',
                        actor_id: connection.user_id,
                        resource_id: connection.id,
                        resource_type: 'bank_connection',
                        status: 'success',
                        details: { event_type: eventType, enrollment_id: enrollmentId },
                    });
                }
                break;
            }

            case 'enrollment.disconnected': {
                const enrollmentId = payload.enrollment_id;
                if (!enrollmentId) break;

                const { data: connection } = await serviceSupabase
                    .from('bank_connections')
                    .update({
                        status: 'reauth_required',
                        error_message: 'Bank connection was disconnected. Please reconnect.',
                    })
                    .eq('teller_enrollment_id', enrollmentId)
                    .select('id, user_id')
                    .maybeSingle();

                if (connection) {
                    await logAudit(null, {
                        action: 'teller_webhook_received',
                        actor_id: connection.user_id,
                        resource_id: connection.id,
                        resource_type: 'bank_connection',
                        status: 'warning',
                        details: { event_type: eventType, enrollment_id: enrollmentId },
                    });
                }
                break;
            }

            default:
                console.log(`[TellerWebhook] Unhandled event type: ${eventType}`);
        }

        return Response.json({ status: 'ok' }, { status: 200 });
    } catch (error: any) {
        console.error('[TellerWebhook] Error:', error);
        // Return 200 to prevent Teller from retrying on processing errors
        return Response.json({ status: 'error', message: 'Processing failed' }, { status: 200 });
    }
});
