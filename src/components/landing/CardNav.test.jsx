// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import CardNav from './CardNav';

// Mock GSAP
vi.mock('gsap', () => ({
  default: {
    set: vi.fn(),
    timeline: vi.fn(() => ({
      to: vi.fn(),
      play: vi.fn(),
      reverse: vi.fn(),
      kill: vi.fn(),
      eventCallback: vi.fn(),
    })),
  },
  gsap: {
    set: vi.fn(),
    timeline: vi.fn(() => ({
      to: vi.fn(),
      play: vi.fn(),
      reverse: vi.fn(),
      kill: vi.fn(),
      eventCallback: vi.fn(),
    })),
  }
}));

test('renders CardNav with items', () => {
  const items = [
    {
      label: "Platform",
      bgColor: "#18181b",
      textColor: "#fff",
      links: [
        { label: "Product", href: "#product", ariaLabel: "Product Features" }
      ]
    }
  ];

  render(<CardNav items={items} logo="Zerithum" />);

  expect(screen.getByText('Get Started')).toBeTruthy();
  expect(screen.getByText('Platform')).toBeTruthy();
  expect(screen.getByText('Product')).toBeTruthy();
});
