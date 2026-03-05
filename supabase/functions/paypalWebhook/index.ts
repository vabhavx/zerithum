/**
 * PayPal Webhook Receiver
 * Public endpoint — no JWT required
 * Verifies PayPal signature, deduplicates events, updates subscription + entitlements
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
    verifyWebhookSignature,
    getPlanEntitlements,
    getPlanName,
} from '../_shared/utils/paypal.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        const rawBody = await req.text();
        const event = JSON.parse(rawBody);
        const eventId = event.id;
        const eventType = event.event_type;

        if (!eventId || !eventType) {
            return Response.json({ error: 'Invalid event payload' }, { status: 400 });
        }

        // Verify webhook signature with PayPal
        const verified = await verifyWebhookSignature(req.headers, rawBody);

        // Idempotency check
        const { data: existing } = await supabase
            .from('webhook_events')
            .select('id')
            .eq('event_id', eventId)
            .maybeSingle();

        if (existing) {
            console.log(`Duplicate webhook event ${eventId}, skipping`);
            return Response.json({ status: 'duplicate' }, { status: 200 });
        }

        // Store the event
        await supabase.from('webhook_events').insert({
            provider: 'paypal',
            event_id: eventId,
            event_type: eventType,
            verified,
            payload: event,
            processed: false,
        });

        // Do NOT process unverified events
        if (!verified) {
            console.error(`Webhook verification FAILED for event ${eventId}`);
            return Response.json({ status: 'verification_failed' }, { status: 200 });
        }

        // Extract subscription resource
        const resource = event.resource;
        const paypalSubscriptionId = resource?.id;
        const customId = resource?.custom_id; // Our user_id
        const planId = resource?.plan_id;

        if (!paypalSubscriptionId) {
            await supabase.from('webhook_events').update({ processed: true }).eq('event_id', eventId);
            return Response.json({ status: 'no_subscription_id' }, { status: 200 });
        }

        // Resolve user_id from custom_id or existing subscription record
        let userId = customId;
        if (!userId) {
            const { data: sub } = await supabase
                .from('subscriptions')
                .select('user_id')
                .eq('paypal_subscription_id', paypalSubscriptionId)
                .maybeSingle();
            userId = sub?.user_id;
        }

        if (!userId) {
            console.error(`Cannot resolve user_id for subscription ${paypalSubscriptionId}`);
            await supabase.from('webhook_events').update({ processed: true }).eq('event_id', eventId);
            return Response.json({ status: 'no_user_id' }, { status: 200 });
        }

        // Process by event type
        switch (eventType) {
            case 'BILLING.SUBSCRIPTION.CREATED': {
                // Use a smarter approach to avoid overwriting ACTIVE status
                const { data: currentSub } = await supabase
                    .from('subscriptions')
                    .select('status')
                    .eq('paypal_subscription_id', paypalSubscriptionId)
                    .maybeSingle();

                if (!currentSub || (currentSub.status !== 'ACTIVE' && currentSub.status !== 'CANCELLED' && currentSub.status !== 'EXPIRED')) {
                    await supabase.from('subscriptions').upsert(
                        {
                            user_id: userId,
                            provider: 'paypal',
                            paypal_subscription_id: paypalSubscriptionId,
                            paypal_plan_id: planId,
                            plan: getPlanName(planId),
                            status: 'PENDING',
                            updated_at: new Date().toISOString(),
                        },
                        { onConflict: 'paypal_subscription_id' },
                    );
                }
                break;
            }

            case 'BILLING.SUBSCRIPTION.ACTIVATED':
            case 'BILLING.SUBSCRIPTION.RE-ACTIVATED': {
                const maxPlatforms = getPlanEntitlements(planId);
                const plan = getPlanName(planId);

                await supabase.from('subscriptions').upsert(
                    {
                        user_id: userId,
                        provider: 'paypal',
                        paypal_subscription_id: paypalSubscriptionId,
                        paypal_plan_id: planId,
                        plan,
                        status: 'ACTIVE',
                        current_period_start: resource.billing_info?.last_payment?.time
                            ? new Date(resource.billing_info.last_payment.time).toISOString()
                            : new Date().toISOString(),
                        current_period_end: resource.billing_info?.next_billing_time
                            ? new Date(resource.billing_info.next_billing_time).toISOString()
                            : null,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'paypal_subscription_id' },
                );

                await supabase.from('entitlements').upsert(
                    { user_id: userId, max_platforms: maxPlatforms, updated_at: new Date().toISOString() },
                    { onConflict: 'user_id' },
                );
                break;
            }

            case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED': {
                await supabase
                    .from('subscriptions')
                    .update({ status: 'PAYMENT_FAILED', updated_at: new Date().toISOString() })
                    .eq('paypal_subscription_id', paypalSubscriptionId);

                await supabase.from('entitlements').upsert(
                    { user_id: userId, max_platforms: 0, updated_at: new Date().toISOString() },
                    { onConflict: 'user_id' },
                );
                break;
            }

            case 'BILLING.SUBSCRIPTION.SUSPENDED': {
                await supabase
                    .from('subscriptions')
                    .update({ status: 'SUSPENDED', updated_at: new Date().toISOString() })
                    .eq('paypal_subscription_id', paypalSubscriptionId);

                await supabase.from('entitlements').upsert(
                    { user_id: userId, max_platforms: 0, updated_at: new Date().toISOString() },
                    { onConflict: 'user_id' },
                );
                break;
            }

            case 'BILLING.SUBSCRIPTION.CANCELLED': {
                await supabase
                    .from('subscriptions')
                    .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
                    .eq('paypal_subscription_id', paypalSubscriptionId);

                await supabase.from('entitlements').upsert(
                    { user_id: userId, max_platforms: 0, updated_at: new Date().toISOString() },
                    { onConflict: 'user_id' },
                );
                break;
            }

            case 'BILLING.SUBSCRIPTION.EXPIRED': {
                await supabase
                    .from('subscriptions')
                    .update({ status: 'EXPIRED', updated_at: new Date().toISOString() })
                    .eq('paypal_subscription_id', paypalSubscriptionId);

                await supabase.from('entitlements').upsert(
                    { user_id: userId, max_platforms: 0, updated_at: new Date().toISOString() },
                    { onConflict: 'user_id' },
                );
                break;
            }

            case 'BILLING.SUBSCRIPTION.UPDATED': {
                const newPlanId = planId || resource?.plan_id;
                const maxPlatforms = getPlanEntitlements(newPlanId);
                const plan = getPlanName(newPlanId);

                await supabase
                    .from('subscriptions')
                    .update({
                        paypal_plan_id: newPlanId,
                        plan,
                        status: 'ACTIVE',
                        updated_at: new Date().toISOString(),
                    })
                    .eq('paypal_subscription_id', paypalSubscriptionId);

                await supabase.from('entitlements').upsert(
                    { user_id: userId, max_platforms: maxPlatforms, updated_at: new Date().toISOString() },
                    { onConflict: 'user_id' },
                );
                break;
            }

            default:
                console.log(`Unhandled event type: ${eventType}`);
        }

        // Mark event as processed
        await supabase.from('webhook_events').update({ processed: true }).eq('event_id', eventId);

        return Response.json({ status: 'ok' }, { status: 200 });
    } catch (error: any) {
        console.error('Webhook processing error:', error);
        return Response.json({ error: 'Internal error' }, { status: 500 });
    }
});
