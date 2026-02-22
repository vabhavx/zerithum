import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
}

// Custom fetch wrapper to handle AbortError issues in development
const customFetch = (url, options = {}) => {
    // Clone options and remove signal to prevent abort issues
    const { signal, ...restOptions } = options;
    return fetch(url, restOptions);
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        // Enable automatic detection of OAuth tokens in URL hash
        detectSessionInUrl: true,
        // Use implicit flow (hash-based) for OAuth
        flowType: 'implicit',
        // Automatically refresh tokens
        autoRefreshToken: true,
        // Persist session in localStorage
        persistSession: true,
    },
    global: {
        fetch: customFetch,
    },
});

// ============================================================================
// AUTH HELPERS (replaces base44.auth)
// ============================================================================

export const auth = {
    // Get current user
    async me() {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;

        if (user) {
            // Fetch profile data
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            return { ...user, ...profile };
        }
        return null;
    },

    // Update current user's profile
    async updateMe(updates) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('profiles')
            .upsert({ id: user.id, ...updates })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Sign out
    async logout(redirectUrl) {
        await supabase.auth.signOut();
        if (redirectUrl) {
            window.location.href = redirectUrl;
        }
    },

    // Redirect to login
    redirectToLogin(redirectUrl) {
        // Store the redirect URL for after login
        if (redirectUrl) {
            sessionStorage.setItem('redirectAfterLogin', redirectUrl);
        }
        window.location.href = '/login';
    },

    // Sign in with email
    async signInWithEmail(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        return data;
    },

    // Sign up with email
    async signUpWithEmail(email, password, metadata = {}) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata
            }
        });
        if (error) throw error;
        return data;
    },

    // OAuth sign in
    async signInWithOAuth(provider) {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            }
        });
        if (error) throw error;
        return data;
    }
};

// ============================================================================
// ENTITY HELPERS (replaces base44.entities)
// ============================================================================

function createEntityHelper(tableName) {
    return {
        // List all records
        async list(orderBy = '-created_at', limit = 100) {
            const isDesc = orderBy.startsWith('-');
            const column = orderBy.replace('-', '');

            let query = supabase
                .from(tableName)
                .select('*')
                .order(column, { ascending: !isDesc })
                .limit(limit);

            const { data, error } = await query;
            if (error) throw error;
            return data;
        },

        // Select specific columns
        async select(columns = '*', filters = {}, limit = 100, orderBy = '-created_at') {
            const isDesc = orderBy.startsWith('-');
            const column = orderBy.replace('-', '');

            let query = supabase
                .from(tableName)
                .select(columns);

            // Apply filters
            query = applyFilters(query, filters);

            query = query.order(column, { ascending: !isDesc });

            if (limit) {
                query = query.limit(limit);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        },

        // Get count of records
        async count(filters = {}) {
            let query = supabase
                .from(tableName)
                .select('*', { count: 'exact', head: true });

            // Apply filters
            query = applyFilters(query, filters);

            const { count, error } = await query;
            if (error) throw error;
            return count;
        },

        // Paginate records
        async paginate(page = 1, pageSize = 20, filters = {}, orderBy = '-created_at') {
            const isDesc = orderBy.startsWith('-');
            const column = orderBy.replace('-', '');
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            let query = supabase
                .from(tableName)
                .select('*', { count: 'exact' });

            // Apply filters
            query = applyFilters(query, filters);

            query = query
                .order(column, { ascending: !isDesc })
                .range(from, to);

            const { data, count, error } = await query;
            if (error) throw error;
            return { data, count };
        },

        // Fetch all IDs (optimized for large datasets)
        async fetchAllIds(filters = {}, orderBy = 'id', selectColumn = 'id') {
            const isDesc = orderBy.startsWith('-');
            const column = orderBy.replace('-', '');
            let allIds = [];
            let page = 0;
            const batchSize = 1000;
            let hasMore = true;

            while (hasMore) {
                let query = supabase
                    .from(tableName)
                    .select(selectColumn);

                // Apply filters
                query = applyFilters(query, filters);

                query = query
                    .order(column, { ascending: !isDesc })
                    .range(page * batchSize, (page + 1) * batchSize - 1);

                const { data, error } = await query;

                if (error) throw error;

                if (data.length > 0) {
                    allIds = [...allIds, ...data.map(r => r[selectColumn])];
                    page++;
                    if (data.length < batchSize) {
                        hasMore = false;
                    }
                } else {
                    hasMore = false;
                }
            }

            return allIds;
        },

        // Filter records
        async filter(filters, orderBy = '-created_at', limit = 100) {
            const isDesc = orderBy.startsWith('-');
            const column = orderBy.replace('-', '');

            let query = supabase
                .from(tableName)
                .select('*');

            // Apply filters
            query = applyFilters(query, filters);

            query = query.order(column, { ascending: !isDesc }).limit(limit);

            const { data, error } = await query;
            if (error) throw error;
            return data;
        },

        // Get single record by ID
        async get(id) {
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        },

        // Create a record
        async create(record) {
            const { data: { user } } = await supabase.auth.getUser();

            const { data, error } = await supabase
                .from(tableName)
                .insert({ ...record, user_id: user?.id })
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        // Bulk create records
        async bulkCreate(records) {
            const { data: { user } } = await supabase.auth.getUser();

            const recordsWithUserId = records.map(r => ({ ...r, user_id: user?.id }));

            const { data, error } = await supabase
                .from(tableName)
                .insert(recordsWithUserId)
                .select();

            if (error) throw error;
            return data;
        },

        // Update a record
        async update(id, updates) {
            const { data, error } = await supabase
                .from(tableName)
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        // Delete a record
        async delete(id) {
            const { error } = await supabase
                .from(tableName)
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;
        },

        // Fetch all records (auto-pagination)
        async fetchAll(filters = {}, orderBy = '-created_at', batchSize = 1000) {
            const isDesc = orderBy.startsWith('-');
            const column = orderBy.replace('-', '');
            let allData = [];
            let page = 0;
            let hasMore = true;

            while (hasMore) {
                let query = supabase
                    .from(tableName)
                    .select('*');

                // Apply filters
                query = applyFilters(query, filters);

                query = query
                    .order(column, { ascending: !isDesc })
                    .range(page * batchSize, (page + 1) * batchSize - 1);

                const { data, error } = await query;

                if (error) throw error;

                if (data.length > 0) {
                    allData = [...allData, ...data];
                    page++;
                    // If we got fewer than batchSize, we're done
                    if (data.length < batchSize) {
                        hasMore = false;
                    }
                } else {
                    hasMore = false;
                }
            }

            return allData;
        }
    };
}

function applyFilters(query, filters) {
    let q = query;
    Object.entries(filters).forEach(([key, value]) => {
        if (value && typeof value === 'object' && value !== null && !Array.isArray(value)) {
            if ('$gte' in value) q = q.gte(key, value.$gte);
            if ('$lte' in value) q = q.lte(key, value.$lte);
            if ('$gt' in value) q = q.gt(key, value.$gt);
            if ('$lt' in value) q = q.lt(key, value.$lt);
            if ('$in' in value) q = q.in(key, value.$in);
            if ('$neq' in value) q = q.neq(key, value.$neq);
            if ('$eq' in value) q = q.eq(key, value.$eq);
        } else {
            q = q.eq(key, value);
        }
    });
    return q;
}

// Map entity names to table names
const tableNameMap = {
    ConnectedPlatform: 'connected_platforms',
    PlatformConnection: 'platform_connections',
    RevenueTransaction: 'revenue_transactions',
    Transaction: 'transactions',
    BankTransaction: 'bank_transactions',
    Expense: 'expenses',
    Insight: 'insights',
    AutopsyEvent: 'autopsy_events',
    Reconciliation: 'reconciliations',
    SyncHistory: 'sync_history',
    TaxProfile: 'tax_profiles'
};

export const entities = Object.fromEntries(
    Object.entries(tableNameMap).map(([entityName, tableName]) => [
        entityName,
        createEntityHelper(tableName)
    ])
);

// ============================================================================
// FUNCTIONS HELPERS (replaces base44.functions.invoke)
// ============================================================================

export const functions = {
    async invoke(functionName, params = {}) {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!token) throw new Error('Not authenticated');

        // Use raw fetch to bypass Supabase SDK error handling opacity
        // This ensures we get the exact error body (requiresReauth, match, etc)
        const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': anonKey, // Critical for Supabase Edge Functions
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params)
        });

        if (!response.ok) {
            // Manual error parsing to preserve custom properties
            try {
                const errorData = await response.json();
                const errorMsg = errorData.error || `Function returned ${response.status}`;
                const err = new Error(errorMsg);

                // Propagate special fields exactly as Edge Function sends them
                if (errorData.requiresReauth) err.requiresReauth = errorData.requiresReauth;
                if (errorData.authMethod) err.authMethod = errorData.authMethod;
                if (errorData.retryAfter) err.retryAfter = errorData.retryAfter;

                // Mark as a structured function error so we know to rethrow it
                err.isFunctionError = true;

                console.error(`Edge Function ${functionName} returned error:`, errorMsg, errorData);
                throw err;
            } catch (e) {
                // If the error we just threw is valid (it came from our try block), rethrow it.
                // We identify it because we just created it and flagged it.
                if (e && (e.isFunctionError || (e.message && (e.requiresReauth || e.authMethod)))) throw e;

                // Fallback for non-JSON errors
                const text = await response.text().catch(() => '');
                throw new Error(text || `Edge Function returned a non-2xx status code (${response.status})`);
            }
        }

        // Success response
        return await response.json();
    },

    async invokeStream(functionName, params = {}, onEvent) {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params)
        });

        if (!response.ok) {
            // Try to parse the error response as JSON
            try {
                const data = await response.json();
                const errorMsg = data.error || `Function returned ${response.status}`;
                const err = new Error(errorMsg);
                // Propagate special fields from the Edge Function response
                if (data.requiresReauth) err.requiresReauth = data.requiresReauth;
                if (data.authMethod) err.authMethod = data.authMethod;
                if (data.retryAfter) err.retryAfter = data.retryAfter;
                throw err;
            } catch (e) {
                // If JSON parsing failed, create a generic error
                if (e instanceof SyntaxError) {
                    throw new Error(`Edge Function returned a non-2xx status code (${response.status})`);
                }
                // Otherwise re-throw the structured error we created above
                throw e;
            }
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const eventMatch = line.match(/^event: (.*)$/m);
                    const dataMatch = line.match(/^data: (.*)$/m);

                    if (eventMatch && dataMatch) {
                        const type = eventMatch[1].trim();
                        try {
                            const data = JSON.parse(dataMatch[1].trim());
                            await onEvent(type, data);
                        } catch (e) {
                            // If the event handler throws, we should propagate it to abort the stream
                            throw e;
                        }
                    }
                }
            }
        } finally {
            reader.cancel();
        }
    }
};

// ============================================================================
// FILE UPLOAD HELPER
// ============================================================================

export const storage = {
    async upload(bucket, path, file) {
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file);

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);

        return publicUrl;
    }
};

// ============================================================================
// ANALYTICS HELPER (replaces base44.appLogs)
// ============================================================================

export const appLogs = {
    // Log a generic event
    async logEvent(eventName, data = {}) {
        // In the future, this would send data to an analytics backend
        // For now, we just log to console in development
        if (import.meta.env.DEV) {
            console.log(`[Analytics] ${eventName}`, data);
        }
        return Promise.resolve();
    },

    // Log user visiting a page
    async logUserInApp(pageName) {
        return this.logEvent('page_view', { page: pageName });
    }
};

// ============================================================================
// BACKWARD COMPATIBLE EXPORT (drop-in replacement for base44)
// ============================================================================

export const base44Compatible = {
    auth,
    entities,
    functions,
    storage,
    appLogs
};

// Direct export for drop-in replacement of base44Client
export const base44 = base44Compatible;

export default supabase;

