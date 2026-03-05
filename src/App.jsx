/**
 * Zerithum App - Enhanced with Performance, Security & Reliability
 * 
 * @description Main application entry point with comprehensive optimizations
 * @author Zerithum Team
 * @version 2.0.0
 */

import { Suspense, useState, useEffect, memo } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { Loader2, WifiOff } from 'lucide-react';

// Import new optimization layers
import { GlobalErrorBoundary, ErrorProvider, useNetworkStatus } from '@/lib/errorHandling.jsx';
import { analytics } from '@/lib/analytics';
import { registerServiceWorker } from '@/lib/pwa';
import { SkipLink } from '@/lib/accessibility.jsx';
import { cn } from '@/lib/utils';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = memo(mainPageKey ? Pages[mainPageKey] : () => null);
const LandingPage = memo(Pages['Landing'] || (() => null));

const LayoutWrapper = memo(({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>
);

LayoutWrapper.displayName = 'LayoutWrapper';

/**
 * Enhanced Page Loader with skeleton states
 */
const PageLoader = memo(() => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
    <div className="relative">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      <div className="absolute inset-0 w-8 h-8 rounded-full border-2 border-indigo-100" />
    </div>
    <div className="flex flex-col items-center gap-2">
      <div className="h-2 w-24 bg-gray-200 rounded animate-pulse" />
      <div className="h-2 w-16 bg-gray-100 rounded animate-pulse" />
    </div>
  </div>
));

PageLoader.displayName = 'PageLoader';

/**
 * Offline Indicator Component
 */
const OfflineIndicator = memo(() => {
  const { isOnline } = useNetworkStatus();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-sm font-medium shadow-lg transition-all duration-300",
        isOnline
          ? "bg-green-100 text-green-800 opacity-0 translate-y-[-10px]"
          : "bg-amber-100 text-amber-800 opacity-100 translate-y-0"
      )}
      role="status"
      aria-live="polite"
    >
      <span className="flex items-center gap-2">
        <WifiOff className="w-4 h-4" />
        {isOnline ? 'Back online' : 'You are offline'}
      </span>
    </div>
  );
});

OfflineIndicator.displayName = 'OfflineIndicator';

/**
 * Enhanced Authenticated App with error boundaries and optimizations
 */
const AuthenticatedApp = memo(() => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, isAuthenticated, user } = useAuth();
  const { isOnline } = useNetworkStatus();

  // Public routes configuration
  const publicRoutes = [
    'Login', 'Signup', 'authcallback', 'SignIn', 'Landing',
    'Methodology', 'Privacy', 'Security', 'TermsOfService', 'Pricing',
    'data-deletion', 'BillingConfirm'
  ];

  const currentPath = window.location.pathname.substring(1);
  const isPublicRoute = publicRoutes.some(route =>
    route.toLowerCase() === currentPath.toLowerCase()
  );
  const isRoot = currentPath === '';

  const [showSlowLoadingMessage, setShowSlowLoadingMessage] = useState(false);

  // Track slow loading
  useEffect(() => {
    const timer = setTimeout(() => setShowSlowLoadingMessage(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Initialize analytics
  useEffect(() => {
    analytics.init();
    analytics.trackFeatureSupport();

    // Register service worker for PWA
    registerServiceWorker();
  }, []);

  // Track user for analytics
  useEffect(() => {
    if (user?.id) {
      analytics.setUserId(user.id);
    }
  }, [user]);

  // Loading state
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">
        <div className="relative mb-6">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
          <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-indigo-100" />
        </div>

        <p className="text-gray-600 font-medium mb-2">
          {isLoadingAuth ? 'Verifying authentication...' : 'Loading settings...'}
        </p>

        {!isOnline && (
          <p className="text-amber-600 text-sm mb-4">
            You appear to be offline. Some features may be limited.
          </p>
        )}

        {showSlowLoadingMessage && (
          <div className="flex flex-col items-center gap-2 mt-4">
            <p className="text-xs text-gray-400">Taking longer than expected?</p>
            <button
              onClick={() => window.location.href = '/SignIn'}
              className="text-sm text-indigo-600 hover:text-indigo-800 underline transition-colors"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    );
  }

  // Authentication errors
  if (authError && !isPublicRoute) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  // Redirect to login for protected routes
  if (!isAuthenticated && !isPublicRoute && !isRoot && !isLoadingAuth) {
    navigateToLogin();
    return null;
  }

  return (
    <>
      <SkipLink targetId="main-content" />
      <OfflineIndicator />

      <Suspense fallback={<PageLoader />}>
        <main id="main-content" className="outline-none" tabIndex={-1}>
          <Routes>
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <LayoutWrapper currentPageName={mainPageKey}>
                    <MainPage />
                  </LayoutWrapper>
                ) : (
                  <LandingPage />
                )
              }
            />

            {Object.entries(Pages).map(([path, Page]) => {
              const noLayoutRoutes = ['Login', 'Signup', 'SignIn', 'authcallback', 'Landing'];
              const shouldShowLayout = !publicRoutes.includes(path) ||
                (isAuthenticated && !noLayoutRoutes.includes(path));

              return (
                <Route
                  key={path}
                  path={`/${path}`}
                  element={
                    shouldShowLayout ? (
                      <LayoutWrapper currentPageName={path}>
                        <Page />
                      </LayoutWrapper>
                    ) : (
                      <Page />
                    )
                  }
                />
              );
            })}

            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </main>
      </Suspense>
    </>
  );
});

AuthenticatedApp.displayName = 'AuthenticatedApp';

/**
 * Main App Component with all providers
 */
function App() {
  return (
    <GlobalErrorBoundary>
      <ErrorProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClientInstance}>
            <Router>
              <NavigationTracker />
              <AuthenticatedApp />
            </Router>
            <Toaster />
          </QueryClientProvider>
        </AuthProvider>
      </ErrorProvider>
    </GlobalErrorBoundary>
  );
}

export default App;
