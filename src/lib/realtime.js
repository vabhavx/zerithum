/**
 * Real-time Features
 * WebSocket integration, live updates, and real-time collaboration
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// ============================================================================
// WebSocket Manager
// ============================================================================

class WebSocketManager {
  constructor(url, options = {}) {
    this.url = url;
    this.options = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      ...options,
    };
    
    this.ws = null;
    this.reconnectAttempts = 0;
    this.listeners = new Map();
    this.isConnecting = false;
    this.heartbeatTimer = null;
    this.reconnectTimer = null;
  }

  connect() {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) return;
    
    this.isConnecting = true;
    
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.emit('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit(data.type, data.payload);
        } catch (e) {
          this.emit('message', event.data);
        }
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.stopHeartbeat();
        this.emit('disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        this.emit('error', error);
      };
    } catch (error) {
      this.isConnecting = false;
      this.emit('error', error);
    }
  }

  disconnect() {
    this.stopHeartbeat();
    clearTimeout(this.reconnectTimer);
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(type, payload) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
      return true;
    }
    return false;
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    
    return () => this.off(event, callback);
  }

  off(event, callback) {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event, data) {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (e) {
        console.error('WebSocket listener error:', e);
      }
    });
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    this.reconnectAttempts++;
    this.emit('reconnecting', { attempt: this.reconnectAttempts });

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.options.reconnectInterval);
  }

  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this.send('ping');
    }, this.options.heartbeatInterval);
  }

  stopHeartbeat() {
    clearInterval(this.heartbeatTimer);
  }
}

// ============================================================================
// Event Source (Server-Sent Events)
// ============================================================================

class EventSourceManager {
  constructor(url, options = {}) {
    this.url = url;
    this.options = options;
    this.es = null;
    this.listeners = new Map();
  }

  connect() {
    this.es = new EventSource(this.url);
    
    this.es.onopen = () => this.emit('connected');
    this.es.onerror = (error) => this.emit('error', error);
    
    // Handle specific event types
    this.es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit(data.type || 'message', data);
      } catch {
        this.emit('message', event.data);
      }
    };
  }

  disconnect() {
    if (this.es) {
      this.es.close();
      this.es = null;
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event, data) {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (e) {
        console.error('EventSource listener error:', e);
      }
    });
  }
}

// ============================================================================
// React Hooks
// ============================================================================

export function useWebSocket(url, options = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocketManager(url, options);
    wsRef.current = ws;

    ws.on('connected', () => setIsConnected(true));
    ws.on('disconnected', () => setIsConnected(false));
    ws.on('message', (data) => setLastMessage(data));

    ws.connect();

    return () => ws.disconnect();
  }, [url]);

  const send = useCallback((type, payload) => {
    return wsRef.current?.send(type, payload);
  }, []);

  return { isConnected, lastMessage, send };
}

export function useEventSource(url) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const esRef = useRef(null);

  useEffect(() => {
    const es = new EventSourceManager(url);
    esRef.current = es;

    es.on('connected', () => setIsConnected(true));
    es.on('error', () => setIsConnected(false));
    es.on('message', (data) => setLastEvent(data));

    es.connect();

    return () => es.disconnect();
  }, [url]);

  return { isConnected, lastEvent };
}

export function useRealtimeSubscription(channel, callback) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    // Integration with Supabase Realtime
    const subscription = supabase
      .channel(channel)
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        callbackRef.current(payload);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [channel]);
}

export function useLiveData(fetcher, interval = 30000) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await fetcher();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    fetch();
    const timer = setInterval(fetch, interval);
    return () => clearInterval(timer);
  }, [fetch, interval]);

  return { data, isLoading, error, refetch: fetch };
}

// ============================================================================
// Presence & Collaboration
// ============================================================================

export function usePresence(channel) {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Track presence via WebSocket or Supabase Realtime
    const presence = {
      user_id: generateUserId(),
      online_at: new Date().toISOString(),
    };

    setCurrentUser(presence);

    // Subscribe to presence changes
    // Implementation depends on backend

    return () => {
      // Unsubscribe from presence
    };
  }, [channel]);

  return { onlineUsers, currentUser };
}

function generateUserId() {
  return `user-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// Optimistic Updates
// ============================================================================

export function useOptimisticUpdate() {
  const [optimisticData, setOptimisticData] = useState(null);

  const update = useCallback(async (currentData, optimisticValue, apiCall) => {
    // Set optimistic value
    setOptimisticData(optimisticValue);

    try {
      const result = await apiCall();
      setOptimisticData(null);
      return result;
    } catch (error) {
      // Revert on error
      setOptimisticData(null);
      throw error;
    }
  }, []);

  return { optimisticData, update };
}
