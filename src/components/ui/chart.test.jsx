// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import * as matchers from '@testing-library/jest-dom/matchers'
import { ChartContainer, ChartStyle } from "./chart"

expect.extend(matchers)

// Mock recharts ResponsiveContainer to just render children
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  Tooltip: () => <div>Tooltip</div>,
  Legend: () => <div>Legend</div>,
}))

describe("ChartContainer", () => {
  const config = {
    test: {
      color: "#ff0000",
      label: "Test Label",
    },
  }

  it("renders without crashing", () => {
    render(
      <ChartContainer config={config} id="test-chart">
        <div>Chart Content</div>
      </ChartContainer>
    )
    expect(screen.getByText("Chart Content")).toBeInTheDocument()
  })

  it("renders style tag with CSS variables", () => {
    const { container } = render(
      <ChartContainer config={config} id="test-chart">
        <div>Chart Content</div>
      </ChartContainer>
    )

    // Check if style tag exists
    const styleTag = container.querySelector("style")
    expect(styleTag).toBeInTheDocument()

    // Check content
    expect(styleTag.textContent).toContain("--color-test: #ff0000;")
    expect(styleTag.textContent).toContain("[data-chart=chart-test-chart]")
  })
})

describe("ChartStyle", () => {
    it("renders CSS variables correctly", () => {
        const config = {
            desktop: { color: "#123456" },
            mobile: { theme: { light: "#abcdef", dark: "#654321" } }
        }
        const { container } = render(<ChartStyle id="style-test" config={config} />)
        const styleContent = container.querySelector("style").textContent

        expect(styleContent).toContain("--color-desktop: #123456;")
        expect(styleContent).toContain("--color-mobile: #abcdef;") // light theme

        // Check for dark theme block
        // The implementation iterates THEMES. light="" prefix, dark=".dark" prefix
        // So we expect:
        // .dark [data-chart=style-test] {
        //   --color-mobile: #654321;
        // }
        expect(styleContent).toContain(".dark [data-chart=style-test]")
        expect(styleContent).toContain("--color-mobile: #654321;")
    })
})
