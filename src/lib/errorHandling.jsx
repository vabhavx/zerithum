/**
 * Comprehensive Error Handling & Resilience Layer
 * Error boundaries, retry logic, and graceful degradation
 */

import React, { Component, createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, WifiOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ============================================================================
// Error Classification System
// ============================================================================

export const ErrorTypes = {
  NETWORK: 'network',
  AUTH: 'authentication',
  VALIDATION: 'validation',
  SERVER: 'server',
  CLIENT: 'client',
  TIMEOUT: 'timeout',
  UNKNOWN: 'unknown',
};

export const ErrorSeverity = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

/**
 * Classify error type based on error object
 */
export function classifyError(error) {
  if (!error) return { type: ErrorTypes.UNKNOWN, severity: ErrorSeverity.LOW };

  const message = error.message?.toLowerCase() || '';
  const status = error.status || error.statusCode;

  // Network errors
  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('connection') ||
    message.includes('offline') ||
    message.includes('enetunreach') ||
    !navigator.onLine
  ) {
    return { type: ErrorTypes.NETWORK, severity: ErrorSeverity.HIGH, retryable: true };
  }

  // Timeout errors
  if (message.includes('timeout') || message.includes('timed out')) {
    return { type: ErrorTypes.TIMEOUT, severity: ErrorSeverity.MEDIUM, retryable: true };
  }

  // Auth errors
  if (status === 401 || status === 403 || message.includes('unauthorized') || message.includes('forbidden')) {
    return { type: ErrorTypes.AUTH, severity: ErrorSeverity.CRITICAL, retryable: false };
  }

  // Validation errors
  if (status === 400 || status === 422 || message.includes('validation') || message.includes('invalid')) {
    return { type: ErrorTypes.VALIDATION, severity: ErrorSeverity.MEDIUM, retryable: false };
  }

  // Server errors
  if (status >= 500 || message.includes('server error')) {
    return { type: ErrorTypes.SERVER, severity: ErrorSeverity.HIGH, retryable: true };
  }

  return { type: ErrorTypes.UNKNOWN, severity: ErrorSeverity.MEDIUM, retryable: true };
}

// ============================================================================
// Global Error Boundary
// ============================================================================

export class GlobalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState(prev => ({ 
      errorInfo,
      errorCount: prev.errorCount + 1,
    }));

    // Log to error tracking service
    this.logError(error, errorInfo);
  }

  logError(error, errorInfo) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    // Send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with error tracking service (Sentry, etc.)
      console.error('Global Error:', errorData);
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { type, severity } = classifyError(this.state.error);
      const isCritical = severity === ErrorSeverity.CRITICAL;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
              isCritical ? 'bg-red-100' : 'bg-amber-100'
            }`}>
              <AlertTriangle className={`w-8 h-8 ${isCritical ? 'text-red-600' : 'text-amber-600'}`} />
            </div>
            
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              {isCritical ? 'Critical Error' : 'Something Went Wrong'}
            </h1>
            
            <p className="text-gray-500 mb-6">
              {process.env.NODE_ENV === 'development' 
                ? this.state.error?.message 
                : 'We apologize for the inconvenience. Please try again.'}
            </p>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <pre className="text-left text-xs bg-gray-100 p-4 rounded-lg mb-6 overflow-auto max-h-48 text-gray-700">
                {this.state.errorInfo.componentStack}
              </pre>
            )}

            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={this.handleReset}
                disabled={this.state.errorCount > 3}
              >
                Try Again
              </Button>
              <Button
                onClick={this.handleReload}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Reload Page
              </Button>
            </div>

            {this.state.errorCount > 3 && (
              <p className="mt-4 text-sm text-red-500">
                Multiple errors detected. Please reload the page.
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// Async Error Boundary Hook
// ============================================================================

const ErrorContext = createContext({
  error: null,
  setError: () => {},
  clearError: () => {},
});

export function ErrorProvider({ children }) {
  const [error, setError] = useState(null);
  const [errorHistory, setErrorHistory] = useState([]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const addError = useCallback((newError) => {
    const classified = classifyError(newError);
    const enrichedError = { 
      ...newError, 
      ...classified,
      timestamp: new Date().toISOString(),
      id: Math.random().toString(36).substr(2, 9),
    };
    
    setError(enrichedError);
    setErrorHistory(prev => [...prev.slice(-9), enrichedError]);
  }, []);

  const value = {
    error,
    setError: addError,
    clearError,
    errorHistory,
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
      {error && <ErrorToast error={error} onClose={clearError} />}
    </ErrorContext.Provider>
  );
}

export function useError() {
  return useContext(ErrorContext);
}

// ============================================================================
// Error Toast Component
// ============================================================================

function ErrorToast({ error, onClose }) {
  const [progress, setProgress] = useState(100);
  const AUTO_DISMISS_TIME = 5000;

  useEffect(() => {
    if (error?.severity === ErrorSeverity.CRITICAL) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / AUTO_DISMISS_TIME) * 100);
      setProgress(remaining);

      if (remaining === 0) {
        onClose();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [error, onClose]);

  const getIcon = () => {
    switch (error?.type) {
      case ErrorTypes.NETWORK:
        return <WifiOff className="w-5 h-5" />;
      case ErrorTypes.AUTH:
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getColors = () => {
    switch (error?.severity) {
      case ErrorSeverity.CRITICAL:
        return 'bg-red-50 border-red-200 text-red-800';
      case ErrorSeverity.HIGH:
        return 'bg-amber-50 border-amber-200 text-amber-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2">
      <div className={`rounded-lg border shadow-lg p-4 min-w-[320px] ${getColors()}`}>
        <div className="flex items-start gap-3">
          {getIcon()}
          <div className="flex-1">
            <h4 className="font-medium text-sm">
              {error?.type === ErrorTypes.NETWORK ? 'Connection Issue' : 'Error'}
            </h4>
            <p className="text-sm opacity-90 mt-1">{error?.message}</p>
          </div>
          <button
            onClick={onClose}
            className="opacity-60 hover:opacity-100 transition-opacity"
          >
            ×
          </button>
        </div>
        {error?.severity !== ErrorSeverity.CRITICAL && (
          <div className="mt-3 h-1 bg-black/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-current transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Retry Logic with Exponential Backoff
// ============================================================================

export async function withRetry(fn, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    retryableTypes = [ErrorTypes.NETWORK, ErrorTypes.TIMEOUT, ErrorTypes.SERVER],
    onRetry,
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const classified = classifyError(error);

      if (attempt === maxRetries || !retryableTypes.includes(classified.type)) {
        throw error;
      }

      const delay = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        maxDelay
      );

      if (onRetry) {
        onRetry({ attempt: attempt + 1, maxRetries, delay, error });
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Hook for retryable operations
 */
export function useRetryable() {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const execute = useCallback(async (fn, options = {}) => {
    setIsRetrying(true);
    setRetryCount(0);

    try {
      const result = await withRetry(fn, {
        ...options,
        onRetry: ({ attempt }) => setRetryCount(attempt),
      });
      return result;
    } finally {
      setIsRetrying(false);
    }
  }, []);

  return { execute, isRetrying, retryCount };
}

// ============================================================================
// Network Status Monitoring
// ============================================================================

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Get connection info if available
    if ('connection' in navigator) {
      setConnectionType(navigator.connection?.effectiveType);
      navigator.connection?.addEventListener('change', () => {
        setConnectionType(navigator.connection?.effectiveType);
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, connectionType };
}

// ============================================================================
// Safe Async Hook
// ============================================================================

export function useSafeAsync() {
  const { setError } = useError();
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(async (asyncFn, options = {}) => {
    const { showError = true, onError, onSuccess } = options;
    setIsLoading(true);

    try {
      const result = await asyncFn();
      if (onSuccess) onSuccess(result);
      return result;
    } catch (error) {
      if (showError) setError(error);
      if (onError) onError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [setError]);

  return { execute, isLoading };
}

// ============================================================================
// Component-Level Error Boundary
// ============================================================================

export class ComponentErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Component Error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-6 text-center border border-gray-200 rounded-lg bg-gray-50">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-4">
            Failed to load {this.props.componentName || 'component'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={this.handleRetry}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
