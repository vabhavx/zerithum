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

    // Get connection details
    const connection = await base44.entities.ConnectedPlatform.filter({ id: connectionId });
    if (!connection || connection.length === 0) {
      return Response.json({ error: 'Connection not found' }, { status: 404 });
    }

    const conn = connection[0];

    // Update status to syncing
    await base44.entities.ConnectedPlatform.update(connectionId, {
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
        // Fetch Patreon pledges
        const pledgesResponse = await fetch(
          'https://www.patreon.com/api/oauth2/v2/campaigns?include=pledges&fields[pledge]=amount_cents,created_at',
          {
            headers: {
              'Authorization': `Bearer ${conn.oauth_token}`,
              'Accept': 'application/json'
            }
          }
        );

        if (pledgesResponse.ok) {
          const data = await pledgesResponse.json();
          const pledges = data.included || [];
          transactions = pledges.map(pledge => ({
            user_id: user.id,
            platform_transaction_id: `patreon_${pledge.id}`,
            platform: 'patreon',
            amount: (pledge.attributes.amount_cents || 0) / 100,
            currency: 'USD',
            transaction_date: pledge.attributes.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            category: 'membership',
            description: 'Patreon Pledge',
            synced_at: new Date().toISOString()
          }));
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
    await base44.entities.ConnectedPlatform.update(connectionId, {
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

    // Update connection to error status if we have connectionId
    const { connectionId } = await req.json().catch(() => ({}));
    if (connectionId) {
      const base44 = createClientFromRequest(req);
      await base44.entities.ConnectedPlatform.update(connectionId, {
        sync_status: 'error',
        error_message: error.message
      });
    }

    return Response.json({ error: error.message }, { status: 500 });
  }
});