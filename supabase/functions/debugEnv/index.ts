Deno.serve(async (req) => {
  return new Response(JSON.stringify({
    OAUTH_REDIRECT_URI: Deno.env.get('OAUTH_REDIRECT_URI'),
    GUMROAD_CLIENT_ID: Deno.env.get('GUMROAD_CLIENT_ID')
  }), { headers: { 'Content-Type': 'application/json' } });
});
