/**
 * Progressive Web App Support
 * Service worker registration, offline support, and app-like features
 */

// ============================================================================
// Service Worker Registration
// ============================================================================

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'imports',
    });

    console.log('SW registered:', registration);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New version available
          showUpdateNotification(newWorker);
        }
      });
    });

    return registration;
  } catch (error) {
    console.error('SW registration failed:', error);
    return null;
  }
}

function showUpdateNotification(worker) {
  // Dispatch custom event for UI to handle
  window.dispatchEvent(new CustomEvent('sw-update-available', {
    detail: { worker },
  }));
}

export function updateServiceWorker() {
  if (!navigator.serviceWorker.controller) return;
  
  navigator.serviceWorker.controller.postMessage({
    type: 'SKIP_WAITING',
  });
  
  window.location.reload();
}

// ============================================================================
// Install Prompt
// ============================================================================

let deferredPrompt = null;

export function initInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Dispatch event for UI
    window.dispatchEvent(new CustomEvent('pwa-install-available'));
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    window.dispatchEvent(new CustomEvent('pwa-installed'));
  });
}

export async function promptInstall() {
  if (!deferredPrompt) return false;

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  
  deferredPrompt = null;
  
  return outcome === 'accepted';
}

export function isInstallAvailable() {
  return deferredPrompt !== null;
}

// ============================================================================
// Offline Support
// ============================================================================

export const offlineSupport = {
  isOnline: () => navigator.onLine,

  async checkConnectivity() {
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-store',
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  subscribeToNetworkChanges(callback) {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  },
};

// ============================================================================
// Background Sync
// ============================================================================

export async function registerBackgroundSync(tag) {
  if (!('serviceWorker' in navigator)) return false;
  if (!('SyncManager' in window)) return false;

  const registration = await navigator.serviceWorker.ready;
  
  try {
    await registration.sync.register(tag);
    return true;
  } catch (error) {
    console.error('Background sync registration failed:', error);
    return false;
  }
}

// ============================================================================
// Push Notifications
// ============================================================================

export const pushNotifications = {
  async requestPermission() {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  async subscribe(pushServerPublicKey) {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers not supported');
    }

    const registration = await navigator.serviceWorker.ready;
    
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(pushServerPublicKey),
      });
    }

    return subscription;
  },

  async unsubscribe() {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
    }
  },
};

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

// ============================================================================
// App Badge
// ============================================================================

export const appBadge = {
  async set(count) {
    if (!('setAppBadge' in navigator)) return false;
    
    try {
      await navigator.setAppBadge(count);
      return true;
    } catch (error) {
      console.error('Failed to set app badge:', error);
      return false;
    }
  },

  async clear() {
    if (!('clearAppBadge' in navigator)) return false;
    
    try {
      await navigator.clearAppBadge();
      return true;
    } catch (error) {
      console.error('Failed to clear app badge:', error);
      return false;
    }
  },
};

// ============================================================================
// Screen Wake Lock
// ============================================================================

export const wakeLock = {
  lock: null,

  async request() {
    if (!('wakeLock' in navigator)) return false;

    try {
      this.lock = await navigator.wakeLock.request('screen');
      return true;
    } catch (error) {
      console.error('Wake lock request failed:', error);
      return false;
    }
  },

  async release() {
    if (this.lock) {
      await this.lock.release();
      this.lock = null;
    }
  },
};

// ============================================================================
// React Hooks
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

export function usePWAStatus() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for install availability
    const handleInstallAvailable = () => setCanInstall(true);
    window.addEventListener('pwa-install-available', handleInstallAvailable);

    // Listen for successful install
    const handleInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
    };
    window.addEventListener('pwa-installed', handleInstalled);

    // Network status
    const unsubscribe = offlineSupport.subscribeToNetworkChanges(setIsOffline);

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('pwa-installed', handleInstalled);
      unsubscribe();
    };
  }, []);

  const install = useCallback(async () => {
    const accepted = await promptInstall();
    if (accepted) {
      setIsInstalled(true);
      setCanInstall(false);
    }
    return accepted;
  }, []);

  return {
    isInstalled,
    canInstall,
    isOffline,
    install,
  };
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState(null);

  useEffect(() => {
    const unsubscribe = offlineSupport.subscribeToNetworkChanges((online) => {
      setIsOnline(online);
    });

    if ('connection' in navigator) {
      setConnectionType(navigator.connection?.effectiveType);
      navigator.connection?.addEventListener('change', () => {
        setConnectionType(navigator.connection?.effectiveType);
      });
    }

    return unsubscribe;
  }, []);

  return { isOnline, connectionType };
}

export function useUpdateNotification() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [worker, setWorker] = useState(null);

  useEffect(() => {
    const handleUpdate = (event) => {
      setUpdateAvailable(true);
      setWorker(event.detail.worker);
    };

    window.addEventListener('sw-update-available', handleUpdate);
    return () => window.removeEventListener('sw-update-available', handleUpdate);
  }, []);

  const update = useCallback(() => {
    if (worker) {
      worker.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [worker]);

  return { updateAvailable, update };
}
