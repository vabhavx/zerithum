import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Scale, FileText, ShieldAlert, ArrowRight, PlayCircle } from 'lucide-react';
import { DemoModal } from './DemoModal';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export function Hero() {
  return (
    <div className="relative z-50 w-full px-4 pt-20 pb-32 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[90vh]">

      {/* Main Headline */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={staggerContainer}
        className="text-center max-w-4xl mx-auto space-y-6"
      >
        <motion.h1
          variants={fadeInUp}
          className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]"
        >
          Match every payout to your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">bank deposits</span>.
        </motion.h1>

        <motion.p
          variants={fadeInUp}
          className="text-xl md:text-2xl text-neutral-400 max-w-2xl mx-auto leading-relaxed"
        >
          Multi-platform income, reconciled weekly, tax-ready exports for accountants.
        </motion.p>

        {/* CTA Row */}
        <motion.div
          variants={fadeInUp}
          className="flex flex-col sm:flex-row gap-4 justify-center pt-8"
        >
          <DemoModal>
            <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-white text-black hover:bg-neutral-200 transition-all hover:scale-105 group">
              <PlayCircle className="mr-2 h-5 w-5 group-hover:text-blue-600 transition-colors" />
              View demo reconciliation
            </Button>
          </DemoModal>

          <Link to="/Signup">
            <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full border-neutral-700 text-neutral-300 hover:bg-neutral-900 hover:text-white transition-all">
              Connect platforms
              <ArrowRight className="ml-2 h-5 w-5 opacity-50" />
            </Button>
          </Link>
        </motion.div>
      </motion.div>

      {/* Feature Cards Grid */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 w-full"
      >
        {/* Card 1: Bank Reconciliation */}
        <Card className="bg-neutral-950/50 border-neutral-800 text-neutral-200 backdrop-blur-sm">
          <CardHeader>
            <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10 text-blue-400">
              <Scale className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl text-white">Bank Reconciliation</CardTitle>
          </CardHeader>
          <CardContent className="text-neutral-400 leading-relaxed">
            YouTube reports USD 1,800, bank shows USD 1,650. We flag the USD 150 gap and explain why.
          </CardContent>
        </Card>

        {/* Card 2: Anomaly Alerts */}
        <Card className="bg-neutral-950/50 border-neutral-800 text-neutral-200 backdrop-blur-sm">
          <CardHeader>
            <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-red-500/10 text-red-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl text-white">Anomaly Alerts</CardTitle>
          </CardHeader>
          <CardContent className="text-neutral-400 leading-relaxed">
            USD 5,000 wire from unknown brand flagged for review. Fraud protection built in.
          </CardContent>
        </Card>

        {/* Card 3: Tax Ready */}
        <Card className="bg-neutral-950/50 border-neutral-800 text-neutral-200 backdrop-blur-sm">
          <CardHeader>
            <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-400">
              <FileText className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl text-white">Tax Ready Exports</CardTitle>
          </CardHeader>
          <CardContent className="text-neutral-400 leading-relaxed">
            Instant categorization for stress-free filing. Export reports with reconciliation notes for audit defense.
          </CardContent>
        </Card>

      </motion.div>
    </div>
  );
}
