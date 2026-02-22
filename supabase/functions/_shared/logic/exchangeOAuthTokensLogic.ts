export interface ExchangeTokensContext {
  envGet: (key: string) => string | undefined;
  fetch: (url: string, init?: any) => Promise<Response>;
  logError: (msg: string, ...args: any[]) => void;
  encrypt: (data: string) => Promise<string>;
  base44: any;
}

export interface ServiceResponse {
  status: number;
  body: any;
}

const PLATFORM_DEFS: Record<string, {
  tokenUrl: string;
  clientIdEnv?: string;
  clientKeyEnv?: string;
  clientSecretEnv: string;
  redirectUriEnv: string;
}> = {
  youtube: {
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientIdEnv: 'GOOGLE_CLIENT_ID',
    clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
    redirectUriEnv: 'OAUTH_REDIRECT_URI'
  },
  patreon: {
    tokenUrl: 'https://www.patreon.com/api/oauth2/token',
    clientIdEnv: 'PATREON_CLIENT_ID',
    clientSecretEnv: 'PATREON_CLIENT_SECRET',
    redirectUriEnv: 'OAUTH_REDIRECT_URI'
  },
  gumroad: {
    tokenUrl: 'https://gumroad.com/oauth/token',
    clientIdEnv: 'GUMROAD_CLIENT_ID',
    clientSecretEnv: 'GUMROAD_CLIENT_SECRET',
    redirectUriEnv: 'OAUTH_REDIRECT_URI'
  },
  stripe: {
    tokenUrl: 'https://connect.stripe.com/oauth/token',
    clientIdEnv: 'STRIPE_CLIENT_ID',
    clientSecretEnv: 'STRIPE_CLIENT_SECRET',
    redirectUriEnv: 'OAUTH_REDIRECT_URI'
  },
  instagram: {
    tokenUrl: 'https://graph.facebook.com/v20.0/oauth/access_token',
    clientIdEnv: 'META_APP_ID',
    clientSecretEnv: 'META_APP_SECRET',
    redirectUriEnv: 'OAUTH_REDIRECT_URI'
  },
  tiktok: {
    tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
    clientKeyEnv: 'TIKTOK_CLIENT_KEY',
    clientSecretEnv: 'TIKTOK_CLIENT_SECRET',
    redirectUriEnv: 'OAUTH_REDIRECT_URI'
  }
};

export async function exchangeOAuthTokens(
  ctx: ExchangeTokensContext,
  user: any,
  code: string,
  platform: string
): Promise<ServiceResponse> {
    if (!code || !platform) {
      return { status: 400, body: { error: 'Code and platform are required' } };
    }

    // Input Validation: specific check against allowed keys
    if (!Object.prototype.hasOwnProperty.call(PLATFORM_DEFS, platform)) {
       return { status: 400, body: { error: 'Unsupported platform' } };
    }

    const def = PLATFORM_DEFS[platform];

    const clientSecret = ctx.envGet(def.clientSecretEnv);
    if (!clientSecret) {
      ctx.logError(`Missing client secret env var: ${def.clientSecretEnv}`);
      return { status: 500, body: { error: 'OAuth configuration error' } };
    }

    const redirectUri = ctx.envGet(def.redirectUriEnv || 'OAUTH_REDIRECT_URI');

    if (!redirectUri) {
      ctx.logError('Missing OAUTH_REDIRECT_URI env var');
      return { status: 500, body: { error: 'OAuth configuration error' } };
    }

    let clientId: string | undefined;
    let clientKey: string | undefined;

    if (platform === 'tiktok') {
        clientKey = ctx.envGet(def.clientKeyEnv!);
        if (!clientKey) {
            ctx.logError('Missing TIKTOK_CLIENT_KEY env var');
            return { status: 500, body: { error: 'OAuth configuration error' } };
        }
    } else {
        clientId = ctx.envGet(def.clientIdEnv!);
        if (!clientId) {
            ctx.logError(`Missing Client ID env var for ${platform}`);
            return { status: 500, body: { error: 'OAuth configuration error' } };
        }
    }

    // Build token request
    const tokenParams: Record<string, string> = {
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    };

    if (platform === 'tiktok') {
      tokenParams.client_key = clientKey!;
      tokenParams.client_secret = clientSecret;
    } else {
      tokenParams.client_id = clientId!;
      tokenParams.client_secret = clientSecret;
    }

    const tokenResponse = await ctx.fetch(def.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(tokenParams),
    });

    if (!tokenResponse.ok) {
      let errorSummary = `Status: ${tokenResponse.status} ${tokenResponse.statusText}`;
      try {
          const errorData = await tokenResponse.json();
           if (errorData && typeof errorData === 'object') {
              // 🛡️ SECURITY FIX: Only log the 'error' code, avoiding sensitive fields.
              const safeError = {
                  error: errorData.error,
              };
              errorSummary += `, Body: ${JSON.stringify(safeError)}`;
           }
      } catch (e) {
          // ignore json parse error
      }

      ctx.logError('Token exchange failed:', errorSummary);

      return {
        status: 400,
        body: { error: 'Failed to exchange code for tokens' }
      };
    }

    const tokens = await tokenResponse.json();

    // Calculate token expiry
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (tokens.expires_in || 3600));

    // UPSERT: Check if connection already exists for this user+platform
    const existingConnections = await ctx.base44.asServiceRole.entities.ConnectedPlatform.filter({
      user_id: user.id,
      platform: platform
    });

    const connectionData = {
      user_id: user.id,
      platform: platform,
      oauth_token: await ctx.encrypt(tokens.access_token),
      refresh_token: tokens.refresh_token ? await ctx.encrypt(tokens.refresh_token) : null,
      expires_at: expiresAt.toISOString(),
      sync_status: 'active',
      connected_at: existingConnections.length > 0 ? existingConnections[0].connected_at : new Date().toISOString(),
      last_synced_at: new Date().toISOString(),
      error_message: null
    };

    if (existingConnections.length > 0) {
      // Update existing connection for this user
      await ctx.base44.asServiceRole.entities.ConnectedPlatform.update(
        existingConnections[0].id,
        connectionData
      );
    } else {
      // Create new connection for this user
      await ctx.base44.asServiceRole.entities.ConnectedPlatform.create(connectionData);
    }

    return {
      status: 200,
      body: {
        success: true,
        message: 'Platform connected successfully'
      }
    };
}
