import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { connectionId, platform } = await req.json();

    if (!connectionId || !platform) {
      return Response.json({ error: 'Missing connectionId or platform' }, { status: 400 });
    }

    // Get connection details - verify it belongs to the current user
    const connection = await base44.asServiceRole.entities.ConnectedPlatform.filter({ 
      id: connectionId,
      user_id: user.id 
    });
    if (!connection || connection.length === 0) {
      return Response.json({ error: 'Connection not found or unauthorized' }, { status: 404 });
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

    // Save transactions
    if (transactions.length > 0) {
      await base44.asServiceRole.entities.RevenueTransaction.bulkCreate(transactions);
    }

    // Update connection status
    await base44.asServiceRole.entities.ConnectedPlatform.update(connectionId, {
      sync_status: 'active',
      last_synced_at: new Date().toISOString(),
      error_message: null
    });

    return Response.json({
      success: true,
      transactionCount: transactions.length,
      message: `Synced ${transactions.length} transactions from ${platform}`
    });

  } catch (error) {
    console.error('Sync error:', error);

    // Try to get connectionId from the already parsed request body
    try {
      const body = await req.clone().json();
      if (body.connectionId) {
        const base44 = createClientFromRequest(req);
        await base44.asServiceRole.entities.ConnectedPlatform.update(body.connectionId, {
          sync_status: 'error',
          error_message: error.message
        });
      }
    } catch (parseError) {
      console.error('Failed to parse request body for error handling:', parseError);
    }

    return Response.json({ error: error.message }, { status: 500 });
  }
});