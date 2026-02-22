import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/utils/cors.ts';
import { logAudit } from '../_shared/utils/audit.ts';
import { syncPlatform, SyncContext } from '../_shared/logic/sync.ts';
import { decryptLegacy, encrypt } from '../_shared/utils/encryption.ts';
import { refreshAccessTokenLogic } from '../_shared/logic/refreshAccessTokenLogic.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
    const corsHeaders = getCorsHeaders(req);

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    let syncHistoryId: string | null = null;
    let body: any = {};
    let user: any = null;

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            global: { headers: { Authorization: authHeader } }
        });

        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser) {
            return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
        }
        user = authUser;

        try {
            body = await req.json();
        } catch (e) {
            return Response.json({ error: 'Invalid JSON body' }, { status: 400, headers: corsHeaders });
        }

        const { connectionId, platform, forceFullSync = false } = body;

        if (!connectionId || !platform) {
            return Response.json({ error: 'Missing connectionId or platform' }, { status: 400, headers: corsHeaders });
        }

        const adminClient = createClient(supabaseUrl, supabaseServiceKey);

        // Create sync history record
        const { data: syncHistory, error: syncError } = await adminClient.from('sync_history').insert({
            user_id: user.id,
            platform: platform,
            sync_started_at: new Date().toISOString(),
            status: 'pending',
            transactions_synced: 0
        }).select().single();

        if (syncError) throw syncError;
        syncHistoryId = syncHistory.id;

        // Get connection details
        const { data: connections, error: connError } = await adminClient
            .from('connected_platforms')
            .select('*')
            .eq('id', connectionId)
            .eq('user_id', user.id);

        if (connError || !connections || connections.length === 0) {
            throw new Error('Connection not found or unauthorized');
        }

        const conn = connections[0];
        let oauthToken = await decryptLegacy(conn.oauth_token);

        // Check expiry
        const expiresAt = new Date(conn.expires_at);
        if (expiresAt <= new Date() && conn.refresh_token) {
            const refreshCtx = {
                base44: {
                    asServiceRole: {
                        entities: {
                            ConnectedPlatform: {
                                update: async (id: string, updates: any) => {
                                    const { data, error } = await adminClient.from('connected_platforms').update(updates).eq('id', id).select().single();
                                    if (error) throw error;
                                    return data;
                                }
                            }
                        }
                    }
                },
                env: {
                    get: (key: string) => Deno.env.get(key)
                },
                fetch: globalThis.fetch.bind(globalThis),
                encrypt,
                decrypt: decryptLegacy
            };

            const refreshResult = await refreshAccessTokenLogic(refreshCtx, user, {
                connectionId: conn.id
            });

            if (refreshResult.status !== 200 || !refreshResult.body.success) {
                throw new Error('Failed to refresh access token');
            }
            const { data: refreshedConns } = await adminClient.from('connected_platforms').select('*').eq('id', connectionId);
            oauthToken = await decryptLegacy(refreshedConns![0].oauth_token);
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
                const { data, error } = await adminClient
                    .from('revenue_transactions')
                    .select('platform_transaction_id')
                    .eq('user_id', userId)
                    .eq('platform', platform)
                    .gte('transaction_date', startDate)
                    .lte('transaction_date', endDate);

                if (error) throw error;
                return new Set(data.map((t: any) => t.platform_transaction_id));
            },
            saveTransactions: async (transactions: any[]) => {
                const { error } = await adminClient.from('revenue_transactions').insert(transactions);
                if (error) throw error;
            },
            logAudit: (e: any) => logAudit(adminClient, e),
            updateConnectionStatus: async (status: string, error?: string) => {
                const update: any = { sync_status: status };
                if (status === 'active') update.last_synced_at = new Date().toISOString();
                if (error) update.error_message = error;
                else update.error_message = null;

                await adminClient.from('connected_platforms').update(update).eq('id', connectionId);
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
                await adminClient.from('sync_history').update(update).eq('id', syncHistoryId);
            }
        };

        const result = await syncPlatform(ctx, user, connectionId, platform, oauthToken, conn.last_synced_at, forceFullSync);

        return Response.json(result, { headers: corsHeaders });

    } catch (error: any) {
        console.error('Sync error:', error);
        return Response.json({
            error: error.message || 'Sync failed',
            success: false
        }, { status: 500, headers: corsHeaders });
    }
});
