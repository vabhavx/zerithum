// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import * as matchers from '@testing-library/jest-dom/matchers';
import Methodology from './Methodology';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Mock animations because they use hooks/intervals that might be tricky in JSDOM or just noise
vi.mock('@/components/landing/methodology/MethodologyAnimations', () => ({
  default: ({ type }) => <div data-testid={`animation-${type}`}>Animation: {type}</div>,
}));

vi.mock('@/components/landing/Footer', () => ({ default: () => <div data-testid="footer">Footer</div> }));

describe('Methodology Page', () => {
  it('renders the main headline', () => {
    render(
      <BrowserRouter>
        <Methodology />
      </BrowserRouter>
    );
    expect(screen.getByText('How reconciliation works')).toBeInTheDocument();
  });

  it('renders the toggle buttons', () => {
    render(
      <BrowserRouter>
        <Methodology />
      </BrowserRouter>
    );
    // Use getAllByText because buttons might be rendered multiple times or similar text exists
    expect(screen.getAllByText('Simple explanation')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Full methodology')[0]).toBeInTheDocument();
  });

  it('shows simple view by default', async () => {
    render(
      <BrowserRouter>
        <Methodology />
      </BrowserRouter>
    );
    // Unique text in Simple View
    expect(await screen.findByText('What a mismatch looks like')).toBeInTheDocument();
  });

  it('switches to full view when toggle is clicked', async () => {
    render(
      <BrowserRouter>
        <Methodology />
      </BrowserRouter>
    );

    const { fireEvent } = await import('@testing-library/react');

    const fullToggle = screen.getAllByText('Full methodology')[0];
    fireEvent.click(fullToggle);

    // Wait for state update
    // Check for Full View unique text
    expect(await screen.findByText('Inputs we use')).toBeInTheDocument();

    // Check animations
    expect(screen.getByTestId('animation-matching')).toBeInTheDocument();
    expect(screen.getByTestId('animation-scoring')).toBeInTheDocument();
    expect(screen.getByTestId('animation-audit')).toBeInTheDocument();
  });
});
