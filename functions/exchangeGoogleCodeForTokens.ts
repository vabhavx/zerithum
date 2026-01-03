import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code, platform } = await req.json();

    if (!code) {
      return Response.json({ error: 'Authorization code is required' }, { status: 400 });
    }

    // Exchange code for tokens with Google
    const clientId = "985180453886-8qbvanuid2ifpdoq84culbg4gta83rbn.apps.googleusercontent.com";
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const redirectUri = "https://zerithum-copy-36d43903.base44.app/authcallback";

    if (!clientSecret) {
      return Response.json({ 
        error: 'Google OAuth not configured. Please set GOOGLE_CLIENT_SECRET in environment variables.' 
      }, { status: 500 });
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      return Response.json({ 
        error: 'Failed to exchange code for tokens', 
        details: errorData 
      }, { status: 400 });
    }

    const tokens = await tokenResponse.json();

    // Calculate token expiry
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

    // Check if connection already exists
    const existingConnections = await base44.entities.ConnectedPlatform.filter({
      user_id: user.id,
      platform: platform || "youtube"
    });

    if (existingConnections.length > 0) {
      // Update existing connection
      await base44.asServiceRole.entities.ConnectedPlatform.update(existingConnections[0].id, {
        oauth_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt.toISOString(),
        sync_status: "active",
        connected_at: new Date().toISOString(),
        last_synced_at: new Date().toISOString(),
        error_message: null
      });
    } else {
      // Create new connection
      await base44.asServiceRole.entities.ConnectedPlatform.create({
        user_id: user.id,
        platform: platform || "youtube",
        oauth_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt.toISOString(),
        sync_status: "active",
        connected_at: new Date().toISOString(),
        last_synced_at: new Date().toISOString()
      });
    }

    return Response.json({ 
      success: true,
      message: 'Platform connected successfully'
    });

  } catch (error) {
    console.error('Token exchange error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});