"use client"

import * as React from "react"
import { ResponsiveContainer, Tooltip as RechartsTooltip, Legend as RechartsLegend } from "recharts"

import { cn } from "@/lib/utils"

// Format: { ThemeName: CSSSelector }
const THEMES = { light: "", dark: ".dark" }

const ChartContext = React.createContext(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

const ChartContainer = React.forwardRef(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "ChartContainer"

const ChartStyle = ({ id, config }) => {
  const colorConfig = Object.entries(config).filter(
    ([_, config]) => config.theme || config.color
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style>
      {Object.entries(THEMES)
        .map(([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color = itemConfig.theme?.[theme] || itemConfig.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .join("\n")}
}
`)
        .join("\n")}
    </style>
  )
}

const ChartTooltip = RechartsTooltip
const ChartTooltipContent = React.forwardRef(({ active, payload, className, indicator = "dot", hideLabel = false, hideIndicator = false, label, labelFormatter, labelClassName, formatter, color, nameKey, labelKey }, ref) => {
    if (!active || !payload?.length) {
        return null
    }
    return (
        <div ref={ref} className={cn("rounded-lg border bg-background p-2 shadow-sm", className)}>
             <div className="grid grid-cols-2 gap-2">
                {payload.map((item, index) => (
                    <div key={index} className="flex items-center gap-1">
                        {!hideIndicator && (
                          <div
                            className={cn("shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]", {
                              "h-2.5 w-2.5": indicator === "dot",
                              "h-1 w-2.5": indicator === "line",
                              "w-0 border-[1.5px] border-dashed bg-transparent": indicator === "dashed",
                              "rounded-full": indicator === "dot"
                            })}
                            style={{
                              backgroundColor: item.color,
                              borderColor: item.color,
                              "--color-bg": item.color,
                              "--color-border": item.color
                            }}
                          />
                        )}
                        <span className="text-muted-foreground">{item.name}: </span>
                        <span className="font-medium">{item.value}</span>
                    </div>
                ))}
             </div>
        </div>
    )
})
ChartTooltipContent.displayName = "ChartTooltipContent"

const ChartLegend = RechartsLegend
const ChartLegendContent = React.forwardRef(({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("flex items-center justify-center gap-4", className)} />
})
ChartLegendContent.displayName = "ChartLegendContent"

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}
