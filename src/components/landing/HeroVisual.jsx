import React from 'react';
import { Check, AlertTriangle } from 'lucide-react';

const ROWS = [
  { platform: 'YouTube', platformColor: '#FF0000', amount: '$4,200.00', bankRef: 'ACH-7291', bankAmount: '$4,200.00', status: 'matched' },
  { platform: 'Stripe', platformColor: '#635BFF', amount: '$8,000.00', bankRef: 'WIRE-4482', bankAmount: '$8,000.00', status: 'matched' },
  { platform: 'Patreon', platformColor: '#FF424D', amount: '$2,600.00', bankRef: 'ACH-7305', bankAmount: '$2,600.00', status: 'matched' },
  { platform: 'Gumroad', platformColor: '#FF90E8', amount: '$1,400.00', bankRef: 'ACH-7340', bankAmount: '$1,380.00', status: 'discrepancy' },
];

export default function HeroVisual() {
  return (
    <div className="w-full max-w-3xl mx-auto mt-12 md:mt-16">
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-zinc-800/60 flex items-center justify-between">
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">Revenue Reconciliation</span>
          <span className="text-[11px] font-mono text-zinc-600">Oct 2025</span>
        </div>

        {/* Column Headers */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center px-5 py-2.5 border-b border-zinc-800/40">
          <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">Platform</span>
          <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider px-6">Status</span>
          <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider text-right">Bank Deposit</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-zinc-800/30">
          {ROWS.map((row, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto_1fr] items-center px-5 py-3 hover:bg-white/[0.02] transition-colors">
              {/* Platform side */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: row.platformColor }} />
                <span className="text-[12px] font-mono text-zinc-300 truncate">{row.platform}</span>
                <span className="text-[12px] font-mono text-zinc-400 tabular-nums flex-shrink-0">{row.amount}</span>
              </div>

              {/* Status */}
              <div className="px-6 flex justify-center">
                {row.status === 'matched' ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-950/50 border border-emerald-800/40 flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-500" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-red-950/50 border border-red-800/40 flex items-center justify-center">
                    <AlertTriangle className="w-3 h-3 text-red-400" />
                  </div>
                )}
              </div>

              {/* Bank side */}
              <div className="flex items-center justify-end gap-3 min-w-0">
                <span className={`text-[12px] font-mono tabular-nums flex-shrink-0 ${
                  row.status === 'matched' ? 'text-zinc-400' : 'text-red-400'
                }`}>{row.bankAmount}</span>
                <span className="text-[11px] font-mono text-zinc-600 truncate">{row.bankRef}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800/60 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono text-emerald-500/80 uppercase tracking-wider">3 matched</span>
            <span className="text-[10px] font-mono text-red-400/80 uppercase tracking-wider">1 flagged</span>
          </div>
          <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">$16,200 reconciled</span>
        </div>
      </div>
    </div>
  );
}
