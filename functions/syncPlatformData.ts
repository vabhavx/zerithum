import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { logAudit } from './utils/audit.ts';
import { syncPlatform, SyncContext } from './logic/sync.ts';

Deno.serve(async (req) => {
  let syncHistoryId: string | null = null;
  let body: any = {};
  let user: any = null;

  try {
    const base44 = createClientFromRequest(req);
    user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      body = await req.json();
    } catch (e) {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { connectionId, platform, forceFullSync = false } = body;

    if (!connectionId || !platform) {
      return Response.json({ error: 'Missing connectionId or platform' }, { status: 400 });
    }

    // Create sync history record
    const syncHistory = await base44.asServiceRole.entities.SyncHistory.create({
      user_id: user.id,
      platform: platform,
      sync_started_at: new Date().toISOString(),
      status: 'pending',
      transactions_synced: 0
    });
    syncHistoryId = syncHistory.id;

    // Get connection details
    const connection = await base44.asServiceRole.entities.ConnectedPlatform.filter({ 
      id: connectionId,
      user_id: user.id 
    });
    if (!connection || connection.length === 0) {
      throw new Error('Connection not found or unauthorized');
    }

    const conn = connection[0];
    let oauthToken = conn.oauth_token;

    // Check expiry
    const expiresAt = new Date(conn.expires_at);
    if (expiresAt <= new Date() && conn.refresh_token) {
      const refreshResult = await base44.functions.invoke('refreshAccessToken', { 
        connectionId: conn.id 
      });
      
      if (!refreshResult.data.success) {
        throw new Error('Failed to refresh access token');
      }
      const refreshedConn = await base44.asServiceRole.entities.ConnectedPlatform.filter({ id: connectionId });
      oauthToken = refreshedConn[0].oauth_token;
    }

    // Create Context
    const ctx: SyncContext = {
      fetchPlatformData: async (url: string, headers: any) => {
        const res = await fetch(url, { headers });
        if (!res.ok) {
          throw new Error(`API failed: ${res.status} ${res.statusText}`);
        }
        return res.json();
      },
      fetchExistingTransactionIdsInRange: async (userId: string, platform: string, startDate: string, endDate: string) => {
        const existingRecs = await base44.asServiceRole.entities.RevenueTransaction.filter({
          user_id: userId,
          platform: platform,
          transaction_date: {
             $gte: startDate,
             $lte: endDate
          }
        });
        return new Set(existingRecs.map((t: any) => t.platform_transaction_id));
      },
      saveTransactions: async (transactions: any[]) => {
        await base44.asServiceRole.entities.RevenueTransaction.bulkCreate(transactions);
      },
      logAudit: logAudit,
      updateConnectionStatus: async (status: string, error?: string, lastSyncedAt?: string) => {
        const update: any = { sync_status: status };
        if (status === 'active') {
             // Use provided lastSyncedAt or fallback to current time if strictly necessary,
             // but logic/sync.ts should provide it if transactions were found.
             // If no transactions found, maybe we shouldn't update last_synced_at?
             // Logic: "update.last_synced_at = new Date().toISOString()" was the old behavior.
             // New behavior: "must use the maximum transaction date from the fetched batch".
             // If lastSyncedAt is provided, use it.
             if (lastSyncedAt) {
                 // Ensure it's in a format compatible with the DB (ISO usually)
                 // transaction_date is often YYYY-MM-DD.
                 // If it's YYYY-MM-DD, maybe append T23:59:59Z to indicate end of that day?
                 // Or just use it as is if DB accepts it. Let's assume ISO format is preferred.
                 // If the string already contains T, it's likely ISO.
                 update.last_synced_at = lastSyncedAt.includes('T') ? lastSyncedAt : `${lastSyncedAt}T23:59:59.999Z`;
             } else {
                 // If no transactions were fetched, should we update last_synced_at?
                 // If we successfully synced "nothing new", it means we are up to date *as of now*.
                 // However, the rule says "use the maximum transaction date".
                 // If there are no transactions, sticking to the old behavior (now) might be acceptable
                 // OR we should not update it.
                 // But the existing code updated it.
                 // Let's keep existing behavior if no transactions: current time.
                 update.last_synced_at = new Date().toISOString();
             }
        }
        if (error) update.error_message = error;
        else update.error_message = null;

        await base44.asServiceRole.entities.ConnectedPlatform.update(connectionId, update);
      },
      updateSyncHistory: async (status: string, count: number, duration: number, error?: string) => {
        if (!syncHistoryId) return;
        const update: any = {
           sync_completed_at: new Date().toISOString(),
           status,
           transactions_synced: count,
           duration_ms: duration
        };
        if (error) update.error_message = error;
        await base44.asServiceRole.entities.SyncHistory.update(syncHistoryId, update);
      }
    };

    const result = await syncPlatform(ctx, user, connectionId, platform, oauthToken, conn.last_synced_at, forceFullSync);

    return Response.json(result);

  } catch (error: any) {
    console.error('Sync error:', error);

    // Side effect for email notification (outside of context to ensure it runs on top-level error)
    if (user && body.platform) {
       try {
        const base44 = createClientFromRequest(req);
        await base44.asServiceRole.functions.invoke('sendSyncFailedEmail', {
            userId: user.id,
            platform: body.platform,
            errorMessage: error.message
          });
       } catch (e) {
           console.error('Failed to send email', e);
       }
    }

    return Response.json({ 
      error: error.message || 'Sync failed',
      originalError: (error as any).originalError,
      retryAttempts: (error as any).retryAttempts || 0,
      success: false
    }, { status: 500 });
  }
});