import React from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

const MockConsole = () => {
  return (
    <div className="w-full h-full bg-[#09090b] rounded-xl overflow-hidden flex flex-col font-mono text-xs md:text-sm relative border border-zinc-800 shadow-2xl">
      {/* Window Header */}
      <div className="h-10 bg-[#09090b] border-b border-zinc-800 flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
          <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
        </div>
        <div className="text-zinc-500 tracking-widest text-[10px] md:text-xs font-medium">ZERITHUM // RECONCILIATION_CONSOLE</div>
        <div className="w-12"></div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative bg-[#09090b] p-6 md:p-8 flex items-center justify-center">

        {/* Particle Flow Animation Layer */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
             {/* Particles moving left to center */}
             {[...Array(5)].map((_, i) => (
                <motion.div
                    key={`p-left-${i}`}
                    className="absolute top-1/2 left-10 w-1 h-1 bg-red-500/50 rounded-full"
                    initial={{ x: 0, opacity: 0 }}
                    animate={{
                        x: [0, 200],
                        opacity: [0, 1, 0]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.4,
                        ease: "linear"
                    }}
                />
             ))}

             {/* Particles moving right to center */}
             {[...Array(5)].map((_, i) => (
                <motion.div
                    key={`p-right-${i}`}
                    className="absolute top-1/2 right-10 w-1 h-1 bg-blue-500/50 rounded-full"
                    initial={{ x: 0, opacity: 0 }}
                    animate={{
                        x: [0, -200],
                        opacity: [0, 1, 0]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.4,
                        ease: "linear"
                    }}
                />
             ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl z-10">

            {/* Left: Platform Reported */}
            <div className="space-y-2">
                <div className="text-zinc-500 uppercase tracking-wider text-[10px]">Platform Reported</div>
                <div className="bg-[#121214] border border-zinc-800 rounded-lg p-5 flex flex-col justify-between h-32 md:h-40 relative group overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-600/80"></div>
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center text-white font-bold text-xs">YT</div>
                            <div>
                                <div className="text-zinc-200 font-sans font-medium text-sm">YouTube Earnings</div>
                                <div className="text-zinc-500 text-[10px]">Oct 01 - Oct 31</div>
                            </div>
                        </div>
                        <div className="text-right">
                             <div className="text-zinc-400 text-[10px]">USD</div>
                             <div className="text-zinc-200 font-medium">1,800.00</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="inline-block px-2 py-0.5 rounded bg-zinc-800/50 text-emerald-500 text-[10px] font-medium border border-emerald-500/20">
                            Reported
                        </div>
                    </div>
                </div>
            </div>

            {/* Center: Discrepancy */}
            <div className="flex flex-col items-center justify-center space-y-4">
                 {/* Connection Lines */}
                 <div className="hidden md:block w-full h-[1px] bg-zinc-800/50 absolute top-1/2 left-0 right-0 -z-10"></div>

                 <div className="bg-[#09090b] px-4 py-2 z-10 flex flex-col items-center">
                    <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] flex items-center gap-2 mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        Discrepancy Detected
                    </div>
                    <div className="text-3xl font-bold text-zinc-100 tracking-tighter font-sans">
                        -$150.00
                    </div>
                    <div className="text-zinc-500 text-[10px] text-center mt-1">
                        Reason: Platform fees /<br/>Payout hold
                    </div>
                 </div>
            </div>

            {/* Right: Bank Deposit */}
            <div className="space-y-2">
                <div className="text-zinc-500 uppercase tracking-wider text-[10px]">Bank Deposit</div>
                <div className="bg-[#121214] border border-zinc-800 rounded-lg p-5 flex flex-col justify-between h-32 md:h-40 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-1 h-full bg-blue-600/80"></div>
                     <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">CH</div>
                            <div>
                                <div className="text-zinc-200 font-sans font-medium text-sm">Chase Checking</div>
                                <div className="text-zinc-500 text-[10px]">Nov 21</div>
                            </div>
                        </div>
                        <div className="text-right">
                             <div className="text-zinc-400 text-[10px]">USD</div>
                             <div className="text-zinc-200 font-medium">1,650.00</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="inline-block px-2 py-0.5 rounded bg-zinc-800/50 text-blue-400 text-[10px] font-medium border border-blue-400/20">
                            Received
                        </div>
                    </div>
                </div>
            </div>

        </div>
      </div>

      {/* Footer: Audit Log */}
      <div className="h-32 bg-[#0c0c0e] border-t border-zinc-800 p-4 shrink-0 font-mono text-[10px] md:text-xs">
         <div className="flex items-center gap-2 text-zinc-500 mb-3 uppercase tracking-wider">
            <Lock className="w-3 h-3" /> Audit Log
         </div>
         <div className="space-y-2 font-mono">
            <div className="flex gap-4 text-zinc-600">
                <span className="opacity-50">2023-11-21 14:02:11</span>
                <span className="text-zinc-500">INGESTION_COMPLETE: YouTube payout id_88291</span>
            </div>
            <div className="flex gap-4 text-zinc-600">
                <span className="opacity-50">2023-11-21 14:02:15</span>
                <span className="text-zinc-500">BANK_FEED_SYNC: Chase batch #9921</span>
            </div>
            <div className="flex gap-4 text-emerald-500/90">
                <span className="opacity-70">2023-11-21 14:02:18</span>
                <span>MATCH_EVENT: Confidence 0.92 | Reason: Fee Deduction (8.3%) | Flagged for review</span>
            </div>
         </div>
      </div>
    </div>
  );
};

export default MockConsole;
