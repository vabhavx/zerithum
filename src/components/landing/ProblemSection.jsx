import React from 'react';
import { motion } from 'framer-motion';
import { Layers, ArrowLeftRight, FileSpreadsheet } from 'lucide-react';
import ScrollReveal from '@/components/ui/ScrollReveal';

const PAIN_POINTS = [
  {
    icon: Layers,
    title: 'Scattered platforms',
    desc: 'Every platform has its own dashboard, its own payout schedule, its own fee structure. There is no unified place to see what you actually earned.',
  },
  {
    icon: ArrowLeftRight,
    title: "Deposits don't match",
    desc: 'Deposits arrive days later, batched together, minus fees and deductions. Matching a bank deposit to the platform that sent it is tedious and error-prone.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Tax prep is manual',
    desc: 'Come tax season, you are manually pulling reports from six platforms, cross-referencing bank statements, and hoping the numbers add up.',
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

export default function ProblemSection() {
  return (
    <section className="py-20 md:py-32 bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="mb-14 md:mb-20">
          <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest mb-4">The problem</p>
          <ScrollReveal
            baseOpacity={0.1}
            enableBlur={true}
            baseRotation={3}
            blurStrength={4}
            textClassName="text-3xl md:text-5xl font-serif font-bold text-white tracking-tight"
          >
            Creator revenue is fragmented by design.
          </ScrollReveal>
          <p className="text-zinc-400 max-w-2xl text-base md:text-lg leading-relaxed mt-5">
            You earn on YouTube, Stripe, Patreon, Gumroad, and more. Each platform reports differently.
            Deposits hit your bank days later, often batched, net of fees, with no clear paper trail.
            Tax season becomes forensic accounting.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PAIN_POINTS.map((point, i) => (
            <motion.div
              key={i}
              className="p-6 md:p-8 bg-zinc-900/50 border border-zinc-800 rounded-xl"
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
            >
              <motion.div
                className="w-10 h-10 bg-zinc-800/80 border border-zinc-700/50 rounded-lg flex items-center justify-center mb-5"
                whileInView={{ rotate: [0, -8, 0] }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 + 0.2 }}
              >
                <point.icon className="w-5 h-5 text-zinc-400" />
              </motion.div>
              <h3 className="text-base font-medium text-white mb-2">{point.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{point.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
