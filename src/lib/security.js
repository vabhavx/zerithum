/**
 * Security Layer
 * Input sanitization, XSS prevention, CSRF protection, and rate limiting
 */

import { useEffect, useRef, useCallback } from 'react';

// ============================================================================
// Input Sanitization
// ============================================================================

const DANGEROUS_PATTERNS = [
  /<script[^>]*>[\s\S]*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe[^>]*>[\s\S]*?<\/iframe>/gi,
  /<object[^>]*>[\s\S]*?<\/object>/gi,
  /<embed[^>]*>/gi,
];

const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input, options = {}) {
  const { 
    allowHTML = false, 
    maxLength = 10000,
    stripScripts = true,
  } = options;

  if (typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Check max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Strip scripts if not allowed
  if (stripScripts && !allowHTML) {
    DANGEROUS_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });
  }

  // Escape HTML entities
  if (!allowHTML) {
    sanitized = sanitized.replace(/[&<>"'\/]/g, char => HTML_ESCAPE_MAP[char]);
  }

  return sanitized.trim();
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email) {
  if (typeof email !== 'string') return '';
  
  const sanitized = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return emailRegex.test(sanitized) ? sanitized : '';
}

/**
 * Sanitize URL
 */
export function sanitizeUrl(url, allowedProtocols = ['http:', 'https:']) {
  if (typeof url !== 'string') return '';

  try {
    const parsed = new URL(url);
    if (!allowedProtocols.includes(parsed.protocol)) {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
}

// ============================================================================
// Rate Limiting
// ============================================================================

class RateLimiter {
  constructor() {
    this.attempts = new Map();
    this.cooldowns = new Map();
  }

  canProceed(key, maxAttempts = 5, windowMs = 60000) {
    const now = Date.now();
    
    // Check cooldown
    const cooldownEnd = this.cooldowns.get(key);
    if (cooldownEnd && now < cooldownEnd) {
      return {
        allowed: false,
        remainingTime: cooldownEnd - now,
        reason: 'cooldown',
      };
    }

    // Get attempts in window
    const attempts = this.attempts.get(key) || [];
    const recentAttempts = attempts.filter(time => now - time < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      // Set cooldown
      const cooldownTime = Math.min(300000, windowMs * 2); // Max 5 min cooldown
      this.cooldowns.set(key, now + cooldownTime);
      return {
        allowed: false,
        remainingTime: cooldownTime,
        reason: 'rate_limit',
      };
    }

    return { allowed: true };
  }

  recordAttempt(key) {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    attempts.push(now);
    this.attempts.set(key, attempts);
  }

  reset(key) {
    this.attempts.delete(key);
    this.cooldowns.delete(key);
  }
}

export const globalRateLimiter = new RateLimiter();

/**
 * Hook for rate-limited actions
 */
export function useRateLimit(key, options = {}) {
  const { maxAttempts = 5, windowMs = 60000 } = options;
  const [state, setState] = useState({ allowed: true, remainingTime: 0 });

  const checkLimit = useCallback(() => {
    const result = globalRateLimiter.canProceed(key, maxAttempts, windowMs);
    setState(result);
    return result.allowed;
  }, [key, maxAttempts, windowMs]);

  const recordAttempt = useCallback(() => {
    globalRateLimiter.recordAttempt(key);
    checkLimit();
  }, [key, checkLimit]);

  const reset = useCallback(() => {
    globalRateLimiter.reset(key);
    setState({ allowed: true, remainingTime: 0 });
  }, [key]);

  return {
    ...state,
    checkLimit,
    recordAttempt,
    reset,
  };
}

// ============================================================================
// CSRF Protection
// ============================================================================

/**
 * Generate CSRF token
 */
export function generateCSRFToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Store CSRF token securely
 */
export function storeCSRFToken(token) {
  sessionStorage.setItem('csrf_token', token);
}

/**
 * Get stored CSRF token
 */
export function getCSRFToken() {
  return sessionStorage.getItem('csrf_token');
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token) {
  const stored = getCSRFToken();
  return stored && token && stored === token;
}

// ============================================================================
// Secure Storage
// ============================================================================

export const secureStorage = {
  set(key, value, options = {}) {
    const { encrypt = false, ttl } = options;
    
    const data = {
      value,
      timestamp: Date.now(),
      ttl,
    };

    const serialized = JSON.stringify(data);
    
    if (encrypt && typeof window !== 'undefined') {
      // Simple XOR encryption for non-sensitive data
      // For sensitive data, use proper encryption
      const encrypted = this._xorEncrypt(serialized, this._getKey());
      sessionStorage.setItem(key, encrypted);
    } else {
      sessionStorage.setItem(key, serialized);
    }
  },

  get(key) {
    const item = sessionStorage.getItem(key);
    if (!item) return null;

    try {
      // Try parsing as JSON first
      const data = JSON.parse(item);
      
      // Check TTL
      if (data.ttl && Date.now() - data.timestamp > data.ttl) {
        this.remove(key);
        return null;
      }
      
      return data.value;
    } catch {
      // Might be encrypted
      try {
        const decrypted = this._xorEncrypt(item, this._getKey());
        const data = JSON.parse(decrypted);
        
        if (data.ttl && Date.now() - data.timestamp > data.ttl) {
          this.remove(key);
          return null;
        }
        
        return data.value;
      } catch {
        return null;
      }
    }
  },

  remove(key) {
    sessionStorage.removeItem(key);
  },

  clear() {
    sessionStorage.clear();
  },

  _getKey() {
    // Generate key from browser fingerprint
    return navigator.userAgent.slice(0, 16);
  },

  _xorEncrypt(str, key) {
    let result = '';
    for (let i = 0; i < str.length; i++) {
      result += String.fromCharCode(
        str.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return btoa(result);
  },
};

// ============================================================================
// Content Security Policy Helpers
// ============================================================================

export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'blob:', 'https:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'", 'https:'],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
};

export function generateCSPHeader(directives = CSP_DIRECTIVES) {
  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}

// ============================================================================
// Secure Random
// ============================================================================

export function secureRandom(min = 0, max = 1) {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const random = array[0] / (0xffffffff + 1);
  return min + random * (max - min);
}

export function secureRandomString(length = 16) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < length; i++) {
    result += charset[randomValues[i] % charset.length];
  }
  
  return result;
}

// ============================================================================
// Password Strength
// ============================================================================

export function checkPasswordStrength(password) {
  const checks = {
    length: password.length >= 12,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    noCommon: !isCommonPassword(password),
  };

  const score = Object.values(checks).filter(Boolean).length;
  
  return {
    score,
    checks,
    strength: score < 3 ? 'weak' : score < 5 ? 'medium' : 'strong',
    suggestions: getPasswordSuggestions(checks),
  };
}

function isCommonPassword(password) {
  const common = ['password', '123456', 'qwerty', 'admin', 'letmein'];
  return common.some(p => password.toLowerCase().includes(p));
}

function getPasswordSuggestions(checks) {
  const suggestions = [];
  if (!checks.length) suggestions.push('Use at least 12 characters');
  if (!checks.lowercase) suggestions.push('Add lowercase letters');
  if (!checks.uppercase) suggestions.push('Add uppercase letters');
  if (!checks.number) suggestions.push('Add numbers');
  if (!checks.special) suggestions.push('Add special characters');
  return suggestions;
}

// ============================================================================
// Audit Logging
// ============================================================================

export const auditLogger = {
  async log(event, details = {}) {
    const entry = {
      event,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 100) : '',
      ...details,
    };

    // Store locally for debugging
    if (typeof localStorage !== 'undefined') {
      try {
        const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
        logs.push(entry);
        localStorage.setItem('audit_logs', JSON.stringify(logs.slice(-100))); // Keep last 100
      } catch {
        // Ignore localStorage quota or parsing errors silently to prevent app crashes
      }
    }

    // Send to server when an endpoint is configured
    const endpoint = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_AUDIT_ENDPOINT : null;
    if (endpoint) {
      try {
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
          keepalive: true, // Ensure delivery even if navigating away
        });
      } catch {
        // Fail gracefully without exposing internal logging mechanism failures
      }
    }
  },

  getLogs() {
    return JSON.parse(localStorage.getItem('audit_logs') || '[]');
  },

  clearLogs() {
    localStorage.removeItem('audit_logs');
  },
};

// ============================================================================
// Hook: Secure Form
// ============================================================================

import { useState } from 'react';

export function useSecureForm(initialValues = {}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const sanitizeField = useCallback((name, value) => {
    switch (name) {
      case 'email':
        return sanitizeEmail(value);
      case 'url':
      case 'website':
        return sanitizeUrl(value);
      default:
        return sanitizeInput(value);
    }
  }, []);

  const handleChange = useCallback((name, value) => {
    const sanitized = sanitizeField(name, value);
    setValues(prev => ({ ...prev, [name]: sanitized }));
    setErrors(prev => ({ ...prev, [name]: null }));
  }, [sanitizeField]);

  const validate = useCallback((validators) => {
    const newErrors = {};
    let isValid = true;

    Object.entries(validators).forEach(([field, validator]) => {
      const error = validator(values[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values]);

  return {
    values,
    errors,
    handleChange,
    validate,
    setValues,
    setErrors,
  };
}
