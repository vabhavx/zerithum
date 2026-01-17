export interface SyncContext {
  fetchPlatformData: (url: string, headers: any) => Promise<any>;
  fetchExistingTransactionIdsInRange: (userId: string, platform: string, startDate: string, endDate: string) => Promise<Set<string>>;
  saveTransactions: (transactions: any[]) => Promise<void>;
  logAudit: (entry: any) => void;
  updateConnectionStatus: (status: string, error?: string) => Promise<void>;
  updateSyncHistory: (status: string, count: number, duration: number, error?: string) => Promise<void>;
}

export async function syncPlatform(
  ctx: SyncContext,
  user: any,
  connectionId: string,
  platform: string,
  oauthToken: string,
  lastSyncedAt?: string | null
) {
  const startTime = Date.now();
  let transactions: any[] = [];
  let savedCount = 0;
  let duplicateCount = 0;

  try {
    // Update status to syncing
    await ctx.updateConnectionStatus('syncing');

    // Fetch data from each platform
    switch (platform) {
      case 'youtube': {
        // Default to 30 days ago if no last sync
        const startDate = lastSyncedAt
          ? new Date(lastSyncedAt).toISOString().split('T')[0]
          : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = new Date().toISOString().split('T')[0];

        const url = `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=${startDate}&endDate=${endDate}&metrics=estimatedRevenue&dimensions=day`;
        const analyticsResponse = await ctx.fetchPlatformData(url, {
          'Authorization': `Bearer ${oauthToken}`,
          'Accept': 'application/json'
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
        const campaignsData = await ctx.fetchPlatformData(campaignsUrl, {
          'Authorization': `Bearer ${oauthToken}`,
          'Accept': 'application/json'
        });

        const campaigns = campaignsData.data || [];

        for (const campaign of campaigns) {
          const membersUrl = `https://www.patreon.com/api/oauth2/v2/campaigns/${campaign.id}/members?include=currently_entitled_tiers,user&fields[member]=full_name,patron_status,currently_entitled_amount_cents,pledge_relationship_start,last_charge_date,last_charge_status&fields[tier]=title,amount_cents`;
          const membersData = await ctx.fetchPlatformData(membersUrl, {
            'Authorization': `Bearer ${oauthToken}`,
            'Accept': 'application/json'
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
        const url = 'https://api.stripe.com/v1/charges?limit=100';
        const data = await ctx.fetchPlatformData(url, {
          'Authorization': `Bearer ${oauthToken}`,
          'Accept': 'application/json'
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

    await ctx.updateConnectionStatus('active');
    await ctx.updateSyncHistory('success', savedCount, duration);

    return {
      success: true,
      transactionCount: savedCount,
      message: `Synced ${savedCount} transactions from ${platform}`,
      duration_ms: duration
    };

  } catch (error: any) {
    const duration = Date.now() - startTime;

    ctx.logAudit({
      action: 'sync_platform_data_failed',
      actor_id: user?.id,
      resource_id: connectionId,
      resource_type: 'connected_platform',
      status: 'failure',
      details: {
        platform,
        error_message: error.message,
        duration_ms: duration
      }
    });

    await ctx.updateConnectionStatus('error', error.message);
    await ctx.updateSyncHistory('error', 0, duration, error.message);

    throw error;
  }
}
