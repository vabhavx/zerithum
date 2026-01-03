import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const PLATFORM_CONFIG = {
  youtube: {
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientId: '985180453886-8qbvanuid2ifpdoq84culbg4gta83rbn.apps.googleusercontent.com',
    clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
    redirectUri: 'https://zerithum-copy-36d43903.base44.app/authcallback'
  },
  patreon: {
    tokenUrl: 'https://www.patreon.com/api/oauth2/token',
    clientId: 'i1ircOfqA2eD5ChN4-d6uElxt4vjWzIEv4vCfj0K_92LqilSM5OA_dJS24uFjiTR',
    clientSecretEnv: 'PATREON_CLIENT_SECRET',
    redirectUri: 'https://zerithum-copy-36d43903.base44.app/authcallback'
  },
  stripe: {
    tokenUrl: 'https://connect.stripe.com/oauth/token',
    clientId: 'YOUR_STRIPE_CLIENT_ID',
    clientSecretEnv: 'STRIPE_CLIENT_SECRET',
    redirectUri: 'https://zerithum-copy-36d43903.base44.app/authcallback'
  },
  instagram: {
    tokenUrl: 'https://graph.facebook.com/v20.0/oauth/access_token',
    clientId: 'YOUR_META_APP_ID',
    clientSecretEnv: 'META_APP_SECRET',
    redirectUri: 'https://zerithum-copy-36d43903.base44.app/authcallback'
  },
  tiktok: {
    tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
    clientKey: 'YOUR_TIKTOK_CLIENT_KEY',
    clientSecretEnv: 'TIKTOK_CLIENT_SECRET',
    redirectUri: 'https://zerithum-copy-36d43903.base44.app/authcallback'
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code, platform } = await req.json();

    if (!code || !platform) {
      return Response.json({ error: 'Code and platform are required' }, { status: 400 });
    }

    const config = PLATFORM_CONFIG[platform];
    if (!config) {
      return Response.json({ error: 'Unsupported platform' }, { status: 400 });
    }

    const clientSecret = Deno.env.get(config.clientSecretEnv);
    if (!clientSecret) {
      return Response.json({ 
        error: `${platform} OAuth not configured. Please set ${config.clientSecretEnv} in environment variables.` 
      }, { status: 500 });
    }

    // Build token request
    const tokenParams = {
      code,
      grant_type: 'authorization_code',
      redirect_uri: config.redirectUri
    };

    if (platform === 'tiktok') {
      tokenParams.client_key = config.clientKey;
      tokenParams.client_secret = clientSecret;
    } else {
      tokenParams.client_id = config.clientId;
      tokenParams.client_secret = clientSecret;
    }

    const tokenResponse = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(tokenParams),
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
    expiresAt.setSeconds(expiresAt.getSeconds() + (tokens.expires_in || 3600));

    // UPSERT: Check if connection already exists for this user+platform
    const existingConnections = await base44.asServiceRole.entities.ConnectedPlatform.filter({
      user_id: user.id,
      platform: platform
    });

    const connectionData = {
      user_id: user.id,
      platform: platform,
      oauth_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      expires_at: expiresAt.toISOString(),
      sync_status: 'active',
      connected_at: existingConnections.length > 0 ? existingConnections[0].connected_at : new Date().toISOString(),
      last_synced_at: new Date().toISOString(),
      error_message: null
    };

    if (existingConnections.length > 0) {
      // Update existing connection for this user
      await base44.asServiceRole.entities.ConnectedPlatform.update(
        existingConnections[0].id, 
        connectionData
      );
    } else {
      // Create new connection for this user
      await base44.asServiceRole.entities.ConnectedPlatform.create(connectionData);
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