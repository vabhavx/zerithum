import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  AlertCircle,
  Sparkles,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const INSIGHT_CONFIG = {
  concentration_risk: {
    icon: AlertTriangle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20'
  },
  pricing_suggestion: {
    icon: DollarSign,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20'
  },
  anomaly_detection: {
    icon: AlertCircle,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20'
  },
  cashflow_forecast: {
    icon: TrendingUp,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20'
  }
};

const InsightsPanel = React.memo(({ insights, onDismiss }) => {
  if (!insights || insights.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-indigo-400" />
        <h3 className="text-lg font-bold text-white">AI Insights</h3>
      </div>

      <AnimatePresence>
        {insights.map((insight) => {
          const config = INSIGHT_CONFIG[insight.insight_type] || INSIGHT_CONFIG.anomaly_detection;
          const Icon = config.icon;

          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={cn(
                "rounded-xl p-4 border",
                config.bgColor,
                config.borderColor
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Icon className={cn("w-5 h-5", config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-white font-semibold text-sm">{insight.title}</h4>
                    {onDismiss && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDismiss(insight.id)}
                        className="h-6 w-6 text-white/40 hover:text-white/70 hover:bg-white/5"
                        aria-label="Dismiss insight"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  <p className="text-white/60 text-xs leading-relaxed mb-2">
                    {insight.description}
                  </p>
                  {insight.confidence && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", config.bgColor)}
                          style={{ width: `${insight.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-white/40 text-xs">
                        {(insight.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
});

export default InsightsPanel;