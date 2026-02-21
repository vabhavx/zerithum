import { Suspense, useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { Loader2 } from 'lucide-react';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;
const LandingPage = Pages['Landing'] || (() => <></>);

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

// Simple loading component for Suspense fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, isAuthenticated } = useAuth();

  // Public routes that don't require authentication
  const publicRoutes = ['Login', 'Signup', 'AuthCallback', 'SignIn', 'Landing', 'Methodology', 'Privacy', 'Security', 'TermsOfService', 'Pricing'];
  // Remove leading slash for matching
  const currentPath = window.location.pathname.substring(1);
  const isPublicRoute = publicRoutes.some(route => route.toLowerCase() === currentPath.toLowerCase());
  const isRoot = currentPath === '';

  const [showSlowLoadingMessage, setShowSlowLoadingMessage] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowSlowLoadingMessage(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-950 z-50">
        <Loader2 className="w-10 h-10 animate-spin text-zteal-400 mb-4" />
        <p className="text-white/50 text-sm animate-pulse mb-4">
          {isLoadingAuth ? 'Verifying authentication...' : 'Loading settings...'}
        </p>

        {showSlowLoadingMessage && (
          <button
            onClick={() => window.location.href = '/Login'}
            className="text-xs text-zteal-400 hover:text-white underline transition-colors cursor-pointer"
          >
            Taking too long? Click here to Login
          </button>
        )}
      </div>
    );
  }

  // Failsafe: If infinite loading happens, force logout option (Hidden but accessible if needed via console)
  // or auto-redirect after timeout could be implemented here.

  // Handle authentication errors (only for protected routes)
  if (authError && !isPublicRoute) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Redirect to login if not authenticated and trying to access protected route
  if (!isAuthenticated && !isPublicRoute && !isRoot && !isLoadingAuth) {
    navigateToLogin();
    return null;
  }

  // Render the main app
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={
          isAuthenticated ? (
            <LayoutWrapper currentPageName={mainPageKey}>
              <MainPage />
            </LayoutWrapper>
          ) : (
            <LandingPage />
          )
        } />
        {Object.entries(Pages).map(([path, Page]) => {
          // Define routes that should NOT have the sidebar even if logged in
          const noLayoutRoutes = ['Login', 'Signup', 'SignIn', 'AuthCallback', 'Landing'];
          const shouldShowLayout = !publicRoutes.includes(path) || (isAuthenticated && !noLayoutRoutes.includes(path));

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
    </Suspense>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
