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
    checkUserAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await fetchUserProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (authUser) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      setUser({ ...authUser, ...profile });
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setUser(authUser);
      setIsAuthenticated(true);
    }
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);

      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Auth check timed out')), 5000)
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
    window.location.href = '/Login';
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
