import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const REFRESH_CONFIG: Record<string, {
  tokenUrl: string;
  clientId?: string;
  clientSecretEnv: string;
}> = {
  youtube: {
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientId: Deno.env.get('GOOGLE_CLIENT_ID'),
    clientSecretEnv: 'GOOGLE_CLIENT_SECRET'
  },
  patreon: {
    tokenUrl: 'https://www.patreon.com/api/oauth2/token',
    clientId: Deno.env.get('PATREON_CLIENT_ID'),
    clientSecretEnv: 'PATREON_CLIENT_SECRET'
  },
  stripe: {
    tokenUrl: 'https://connect.stripe.com/oauth/token',
    clientId: Deno.env.get('STRIPE_CLIENT_ID'),
    clientSecretEnv: 'STRIPE_CLIENT_SECRET'
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { connectionId } = await req.json();

    if (!connectionId) {
      return Response.json({ error: 'Connection ID is required' }, { status: 400 });
    }

    // Get connection details - verify it belongs to the current user
    const connections = await base44.asServiceRole.entities.ConnectedPlatform.filter({ 
      id: connectionId,
      user_id: user.id
    });
    
    if (!connections || connections.length === 0) {
      return Response.json({ error: 'Connection not found or unauthorized' }, { status: 404 });
    }

    const connection = connections[0];

    if (!connection.refresh_token) {
      return Response.json({ error: 'No refresh token available' }, { status: 400 });
    }

    const config = REFRESH_CONFIG[connection.platform];
    if (!config) {
      return Response.json({ error: 'Token refresh not supported for this platform' }, { status: 400 });
    }

    const clientSecret = Deno.env.get(config.clientSecretEnv);
    if (!clientSecret) {
      console.error(`Missing client secret for ${connection.platform}`);
      return Response.json({ 
        error: 'OAuth configuration error'
      }, { status: 500 });
    }

    if (!config.clientId) {
      console.error(`Missing client ID for ${connection.platform}`);
      return Response.json({
        error: 'OAuth configuration error'
      }, { status: 500 });
    }

    // Refresh the token
    const refreshResponse = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: clientSecret,
        refresh_token: connection.refresh_token,
        grant_type: 'refresh_token'
      }),
    });

    if (!refreshResponse.ok) {
      const errorData = await refreshResponse.text();
      console.error('Token refresh failed:', errorData);
      return Response.json({ 
        error: 'Failed to refresh token'
      }, { status: 400 });
    }

    const tokens = await refreshResponse.json();

    // Calculate new expiry
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (tokens.expires_in || 3600));

    // Update connection with new token
    await base44.asServiceRole.entities.ConnectedPlatform.update(connectionId, {
      oauth_token: tokens.access_token,
      refresh_token: tokens.refresh_token || connection.refresh_token, // Keep old if new not provided
      expires_at: expiresAt.toISOString()
    });

    return Response.json({ 
      success: true,
      message: 'Token refreshed successfully'
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
