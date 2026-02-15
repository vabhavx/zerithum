
export interface RevokeContext {
    envGet: (key: string) => string | undefined;
    fetch: (url: string, init?: any) => Promise<any>;
    logger: {
        error: (msg: string, ...args: any[]) => void;
        info: (msg: string, ...args: any[]) => void;
    };
}

export async function revokeToken(
    ctx: RevokeContext,
    platform: string,
    token: string,
    refreshToken?: string
): Promise<boolean> {
    try {
        switch (platform) {
            case 'youtube': {
                // Google Revocation
                // https://oauth2.googleapis.com/revoke?token={token}
                const googleUrl = new URL('https://oauth2.googleapis.com/revoke');
                googleUrl.searchParams.set('token', token);

                let res = await ctx.fetch(googleUrl.toString(), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                });

                if (!res.ok && refreshToken) {
                     // Try with refresh token if available and access token failed
                     const retryUrl = new URL('https://oauth2.googleapis.com/revoke');
                     retryUrl.searchParams.set('token', refreshToken);
                     res = await ctx.fetch(retryUrl.toString(), {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                     });
                }

                if (!res.ok) {
                    ctx.logger.error(`YouTube revocation failed: ${res.status}`);
                }
                return res.ok;
            }

            case 'patreon':
                 // Patreon does not have a public revocation endpoint for clients.
                 // We rely on the user to revoke access in their Patreon settings.
                 ctx.logger.info('Patreon token revocation not supported via API');
                 return true;

            case 'stripe': {
                // 1. Get account ID
                // Standard accounts can access their own account details with the access token
                const accountRes = await ctx.fetch('https://api.stripe.com/v1/account', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!accountRes.ok) {
                    ctx.logger.error(`Failed to get Stripe account ID: ${accountRes.status}`);
                    return false;
                }

                const accountData = await accountRes.json();
                const stripeUserId = accountData.id;

                // 2. Deauthorize
                const stripeClientId = ctx.envGet('STRIPE_CLIENT_ID');

                if (!stripeClientId) {
                    ctx.logger.error('Missing STRIPE_CLIENT_ID for revocation');
                    return false;
                }

                // Stripe deauthorization usually requires the platform secret key
                const deauthRes = await ctx.fetch('https://connect.stripe.com/oauth/deauthorize', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${ctx.envGet('STRIPE_CLIENT_SECRET')}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({
                        client_id: stripeClientId,
                        stripe_user_id: stripeUserId
                    })
                });

                if (!deauthRes.ok) {
                    const errorText = await deauthRes.text();
                    ctx.logger.error(`Stripe deauthorization failed: ${deauthRes.status} ${errorText}`);
                }
                return deauthRes.ok;
            }

            case 'instagram': {
                 // 1. Get User ID using Graph API (v20.0 per oauthCallback)
                 const meRes = await ctx.fetch('https://graph.facebook.com/v20.0/me', {
                     headers: { 'Authorization': `Bearer ${token}` }
                 });

                 if (!meRes.ok) {
                     ctx.logger.error(`Failed to get Instagram user ID: ${meRes.status}`);
                     return false;
                 }

                 const meData = await meRes.json();
                 const userId = meData.id;

                 // 2. Revoke permissions
                 const revokeRes = await ctx.fetch(`https://graph.facebook.com/v20.0/${userId}/permissions`, {
                     method: 'DELETE',
                     headers: { 'Authorization': `Bearer ${token}` }
                 });

                 if (!revokeRes.ok) {
                     ctx.logger.error(`Instagram revocation failed: ${revokeRes.status}`);
                 }
                 return revokeRes.ok;
            }

            case 'tiktok': {
                 // https://open.tiktokapis.com/v2/oauth/revoke/
                 const tiktokRes = await ctx.fetch('https://open.tiktokapis.com/v2/oauth/revoke/', {
                     method: 'POST',
                     headers: {
                         'Authorization': `Bearer ${token}`,
                         'Content-Type': 'application/x-www-form-urlencoded'
                     }
                 });

                 if (!tiktokRes.ok) {
                     ctx.logger.error(`TikTok revocation failed: ${tiktokRes.status}`);
                 }
                 return tiktokRes.ok;
            }

            default:
                ctx.logger.info(`Unknown platform for revocation: ${platform}`);
                // Return true so we don't consider it a "failure" of the process
                return true;
        }
    } catch (e: any) {
        ctx.logger.error(`Revocation exception for ${platform}: ${e.message}`);
        return false;
    }
}
