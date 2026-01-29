import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AIExpenseChat from './AIExpenseChat';
import { base44 } from '@/api/base44Client';
import { vi } from 'vitest';

// Mock dependencies
vi.mock('@/api/base44Client', () => ({
  base44: {
    agents: {
      createConversation: vi.fn(),
      subscribeToConversation: vi.fn(() => () => {}),
      addMessage: vi.fn(),
    }
  }
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }) => <div className={className} {...props}>{children}</div>
  },
  AnimatePresence: ({ children }) => <>{children}</>
}));

vi.mock('react-markdown', () => ({
  default: ({ children }) => <div>{children}</div>
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }) => open ? <div>{children}</div> : null,
  DialogContent: ({ children }) => <div>{children}</div>,
  DialogHeader: ({ children }) => <div>{children}</div>,
  DialogTitle: ({ children }) => <h2>{children}</h2>,
}));

// Basic ScrollIntoView mock
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('AIExpenseChat', () => {
  const mockConversation = {
    id: '123',
    messages: [
      { role: 'assistant', content: 'Hello, how can I help?' },
      { role: 'user', content: 'Show me my expenses' }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    base44.agents.createConversation.mockResolvedValue(mockConversation);
  });

  it('renders correctly when open', async () => {
    render(<AIExpenseChat open={true} onOpenChange={() => {}} />);

    expect(screen.getByText('AI Expense Advisor')).toBeInTheDocument();

    await waitFor(() => {
      expect(base44.agents.createConversation).toHaveBeenCalled();
    });

    expect(screen.getByText('Hello, how can I help?')).toBeInTheDocument();
    expect(screen.getByText('Show me my expenses')).toBeInTheDocument();
  });

  it('has accessible chat log container', async () => {
    render(<AIExpenseChat open={true} onOpenChange={() => {}} />);

    // Waiting for conversation to load
    await waitFor(() => {
      expect(base44.agents.createConversation).toHaveBeenCalled();
    });

    // Find the container. Since we haven't added the roles yet, this might be tricky to find semantically.
    // We'll target it by structure or text presence for now, but the goal is to assert roles eventually.
    // For now, let's just check if we can find the messages.
    const assistantMessage = screen.getByText('Hello, how can I help?');
    expect(assistantMessage).toBeInTheDocument();
  });

  it('has accessible input and send button', async () => {
    render(<AIExpenseChat open={true} onOpenChange={() => {}} />);

    // Input
    const input = screen.getByPlaceholderText(/Ask about expenses/i);
    expect(input).toBeInTheDocument();
    // Verify it doesn't have label yet (this test documents current state or future state?)
    // I'll write the test for the FUTURE state, so it fails now.

    // Expectation: Input has accessible label
    expect(input).toHaveAttribute('aria-label', 'Message to AI Advisor');

    // Expectation: Send button has accessible label
    // The button has an SVG inside, so getByRole('button') is best.
    // We expect to find it by its accessible name "Send message"
    const sendBtn = screen.getByRole('button', { name: /Send message/i });
    expect(sendBtn).toBeInTheDocument();
  });

  it('chat log has correct accessibility roles', async () => {
    render(<AIExpenseChat open={true} onOpenChange={() => {}} />);

    await waitFor(() => {
        expect(base44.agents.createConversation).toHaveBeenCalled();
    });

    // We expect the log to be identifiable by role
    const chatLog = screen.getByRole('log');
    expect(chatLog).toHaveAttribute('aria-label', 'Chat history');
    expect(chatLog).toHaveAttribute('aria-live', 'polite');
  });
});
