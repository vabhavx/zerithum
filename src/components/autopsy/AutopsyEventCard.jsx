import React, { memo } from "react";
import { format } from "date-fns";
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Clock,
  Target,
  CheckCircle2,
  XCircle,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const getEventIcon = (type) => {
  switch (type) {
    case "revenue_drop": return TrendingDown;
    case "revenue_spike": return TrendingUp;
    case "payout_delay": return Clock;
    case "concentration_shift": return Target;
    default: return AlertTriangle;
  }
};

const getSeverityColor = (severity) => {
  switch (severity) {
    case "critical": return "border-red-500/30 bg-red-500/5";
    case "high": return "border-orange-500/30 bg-orange-500/5";
    case "medium": return "border-amber-500/30 bg-amber-500/5";
    case "low": return "border-blue-500/30 bg-blue-500/5";
    default: return "border-white/10 bg-white/5";
  }
};

/**
 * @typedef {Object} AutopsyEventCardProps
 * @property {any} event
 * @property {(event: any, decision: string) => void} onDecision
 */

/**
 * @type {React.NamedExoticComponent<AutopsyEventCardProps>}
 */
const AutopsyEventCard = memo(({ event, onDecision }) => {
  const Icon = getEventIcon(event.event_type);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn("rounded-xl p-6 border-2", getSeverityColor(event.severity))}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-white capitalize">
                {event.event_type.replace(/_/g, ' ')}
              </h3>
              <span className={cn(
                "px-2 py-0.5 rounded text-xs font-semibold uppercase",
                event.severity === 'critical' && "bg-red-500/20 text-red-400",
                event.severity === 'high' && "bg-orange-500/20 text-orange-400",
                event.severity === 'medium' && "bg-amber-500/20 text-amber-400"
              )}>
                {event.severity}
              </span>
            </div>
            <p className="text-sm text-white/60">
              Detected {format(new Date(event.detected_at), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn("text-2xl font-bold", event.impact_percentage > 0 ? "text-emerald-400" : "text-red-400")}>
            {event.impact_percentage > 0 ? '+' : ''}{event.impact_percentage.toFixed(1)}%
          </p>
          <p className="text-sm text-white/50">${Math.abs(event.impact_amount || 0).toFixed(0)}</p>
        </div>
      </div>

      {/* Causal Reconstruction */}
      <div className="grid grid-cols-2 gap-4 mb-4 p-4 rounded-lg bg-white/[0.02] border border-white/5">
        <div>
          <p className="text-xs font-semibold text-indigo-400 mb-1">🏢 Platform Behavior</p>
          <p className="text-xs text-white/70">{event.causal_reconstruction?.platform_behaviour}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-purple-400 mb-1">👤 Creator Behavior</p>
          <p className="text-xs text-white/70">{event.causal_reconstruction?.creator_behaviour}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-amber-400 mb-1">🌍 External Timing</p>
          <p className="text-xs text-white/70">{event.causal_reconstruction?.external_timing}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-cyan-400 mb-1">📊 Historical Patterns</p>
          <p className="text-xs text-white/70">{event.causal_reconstruction?.historical_analogues}</p>
        </div>
      </div>

      {/* Exposure Score */}
      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-red-400" />
          <p className="text-sm font-semibold text-red-400">Future Exposure Index</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-white/50 mb-1">Recurrence Risk</p>
            <p className="text-lg font-bold text-white">
              {((event.exposure_score?.recurrence_probability || 0) * 100).toFixed(0)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-white/50 mb-1">Expected Damage</p>
            <p className="text-lg font-bold text-white">
              ${(event.exposure_score?.expected_damage || 0).toFixed(0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-white/50 mb-1">Time to Impact</p>
            <p className="text-lg font-bold text-white capitalize">
              {event.exposure_score?.time_to_impact?.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
      </div>

      {/* Decision Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={() => onDecision(event, 'ignored')}
          variant="outline"
          className="flex-1 border-white/10 text-white/70"
        >
          <XCircle className="w-4 h-4 mr-2" />
          Ignore
        </Button>
        <Button
          onClick={() => onDecision(event, 'mitigated')}
          className="flex-1 bg-emerald-600"
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Mitigate
        </Button>
        <Button
          onClick={() => onDecision(event, 'accepted_risk')}
          className="flex-1 bg-amber-600"
        >
          <Shield className="w-4 h-4 mr-2" />
          Accept Risk
        </Button>
      </div>
    </motion.div>
  );
});

AutopsyEventCard.displayName = "AutopsyEventCard";

export default AutopsyEventCard;
