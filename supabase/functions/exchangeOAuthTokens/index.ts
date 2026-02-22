import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/utils/cors.ts';
import { encrypt } from '../_shared/utils/encryption.ts';
import { exchangeOAuthTokens } from '../_shared/logic/exchangeOAuthTokensLogic.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
    const corsHeaders = getCorsHeaders(req);

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            global: { headers: { Authorization: authHeader } }
        });

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
        }

        let body;
        try {
            body = await req.json();
        } catch (e) {
            body = {};
        }
        const { code, platform } = body;

        const result = await exchangeOAuthTokens(
            {
                envGet: (key: string) => Deno.env.get(key),
                fetch: fetch,
                logError: console.error,
                encrypt: encrypt,
                base44: {
                    asServiceRole: {
                        entities: {
                            ConnectedPlatform: {
                                filter: async (f: any) => {
                                    let query = supabase.from('connected_platforms').select('*');
                                    if (f.user_id) query = query.eq('user_id', f.user_id);
                                    if (f.platform) query = query.eq('platform', f.platform);
                                    if (f.id) query = query.eq('id', f.id);
                                    const { data, error } = await query;
                                    if (error) throw error;
                                    return data;
                                },
                                update: async (id: string, updates: any) => {
                                    const { data, error } = await supabase.from('connected_platforms').update(updates).eq('id', id).select().single();
                                    if (error) throw error;
                                    return data;
                                },
                                create: async (record: any) => {
                                    const { data, error } = await supabase.from('connected_platforms').insert(record).select().single();
                                    if (error) throw error;
                                    return data;
                                }
                            }
                        }
                    }
                }
            },
            user,
            code,
            platform
        );

        return Response.json(result.body, { status: result.status, headers: corsHeaders });

    } catch (error: any) {
        console.error('Token exchange error:', error);
        return Response.json({ error: error.message || 'Internal Server Error' }, { status: 500, headers: corsHeaders });
    }
});
