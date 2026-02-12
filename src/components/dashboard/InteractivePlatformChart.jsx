import React from "react";
import { 
  Area,
  AreaChart,
  CartesianGrid, 
  ResponsiveContainer,
  Tooltip, 
  XAxis,
  YAxis,
  Line
} from "recharts";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function InteractivePlatformChart({ data, isLoading }) {
  if (isLoading) {
    return (
      <Card className="col-span-1 lg:col-span-2 h-[400px]">
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="col-span-1 lg:col-span-2 h-[400px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground font-medium">No revenue data available</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Connect platforms to see trends</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Revenue Trend</CardTitle>
        <CardDescription>
          Daily revenue vs 7-day moving average (Last 90 Days)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tickFormatter={(str) => format(new Date(str), "MMM d")}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                minTickGap={30}
              />
              <YAxis
                tickFormatter={(value) => `$${value}`}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
                labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: "0.5rem" }}
                formatter={(value, name) => [
                  `$${Number(value).toFixed(2)}`,
                  name === "revenue" ? "Daily Revenue" : "7-Day Avg"
                ]}
                labelFormatter={(label) => format(new Date(label), "MMM d, yyyy")}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#colorRevenue)"
                strokeWidth={2}
                name="Revenue"
              />
              <Line
                type="monotone"
                dataKey="ma7"
                stroke="hsl(var(--warning))"
                strokeWidth={2}
                dot={false}
                name="7-Day Avg"
                strokeDasharray="5 5"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
