import React from 'react';
import { motion } from 'framer-motion';
import { Check, Download } from 'lucide-react';

const FEATURES = [
  'Platform-by-platform revenue breakdown',
  'Reconciliation notes on every transaction',
  'CSV and PDF export in standard formats',
];

export default function TaxWorkflowSection() {
  return (
    <section className="py-20 md:py-32 bg-zinc-950">
      <motion.div
        className="max-w-6xl mx-auto px-4 md:px-6"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-start">
          {/* Left: Copy */}
          <div>
            <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest mb-4">For tax season</p>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-white tracking-tight mb-5">
              Your accountant will thank you.
            </h2>
            <p className="text-zinc-400 text-base md:text-lg leading-relaxed mb-8">
              Zerithum produces reconciled revenue reports that show exactly what each platform paid,
              what arrived in the bank, and any discrepancies — all in formats your accountant already works with.
            </p>
            <ul className="space-y-3">
              {FEATURES.map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm text-zinc-300">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Static export card */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-800/60 flex items-center justify-between">
              <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">Export</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-900/30 text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
                Reconciled
              </span>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider mb-1">Period</p>
                <p className="text-sm font-mono text-zinc-300">October 2025</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider mb-1">Platform Revenue</p>
                  <p className="text-lg font-mono text-white tabular-nums">$14,230.50</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider mb-1">Bank Deposits</p>
                  <p className="text-lg font-mono text-white tabular-nums">$14,180.00</p>
                </div>
              </div>
              <div className="pt-2 border-t border-zinc-800/40 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider mb-1">Reconciliation Rate</p>
                  <p className="text-sm font-mono text-emerald-400">100%</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-zinc-700 rounded-lg text-[11px] font-mono text-zinc-300 uppercase tracking-wider">
                  <Download className="w-3.5 h-3.5" />
                  Export
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
