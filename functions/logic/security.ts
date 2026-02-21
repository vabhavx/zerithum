/**
 * Security logic module - pure functions for password validation, OTP handling,
 * and rate limiting. Testable without edge function runtime.
 */

/**
 * Supported OAuth providers for Supabase Auth.
 * Used to determine if a user has password-based auth.
 */
export const OAUTH_PROVIDERS = ['google', 'github', 'gitlab', 'bitbucket', 'azure', 'facebook', 'twitter'];

export interface PasswordValidationResult {
    valid: boolean;
    errors: string[];
    strength: 'weak' | 'medium' | 'strong';
}

/**
 * Checks if a password has been compromised using the Have I Been Pwned API.
 * Uses k-anonymity to protect the password by only sending the first 5 chars of its SHA-1 hash.
 */
async function isPasswordPwned(password: string): Promise<boolean> {
    try {
        const msgUint8 = new TextEncoder().encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

        const prefix = hashHex.substring(0, 5);
        const suffix = hashHex.substring(5);

        const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
        if (!response.ok) {
            // Fail open if HIBP is down to avoid blocking users
            return false;
        }

        const text = await response.text();
        const lines = text.split('\n');

        return lines.some(line => line.split(':')[0].trim() === suffix);
    } catch (error) {
        console.error('Error checking pwned password:', error);
        return false;
    }
}

/**
 * Validates a new password against security requirements.
 * - Minimum 12 characters
 * - Not a compromised password (via HIBP)
 * - Returns strength assessment
 */
export async function validatePassword(password: string): Promise<PasswordValidationResult> {
    const errors: string[] = [];

    // Minimum length check
    if (password.length < 12) {
        errors.push('Password must be at least 12 characters');
    }

    // Compromised password check
    if (password.length >= 12 && await isPasswordPwned(password)) {
        errors.push('This password has appeared in a data breach. Please choose a different, more unique password');
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
    let message = error?.message || 'An unexpected error occurred';

    // Don't expose internal error details
    if (message.includes('stack') || message.includes('at ')) {
        return 'An unexpected error occurred. Please try again.';
    }

    // List of patterns to redact
    const sensitivePatterns = [
        /password/gi,
        /token/gi,
        /secret/gi,
        /key/gi,
        /credential/gi,
        /auth/gi
    ];

    // Redact sensitive information
    for (const pattern of sensitivePatterns) {
        message = message.replace(pattern, '********');
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
