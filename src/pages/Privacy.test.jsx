// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { BrowserRouter } from 'react-router-dom';
import Privacy from './Privacy';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

describe('Privacy Page', () => {
  it('renders privacy policy heading', () => {
    render(
      <BrowserRouter>
        <Privacy />
      </BrowserRouter>
    );
    // Specify level 1 to ensure we get the main title
    expect(screen.getByRole('heading', { name: /privacy policy/i, level: 1 })).toBeInTheDocument();
  });

  it('renders quick summary section', () => {
    render(
      <BrowserRouter>
        <Privacy />
      </BrowserRouter>
    );
    // Check for the heading specifically
    expect(screen.getByRole('heading', { name: /2. Quick summary for creators/i })).toBeInTheDocument();

    // Use getAllByText because the phrase about selling data appears in summary and later in detail.
    // We just want to ensure at least one instance exists, or specifically the summary one.
    // The summary one is "Zerithum does not sell your personal data to third party advertisers"
    // The later one is "...to third party data brokers or advertisers."

    // Let's check for a unique item in the summary:
    expect(screen.getByText('Zerithum is accounting and revenue analytics software for creators')).toBeInTheDocument();
  });

  it('renders table of contents', () => {
    render(
      <BrowserRouter>
        <Privacy />
      </BrowserRouter>
    );

    // Check for "Table of Contents" heading
    const tocHeadings = screen.getAllByRole('heading', { name: /table of contents/i });
    expect(tocHeadings.length).toBeGreaterThan(0);
    expect(tocHeadings[0]).toBeInTheDocument();

    // Check for a specific TOC item. Since "1. Scope" matches both button and H2, we look for all.
    const scopeElements = screen.getAllByText(/1. Scope/i);
    expect(scopeElements.length).toBeGreaterThan(1); // Should have button and H2
  });

  it('renders back to home link', () => {
    render(
      <BrowserRouter>
        <Privacy />
      </BrowserRouter>
    );
    const links = screen.getAllByText(/back to home/i);
    expect(links.length).toBeGreaterThan(0);
  });

  it('does not contain delete account button', () => {
    render(
      <BrowserRouter>
        <Privacy />
      </BrowserRouter>
    );
    expect(screen.queryByText('Delete Account')).not.toBeInTheDocument();
  });
});
