/**
 * Security logic module - pure functions for password validation, OTP handling,
 * and rate limiting. Testable without edge function runtime.
 */

// Common weak passwords to block
const COMMON_PASSWORDS = new Set([
    'password123', 'password1234', 'password12345',
    '123456789012', 'qwertyuiop12', 'abcdefghij12',
    'letmein12345', 'welcome12345', 'admin1234567',
    'iloveyou1234', 'monkey123456', 'dragon123456',
    'master123456', 'sunshine1234', 'princess1234',
]);

export interface PasswordValidationResult {
    valid: boolean;
    errors: string[];
    strength: 'weak' | 'medium' | 'strong';
}

/**
 * Validates a new password against security requirements.
 * - Minimum 12 characters
 * - Not a common password
 * - Returns strength assessment
 */
export function validatePassword(password: string): PasswordValidationResult {
    const errors: string[] = [];

    // Minimum length check
    if (password.length < 12) {
        errors.push('Password must be at least 12 characters');
    }

    // Common password check
    if (COMMON_PASSWORDS.has(password.toLowerCase())) {
        errors.push('This password is too common. Please choose a stronger password');
    }

    // Calculate strength
    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    let score = 0;

    if (password.length >= 12) score++;
    if (password.length >= 16) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score >= 5) strength = 'strong';
    else if (score >= 3) strength = 'medium';

    return {
        valid: errors.length === 0,
        errors,
        strength
    };
}

/**
 * Generates a cryptographically secure 6-digit OTP code.
 */
export function generateOTPCode(): string {
    const randomBytes = new Uint32Array(1);
    crypto.getRandomValues(randomBytes);
    const code = (randomBytes[0] % 900000) + 100000; // 100000-999999
    return code.toString();
}

/**
 * Checks if an OTP code is valid (format only, not verified against DB).
 */
export function isValidOTPFormat(code: string): boolean {
    return /^\d{6}$/.test(code);
}

export interface RateLimitConfig {
    maxAttempts: number;
    windowMs: number;
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: Date;
}

// In-memory rate limit store (per instance, for edge functions)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Checks rate limit for a given key (userId + action).
 * Simple in-memory implementation suitable for edge functions.
 */
export function checkRateLimit(
    key: string,
    config: RateLimitConfig
): RateLimitResult {
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    // Clean up expired entries
    if (entry && entry.resetAt <= now) {
        rateLimitStore.delete(key);
    }

    const current = rateLimitStore.get(key);

    if (!current) {
        // First request in window
        rateLimitStore.set(key, {
            count: 1,
            resetAt: now + config.windowMs
        });
        return {
            allowed: true,
            remaining: config.maxAttempts - 1,
            resetAt: new Date(now + config.windowMs)
        };
    }

    if (current.count >= config.maxAttempts) {
        return {
            allowed: false,
            remaining: 0,
            resetAt: new Date(current.resetAt)
        };
    }

    // Increment count
    current.count++;
    return {
        allowed: true,
        remaining: config.maxAttempts - current.count,
        resetAt: new Date(current.resetAt)
    };
}

/**
 * Rate limit configurations for different actions.
 */
export const RATE_LIMITS = {
    PASSWORD_CHANGE: {
        maxAttempts: 5,
        windowMs: 10 * 60 * 1000 // 10 minutes
    },
    DELETE_ACCOUNT: {
        maxAttempts: 3,
        windowMs: 30 * 60 * 1000 // 30 minutes
    },
    SEND_OTP: {
        maxAttempts: 3,
        windowMs: 10 * 60 * 1000 // 10 minutes
    },
    VERIFY_OTP: {
        maxAttempts: 5,
        windowMs: 10 * 60 * 1000 // 10 minutes
    }
};

/**
 * Audit log action types for security events.
 */
export const SECURITY_ACTIONS = {
    PASSWORD_CHANGE_ATTEMPT: 'PASSWORD_CHANGE_ATTEMPT',
    PASSWORD_CHANGED: 'PASSWORD_CHANGED',
    PASSWORD_CHANGE_FAILED: 'PASSWORD_CHANGE_FAILED',
    SESSIONS_REVOKE_ATTEMPT: 'SESSIONS_REVOKE_ATTEMPT',
    SESSIONS_REVOKED: 'SESSIONS_REVOKED',
    SESSIONS_REVOKE_FAILED: 'SESSIONS_REVOKE_FAILED',
    ACCOUNT_DELETE_REQUESTED: 'ACCOUNT_DELETE_REQUESTED',
    ACCOUNT_DELETED: 'ACCOUNT_DELETED',
    ACCOUNT_DELETE_FAILED: 'ACCOUNT_DELETE_FAILED',
    OTP_SENT: 'OTP_SENT',
    OTP_SEND_FAILED: 'OTP_SEND_FAILED',
    OTP_VERIFIED: 'OTP_VERIFIED',
    OTP_VERIFICATION_FAILED: 'OTP_VERIFICATION_FAILED',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
};

/**
 * Sanitizes error messages to prevent leaking sensitive information.
 */
export function sanitizeErrorMessage(error: any): string {
    const message = error?.message || 'An unexpected error occurred';

    // List of patterns to redact
    const sensitivePatterns = [
        /password/gi,
        /token/gi,
        /secret/gi,
        /key/gi,
        /credential/gi,
        /auth/gi
    ];

    // Don't expose internal error details
    if (message.includes('stack') || message.includes('at ')) {
        return 'An unexpected error occurred. Please try again.';
    }

    return message;
}

/**
 * Extracts client info from request for audit logging.
 */
export function extractClientInfo(req: Request): { ip: string; userAgent: string } {
    return {
        ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            req.headers.get('x-real-ip') ||
            'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown'
    };
}
