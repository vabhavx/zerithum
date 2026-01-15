import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // platform identifier
    const error = url.searchParams.get('error');

    if (error) {
      console.error(`OAuth error param: ${error}`);
      return Response.json({ error: 'OAuth provider reported an error' }, { status: 400 });
    }

    if (!code || !state) {
      return Response.json({ error: 'Missing code or state parameter' }, { status: 400 });
    }

    const platform = state;
    const redirectUri = `${url.origin}/auth/callback`;

    let tokenData;

    // Exchange code for tokens based on platform
    switch (platform) {
      case 'youtube': {
        const clientId = Deno.env.get('YOUTUBE_CLIENT_ID');
        const clientSecret = Deno.env.get('YOUTUBE_CLIENT_SECRET');

        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code'
          })
        });

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.text();
          console.error(`YouTube token exchange failed: ${errorData}`);
          throw new Error('Token exchange failed');
        }

        tokenData = await tokenResponse.json();
        break;
      }

      case 'patreon': {
        const clientId = Deno.env.get('PATREON_CLIENT_ID');
        const clientSecret = Deno.env.get('PATREON_CLIENT_SECRET');

        const tokenResponse = await fetch('https://www.patreon.com/api/oauth2/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            grant_type: 'authorization_code',
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri
          })
        });

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.text();
          console.error(`Patreon token exchange failed: ${errorData}`);
          throw new Error('Token exchange failed');
        }

        tokenData = await tokenResponse.json();
        break;
      }

      case 'stripe': {
        const clientId = Deno.env.get('STRIPE_CLIENT_ID');
        const clientSecret = Deno.env.get('STRIPE_CLIENT_SECRET');

        const tokenResponse = await fetch('https://connect.stripe.com/oauth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            grant_type: 'authorization_code',
            client_secret: clientSecret
          })
        });

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.text();
          console.error(`Stripe token exchange failed: ${errorData}`);
          throw new Error('Token exchange failed');
        }

        tokenData = await tokenResponse.json();
        break;
      }

      case 'instagram': {
        const clientId = Deno.env.get('INSTAGRAM_CLIENT_ID');
        const clientSecret = Deno.env.get('INSTAGRAM_CLIENT_SECRET');

        const params = new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          code
        });

        const instagramTokenResponse = await fetch(`https://graph.facebook.com/v20.0/oauth/access_token?${params}`);

        if (!instagramTokenResponse.ok) {
          const errorData = await instagramTokenResponse.text();
          console.error(`Instagram token exchange failed: ${errorData}`);
          throw new Error('Token exchange failed');
        }

        tokenData = await instagramTokenResponse.json();
        break;
      }

      case 'tiktok': {
        const clientKey = Deno.env.get('TIKTOK_CLIENT_KEY');
        const clientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET');

        const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_key: clientKey,
            client_secret: clientSecret,
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri
          })
        });

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.text();
          console.error(`TikTok token exchange failed: ${errorData}`);
          throw new Error('Token exchange failed');
        }

        const tiktokData = await tokenResponse.json();
        tokenData = tiktokData.data;
        break;
      }

      default:
        return Response.json({ error: 'Unknown platform' }, { status: 400 });
    }

    // Calculate token expiry
    const expiresAt = new Date();
    if (tokenData.expires_in) {
      expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);
    } else {
      expiresAt.setHours(expiresAt.getHours() + 1); // Default 1 hour
    }

    // Store connection using service role
    const connection = await base44.asServiceRole.entities.ConnectedPlatform.create({
      user_id: user.id,
      platform: platform,
      oauth_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      expires_at: expiresAt.toISOString(),
      sync_status: 'active',
      connected_at: new Date().toISOString(),
      last_synced_at: new Date().toISOString()
    });

    // Trigger initial sync
    try {
      await base44.asServiceRole.functions.invoke('syncPlatformData', {
        connectionId: connection.id,
        platform: platform
      });
    } catch (syncError) {
      console.error('Initial sync failed:', syncError);
    }

    // Return success response that redirects to the app
    return new Response(
      `<html><body><script>window.opener.postMessage({type: 'oauth_success', platform: '${platform}'}, '*'); window.close();</script></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );

  } catch (error) {
    console.error('OAuth callback error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
