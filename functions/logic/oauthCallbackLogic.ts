export interface OAuthContext {
  envGet: (key: string) => string | undefined;
  fetch: (url: string, init?: any) => Promise<any>;
  base44: any; // Using any for the client as it's complex to mock fully typed
  logger: {
    error: (msg: string, ...args: any[]) => void;
  };
}

export interface OAuthCallbackResult {
  statusCode: number;
  body: any; // JSON object or string (for HTML)
  headers?: any;
}

export async function handleOAuthCallback(
  ctx: OAuthContext,
  urlObj: URL,
  cookieHeader: string | null
): Promise<OAuthCallbackResult> {
  try {
    const user = await ctx.base44.auth.me();

    if (!user) {
      return { statusCode: 401, body: { error: 'Unauthorized' } };
    }

    const code = urlObj.searchParams.get('code');
    const state = urlObj.searchParams.get('state');
    const error = urlObj.searchParams.get('error');

    if (error) {
      return { statusCode: 400, body: { error: `OAuth error: ${error}` } };
    }

    if (!code || !state) {
      return { statusCode: 400, body: { error: 'Missing code or state parameter' } };
    }

    // 🛡️ Sentinel: Security Fix for CSRF
    // Check if state contains platform:token format
    let platform = state;
    let csrfToken: string | null = null;

    if (state.includes(':')) {
      const parts = state.split(':');
      platform = parts[0];
      csrfToken = parts[1];
    }

    // Verify CSRF token against cookie
    const cookies = cookieHeader ? parseCookies(cookieHeader) : {};
    const storedToken = cookies['oauth_state'];

    // Strict validation: Both must exist and match
    if (!csrfToken || !storedToken || csrfToken !== storedToken) {
       ctx.logger.error('CSRF validation failed', {
           stateHasToken: !!csrfToken,
           cookieHasToken: !!storedToken,
           match: csrfToken === storedToken
       });
       return { statusCode: 400, body: { error: 'Security validation failed (CSRF mismatch)' } };
    }

    // Use configured redirect URI if available, otherwise fallback to request origin (less secure)
    const redirectUri = ctx.envGet('OAUTH_REDIRECT_URI') || `${urlObj.origin}/auth/callback`;

    let tokenData;

    switch (platform) {
      case 'youtube': {
        const clientId = ctx.envGet('YOUTUBE_CLIENT_ID');
        const clientSecret = ctx.envGet('YOUTUBE_CLIENT_SECRET');

        const tokenResponse = await ctx.fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: clientId || '',
            client_secret: clientSecret || '',
            redirect_uri: redirectUri,
            grant_type: 'authorization_code'
          })
        });

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.text();
          throw new Error(`YouTube token exchange failed: ${errorData}`);
        }

        tokenData = await tokenResponse.json();
        break;
      }

      case 'patreon': {
        const clientId = ctx.envGet('PATREON_CLIENT_ID');
        const clientSecret = ctx.envGet('PATREON_CLIENT_SECRET');

        const tokenResponse = await ctx.fetch('https://www.patreon.com/api/oauth2/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            grant_type: 'authorization_code',
            client_id: clientId || '',
            client_secret: clientSecret || '',
            redirect_uri: redirectUri
          })
        });

        if (!tokenResponse.ok) {
          throw new Error('Patreon token exchange failed');
        }

        tokenData = await tokenResponse.json();
        break;
      }

      case 'stripe': {
        const clientSecret = ctx.envGet('STRIPE_CLIENT_SECRET');

        const tokenResponse = await ctx.fetch('https://connect.stripe.com/oauth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            grant_type: 'authorization_code',
            client_secret: clientSecret || ''
          })
        });

        if (!tokenResponse.ok) {
          throw new Error('Stripe token exchange failed');
        }

        tokenData = await tokenResponse.json();
        break;
      }

      case 'instagram': {
        const clientId = ctx.envGet('INSTAGRAM_CLIENT_ID');
        const clientSecret = ctx.envGet('INSTAGRAM_CLIENT_SECRET');

        // Initial exchange (if needed) - typically IG returns short-lived, need to exchange for long-lived?
        // The original code did a GET to graph.facebook... which seems odd for code exchange?
        // Original:
        // const tokenResponse = await fetch('https://graph.facebook.com/v20.0/oauth/access_token', ... method: 'GET' ...
        // And then another fetch?
        // Let's replicate original logic exactly.

        const params = new URLSearchParams({
          client_id: clientId || '',
          client_secret: clientSecret || '',
          redirect_uri: redirectUri,
          code
        });

        const instagramTokenResponse = await ctx.fetch(`https://graph.facebook.com/v20.0/oauth/access_token?${params}`);

        if (!instagramTokenResponse.ok) {
          throw new Error('Instagram token exchange failed');
        }

        tokenData = await instagramTokenResponse.json();
        break;
      }

      case 'tiktok': {
        const clientKey = ctx.envGet('TIKTOK_CLIENT_KEY');
        const clientSecret = ctx.envGet('TIKTOK_CLIENT_SECRET');

        const tokenResponse = await ctx.fetch('https://open.tiktokapis.com/v2/oauth/token/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_key: clientKey || '',
            client_secret: clientSecret || '',
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri
          })
        });

        if (!tokenResponse.ok) {
          throw new Error('TikTok token exchange failed');
        }

        const tiktokData = await tokenResponse.json();
        tokenData = tiktokData.data;
        break;
      }

      default:
        return { statusCode: 400, body: { error: 'Unknown platform' } };
    }

    // Calculate token expiry
    const expiresAt = new Date();
    if (tokenData.expires_in) {
      expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);
    } else {
      expiresAt.setHours(expiresAt.getHours() + 1); // Default 1 hour
    }

    // Store connection using service role
    const connection = await ctx.base44.asServiceRole.entities.ConnectedPlatform.create({
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
      await ctx.base44.asServiceRole.functions.invoke('syncPlatformData', {
        connectionId: connection.id,
        platform: platform
      });
    } catch (syncError) {
      ctx.logger.error('Initial sync failed:', syncError);
    }

    // Return success response that redirects to the app
    // We also set a Set-Cookie header to clear the oauth_state cookie
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
        'Set-Cookie': 'oauth_state=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
      },
      body: `<html><body><script>window.opener.postMessage({type: 'oauth_success', platform: '${platform}'}, '*'); window.close();</script></body></html>`
    };

  } catch (error: any) {
    ctx.logger.error('OAuth callback error:', error);
    return { statusCode: 500, body: { error: 'Internal Server Error' } };
  }
}

function parseCookies(cookieHeader: string): Record<string, string> {
  const list: Record<string, string> = {};
  cookieHeader.split(';').forEach(function(cookie) {
      const parts = cookie.split('=');
      list[parts.shift()!.trim()] = decodeURI(parts.join('='));
  });
  return list;
}
