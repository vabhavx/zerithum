// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { classifyError, ErrorTypes, ErrorSeverity } from './errorHandling';

describe('classifyError', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return UNKNOWN type and LOW severity for null or undefined error', () => {
    expect(classifyError(null)).toEqual({
      type: ErrorTypes.UNKNOWN,
      severity: ErrorSeverity.LOW,
    });
    expect(classifyError(undefined)).toEqual({
      type: ErrorTypes.UNKNOWN,
      severity: ErrorSeverity.LOW,
    });
  });

  describe('Network Errors', () => {
    it('should classify error as NETWORK if message contains network-related keywords', () => {
      const keywords = ['network', 'fetch', 'connection', 'offline', 'enetunreach'];
      keywords.forEach(keyword => {
        const error = new Error(`A ${keyword} error occurred`);
        expect(classifyError(error)).toEqual({
          type: ErrorTypes.NETWORK,
          severity: ErrorSeverity.HIGH,
          retryable: true,
        });
      });
    });

    it('should classify error as NETWORK if navigator.onLine is false', () => {
      vi.stubGlobal('navigator', { onLine: false });
      const error = new Error('Some error');
      expect(classifyError(error)).toEqual({
        type: ErrorTypes.NETWORK,
        severity: ErrorSeverity.HIGH,
        retryable: true,
      });
    });
  });

  describe('Timeout Errors', () => {
    it('should classify error as TIMEOUT if message contains timeout keywords', () => {
      const keywords = ['timeout', 'timed out'];
      keywords.forEach(keyword => {
        const error = new Error(`Request ${keyword}`);
        expect(classifyError(error)).toEqual({
          type: ErrorTypes.TIMEOUT,
          severity: ErrorSeverity.MEDIUM,
          retryable: true,
        });
      });
    });
  });

  describe('Auth Errors', () => {
    it('should classify error as AUTH for 401 or 403 status', () => {
      [401, 403].forEach(status => {
        const error = { status };
        expect(classifyError(error)).toEqual({
          type: ErrorTypes.AUTH,
          severity: ErrorSeverity.CRITICAL,
          retryable: false,
        });
      });
    });

    it('should classify error as AUTH if message contains auth keywords', () => {
      ['unauthorized', 'forbidden'].forEach(keyword => {
        const error = new Error(`User is ${keyword}`);
        expect(classifyError(error)).toEqual({
          type: ErrorTypes.AUTH,
          severity: ErrorSeverity.CRITICAL,
          retryable: false,
        });
      });
    });
  });

  describe('Validation Errors', () => {
    it('should classify error as VALIDATION for 400 or 422 status', () => {
      [400, 422].forEach(status => {
        const error = { status };
        expect(classifyError(error)).toEqual({
          type: ErrorTypes.VALIDATION,
          severity: ErrorSeverity.MEDIUM,
          retryable: false,
        });
      });
    });

    it('should classify error as VALIDATION if message contains validation keywords', () => {
      ['validation', 'invalid'].forEach(keyword => {
        const error = new Error(`Input ${keyword}`);
        expect(classifyError(error)).toEqual({
          type: ErrorTypes.VALIDATION,
          severity: ErrorSeverity.MEDIUM,
          retryable: false,
        });
      });
    });
  });

  describe('Server Errors', () => {
    it('should classify error as SERVER for status >= 500', () => {
      [500, 503, 504].forEach(status => {
        const error = { status };
        expect(classifyError(error)).toEqual({
          type: ErrorTypes.SERVER,
          severity: ErrorSeverity.HIGH,
          retryable: true,
        });
      });
    });

    it('should classify error as SERVER if message contains "server error"', () => {
      const error = new Error('Internal server error occurred');
      expect(classifyError(error)).toEqual({
        type: ErrorTypes.SERVER,
        severity: ErrorSeverity.HIGH,
        retryable: true,
      });
    });
  });

  it('should classify unknown errors as UNKNOWN with MEDIUM severity', () => {
    const error = new Error('Something weird happened');
    expect(classifyError(error)).toEqual({
      type: ErrorTypes.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      retryable: true,
    });
  });
});
