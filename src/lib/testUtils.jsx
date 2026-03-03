/**
 * Testing Utilities
 * Comprehensive test helpers for components and hooks
 */

import React from 'react';
import { render as rtlRender, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ErrorProvider } from './errorHandling';

// ============================================================================
// Custom Render
// ============================================================================

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: Infinity,
    },
  },
});

export function render(ui, { 
  route = '/',
  queryClient = createTestQueryClient(),
  ...options 
} = {}) {
  const Wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <ErrorProvider>
        <BrowserRouter initialEntries={[route]}>
          {children}
        </BrowserRouter>
      </ErrorProvider>
    </QueryClientProvider>
  );

  return {
    ...rtlRender(ui, { wrapper: Wrapper, ...options }),
    queryClient,
  };
}

// ============================================================================
// Mock Factories
// ============================================================================

export const mockFactories = {
  user: (overrides = {}) => ({
    id: 'user-123',
    email: 'test@example.com',
    full_name: 'Test User',
    avatar_url: null,
    created_at: new Date().toISOString(),
    ...overrides,
  }),

  transaction: (overrides = {}) => ({
    id: `tx-${Math.random().toString(36).substr(2, 9)}`,
    platform_transaction_id: `platform-${Date.now()}`,
    user_id: 'user-123',
    platform: 'stripe',
    amount: 100.00,
    currency: 'USD',
    transaction_date: new Date().toISOString().split('T')[0],
    description: 'Test Transaction',
    category: 'product_sale',
    platform_fee: 2.90,
    synced_at: new Date().toISOString(),
    ...overrides,
  }),

  expense: (overrides = {}) => ({
    id: `exp-${Math.random().toString(36).substr(2, 9)}`,
    user_id: 'user-123',
    amount: 50.00,
    expense_date: new Date().toISOString().split('T')[0],
    merchant: 'Test Merchant',
    category: 'software',
    description: 'Test Expense',
    is_tax_deductible: true,
    deduction_percentage: 100,
    receipt_url: null,
    payment_method: 'credit_card',
    notes: '',
    ...overrides,
  }),

  connectedPlatform: (overrides = {}) => ({
    id: `conn-${Math.random().toString(36).substr(2, 9)}`,
    user_id: 'user-123',
    platform: 'stripe',
    status: 'active',
    last_synced_at: new Date().toISOString(),
    sync_status: 'success',
    error_message: null,
    metadata: {},
    ...overrides,
  }),

  autopsyEvent: (overrides = {}) => ({
    id: `aut-${Math.random().toString(36).substr(2, 9)}`,
    user_id: 'user-123',
    event_type: 'revenue_drop',
    severity: 'high',
    detected_at: new Date().toISOString(),
    impact_percentage: -25.5,
    impact_amount: -500,
    affected_platforms: ['stripe'],
    causal_reconstruction: {
      platform_behaviour: 'Platform fee increased',
      creator_behaviour: 'No significant changes',
      external_timing: 'Market conditions',
      historical_analogues: 'Similar drop 6 months ago',
    },
    exposure_score: {
      recurrence_probability: 0.7,
      expected_damage: 1000,
      time_to_impact: 'within_30_days',
      platforms_at_risk: ['stripe'],
    },
    status: 'pending_review',
    ...overrides,
  }),
};

// ============================================================================
// Async Test Helpers
// ============================================================================

export async function waitForLoadingToFinish() {
  const loadingElements = screen.queryAllByText(/loading|loading\.{3}/i);
  if (loadingElements.length) {
    await waitFor(() => {
      expect(screen.queryAllByText(/loading|loading\.{3}/i)).toHaveLength(0);
    });
  }
}

export async function waitForElementToBeRemoved(element) {
  return waitFor(() => expect(element).not.toBeInTheDocument());
}

// ============================================================================
// User Event Setup
// ============================================================================

export function setupUserEvent() {
  return userEvent.setup({
    delay: null,
    skipHover: true,
  });
}

// ============================================================================
// Mock Services
// ============================================================================

export const mockSupabase = {
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: mockFactories.user() },
      error: null,
    }),
    getSession: jest.fn().mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
      error: null,
    }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
  },
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: null, error: null }),
};

export const mockFetch = (response, ok = true) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(response),
    text: () => Promise.resolve(JSON.stringify(response)),
    status: ok ? 200 : 500,
  });
};

// ============================================================================
// Accessibility Test Helpers
// ============================================================================

export async function testAccessibility(container) {
  // Basic accessibility checks
  const html = container.innerHTML;
  
  // Check for images without alt
  const imagesWithoutAlt = container.querySelectorAll('img:not([alt])');
  if (imagesWithoutAlt.length > 0) {
    console.warn('Images without alt:', imagesWithoutAlt.length);
  }

  // Check for form inputs without labels
  const inputsWithoutLabels = Array.from(container.querySelectorAll('input, select, textarea'))
    .filter(input => !input.id || !container.querySelector(`label[for="${input.id}"]`));
  
  if (inputsWithoutLabels.length > 0) {
    console.warn('Inputs without labels:', inputsWithoutLabels.length);
  }

  // Check for buttons without accessible names
  const buttonsWithoutNames = Array.from(container.querySelectorAll('button'))
    .filter(button => !button.textContent && !button.getAttribute('aria-label'));
  
  if (buttonsWithoutNames.length > 0) {
    console.warn('Buttons without accessible names:', buttonsWithoutNames.length);
  }
}

// ============================================================================
// Performance Test Helpers
// ============================================================================

export function measureRenderTime(Component, props = {}) {
  const start = performance.now();
  render(<Component {...props} />);
  const end = performance.now();
  return end - start;
}

export async function measureAsyncOperation(operation) {
  const start = performance.now();
  await operation();
  const end = performance.now();
  return end - start;
}

// ============================================================================
// Snapshot Helpers
// ============================================================================

export function createSnapshotSerializer() {
  return {
    test: (val) => typeof val === 'string' && val.includes('class='),
    print: (val) => val.replace(/class="[^"]*"/g, 'class="[REDACTED]"'),
  };
}

// ============================================================================
// Custom Matchers
// ============================================================================

export const customMatchers = {
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },

  toHaveBeenCalledWithMatch(received, matcher) {
    const calls = received.mock.calls;
    const pass = calls.some(call => matcher(call[0]));
    
    if (pass) {
      return {
        message: () => `expected function not to be called with matching argument`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected function to be called with matching argument`,
        pass: false,
      };
    }
  },
};

// ============================================================================
// Test Data Generators
// ============================================================================

export function generateTransactions(count, overrides = {}) {
  return Array.from({ length: count }, (_, i) => 
    mockFactories.transaction({
      id: `tx-${i}`,
      amount: Math.random() * 1000,
      transaction_date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
      ...overrides,
    })
  );
}

export function generateExpenses(count, overrides = {}) {
  return Array.from({ length: count }, (_, i) => 
    mockFactories.expense({
      id: `exp-${i}`,
      amount: Math.random() * 500,
      expense_date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
      ...overrides,
    })
  );
}
