// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { BrowserRouter } from 'react-router-dom';
import TermsOfService from './TermsOfService';

expect.extend(matchers);

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.IntersectionObserver = MockIntersectionObserver;

// Mock window.scrollTo
window.scrollTo = vi.fn();

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('TermsOfService Page', () => {
  it('renders Terms of Service heading', () => {
    render(
      <BrowserRouter>
        <TermsOfService />
      </BrowserRouter>
    );
    expect(screen.getByRole('heading', { name: /terms of service/i, level: 1 })).toBeInTheDocument();
  });

  it('renders definitions section', () => {
    render(
      <BrowserRouter>
        <TermsOfService />
      </BrowserRouter>
    );
    expect(screen.getByRole('heading', { name: /1. Definitions/i })).toBeInTheDocument();
  });

  it('renders table of contents', () => {
    render(
      <BrowserRouter>
        <TermsOfService />
      </BrowserRouter>
    );
    const tocHeadings = screen.getAllByRole('heading', { name: /contents/i, level: 4 });
    expect(tocHeadings.length).toBeGreaterThan(0);

    // Check for a specific TOC item
    const definitionsButton = screen.getAllByText(/1. Definitions/i);
    expect(definitionsButton.length).toBeGreaterThan(1); // One in TOC, one in main content
  });

  it('renders legal warning', () => {
    render(
      <BrowserRouter>
        <TermsOfService />
      </BrowserRouter>
    );
    const warningText = screen.getByText(/THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS/i);
    expect(warningText).toBeInTheDocument();
  });

  it('renders contact section', () => {
    render(
      <BrowserRouter>
        <TermsOfService />
      </BrowserRouter>
    );
    expect(screen.getByRole('heading', { name: /18. Contact Information/i })).toBeInTheDocument();
    const emails = screen.getAllByText('support@zerithum.com');
    expect(emails.length).toBeGreaterThan(0);
  });

  it('renders back to home link', () => {
    render(
      <BrowserRouter>
        <TermsOfService />
      </BrowserRouter>
    );
    const links = screen.getAllByText(/back to home/i);
    expect(links.length).toBeGreaterThan(0);
  });
});
