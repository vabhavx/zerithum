import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Check, Download } from 'lucide-react';
import ScrollReveal from '@/components/ui/ScrollReveal';
import NumberFlow from '@number-flow/react';

const FEATURES = [
  'Platform-by-platform revenue breakdown',
  'Reconciliation notes on every transaction',
  'CSV and PDF export in standard formats',
];

export default function TaxWorkflowSection() {
  const cardRef = useRef(null);
  const cardInView = useInView(cardRef, { once: true, margin: '-60px' });

  return (
    <section className="py-20 md:py-32 bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-start">
          {/* Left: Copy */}
          <div>
            <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest mb-4">For tax season</p>
            <ScrollReveal
              baseOpacity={0.1}
              enableBlur={true}
              baseRotation={3}
              blurStrength={4}
              textClassName="text-3xl md:text-5xl font-serif font-bold text-white tracking-tight"
            >
              Your accountant will thank you.
            </ScrollReveal>
            <p className="text-zinc-400 text-base md:text-lg leading-relaxed mb-8 mt-5">
              Zerithum produces reconciled revenue reports that show exactly what each platform paid,
              what arrived in the bank, and any discrepancies — all in formats your accountant already works with.
            </p>
            <ul className="space-y-3">
              {FEATURES.map((feature, i) => (
                <motion.li
                  key={i}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.15, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <motion.span
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15, delay: i * 0.15 + 0.1 }}
                  >
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  </motion.span>
                  <span className="text-sm text-zinc-300">{feature}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Right: Export card with NumberFlow */}
          <motion.div
            ref={cardRef}
            className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
          >
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
                  <p className="text-lg font-mono text-white tabular-nums">
                    $<NumberFlow value={cardInView ? 14230.50 : 0} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} />
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider mb-1">Bank Deposits</p>
                  <p className="text-lg font-mono text-white tabular-nums">
                    $<NumberFlow value={cardInView ? 14180.00 : 0} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} />
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-zinc-800/40 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider mb-1">Reconciliation Rate</p>
                  <p className="text-sm font-mono text-emerald-400">
                    <NumberFlow value={cardInView ? 100 : 0} />%
                  </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-zinc-700 rounded-lg text-[11px] font-mono text-zinc-300 uppercase tracking-wider hover:border-zinc-500 hover:shadow-[0_0_12px_rgba(255,255,255,0.05)] transition-all cursor-pointer">
                  <Download className="w-3.5 h-3.5" />
                  Export
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
