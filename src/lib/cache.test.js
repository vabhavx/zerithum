// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { backgroundSync } from './cache';

describe('backgroundSync', () => {
  beforeEach(() => {
    // Mock localStorage
    const localStorageMock = (() => {
      let store = {};
      return {
        getItem: vi.fn(key => store[key] || null),
        setItem: vi.fn((key, value) => {
          store[key] = value.toString();
        }),
        clear: vi.fn(() => {
          store = {};
        })
      };
    })();
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });

    // Clear previous items
    window.localStorage.clear();

    // Mock navigator.serviceWorker.ready
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        ready: Promise.resolve({
          sync: {
            register: vi.fn()
          }
        })
      },
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('queueAction should use a secure UUID for action ids', async () => {
    const action = { type: 'TEST_ACTION', payload: 'test' };

    // We expect crypto.randomUUID() to be used if available
    // JSDOM has basic crypto.getRandomValues support but randomUUID might not be available out-of-the-box in all Node versions testing JSDOM.
    // However, our code has fallbacks, so let's just assert that an id exists, is a string, and looks reasonable.
    // Better yet, let's mock crypto.randomUUID to ensure it uses it when available.

    let originalCrypto = window.crypto;
    let uuidCalled = false;

    Object.defineProperty(window, 'crypto', {
      value: {
        randomUUID: vi.fn(() => {
          uuidCalled = true;
          return '123e4567-e89b-12d3-a456-426614174000';
        })
      },
      configurable: true
    });

    await backgroundSync.queueAction(action);

    const queued = JSON.parse(window.localStorage.setItem.mock.calls[0][1]);
    expect(queued).toHaveLength(1);

    const queuedAction = queued[0];
    expect(queuedAction.type).toBe('TEST_ACTION');
    expect(queuedAction.payload).toBe('test');
    expect(queuedAction.timestamp).toBeDefined();
    expect(queuedAction.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(uuidCalled).toBe(true);

    // Restore crypto
    Object.defineProperty(window, 'crypto', {
      value: originalCrypto,
      configurable: true
    });
  });

  it('queueAction should fallback if crypto is not available', async () => {
    const action = { type: 'TEST_ACTION_2', payload: 'test2' };

    let originalCrypto = window.crypto;
    Object.defineProperty(window, 'crypto', {
      value: undefined,
      configurable: true
    });

    await backgroundSync.queueAction(action);

    const queued = JSON.parse(window.localStorage.setItem.mock.calls[0][1]);
    expect(queued).toHaveLength(1);

    const queuedAction = queued[0];
    expect(queuedAction.type).toBe('TEST_ACTION_2');
    expect(queuedAction.payload).toBe('test2');
    expect(queuedAction.id).toBeDefined();
    expect(typeof queuedAction.id).toBe('string');
    // It should have length > 0
    expect(queuedAction.id.length).toBeGreaterThan(5);

    // Restore crypto
    Object.defineProperty(window, 'crypto', {
      value: originalCrypto,
      configurable: true
    });
  });
});
