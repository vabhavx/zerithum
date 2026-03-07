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
    getPayPalAccessToken,
    PAYPAL_API_BASE,
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
                            : resource.billing_info?.cycle_executions?.[0]?.next_billing_time
                                ? new Date(resource.billing_info.cycle_executions[0].next_billing_time).toISOString()
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

                // DO NOT zero out entitlements immediately if the period is still active.
                // This prevents "stolen" access for days already paid.
                const { data: sub } = await supabase
                    .from('subscriptions')
                    .select('current_period_end')
                    .eq('paypal_subscription_id', paypalSubscriptionId)
                    .maybeSingle();

                const now = new Date();
                const periodEnd = sub?.current_period_end ? new Date(sub.current_period_end) : null;

                if (!periodEnd || periodEnd <= now) {
                    await supabase.from('entitlements').upsert(
                        { user_id: userId, max_platforms: 0, updated_at: new Date().toISOString() },
                        { onConflict: 'user_id' },
                    );
                }
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

                // Only update plan/entitlement info — do NOT change status.
                // Status lifecycle is driven by dedicated status events (ACTIVATED, PAYMENT.FAILED, SUSPENDED, CANCELLED, EXPIRED).
                await supabase
                    .from('subscriptions')
                    .update({
                        paypal_plan_id: newPlanId,
                        plan,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('paypal_subscription_id', paypalSubscriptionId);

                await supabase.from('entitlements').upsert(
                    { user_id: userId, max_platforms: maxPlatforms, updated_at: new Date().toISOString() },
                    { onConflict: 'user_id' },
                );
                break;
            }

            case 'BILLING.SUBSCRIPTION.PAYMENT.SUCCEEDED':
            case 'PAYMENT.SALE.COMPLETED': {
                const subIdForSuccess = paypalSubscriptionId || resource?.billing_agreement_id;
                if (!subIdForSuccess) break;

                try {
                    // Fetch updated subscription from PayPal to get new billing period end date
                    const accessToken = await getPayPalAccessToken();
                    const subDetailsResponse = await fetch(
                        `${PAYPAL_API_BASE}/v1/billing/subscriptions/${subIdForSuccess}`,
                        { headers: { 'Authorization': `Bearer ${accessToken}` } }
                    );

                    let newPeriodEnd = null;
                    if (subDetailsResponse.ok) {
                        const subDetails = await subDetailsResponse.json();
                        newPeriodEnd = subDetails.billing_info?.next_billing_time
                            ? new Date(subDetails.billing_info.next_billing_time).toISOString()
                            : null;
                    }

                    // Update subscription with renewed period end date
                    await supabase.from('subscriptions').update({
                        status: 'ACTIVE',
                        current_period_end: newPeriodEnd,
                        updated_at: new Date().toISOString(),
                    }).eq('paypal_subscription_id', subIdForSuccess);

                    // Also ensure entitlements are set (in case they were zeroed by missed event)
                    const { data: sub } = await supabase
                        .from('subscriptions')
                        .select('paypal_plan_id')
                        .eq('paypal_subscription_id', subIdForSuccess)
                        .maybeSingle();

                    if (sub?.paypal_plan_id) {
                        const maxPlatforms = getPlanEntitlements(sub.paypal_plan_id);
                        await supabase.from('entitlements').upsert(
                            { user_id: userId, max_platforms: maxPlatforms, updated_at: new Date().toISOString() },
                            { onConflict: 'user_id' }
                        );
                    }
                } catch (error) {
                    console.error(`Error processing payment success for ${subIdForSuccess}:`, error);
                    // Continue without failing — the subscription status was updated even if entitlement refresh failed
                }
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
