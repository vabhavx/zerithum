export interface SyncContext {
  fetchPlatformData: (url: string, headers: any) => Promise<any>;
  fetchExistingTransactionIdsInRange: (userId: string, platform: string, startDate: string, endDate: string) => Promise<Set<string>>;
  saveTransactions: (transactions: any[]) => Promise<void>;
  logAudit: (entry: any) => Promise<void>;
  updateConnectionStatus: (status: string, error?: string, lastSyncedAt?: string) => Promise<void>;
  updateSyncHistory: (status: string, count: number, duration: number, error?: string) => Promise<void>;
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
    errorMessage.includes(pattern) || errorCode.includes(pattern)
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
    
    console.log(`Retry attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries} after ${delay}ms`);
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
          transactions = (analyticsResponse.rows || []).map((row: any) => ({
            user_id: user.id,
            platform_transaction_id: `youtube_${row[0]}`,
            platform: 'youtube',
            amount: row[1] || 0,
            currency: 'USD',
            transaction_date: row[0],
            category: 'ad_revenue',
            description: 'YouTube AdSense Revenue',
            synced_at: new Date().toISOString()
          }));
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

        for (const campaign of campaigns) {
          const membersUrl = `https://www.patreon.com/api/oauth2/v2/campaigns/${campaign.id}/members?include=currently_entitled_tiers,user&fields[member]=full_name,patron_status,currently_entitled_amount_cents,pledge_relationship_start,last_charge_date,last_charge_status&fields[tier]=title,amount_cents`;
          
          const membersData = await retryWithBackoff(async () => {
            retryAttempts++;
            return await ctx.fetchPlatformData(membersUrl, {
              'Authorization': `Bearer ${oauthToken}`,
              'Accept': 'application/json'
            });
          });

          const members = membersData.data || [];

          const memberTransactions = members
            .filter((member: any) => member.attributes.patron_status === 'active_patron')
            .map((member: any) => {
              const amount = (member.attributes.currently_entitled_amount_cents || 0) / 100;
              const lastChargeDate = member.attributes.last_charge_date || member.attributes.pledge_relationship_start || new Date().toISOString();

              return {
                user_id: user.id,
                platform_transaction_id: `patreon_member_${member.id}_${lastChargeDate}`,
                platform: 'patreon',
                amount: amount,
                currency: 'USD',
                transaction_date: lastChargeDate.split('T')[0],
                category: 'membership',
                description: `Patreon Membership - ${member.attributes.full_name || 'Patron'}`,
                synced_at: new Date().toISOString()
              };
            });

          transactions.push(...memberTransactions);
        }
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

        transactions = (data.data || []).map((charge: any) => ({
          user_id: user.id,
          platform_transaction_id: `stripe_${charge.id}`,
          platform: 'stripe',
          amount: charge.amount / 100,
          currency: charge.currency.toUpperCase(),
          transaction_date: new Date(charge.created * 1000).toISOString().split('T')[0],
          category: 'product_sale',
          platform_fee: (charge.amount * 0.029 + 30) / 100,
          description: charge.description || 'Stripe Payment',
          synced_at: new Date().toISOString()
        }));
        break;
      }

      default:
        // Other platforms might return empty or throw
        if (['instagram', 'tiktok'].includes(platform)) {
             transactions = [];
        } else {
             throw new Error('Unsupported platform');
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

    // Determine max date for last_synced_at update
    let maxDate: string | undefined;
    if (transactions.length > 0) {
       // Start with the first one
       maxDate = transactions[0].transaction_date;
       for (const t of transactions) {
         if (t.transaction_date > maxDate) {
            maxDate = t.transaction_date;
         }
       }
       // Ensure it is ISO string if it isn't (transaction_date is YYYY-MM-DD or ISO)
       // If it's YYYY-MM-DD, we might want to append time or keep it as is.
       // The requirement says "maximum transaction date".
       // existing logic used transactions[0].transaction_date which was YYYY-MM-DD for some.
    }

    const duration = Date.now() - startTime;

    await ctx.logAudit({
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

    await ctx.updateConnectionStatus('active', undefined, maxDate);
    await ctx.updateSyncHistory('success', savedCount, duration);

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

    await ctx.logAudit({
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

    await ctx.updateConnectionStatus('error', detailedErrorMessage);
    await ctx.updateSyncHistory('error', 0, duration, detailedErrorMessage);

    // Return detailed error in response
    const enhancedError = new Error(detailedErrorMessage);
    (enhancedError as any).originalError = error.message;
    (enhancedError as any).retryAttempts = retryAttempts - 1;
    throw enhancedError;
  }
}