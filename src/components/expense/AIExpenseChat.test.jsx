import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AIExpenseChat from './AIExpenseChat';
import { vi } from 'vitest';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }) => <div className={className} {...props}>{children}</div>
  },
  AnimatePresence: ({ children }) => <>{children}</>
}));

// Mock react-markdown
vi.mock('react-markdown', () => {
  return {
    default: ({ children }) => <div data-testid="markdown">{children}</div>
  };
});

// Mock base44 client
const mockSubscribe = vi.fn(() => () => {});
const mockCreateConversation = vi.fn().mockResolvedValue({ id: '123', messages: [] });
const mockAddMessage = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

vi.mock('@/api/base44Client', () => ({
  base44: {
    agents: {
      createConversation: (...args) => mockCreateConversation(...args),
      subscribeToConversation: (...args) => mockSubscribe(...args),
      addMessage: (...args) => mockAddMessage(...args)
    }
  }
}));

// Mock ScrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('AIExpenseChat', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders chat interface with accessible elements', () => {
    render(<AIExpenseChat {...defaultProps} />);

    // Check for accessible names
    expect(screen.getByRole('textbox', { name: /message to ai advisor/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();

    // Check for log role on message container
    const logContainer = screen.getByRole('log');
    expect(logContainer).toBeInTheDocument();
    expect(logContainer).toHaveAttribute('aria-live', 'polite');
  });

  it('updates send button label when sending', async () => {
    render(<AIExpenseChat {...defaultProps} />);

    // Wait for conversation to initialize
    await waitFor(() => expect(mockCreateConversation).toHaveBeenCalled());

    const input = screen.getByRole('textbox', { name: /message to ai advisor/i });
    const button = screen.getByRole('button', { name: /send message/i });

    fireEvent.change(input, { target: { value: 'Hello AI' } });
    fireEvent.click(button);

    // Should show loading label
    await waitFor(() => {
        expect(screen.getByRole('button', { name: /sending message/i })).toBeInTheDocument();
    });
  });
});
