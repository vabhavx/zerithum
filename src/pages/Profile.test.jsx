import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Profile from './Profile';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';

// Mock base44 client
vi.mock('@/api/base44Client', () => ({
  base44: {
    auth: {
      me: vi.fn(),
      updateMe: vi.fn(),
    },
    entities: {
      ConnectedPlatform: {
        list: vi.fn(),
        delete: vi.fn(),
      },
    },
  },
}));

// Mock framer-motion to avoid animation issues
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

// Polyfill ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Polyfill getBoundingClientRect
Element.prototype.getBoundingClientRect = vi.fn(() => ({
  width: 120,
  height: 120,
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  x: 0,
  y: 0,
}));

// Polyfill Pointer Capture
Element.prototype.setPointerCapture = vi.fn();
Element.prototype.releasePointerCapture = vi.fn();
Element.prototype.hasPointerCapture = vi.fn();

// Polyfill window.confirm
window.confirm = vi.fn(() => true);

// Polyfill URL.createObjectURL
global.URL.createObjectURL = vi.fn();
global.URL.revokeObjectURL = vi.fn();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('Profile Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <Profile />
      </QueryClientProvider>
    );
  };

  it('renders user profile information', async () => {
    const { base44 } = await import('@/api/base44Client');
    base44.auth.me.mockResolvedValue({
      full_name: 'Test User',
      email: 'test@example.com',
      role: 'creator',
      created_date: '2023-01-01',
    });
    base44.entities.ConnectedPlatform.list.mockResolvedValue([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('switches tabs correctly', async () => {
    const { base44 } = await import('@/api/base44Client');
    base44.auth.me.mockResolvedValue({ full_name: 'Test User' });
    base44.entities.ConnectedPlatform.list.mockResolvedValue([]);

    renderComponent();

    await waitFor(() => expect(screen.getByText('General')).toBeInTheDocument());

    const preferencesTab = screen.getByRole('tab', { name: /preferences/i });
    fireEvent.mouseDown(preferencesTab);
    fireEvent.click(preferencesTab);

    await waitFor(() => {
      expect(screen.getByText('Regional Settings')).toBeInTheDocument();
      expect(screen.getByText('Currency Display')).toBeInTheDocument();
    });
  });

  it('updates preferences in localStorage', async () => {
    const { base44 } = await import('@/api/base44Client');
    base44.auth.me.mockResolvedValue({ full_name: 'Test User' });
    base44.entities.ConnectedPlatform.list.mockResolvedValue([]);

    renderComponent();

    // Click Preferences tab
    const preferencesTab = screen.getByRole('tab', { name: /preferences/i });
    fireEvent.mouseDown(preferencesTab);
    fireEvent.click(preferencesTab);

    await waitFor(() => expect(screen.getByText('Regional Settings')).toBeInTheDocument());

    // Find the density toggle (Compact/Comfortable)
    const compactButton = screen.getByRole('button', { name: /compact/i });
    fireEvent.click(compactButton);

    // Check localStorage
    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('user_preferences'));
      expect(stored.density).toBe('compact');
    });
  });
});
