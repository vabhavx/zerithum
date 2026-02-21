import { ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

export function ChartContainer({ children, className, height = 300 }) {
  return (
    <div className={cn("relative w-full overflow-hidden rounded-xl border border-white/10 bg-[#121214]/40 p-4 backdrop-blur-md", className)}>
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
