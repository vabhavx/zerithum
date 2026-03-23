import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

const steps = [
  {
    platform: 'YouTube',
    logo: 'YT',
    color: 'bg-red-600',
    amount: 1800,
    bankAmount: 1650,
    delta: 150,
    reason: 'Fee deduction',
    status: 'match',
    icon: CheckCircle2,
    iconColor: 'text-emerald-500'
  },
  {
    platform: 'Patreon',
    logo: 'PT',
    color: 'bg-orange-600',
    amount: 1200,
    bankAmount: 1150,
    delta: 50,
    reason: 'Fee deduction',
    status: 'match',
    icon: CheckCircle2,
    iconColor: 'text-emerald-500'
  },
  {
    platform: 'Stripe',
    logo: 'ST',
    color: 'bg-indigo-600',
    amount: 99,
    bankAmount: -99,
    delta: 0,
    reason: 'Refund',
    status: 'refund',
    icon: AlertCircle,
    iconColor: 'text-amber-500'
  },
  {
    platform: 'Gumroad',
    logo: 'GR',
    color: 'bg-pink-600',
    amount: 450,
    bankAmount: 450,
    delta: 0,
    reason: 'Hold period',
    status: 'pending',
    icon: Clock,
    iconColor: 'text-blue-500'
  }
];

const IngestionVisual = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Start playing immediately on mount for tab switching context
    setIsPlaying(true);

    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % steps.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const CurrentIcon = steps[currentStep].icon;

  return (
    <div className="w-full bg-zinc-900/50 rounded-xl border border-zinc-800 p-8 relative overflow-hidden h-auto min-h-[500px] md:h-[400px] flex flex-col">
        {/* Header */}
        <div className="flex justify-between text-xs font-mono text-zinc-500 mb-8 border-b border-zinc-800 pb-2">
            <span>PLATFORM_INGESTION_STREAM</span>
            <span>LIVE_RECONCILIATION</span>
        </div>

        <div className="flex-1 relative flex flex-col md:flex-row items-center justify-center md:justify-between px-4 md:px-12 gap-12 md:gap-0">
            {/* Left: Platform */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`plat-${currentStep}`}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 50, opacity: 0 }} // Move towards center then fade
                    transition={{ duration: 0.5 }}
                    className="w-full md:w-48 bg-zinc-950 border border-zinc-800 p-4 rounded-lg shadow-xl z-10"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`w-8 h-8 rounded ${steps[currentStep].color} flex items-center justify-center font-bold text-white text-xs`}>
                            {steps[currentStep].logo}
                        </div>
                        <div className="text-zinc-200 font-medium">{steps[currentStep].platform}</div>
                    </div>
                    <div className="text-2xl font-mono text-white">
                        ${steps[currentStep].amount}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">Reported Earnings</div>
                </motion.div>
            </AnimatePresence>

            {/* Center: Match Logic */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className="hidden md:block w-full h-[1px] bg-zinc-800"></div>
                 <div className="md:hidden h-full w-[1px] bg-zinc-800"></div>
                 <AnimatePresence mode="wait">
                    <motion.div
                         key={`match-${currentStep}`}
                         initial={{ scale: 0, opacity: 0 }}
                         animate={{ scale: 1, opacity: 1 }}
                         exit={{ scale: 0, opacity: 0 }}
                         transition={{ delay: 0.3 }}
                         className="absolute bg-zinc-950 border border-zinc-700 px-4 py-2 rounded-full flex items-center gap-2 z-20"
                    >
                        <CurrentIcon className={`w-4 h-4 ${steps[currentStep].iconColor}`} />
                        <span className="text-xs font-mono text-white">
                            {steps[currentStep].delta !== 0 ? `DELTA $${steps[currentStep].delta}` : 'EXACT MATCH'}
                        </span>
                    </motion.div>
                 </AnimatePresence>
            </div>


            {/* Right: Bank */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`bank-${currentStep}`}
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -50, opacity: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="w-full md:w-48 bg-zinc-950 border border-zinc-800 p-4 rounded-lg shadow-xl z-10 text-right"
                >
                    <div className="flex items-center justify-end gap-3 mb-2">
                        <div className="text-zinc-200 font-medium">Bank Deposit</div>
                        <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
                            BK
                        </div>
                    </div>
                    <div className="text-2xl font-mono text-white">
                        ${steps[currentStep].bankAmount}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">Settled Amount</div>
                </motion.div>
            </AnimatePresence>
        </div>

        {/* Bottom: Audit Log */}
        <div className="mt-8 border-t border-zinc-800 pt-4">
             <div className="font-mono text-[10px] text-zinc-600 mb-2">AUDIT_TRAIL_APPEND // IMMUTABLE</div>
             <AnimatePresence mode="popLayout">
                <motion.div
                    key={`audit-${currentStep}`}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ opacity: 0.5 }}
                    className="font-mono text-xs text-emerald-500/80 bg-emerald-500/5 p-2 rounded border border-emerald-500/20"
                >
                    <span className="mr-2 text-zinc-500">[{new Date().toLocaleTimeString()}]</span>
                    MATCH_DECISION: {steps[currentStep].platform} vs BANK | Reason: {steps[currentStep].reason} | Confidence: 0.99
                </motion.div>
             </AnimatePresence>
        </div>
      </div>
  );
};

export default IngestionVisual;
