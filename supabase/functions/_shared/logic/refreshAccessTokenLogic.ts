export interface ServiceResponse {
  status: number;
  body: any;
}

export interface RefreshAccessTokenContext {
  db: any;
  env: {
    get: (key: string) => string | undefined;
  };
  fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  encrypt: (text: string) => Promise<string>;
  decrypt: (text: string) => Promise<string>;
}

const REFRESH_CONFIG: Record<string, { tokenUrl: string; clientId?: string; clientIdEnv?: string; clientSecretEnv: string }> = {
  youtube: {
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientId: '985180453886-8qbvanuid2ifpdoq84culbg4gta83rbn.apps.googleusercontent.com',
    clientSecretEnv: 'GOOGLE_CLIENT_SECRET'
  },
  patreon: {
    tokenUrl: 'https://www.patreon.com/api/oauth2/token',
    clientId: 'i1ircOfqA2eD5ChN4-d6uElxt4vjWzIEv4vCfj0K_92LqilSM5OA_dJS24uFjiTR',
    clientSecretEnv: 'PATREON_CLIENT_SECRET'
  },
  stripe: {
    tokenUrl: 'https://connect.stripe.com/oauth/token',
    clientId: 'YOUR_STRIPE_CLIENT_ID',
    clientSecretEnv: 'STRIPE_CLIENT_SECRET'
  },
  twitch: {
    tokenUrl: 'https://id.twitch.tv/oauth2/token',
    clientIdEnv: 'TWITCH_CLIENT_ID',
    clientSecretEnv: 'TWITCH_CLIENT_SECRET'
  },
  square: {
    tokenUrl: 'https://connect.squareup.com/oauth2/token',
    clientIdEnv: 'SQUARE_CLIENT_ID',
    clientSecretEnv: 'SQUARE_CLIENT_SECRET'
  },
  gumroad: {
    tokenUrl: 'https://api.gumroad.com/oauth/token',
    clientIdEnv: 'GUMROAD_CLIENT_ID',
    clientSecretEnv: 'GUMROAD_CLIENT_SECRET'
  },
  tiktok: {
    tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
    clientIdEnv: 'TIKTOK_CLIENT_KEY',
    clientSecretEnv: 'TIKTOK_CLIENT_SECRET'
  },
  instagram: {
    tokenUrl: 'https://graph.facebook.com/v20.0/oauth/access_token',
    clientIdEnv: 'META_APP_ID',
    clientSecretEnv: 'META_APP_SECRET'
  }
};

export async function refreshAccessTokenLogic(
  ctx: RefreshAccessTokenContext,
  user: any,
  body: any
): Promise<ServiceResponse> {
  const { connectionId } = body;

  if (!connectionId) {
    return { status: 400, body: { error: 'Connection ID is required' } };
  }

  // Get connection details - verify it belongs to the current user
  const connections = await ctx.db.asServiceRole.entities.ConnectedPlatform.filter({
    id: connectionId,
    user_id: user.id
  });

  if (!connections || connections.length === 0) {
    return { status: 404, body: { error: 'Connection not found or unauthorized' } };
  }

  const connection = connections[0];

  if (!connection.refresh_token) {
    return { status: 400, body: { error: 'No refresh token available' } };
  }

  const refreshToken = await ctx.decrypt(connection.refresh_token);

  const config = REFRESH_CONFIG[connection.platform];
  if (!config) {
    return { status: 400, body: { error: 'Token refresh not supported for this platform' } };
  }

  const clientId = config.clientId || (config.clientIdEnv ? ctx.env.get(config.clientIdEnv) : undefined);
  if (!clientId) {
    return { status: 500, body: { error: `Client ID not configured for ${connection.platform}` } };
  }

  const clientSecret = ctx.env.get(config.clientSecretEnv);
  if (!clientSecret) {
    return {
      status: 500, body: {
        error: `OAuth not configured for ${connection.platform}`
      }
    };
  }

  const requestBody: any = {
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  };

  if (connection.platform === 'tiktok') {
    requestBody.client_key = clientId;
    delete requestBody.client_id;
  }

  // Refresh the token
  const refreshResponse = await ctx.fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': connection.platform === 'square' ? 'application/json' : 'application/x-www-form-urlencoded',
    },
    body: connection.platform === 'square' ? JSON.stringify(requestBody) : new URLSearchParams(requestBody),
  });

  if (!refreshResponse.ok) {
    const errorData = await refreshResponse.json();
    return {
      status: 400, body: {
        error: 'Failed to refresh token',
        details: errorData
      }
    };
  }

  const tokens = await refreshResponse.json();

  // Calculate new expiry
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + (tokens.expires_in || 3600));

  // Update connection with new token
  const updateData: any = {
    oauth_token: await ctx.encrypt(tokens.access_token),
    expires_at: expiresAt.toISOString()
  };

  if (tokens.refresh_token) {
    updateData.refresh_token = await ctx.encrypt(tokens.refresh_token);
  } else {
    // Re-encrypt the old token to ensure it's stored securely (migration)
    updateData.refresh_token = await ctx.encrypt(refreshToken);
  }

  await ctx.db.asServiceRole.entities.ConnectedPlatform.update(connectionId, updateData);

  return {
    status: 200, body: {
      success: true,
      message: 'Token refreshed successfully'
    }
  };
}
