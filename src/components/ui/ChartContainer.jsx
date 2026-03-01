import { ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

export function ChartContainer({ children, className, height = 300 }) {
  return (
    <div className={cn("relative w-full overflow-hidden rounded-lg border border-gray-200 bg-white p-4", className)}>
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
