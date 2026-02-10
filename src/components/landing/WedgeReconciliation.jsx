import React from 'react';
import { motion } from 'framer-motion';
import { Scale, ShieldAlert, Fingerprint } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function WedgeReconciliation() {
  return (
    <section className="w-full py-24 bg-neutral-950 border-t border-white/5 relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Card 1: Bank Reconciliation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card className="h-full bg-neutral-900/50 border-neutral-800 text-neutral-300 backdrop-blur-sm hover:border-neutral-700 transition-colors">
              <CardHeader>
                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Scale className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl text-white font-mono tracking-tight">Bank Reconciliation</CardTitle>
              </CardHeader>
              <CardContent className="text-neutral-400 leading-relaxed text-sm">
                YouTube reports <span className="text-white font-mono">$1,800</span>, bank shows <span className="text-white font-mono">$1,650</span>. We flag the <span className="text-red-400 font-mono">$150</span> gap and explain why.
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 2: Anomaly Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="h-full bg-neutral-900/50 border-neutral-800 text-neutral-300 backdrop-blur-sm hover:border-neutral-700 transition-colors">
              <CardHeader>
                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl text-white font-mono tracking-tight">Anomaly Alerts</CardTitle>
              </CardHeader>
              <CardContent className="text-neutral-400 leading-relaxed text-sm">
                <span className="text-white font-mono">$5,000</span> wire from unknown brand flagged for review. Fraud protection built in.
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 3: The Core Wedge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-1 lg:row-span-1"
          >
            <Card className="h-full bg-blue-950/10 border-blue-900/30 text-neutral-300 backdrop-blur-sm relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <CardHeader>
                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Fingerprint className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl text-white font-mono tracking-tight flex items-center gap-2">
                    The Core Wedge
                </CardTitle>
              </CardHeader>
              <CardContent className="text-neutral-400 leading-relaxed text-sm space-y-4">
                <p>
                  <span className="text-white font-semibold">Platforms lie.</span> YouTube reports $1,800 earned but deposits $1,650 after fees and holds. Patreon shows $1,200 but the bank receives $1,150 because of processing delays.
                </p>
                <p>
                  Stripe fires webhooks for charges that later get refunded or disputed. Zerithum exposes the gap between reported revenue and cash reality.
                </p>
              </CardContent>
            </Card>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
