import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const PLATFORM_COLORS = { youtube: '#DC2626', patreon: '#F87171', stripe: '#6366F1', gumroad: '#EC4899', instagram: '#E11D48', tiktok: '#111827' };

export default function LendingSignalsCard({ insight }) {
  if (!insight || !insight.data?.predictions) return null;
  const predictions = insight.data.predictions;
  const totalExpected = predictions.reduce((sum, p) => sum + p.predictedAmount, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-gray-100 bg-white p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-gray-500" /></div>
        <div><h3 className="text-sm font-semibold text-gray-900">Cashflow Forecast</h3><p className="text-gray-400 text-xs">Predicted payouts next 30 days</p></div>
      </div>
      <div className="mb-4 p-4 rounded-lg bg-emerald-50 border border-emerald-100">
        <p className="text-emerald-700 text-xs font-medium mb-1">Total Expected</p>
        <p className="text-2xl font-bold text-gray-900">${totalExpected.toFixed(0)}</p>
        <p className="text-gray-400 text-xs mt-1">Confidence: {(insight.confidence * 100).toFixed(0)}%</p>
      </div>
      <div className="space-y-3">
        {predictions.map((pred, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PLATFORM_COLORS[pred.platform] || '#6366F1' }} />
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 text-sm font-medium capitalize">{pred.platform}</p>
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5"><Calendar className="w-3 h-3" />{format(parseISO(pred.predictedDate), 'MMM d, yyyy')}</div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-gray-900 font-semibold text-sm">${pred.predictedAmount.toFixed(0)}</p>
              <p className="text-gray-400 text-xs">±${pred.confidenceInterval.toFixed(0)}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-100 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-blue-600 text-xs">Plan expenses accordingly. Accuracy improves with more transaction history.</p>
      </div>
    </motion.div>
  );
}