import React from 'react';
import { motion } from 'framer-motion';
import { Plug, Building, CheckCircle } from 'lucide-react';

const STEPS = [
  {
    num: '01',
    icon: Plug,
    title: 'Connect your platforms',
    desc: 'Link YouTube, Stripe, Patreon, Gumroad, and others via OAuth. Zerithum pulls transaction and payout data automatically.',
  },
  {
    num: '02',
    icon: Building,
    title: 'Connect your bank',
    desc: 'Read-only bank connection via Teller. Zerithum sees deposits but can never move money or access credentials.',
  },
  {
    num: '03',
    icon: CheckCircle,
    title: 'Reconcile and export',
    desc: 'Zerithum matches platform payouts to bank deposits, flags discrepancies with reason codes, and produces tax-ready exports for your accountant.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 md:py-32 bg-zinc-950">
      <motion.div
        className="max-w-6xl mx-auto px-4 md:px-6"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-14 md:mb-20">
          <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest mb-4">How it works</p>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-white tracking-tight">
            Three steps to reconciled revenue.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-[52px] left-[16.67%] right-[16.67%] h-px bg-zinc-800" />

          {STEPS.map((step, i) => (
            <div key={i} className="relative">
              {/* Step number */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center relative z-10">
                  <step.icon className="w-4 h-4 text-zinc-400" />
                </div>
                <span className="text-[11px] font-mono text-zinc-600 uppercase tracking-wider">{step.num}</span>
              </div>

              <h3 className="text-lg font-medium text-white mb-3">{step.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
