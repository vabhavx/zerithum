import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom'; // Import matchers
import Landing from './Landing';

// Mock Three.js components to avoid JSDOM issues
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }) => <div data-testid="mock-canvas">{children}</div>,
}));

vi.mock('@/components/ui/background-paper-shaders', () => ({
  ShaderPlane: () => <div data-testid="mock-shader-plane" />,
}));

vi.mock('@paper-design/shaders-react', () => ({
  MeshGradient: () => <div data-testid="mock-mesh-gradient" />,
  DotOrbit: () => <div data-testid="mock-dot-orbit" />,
}));

// Mock the components that use canvas or complex animations to avoid JSDOM issues
vi.mock('@/components/landing/HeroSection', () => ({ default: () => <div data-testid="hero-section">Hero Section</div> }));
vi.mock('@/components/landing/ProductIngestion', () => ({ default: () => <div data-testid="product-ingestion">Product Ingestion</div> }));
vi.mock('@/components/landing/ProductAutopsy', () => ({ default: () => <div data-testid="product-autopsy">Product Autopsy</div> }));
vi.mock('@/components/landing/ProductExport', () => ({ default: () => <div data-testid="product-export">Product Export</div> }));
vi.mock('@/components/landing/HowItWorks', () => ({ default: () => <div data-testid="how-it-works">How It Works</div> }));
vi.mock('@/components/landing/AccuracySpecs', () => ({ default: () => <div data-testid="accuracy-specs">Accuracy Specs</div> }));
vi.mock('@/components/landing/SecuritySection', () => ({ default: () => <div data-testid="security-section">Security Section</div> }));
vi.mock('@/components/landing/Footer', () => ({ default: () => <div data-testid="footer">Footer</div> }));

describe('Landing Page', () => {
  it('renders all sections', () => {
    render(
      <BrowserRouter>
        <Landing />
      </BrowserRouter>
    );

    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    expect(screen.getByTestId('product-ingestion')).toBeInTheDocument();
    expect(screen.getByTestId('product-autopsy')).toBeInTheDocument();
    expect(screen.getByTestId('product-export')).toBeInTheDocument();
    expect(screen.getByTestId('how-it-works')).toBeInTheDocument();
    expect(screen.getByTestId('accuracy-specs')).toBeInTheDocument();
    expect(screen.getByTestId('security-section')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
});
