// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import * as matchers from '@testing-library/jest-dom/matchers';
import Landing from './Landing';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

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
vi.mock('@/components/landing/ProductShowcase', () => ({ default: () => <div data-testid="product-showcase">Product Showcase</div> }));
// Updated mocks to match current Landing.jsx
vi.mock('@/components/landing/HowItWorksSection', () => ({ default: () => <div data-testid="how-it-works-section">How It Works Section</div> }));
vi.mock('@/components/landing/AccuracySection', () => ({ default: () => <div data-testid="accuracy-section">Accuracy Section</div> }));
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
    expect(screen.getByTestId('product-showcase')).toBeInTheDocument();
    expect(screen.getByTestId('how-it-works-section')).toBeInTheDocument();
    expect(screen.getByTestId('accuracy-section')).toBeInTheDocument();
    expect(screen.getByTestId('security-section')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
});
