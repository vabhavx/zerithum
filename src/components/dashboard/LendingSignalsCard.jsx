import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const PLATFORM_COLORS = {
  youtube: '#FF0000',
  patreon: '#FF424D',
  stripe: '#635BFF',
  gumroad: '#FF90E8',
  instagram: '#E4405F',
  tiktok: '#000000'
};

const LendingSignalsCard = React.memo(({ insight }) => {
  if (!insight || !insight.data?.predictions) {
    return null;
  }

  const predictions = insight.data.predictions;
  const totalExpected = predictions.reduce((sum, p) => sum + p.predictedAmount, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-modern rounded-xl p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-white/10 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Cashflow Forecast</h3>
          <p className="text-white/40 text-xs">Predicted payouts next 30 days</p>
        </div>
      </div>

      <div className="mb-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <p className="text-emerald-400 text-xs font-medium mb-1">Total Expected</p>
        <p className="text-2xl font-bold text-white">${totalExpected.toFixed(0)}</p>
        <p className="text-white/40 text-xs mt-1">
          Confidence: {(insight.confidence * 100).toFixed(0)}%
        </p>
      </div>

      <div className="space-y-3">
        {predictions.map((pred, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5"
          >
            <div className="flex items-center gap-3 flex-1">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: PLATFORM_COLORS[pred.platform] || '#6366F1' }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium capitalize">{pred.platform}</p>
                <div className="flex items-center gap-2 text-xs text-white/40 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  {format(parseISO(pred.predictedDate), 'MMM d, yyyy')}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-semibold text-sm">
                ${pred.predictedAmount.toFixed(0)}
              </p>
              <p className="text-white/40 text-xs">
                ±${pred.confidenceInterval.toFixed(0)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-blue-400 text-xs">
          Plan expenses accordingly. Accuracy improves with more transaction history.
        </p>
      </div>
    </motion.div>
  );
});

LendingSignalsCard.displayName = "LendingSignalsCard";

export default LendingSignalsCard;