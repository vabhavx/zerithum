import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Privacy from './Privacy';

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
    expect(screen.getByText(/back to home/i)).toBeInTheDocument();
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
