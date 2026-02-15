// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { BrowserRouter } from 'react-router-dom';
import Privacy from './Privacy';

expect.extend(matchers);

describe('Privacy Page', () => {
  it('renders privacy policy heading', () => {
    render(
      <BrowserRouter>
        <Privacy />
      </BrowserRouter>
    );
    expect(screen.getByRole('heading', { name: /privacy policy/i })).toBeInTheDocument();
  });

  it('renders back to home link', () => {
    render(
      <BrowserRouter>
        <Privacy />
      </BrowserRouter>
    );
    // Use getAllByText as it might appear multiple times (desktop/mobile)
    const links = screen.getAllByText(/back to home/i);
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toBeInTheDocument();
  });

  it('does not contain delete account button', () => {
    render(
      <BrowserRouter>
        <Privacy />
      </BrowserRouter>
    );
    // The public page should NOT have the danger zone
    expect(screen.queryByText(/delete account/i)).not.toBeInTheDocument();
  });
});
