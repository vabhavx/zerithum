import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, GitCompareArrows, AlertTriangle, Download } from 'lucide-react';

const OUTCOMES = [
  {
    icon: BarChart3,
    title: 'Unified revenue view',
    desc: 'All platforms, one dashboard. See what every platform reported, when payouts were sent, and what arrived in your bank.',
  },
  {
    icon: GitCompareArrows,
    title: 'Automated matching',
    desc: 'Zerithum matches platform payouts to bank deposits automatically, using amount, timing, and reference data.',
  },
  {
    icon: AlertTriangle,
    title: 'Discrepancy detection',
    desc: 'When a deposit does not match what the platform reported, Zerithum flags it with the exact variance and a reason code.',
  },
  {
    icon: Download,
    title: 'Tax-ready exports',
    desc: 'Download reconciled revenue data formatted for your accountant. CSV, PDF, or direct integration with tax prep workflows.',
  },
];

export default function OutcomesSection() {
  return (
    <section id="outcomes" className="py-20 md:py-32 bg-zinc-950">
      <motion.div
        className="max-w-6xl mx-auto px-4 md:px-6"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-14 md:mb-20">
          <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest mb-4">What you get</p>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-white tracking-tight">
            The clarity your finances deserve.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {OUTCOMES.map((outcome, i) => (
            <div
              key={i}
              className="p-6 md:p-8 bg-zinc-900/30 border border-zinc-800 rounded-xl"
            >
              <div className="w-10 h-10 bg-zinc-800/80 border border-zinc-700/50 rounded-lg flex items-center justify-center mb-5">
                <outcome.icon className="w-5 h-5 text-zinc-400" />
              </div>
              <h3 className="text-base font-medium text-white mb-2">{outcome.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{outcome.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
