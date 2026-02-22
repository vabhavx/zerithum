import React from "react";
import { GlassCard } from "@/components/ui/glass-card";

export default function MetricCard({ label, value, helper, tone = "neutral", icon: Icon }) {
  const toneClass =
    tone === "teal"
      ? "text-[#56C5D0]"
      : tone === "orange"
        ? "text-[#F0A562]"
        : tone === "red"
          ? "text-[#F06C6C]"
          : "text-[#F5F5F5]";

  return (
    <GlassCard hoverEffect glowEffect={tone === 'teal'} className="group p-5">
      <div className="flex items-start justify-between">
        <div>
           <p className="text-xs uppercase tracking-wide text-white/50 group-hover:text-white/70 transition-colors">{label}</p>
           <p className={`mt-2 font-mono-financial text-3xl font-bold tracking-tight ${toneClass}`}>{value}</p>
        </div>
        {Icon && (
          <div className={`rounded-lg p-2 transition-colors ${tone === 'teal' ? 'bg-[#56C5D0]/10 text-[#56C5D0]' : 'bg-white/5 text-white/40 group-hover:bg-white/10'}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      <p className="mt-2 text-xs text-white/50">{helper}</p>
    </GlassCard>
  );
}
