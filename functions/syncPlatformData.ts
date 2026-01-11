import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { logAudit } from './utils/audit.ts';

Deno.serve(async (req) => {
  const startTime = Date.now();
  let syncHistoryId = null;
  let body: any = {};
  let user: any = null;
  
  try {
    const base44 = createClientFromRequest(req);
    user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Securely parse body once
    try {
      body = await req.json();
    } catch (e) {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { connectionId, platform } = body;

    if (!connectionId || !platform) {
      return Response.json({ error: 'Missing connectionId or platform' }, { status: 400 });
    }

    // Create sync history record
    const syncHistory = await base44.asServiceRole.entities.SyncHistory.create({
      user_id: user.id,
      platform: platform,
      sync_started_at: new Date().toISOString(),
      status: 'success',
      transactions_synced: 0
    });
    syncHistoryId = syncHistory.id;

    // Get connection details - verify it belongs to the current user
    const connection = await base44.asServiceRole.entities.ConnectedPlatform.filter({ 
      id: connectionId,
      user_id: user.id 
    });
    if (!connection || connection.length === 0) {
      throw new Error('Connection not found or unauthorized');
    }

    const conn = connection[0];

    // Check if token is expired and refresh if needed
    const expiresAt = new Date(conn.expires_at);
    const now = new Date();
    if (expiresAt <= now && conn.refresh_token) {
      const refreshResult = await base44.functions.invoke('refreshAccessToken', { 
        connectionId: conn.id 
      });
      
      if (!refreshResult.data.success) {
        throw new Error('Failed to refresh access token');
      }
      
      // Refetch connection with new token
      const refreshedConn = await base44.asServiceRole.entities.ConnectedPlatform.filter({ id: connectionId });
      conn.oauth_token = refreshedConn[0].oauth_token;
    }

    // Update status to syncing
    await base44.asServiceRole.entities.ConnectedPlatform.update(connectionId, {
      sync_status: 'syncing'
    });

    let transactions = [];

    // Fetch data from each platform
    switch (platform) {
      case 'youtube': {
        // Fetch YouTube Analytics data
        const analyticsResponse = await fetch(
          'https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=2024-01-01&endDate=2026-12-31&metrics=estimatedRevenue&dimensions=day',
          {
            headers: {
              'Authorization': `Bearer ${conn.oauth_token}`,
              'Accept': 'application/json'
            }
          }
        );

        if (analyticsResponse.ok) {
          const data = await analyticsResponse.json();
          transactions = (data.rows || []).map(row => ({
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
        // Fetch Patreon campaigns and members
        const campaignsResponse = await fetch(
          'https://www.patreon.com/api/oauth2/v2/campaigns?include=benefits,tiers&fields[campaign]=creation_name,patron_count,published_at&fields[tier]=amount_cents,title,patron_count&fields[benefit]=title',
          {
            headers: {
              'Authorization': `Bearer ${conn.oauth_token}`,
              'Accept': 'application/json'
            }
          }
        );

        if (!campaignsResponse.ok) {
          throw new Error(`Patreon campaigns API failed: ${campaignsResponse.statusText}`);
        }

        const campaignsData = await campaignsResponse.json();
        const campaigns = campaignsData.data || [];

        // For each campaign, fetch members
        for (const campaign of campaigns) {
          const membersResponse = await fetch(
            `https://www.patreon.com/api/oauth2/v2/campaigns/${campaign.id}/members?include=currently_entitled_tiers,user&fields[member]=full_name,patron_status,currently_entitled_amount_cents,pledge_relationship_start,last_charge_date,last_charge_status&fields[tier]=title,amount_cents`,
            {
              headers: {
                'Authorization': `Bearer ${conn.oauth_token}`,
                'Accept': 'application/json'
              }
            }
          );

          if (membersResponse.ok) {
            const membersData = await membersResponse.json();
            const members = membersData.data || [];
            
            const memberTransactions = members
              .filter(member => member.attributes.patron_status === 'active_patron')
              .map(member => {
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
        }
        break;
      }

      case 'stripe': {
        // Fetch Stripe charges
        const chargesResponse = await fetch(
          'https://api.stripe.com/v1/charges?limit=100',
          {
            headers: {
              'Authorization': `Bearer ${conn.oauth_token}`,
              'Accept': 'application/json'
            }
          }
        );

        if (chargesResponse.ok) {
          const data = await chargesResponse.json();
          transactions = (data.data || []).map(charge => ({
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
        }
        break;
      }

      case 'instagram':
      case 'tiktok':
        // For Instagram and TikTok, we'd need more complex API calls
        // This is a placeholder for now
        transactions = [];
        break;

      default:
        throw new Error('Unsupported platform');
    }

    // Deduplication and Saving
    let savedCount = 0;
    let duplicateCount = 0;

    if (transactions.length > 0) {
      // Fetch existing transactions to deduplicate
      // We filter by user_id and platform to narrow down the search space
      // TODO: Optimize this for scalability. Currently fetching all user transactions for platform.
      // Ideally, we should filter by the specific IDs we are trying to insert, e.g., using an $in query if supported,
      // or filtering by the date range of the new transactions.
      const existingRecs = await base44.asServiceRole.entities.RevenueTransaction.filter({
        user_id: user.id,
        platform: platform
      });

      const existingIds = new Set(existingRecs.map((t: any) => t.platform_transaction_id));
      const newTransactions = transactions.filter((t: any) => !existingIds.has(t.platform_transaction_id));

      duplicateCount = transactions.length - newTransactions.length;
      savedCount = newTransactions.length;

      if (newTransactions.length > 0) {
        await base44.asServiceRole.entities.RevenueTransaction.bulkCreate(newTransactions);
      }
    }

    // Audit Log
    logAudit({
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
        duration_ms: Date.now() - startTime
      }
    });

    // Update connection status
    await base44.asServiceRole.entities.ConnectedPlatform.update(connectionId, {
      sync_status: 'active',
      last_synced_at: new Date().toISOString(),
      error_message: null
    });

    // Update sync history
    const duration = Date.now() - startTime;
    await base44.asServiceRole.entities.SyncHistory.update(syncHistoryId, {
      sync_completed_at: new Date().toISOString(),
      status: 'success',
      transactions_synced: savedCount,
      duration_ms: duration
    });

    return Response.json({
      success: true,
      transactionCount: savedCount,
      message: `Synced ${savedCount} transactions from ${platform}`,
      duration_ms: duration
    });

  } catch (error) {
    console.error('Sync error:', error); // Internal log

    const duration = Date.now() - startTime;

    // Audit Log Failure
    logAudit({
      action: 'sync_platform_data_failed',
      actor_id: user?.id,
      resource_id: body?.connectionId,
      resource_type: 'connected_platform',
      status: 'failure',
      details: {
        platform: body?.platform,
        error_message: error.message, // Safe for internal audit
        duration_ms: duration
      }
    });

    // Update sync history with error
    if (syncHistoryId) {
      try {
        const base44 = createClientFromRequest(req);
        await base44.asServiceRole.entities.SyncHistory.update(syncHistoryId, {
          sync_completed_at: new Date().toISOString(),
          status: 'error',
          error_message: error.message,
          duration_ms: duration
        });
      } catch (historyError) {
        console.error('Failed to update sync history:', historyError);
      }
    }

    // Update connection status and send email notification
    try {
      if (body.connectionId) {
        const base44 = createClientFromRequest(req);
        await base44.asServiceRole.entities.ConnectedPlatform.update(body.connectionId, {
          sync_status: 'error',
          error_message: error.message
        });
        
        // Send sync failed email
        if (user) {
          await base44.asServiceRole.functions.invoke('sendSyncFailedEmail', {
            userId: user.id,
            platform: body.platform,
            errorMessage: error.message
          });
        }
      }
    } catch (parseError) {
      console.error('Failed to handle error side-effects:', parseError);
    }

    // Return generic error to client
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
