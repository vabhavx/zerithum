export interface SyncContext {
  env: { get: (key: string) => string | undefined };
  fetchPlatformData: (url: string, headers: any) => Promise<any>;
  fetchExistingTransactionIdsInRange: (userId: string, platform: string, startDate: string, endDate: string) => Promise<Set<string>>;
  saveTransactions: (transactions: any[]) => Promise<void>;
  logAudit: (entry: any) => void;
  updateConnectionStatus: (status: string, error?: string) => Promise<void>;
  updateSyncHistory: (status: string, count: number, duration: number, error?: string) => Promise<void>;
}

// Platform fee structures (used to calculate net_amount for reconciliation)
const PLATFORM_FEES: Record<string, { percentFee: number; fixedFeeCents: number; description: string }> = {
  patreon:  { percentFee: 0.08,   fixedFeeCents: 0,  description: 'Patreon 8% platform fee' },
  twitch:   { percentFee: 0.50,   fixedFeeCents: 0,  description: 'Twitch 50% revenue share' },
  square:   { percentFee: 0.026,  fixedFeeCents: 10, description: 'Square 2.6% + $0.10 processing' },
  gumroad:  { percentFee: 0.10,   fixedFeeCents: 0,  description: 'Gumroad 10% flat fee' },
  stripe:   { percentFee: 0.029,  fixedFeeCents: 30, description: 'Stripe 2.9% + $0.30 processing' },
  youtube:  { percentFee: 0.45,   fixedFeeCents: 0,  description: 'YouTube 45% revenue share' },
};

// Calculate platform fee and net amount using integer cents arithmetic
function calculateFeeAndNet(grossAmountCents: number, platform: string): { feeCents: number; netCents: number } {
  const feeConfig = PLATFORM_FEES[platform];
  if (!feeConfig) return { feeCents: 0, netCents: grossAmountCents };

  const percentFeeCents = Math.round(grossAmountCents * feeConfig.percentFee);
  const totalFeeCents = percentFeeCents + feeConfig.fixedFeeCents;
  const netCents = grossAmountCents - totalFeeCents;

  return { feeCents: totalFeeCents, netCents: Math.max(0, netCents) };
}

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  temporaryErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'rate_limit',
    'too_many_requests',
    '429',
    '503',
    '504'
  ]
};

// Helper function to check if error is temporary
function isTemporaryError(error: any): boolean {
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code?.toLowerCase() || '';

  return RETRY_CONFIG.temporaryErrors.some(pattern =>
    errorMessage.includes(pattern.toLowerCase()) || errorCode.includes(pattern.toLowerCase())
  );
}

// Retry wrapper with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retryCount = 0
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retryCount >= RETRY_CONFIG.maxRetries || !isTemporaryError(error)) {
      throw error;
    }

    // Exponential backoff with jitter
    const delay = Math.min(
      RETRY_CONFIG.baseDelay * Math.pow(2, retryCount) + Math.random() * 1000,
      RETRY_CONFIG.maxDelay
    );

    await new Promise(resolve => setTimeout(resolve, delay));

    return retryWithBackoff(fn, retryCount + 1);
  }
}

// Enhanced error message generation
function generateDetailedErrorMessage(error: any, platform: string, context: string): string {
  const baseMessage = error.message || 'Unknown error';

  // Rate limit errors
  if (baseMessage.includes('429') || baseMessage.includes('rate_limit')) {
    return `Rate limit exceeded for ${platform}. Please wait a few minutes before trying again. The platform API has temporary usage restrictions.`;
  }

  // Network errors
  if (baseMessage.includes('ECONNRESET') || baseMessage.includes('ETIMEDOUT')) {
    return `Network connection issue with ${platform}. The platform's servers may be temporarily unavailable. Please try again later.`;
  }

  // Authentication errors
  if (baseMessage.includes('401') || baseMessage.includes('Unauthorized') || baseMessage.includes('invalid_token')) {
    return `Authentication failed for ${platform}. Your access token may have expired. Please disconnect and reconnect the platform.`;
  }

  // Permission errors
  if (baseMessage.includes('403') || baseMessage.includes('Forbidden') || baseMessage.includes('insufficient_scope')) {
    return `Insufficient permissions for ${platform}. Please reconnect with the required permissions.`;
  }

  // Not found errors
  if (baseMessage.includes('404')) {
    return `Resource not found on ${platform}. This may indicate the platform API has changed or your account setup is incomplete.`;
  }

  // Server errors
  if (baseMessage.includes('500') || baseMessage.includes('503') || baseMessage.includes('504')) {
    return `${platform} servers are experiencing issues. This is temporary - please try again in a few minutes.`;
  }

  // Generic fallback
  return `Sync failed for ${platform} during ${context}: ${baseMessage}`;
}

export async function syncPlatform(
  ctx: SyncContext,
  user: any,
  connectionId: string,
  platform: string,
  oauthToken: string,
  lastSyncedAt?: string | null,
  forceFullSync = false
) {
  const startTime = Date.now();
  let transactions: any[] = [];
  let savedCount = 0;
  let duplicateCount = 0;
  let retryAttempts = 0;

  try {
    // Update status to syncing
    await ctx.updateConnectionStatus('syncing');

    // Fetch data from each platform
    switch (platform) {
      case 'youtube': {
        // Default to 30 days ago if no last sync, or 90 days for full sync
        const defaultDays = forceFullSync ? 90 : 30;
        const startDate = (lastSyncedAt && !forceFullSync)
          ? new Date(lastSyncedAt).toISOString().split('T')[0]
          : new Date(Date.now() - defaultDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = new Date().toISOString().split('T')[0];

        const url = `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=${startDate}&endDate=${endDate}&metrics=estimatedRevenue&dimensions=day`;

        const analyticsResponse = await retryWithBackoff(async () => {
          retryAttempts++;
          return await ctx.fetchPlatformData(url, {
            'Authorization': `Bearer ${oauthToken}`,
            'Accept': 'application/json'
          });
        });

        if (analyticsResponse.rows) {
          transactions = (analyticsResponse.rows || []).map((row: any) => {
            const grossCents = Math.round((row[1] || 0) * 100);
            const { feeCents, netCents } = calculateFeeAndNet(grossCents, 'youtube');

            return {
              user_id: user.id,
              platform_transaction_id: `youtube_${row[0]}`,
              platform: 'youtube',
              amount: grossCents / 100,
              fee: feeCents / 100,
              net_amount: netCents / 100,
              currency: 'USD',
              transaction_date: row[0],
              transaction_type: 'sale',
              description: 'YouTube AdSense Revenue',
              synced_at: new Date().toISOString()
            };
          });
        }
        break;
      }

      case 'patreon': {
        const campaignsUrl = 'https://www.patreon.com/api/oauth2/v2/campaigns?include=benefits,tiers&fields[campaign]=creation_name,patron_count,published_at&fields[tier]=amount_cents,title,patron_count&fields[benefit]=title';

        const campaignsData = await retryWithBackoff(async () => {
          retryAttempts++;
          return await ctx.fetchPlatformData(campaignsUrl, {
            'Authorization': `Bearer ${oauthToken}`,
            'Accept': 'application/json'
          });
        });

        const campaigns = campaignsData.data || [];

        const campaignsTransactions = await Promise.all(campaigns.map(async (campaign: any) => {
          const allMembers: any[] = [];
          let nextCursor: string | null = null;

          // Paginate through ALL members (Patreon API pages at 500 max)
          do {
            let membersUrl = `https://www.patreon.com/api/oauth2/v2/campaigns/${campaign.id}/members?include=currently_entitled_tiers,user&fields[member]=full_name,email,patron_status,currently_entitled_amount_cents,pledge_relationship_start,last_charge_date,last_charge_status&fields[tier]=title,amount_cents&fields[user]=full_name,email&page[count]=200`;

            if (nextCursor) {
              membersUrl += `&page[cursor]=${encodeURIComponent(nextCursor)}`;
            }

            const membersData = await retryWithBackoff(async () => {
              retryAttempts++;
              return await ctx.fetchPlatformData(membersUrl, {
                'Authorization': `Bearer ${oauthToken}`,
                'Accept': 'application/json'
              });
            });

            const members = membersData.data || [];
            allMembers.push(...members);

            // Extract pagination cursor
            nextCursor = membersData.meta?.pagination?.cursors?.next || null;
          } while (nextCursor);

          return allMembers
            .filter((member: any) => member.attributes.patron_status === 'active_patron')
            .map((member: any) => {
              const grossCents = member.attributes.currently_entitled_amount_cents || 0;
              const { feeCents, netCents } = calculateFeeAndNet(grossCents, 'patreon');
              const lastChargeDate = member.attributes.last_charge_date || member.attributes.pledge_relationship_start || new Date().toISOString();
              const patronName = member.attributes.full_name || 'Patron';
              const patronEmail = member.attributes.email || null;

              return {
                user_id: user.id,
                platform_transaction_id: `patreon_member_${member.id}_${lastChargeDate.split('T')[0]}`,
                platform: 'patreon',
                amount: grossCents / 100,
                fee: feeCents / 100,
                net_amount: netCents / 100,
                currency: 'USD',
                transaction_date: lastChargeDate.split('T')[0],
                transaction_type: 'subscription',
                customer_name: patronName,
                customer_email: patronEmail,
                description: `Patreon Membership - ${patronName}`,
                synced_at: new Date().toISOString()
              };
            });
        }));

        transactions.push(...campaignsTransactions.flat());
        break;
      }

      case 'stripe': {
        const limit = forceFullSync ? 500 : 100;
        const url = `https://api.stripe.com/v1/charges?limit=${limit}`;

        const data = await retryWithBackoff(async () => {
          retryAttempts++;
          return await ctx.fetchPlatformData(url, {
            'Authorization': `Bearer ${oauthToken}`,
            'Accept': 'application/json'
          });
        });

        transactions = (data.data || []).map((charge: any) => {
          const grossCents = charge.amount || 0;
          const { feeCents, netCents } = calculateFeeAndNet(grossCents, 'stripe');

          return {
            user_id: user.id,
            platform_transaction_id: `stripe_${charge.id}`,
            platform: 'stripe',
            amount: grossCents / 100,
            fee: feeCents / 100,
            net_amount: netCents / 100,
            currency: (charge.currency || 'usd').toUpperCase(),
            transaction_date: new Date(charge.created * 1000).toISOString().split('T')[0],
            transaction_type: 'sale',
            customer_email: charge.receipt_email || charge.billing_details?.email || null,
            customer_name: charge.billing_details?.name || null,
            description: charge.description || 'Stripe Payment',
            synced_at: new Date().toISOString()
          };
        });
        break;
      }

      case 'gumroad': {
        // Paginate through all sales pages
        const allSales: any[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          const url = `https://api.gumroad.com/v2/sales?page=${page}`;
          const data = await retryWithBackoff(async () => {
            retryAttempts++;
            return await ctx.fetchPlatformData(url, {
              'Authorization': `Bearer ${oauthToken}`,
              'Accept': 'application/json'
            });
          });

          const sales = data.sales || [];
          allSales.push(...sales);

          // Gumroad returns next_page_url when more pages exist
          hasMore = !!data.next_page_url && sales.length > 0;
          page++;

          // Safety cap: prevent infinite loops
          if (page > 100) break;
        }

        transactions = allSales.map((sale: any) => {
          // Gumroad provides price in cents
          const grossCents = sale.price || 0;
          // Gumroad provides actual fee data when available
          const actualFeeCents = sale.gumroad_fee ? Math.round(sale.gumroad_fee * 100) : null;
          const { feeCents: estimatedFeeCents, netCents: estimatedNetCents } = calculateFeeAndNet(grossCents, 'gumroad');

          const feeCents = actualFeeCents ?? estimatedFeeCents;
          const netCents = grossCents - feeCents;

          return {
            user_id: user.id,
            platform_transaction_id: `gumroad_${sale.id}`,
            platform: 'gumroad',
            amount: grossCents / 100,
            fee: feeCents / 100,
            net_amount: Math.max(0, netCents) / 100,
            currency: (sale.currency || 'USD').toUpperCase(),
            transaction_date: sale.created_at.split('T')[0],
            transaction_type: sale.recurring ? 'subscription' : 'sale',
            customer_email: sale.email || null,
            customer_name: sale.full_name || null,
            product_name: sale.product_name || null,
            description: sale.product_name || 'Gumroad Sale',
            synced_at: new Date().toISOString()
          };
        });
        break;
      }

      case 'square': {
        // Paginate through all Square payments using cursor
        const allPayments: any[] = [];
        let cursor: string | null = null;

        do {
          let url = 'https://connect.squareup.com/v2/payments?limit=100&sort_order=DESC';
          if (cursor) {
            url += `&cursor=${encodeURIComponent(cursor)}`;
          }

          const data = await retryWithBackoff(async () => {
            retryAttempts++;
            return await ctx.fetchPlatformData(url, {
              'Authorization': `Bearer ${oauthToken}`,
              'Accept': 'application/json',
              'Square-Version': '2024-03-20'
            });
          });

          const payments = data.payments || [];
          allPayments.push(...payments);

          cursor = data.cursor || null;

          // Safety cap
          if (allPayments.length > 5000) break;
        } while (cursor);

        transactions = allPayments.map((payment: any) => {
          const grossCents = payment.amount_money?.amount || 0;
          // Square provides actual processing fee in the API response
          const actualFeeCents = payment.processing_fee?.length > 0
            ? payment.processing_fee.reduce((sum: number, f: any) => sum + Math.abs(f.amount_money?.amount || 0), 0)
            : null;
          const { feeCents: estimatedFeeCents } = calculateFeeAndNet(grossCents, 'square');

          const feeCents = actualFeeCents ?? estimatedFeeCents;
          const netCents = grossCents - feeCents;

          // Build a description from order/receipt data if available
          const desc = payment.receipt_url
            ? `Square Payment #${payment.receipt_number || payment.id.slice(-8)}`
            : 'Square Payment';

          return {
            user_id: user.id,
            platform_transaction_id: `square_${payment.id}`,
            platform: 'square',
            amount: grossCents / 100,
            fee: feeCents / 100,
            net_amount: Math.max(0, netCents) / 100,
            currency: (payment.amount_money?.currency || 'USD').toUpperCase(),
            transaction_date: payment.created_at.split('T')[0],
            transaction_type: payment.source_type === 'CARD' ? 'sale' : 'sale',
            customer_email: payment.buyer_email_address || null,
            description: desc,
            synced_at: new Date().toISOString()
          };
        });
        break;
      }

      case 'twitch': {
        const clientId = ctx.env.get('TWITCH_CLIENT_ID');
        if (!clientId) throw new Error('Twitch Client ID not configured (requires environment variable)');

        // Step 1: Get broadcaster ID
        const userResponse = await retryWithBackoff(async () => {
          retryAttempts++;
          return await ctx.fetchPlatformData('https://api.twitch.tv/helix/users', {
            'Authorization': `Bearer ${oauthToken}`,
            'Client-Id': clientId,
            'Accept': 'application/json'
          });
        });

        const broadcasterId = userResponse.data?.[0]?.id;
        if (!broadcasterId) throw new Error('Could not resolve Twitch broadcaster ID from token');

        // Step 2: Fetch ALL subscriptions with pagination
        const allSubs: any[] = [];
        let subCursor: string | null = null;
        let totalSubPoints = 0;

        do {
          let subUrl = `https://api.twitch.tv/helix/subscriptions?broadcaster_id=${broadcasterId}&first=100`;
          if (subCursor) {
            subUrl += `&after=${encodeURIComponent(subCursor)}`;
          }

          const subData = await retryWithBackoff(async () => {
            retryAttempts++;
            return await ctx.fetchPlatformData(subUrl, {
              'Authorization': `Bearer ${oauthToken}`,
              'Client-Id': clientId,
              'Accept': 'application/json'
            });
          });

          const subs = subData.data || [];
          allSubs.push(...subs);
          totalSubPoints = subData.total || allSubs.length;

          subCursor = subData.pagination?.cursor || null;

          // Safety cap
          if (allSubs.length > 10000) break;
        } while (subCursor);

        const currentMonth = new Date().toISOString().substring(0, 7); // e.g., 2024-03

        // Map subscriptions — filter out broadcaster's own sub
        const subTransactions = allSubs
          .filter((sub: any) => sub.user_id !== broadcasterId)
          .map((sub: any) => {
            // Twitch tier amounts: tier string is "1000", "2000", "3000"
            // These are the subscriber prices (what the sub pays)
            const tierPriceCents = sub.tier === '1000' ? 499 : sub.tier === '2000' ? 999 : sub.tier === '3000' ? 2499 : 0;
            const { feeCents, netCents } = calculateFeeAndNet(tierPriceCents, 'twitch');

            return {
              user_id: user.id,
              platform_transaction_id: `twitch_sub_${sub.user_id}_${currentMonth}`,
              platform: 'twitch',
              amount: tierPriceCents / 100,
              fee: feeCents / 100,
              net_amount: netCents / 100,
              currency: 'USD',
              transaction_date: new Date().toISOString().split('T')[0],
              transaction_type: 'subscription',
              customer_name: sub.user_name || null,
              description: `Twitch Sub: ${sub.user_name} (Tier ${sub.tier === '1000' ? '1' : sub.tier === '2000' ? '2' : '3'}${sub.is_gift ? ', Gift' : ''})`,
              synced_at: new Date().toISOString()
            };
          });

        transactions.push(...subTransactions);

        // Step 3: Fetch bits leaderboard (scope: bits:read)
        try {
          const bitsUrl = `https://api.twitch.tv/helix/bits/leaderboard?period=month&count=100`;
          const bitsData = await retryWithBackoff(async () => {
            retryAttempts++;
            return await ctx.fetchPlatformData(bitsUrl, {
              'Authorization': `Bearer ${oauthToken}`,
              'Client-Id': clientId,
              'Accept': 'application/json'
            });
          });

          if (bitsData.data && bitsData.data.length > 0) {
            const bitsTransactions = bitsData.data.map((entry: any) => {
              // 1 bit = $0.01 to the streamer (Twitch keeps nothing from bits already purchased)
              const bitsCents = entry.score || 0;

              return {
                user_id: user.id,
                platform_transaction_id: `twitch_bits_${entry.user_id}_${currentMonth}`,
                platform: 'twitch',
                amount: bitsCents / 100,
                fee: 0,
                net_amount: bitsCents / 100,
                currency: 'USD',
                transaction_date: new Date().toISOString().split('T')[0],
                transaction_type: 'sale',
                customer_name: entry.user_name || null,
                description: `Twitch Bits: ${entry.user_name} (${entry.score} bits)`,
                synced_at: new Date().toISOString()
              };
            });

            transactions.push(...bitsTransactions);
          }
        } catch (bitsError: any) {
          // Bits endpoint may fail if scope not granted or not a partner/affiliate
          // Log but don't fail the entire sync
          ctx.logAudit({
            action: 'sync_twitch_bits_skipped',
            actor_id: user.id,
            resource_id: connectionId,
            resource_type: 'connected_platform',
            status: 'warning',
            details: { error: bitsError.message, note: 'Bits data unavailable - may require affiliate/partner status' }
          });
        }

        break;
      }

      default:
        // Do not silently mask unhandled platforms
        if (['shopify', 'tiktok', 'instagram', 'substack'].includes(platform)) {
          throw new Error(`Data synchronization logic not yet implemented for ${platform}`);
        } else {
          throw new Error(`Unsupported platform plugin identifier: ${platform}`);
        }
    }

    if (transactions.length > 0) {
      // Find date range of fetched transactions
      let minDate = transactions[0].transaction_date;
      let maxDate = transactions[0].transaction_date;

      for (const t of transactions) {
        if (t.transaction_date < minDate) minDate = t.transaction_date;
        if (t.transaction_date > maxDate) maxDate = t.transaction_date;
      }

      const existingIds = await ctx.fetchExistingTransactionIdsInRange(user.id, platform, minDate, maxDate);
      const newTransactions = transactions.filter((t: any) => !existingIds.has(t.platform_transaction_id));

      duplicateCount = transactions.length - newTransactions.length;
      savedCount = newTransactions.length;

      if (newTransactions.length > 0) {
        await ctx.saveTransactions(newTransactions);
      }
    }

    const duration = Date.now() - startTime;

    ctx.logAudit({
      action: 'sync_platform_data',
      actor_id: user.id,
      resource_id: connectionId,
      resource_type: 'connected_platform',
      status: 'success',
      details: {
        platform,
        found_transactions: transactions.length,
        synced_transactions: savedCount,
        duplicates_ignored: duplicateCount,
        duration_ms: duration
      }
    });

    await Promise.all([
      ctx.updateConnectionStatus('active'),
      ctx.updateSyncHistory('success', savedCount, duration)
    ]);

    return {
      success: true,
      transactionCount: savedCount,
      duplicateCount,
      retryAttempts: retryAttempts - 1, // Subtract 1 for initial attempt
      message: `Successfully synced ${savedCount} new transactions from ${platform}${duplicateCount > 0 ? ` (${duplicateCount} duplicates skipped)` : ''}`,
      duration_ms: duration
    };

  } catch (error: any) {
    const duration = Date.now() - startTime;
    const detailedErrorMessage = generateDetailedErrorMessage(error, platform, 'data sync');

    ctx.logAudit({
      action: 'sync_platform_data_failed',
      actor_id: user?.id,
      resource_id: connectionId,
      resource_type: 'connected_platform',
      status: 'failure',
      details: {
        platform,
        error_message: error.message,
        detailed_error: detailedErrorMessage,
        retry_attempts: retryAttempts - 1,
        duration_ms: duration
      }
    });

    await Promise.all([
      ctx.updateConnectionStatus('error', detailedErrorMessage),
      ctx.updateSyncHistory('error', 0, duration, detailedErrorMessage)
    ]);

    // Return detailed error in response
    const enhancedError = new Error(detailedErrorMessage);
    (enhancedError as any).originalError = error.message;
    (enhancedError as any).retryAttempts = retryAttempts - 1;
    throw enhancedError;
  }
}
