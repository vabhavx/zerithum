import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase, base44 } from '@/api/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState({ public_settings: {} });

  useEffect(() => {
    let isMounted = true;

    // Immediately check for session on mount (and handle OAuth callback)
    const initializeAuth = async () => {
      try {
        // Check for OAuth callback hash first
        const hash = window.location.hash;
        const isOAuthCallback = hash && hash.includes('access_token');

        if (isOAuthCallback) {
          // For OAuth callbacks, wait for Supabase to process the hash
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Try to get session from Supabase
        let session = null;
        try {
          const result = await supabase.auth.getSession();
          session = result.data?.session;
        } catch (err) {
          console.warn('[Auth] getSession failed:', err.name, '- recovering from localStorage');

          // Recover from localStorage directly
          // Supabase stores session in localStorage with a specific key format
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const projectId = new URL(supabaseUrl).hostname.split('.')[0];
          const storageKey = `sb-${projectId}-auth-token`;
          const storedData = localStorage.getItem(storageKey);

          if (storedData) {
            try {
              const parsed = JSON.parse(storedData);
              if (parsed.access_token) {
                // Use Supabase SDK to set session, ensuring token validation
                const { data, error } = await supabase.auth.setSession({
                  access_token: parsed.access_token,
                  refresh_token: parsed.refresh_token || '',
                });

                if (error) {
                  console.warn('[Auth] Failed to restore session from storage:', error);
                } else if (data?.session) {
                  session = data.session;
                }
              }
            } catch (parseError) {
              console.warn('[Auth] Failed to parse stored session');
            }
          }

          // If still no session and this is an OAuth callback, parse tokens from hash
          if (!session && isOAuthCallback) {
            try {
              const hashParams = new URLSearchParams(hash.substring(1));
              const accessToken = hashParams.get('access_token');
              const refreshToken = hashParams.get('refresh_token');

              if (accessToken) {
                // Use Supabase SDK to set session, avoiding insecure manual localStorage manipulation
                const { data, error } = await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken || '',
                });

                if (error) {
                  console.error('[Auth] Failed to set session from hash:', error);
                } else if (data?.session) {
                  session = data.session;
                }
              }
            } catch (parseError) {
              console.error('[Auth] Failed to parse hash tokens:', parseError);
            }
          }
        }

        if (!isMounted) return;

        if (session?.user) {
          setUser(session.user);
          setIsAuthenticated(true);
          fetchUserProfile(session.user).catch(console.error);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }

        // Clean up URL hash if present
        if (isOAuthCallback) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }

      } catch (error) {
        if (!isMounted) return;
        console.error('[Auth] Init error:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        if (isMounted) {
          setIsLoadingAuth(false);
        }
      }
    };

    initializeAuth();

    // Listen for subsequent auth state changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        setIsAuthenticated(true);
        fetchUserProfile(session.user).catch(console.error);
        setIsLoadingAuth(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setUser(session.user);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (authUser) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error || !profile) {
        console.error('Failed to fetch profile (user might be deleted):', error);
        // If profile is missing, the account is likely deleted or in a bad state.
        // Force logout to ensure all sessions are invalidated.
        await logout(true);
        return;
      }

      setUser({ ...authUser, ...profile });
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      // Safety net: invalid state -> logout
      await logout(true);
    }
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);

      // Check if we have hash fragments from OAuth callback
      const hash = window.location.hash;
      const isOAuthCallback = hash && (hash.includes('access_token') || hash.includes('error'));

      if (isOAuthCallback) {
        // This is an OAuth callback - Supabase needs to process the hash
        // CRITICAL: Do NOT clear the hash BEFORE getSession() - Supabase reads tokens from it!

        // First call to getSession - Supabase will detect and process the hash tokens
        const { data: { session }, error } = await supabase.auth.getSession();

        // NOW we can clear the hash from URL for cleaner UX (after Supabase read it)
        const cleanPath = window.location.pathname + window.location.search;
        if (window.history.replaceState) {
          window.history.replaceState(null, '', cleanPath);
        }

        if (error) {
          console.error('[Auth] OAuth error:', error);
          setAuthError({ type: 'auth_error', message: error.message });
          setIsAuthenticated(false);
          setUser(null);
        } else if (session?.user) {
          setIsAuthenticated(true);
          setUser(session.user);
          fetchUserProfile(session.user).catch(console.error);
        } else {
          console.warn('[Auth] OAuth callback but no session');
          setIsAuthenticated(false);
          setUser(null);
        }

        setIsLoadingAuth(false);
        return;
      }

      // Normal auth check (not OAuth callback)
      const timeoutMs = 5000;
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Auth check timed out')), timeoutMs)
      );

      // Race between actual auth check and timeout
      const { data: { session } } = await Promise.race([
        supabase.auth.getSession(),
        timeoutPromise
      ]);

      if (session?.user) {
        // Optimistically set authenticated to unblock UI
        setIsAuthenticated(true);
        // data.user has basic info, we set it first
        setUser(session.user);

        // Fetch full profile in background
        fetchUserProfile(session.user).catch(console.error);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // If error is timeout or network, likely not logged in or offline.
      // Default to unauthenticated state so the user isn't blocked.
      setIsAuthenticated(false);
      setUser(null);

      if (error.message !== 'Auth check timed out') {
        setAuthError({
          type: 'unknown',
          message: error.message || 'Authentication check failed'
        });
      }
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = async (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);

    await supabase.auth.signOut();

    if (shouldRedirect) {
      window.location.href = '/';
    }
  };

  const navigateToLogin = () => {
    window.location.href = '/SignIn';
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState: checkUserAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
