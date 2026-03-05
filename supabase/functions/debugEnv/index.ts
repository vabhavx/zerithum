Deno.serve(async (req) => {
  return new Response(JSON.stringify({
    PAYPAL_PLAN_ID_STARTER_9: Deno.env.get('PAYPAL_PLAN_ID_STARTER_9'),
    PAYPAL_PLAN_ID_PRO_20: Deno.env.get('PAYPAL_PLAN_ID_PRO_20'),
    PAYPAL_WEBHOOK_ID_LIVE: Deno.env.get('PAYPAL_WEBHOOK_ID_LIVE')
  }), { headers: { 'Content-Type': 'application/json' } });
});
