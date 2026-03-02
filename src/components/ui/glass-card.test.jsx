// @vitest-environment jsdom
import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { GlassCard, InteractiveMetricCard } from "./glass-card"
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)

// Mock lucide-react
vi.mock("lucide-react", () => ({
  TrendingUp: (props) => <div data-testid="icon-trending-up" {...props} />,
  TrendingDown: (props) => <div data-testid="icon-trending-down" {...props} />,
  Minus: (props) => <div data-testid="icon-minus" {...props} />,
  X: (props) => <div data-testid="icon-x" {...props} />
}))

// Mock framer-motion using a Proxy to handle motion.div etc.
vi.mock("framer-motion", () => {
  const React = require("react")
  const motionMock = new Proxy({}, {
    get: (_, prop) => {
      // Return a basic element with forwardRef
      return React.forwardRef(({ children, whileHover, whileTap, layout, layoutId, initial, animate, exit, variants, transition, ...props }, ref) => {
        const Component = prop;
        return <Component ref={ref} {...props}>{children}</Component>;
      })
    }
  })
  return {
    motion: motionMock,
    AnimatePresence: ({ children }) => <>{children}</>
  }
})

describe("GlassCard", () => {
  it("renders children correctly", () => {
    render(
      <GlassCard>
        <div data-testid="test-child">Child content</div>
      </GlassCard>
    )
    expect(screen.getByTestId("test-child")).toBeInTheDocument()
    expect(screen.getByText("Child content")).toBeInTheDocument()
  })

  it("applies default classes and custom className", () => {
    const { container } = render(
      <GlassCard className="custom-test-class">
        Content
      </GlassCard>
    )

    const card = container.firstChild
    expect(card).toHaveClass("bg-white")
    expect(card).toHaveClass("border-gray-100")
    expect(card).toHaveClass("rounded-xl")
    expect(card).toHaveClass("shadow-sm")
    expect(card).toHaveClass("custom-test-class")
  })
})

describe("InteractiveMetricCard", () => {
  const defaultProps = {
    title: "Total Revenue",
    value: "$10,000",
  }

  it("renders basic properties correctly", () => {
    render(<InteractiveMetricCard {...defaultProps} subtitle="Last 30 days" />)

    expect(screen.getByText("Total Revenue")).toBeInTheDocument()
    expect(screen.getByText("$10,000")).toBeInTheDocument()
    expect(screen.getByText("Last 30 days")).toBeInTheDocument()
  })

  it("renders positive trend correctly", () => {
    render(<InteractiveMetricCard {...defaultProps} trend={5.5} />)

    expect(screen.getByText("5.5%")).toBeInTheDocument()
    expect(screen.getByTestId("icon-trending-up")).toBeInTheDocument()

    const badge = screen.getByText("5.5%").closest("span")
    expect(badge).toHaveClass("bg-emerald-100")
    expect(badge).toHaveClass("text-emerald-700")
  })

  it("renders negative trend correctly", () => {
    render(<InteractiveMetricCard {...defaultProps} trend={-2.3} />)

    expect(screen.getByText("2.3%")).toBeInTheDocument() // uses Math.abs
    expect(screen.getByTestId("icon-trending-down")).toBeInTheDocument()

    const badge = screen.getByText("2.3%").closest("span")
    expect(badge).toHaveClass("bg-red-100")
    expect(badge).toHaveClass("text-red-700")
  })

  it("renders neutral trend correctly", () => {
    render(<InteractiveMetricCard {...defaultProps} trend={0} />)

    expect(screen.getByText("0%")).toBeInTheDocument()
    expect(screen.getByTestId("icon-minus")).toBeInTheDocument()

    const badge = screen.getByText("0%").closest("span")
    expect(badge).toHaveClass("bg-gray-100")
  })

  it("handles custom icon rendering", () => {
    const TestIcon = (props) => <div data-testid="custom-icon" {...props} />
    render(<InteractiveMetricCard {...defaultProps} icon={TestIcon} />)

    expect(screen.getByTestId("custom-icon")).toBeInTheDocument()

    // Check default tone (neutral) background for icon wrapper
    const iconWrapper = screen.getByTestId("custom-icon").parentElement
    expect(iconWrapper).toHaveClass("bg-gray-50")
  })

  it("applies tone configurations correctly", () => {
    const TestIcon = (props) => <div data-testid="custom-icon-blue" {...props} />
    render(<InteractiveMetricCard {...defaultProps} icon={TestIcon} tone="blue" />)

    const iconWrapper = screen.getByTestId("custom-icon-blue").parentElement
    expect(iconWrapper).toHaveClass("bg-blue-50")
    expect(screen.getByTestId("custom-icon-blue")).toHaveClass("text-blue-500")
  })

  it("handles onClick prop and applies cursor-pointer", () => {
    const handleClick = vi.fn()
    const { container } = render(
      <InteractiveMetricCard {...defaultProps} onClick={handleClick} />
    )

    const card = container.firstChild
    expect(card).toHaveClass("cursor-pointer")

    fireEvent.click(card)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it("does not have cursor-pointer when onClick is undefined", () => {
    const { container } = render(<InteractiveMetricCard {...defaultProps} />)

    const card = container.firstChild
    expect(card).not.toHaveClass("cursor-pointer")
  })
})
