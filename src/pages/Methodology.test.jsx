import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom'; // Import matchers
import Methodology from './Methodology';

// Mock components if necessary
vi.mock('@/components/ui/button', () => ({ Button: ({ children }) => <button>{children}</button> }));
// Mock Lucide icons
vi.mock('lucide-react', () => ({
  ArrowLeft: () => <span>ArrowLeft</span>,
  CheckCircle2: () => <span>CheckCircle2</span>,
  AlertTriangle: () => <span>AlertTriangle</span>,
  FileText: () => <span>FileText</span>,
  Lock: () => <span>Lock</span>
}));

describe('Methodology Page', () => {
  it('renders key sections', () => {
    render(
      <BrowserRouter>
        <Methodology />
      </BrowserRouter>
    );

    expect(screen.getByText(/Technical Paper/i)).toBeInTheDocument();

    // Use headings to be more specific and avoid "multiple elements found" error
    expect(screen.getByRole('heading', { name: /Reconciliation Methodology/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Data Inputs/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Matching Logic/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Reason Codes/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Review Workflow/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Known Limitations/i })).toBeInTheDocument();
  });
});
