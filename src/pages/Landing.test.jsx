// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import * as matchers from '@testing-library/jest-dom/matchers';
import Landing from './Landing';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Mock the components to avoid JSDOM issues with animations
vi.mock('@/components/landing/HeroSection', () => ({ default: () => <div data-testid="hero-section">Hero Section</div> }));
vi.mock('@/components/landing/ProblemSection', () => ({ default: () => <div data-testid="problem-section">Problem Section</div> }));
vi.mock('@/components/landing/ProductShowcase', () => ({ default: () => <div data-testid="product-showcase">Product Showcase</div> }));
vi.mock('@/components/landing/HowItWorksSection', () => ({ default: () => <div data-testid="how-it-works-section">How It Works Section</div> }));
vi.mock('@/components/landing/ReconciliationFlow', () => ({ default: () => <div data-testid="reconciliation-flow">Reconciliation Flow</div> }));
vi.mock('@/components/landing/TaxWorkflowSection', () => ({ default: () => <div data-testid="tax-workflow">Tax Workflow</div> }));
vi.mock('@/components/landing/SecuritySection', () => ({ default: () => <div data-testid="security-section">Security Section</div> }));
vi.mock('@/components/landing/FAQSection', () => ({ default: () => <div data-testid="faq-section">FAQ Section</div> }));
vi.mock('@/components/landing/CTASection', () => ({ default: () => <div data-testid="cta-section">CTA Section</div> }));
vi.mock('@/components/landing/Footer', () => ({ default: () => <div data-testid="footer">Footer</div> }));

describe('Landing Page', () => {
  it('renders all sections', () => {
    render(
      <BrowserRouter>
        <Landing />
      </BrowserRouter>
    );

    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    expect(screen.getByTestId('problem-section')).toBeInTheDocument();
    expect(screen.getByTestId('product-showcase')).toBeInTheDocument();
    expect(screen.getByTestId('reconciliation-flow')).toBeInTheDocument();
    expect(screen.getByTestId('how-it-works-section')).toBeInTheDocument();
    expect(screen.getByTestId('tax-workflow')).toBeInTheDocument();
    expect(screen.getByTestId('security-section')).toBeInTheDocument();
    expect(screen.getByTestId('faq-section')).toBeInTheDocument();
    expect(screen.getByTestId('cta-section')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
});
