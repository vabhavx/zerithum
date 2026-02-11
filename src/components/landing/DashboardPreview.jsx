import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Youtube, CreditCard, ShoppingBag, Video, Mail, Globe,
  Smartphone, Box, DollarSign, Code,
  Search, CheckCircle2, Shield, Zap, Terminal, XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PLATFORMS = [
    { id: 'yt', name: "YouTube", icon: Youtube, color: "text-red-500", bg: "bg-red-500/10" },
    { id: 'str', name: "Stripe", icon: CreditCard, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { id: 'shp', name: "Shopify", icon: ShoppingBag, color: "text-green-500", bg: "bg-green-500/10" },
    { id: 'twh', name: "Twitch", icon: Video, color: "text-purple-500", bg: "bg-purple-500/10" },
    { id: 'pat', name: "Patreon", icon: DollarSign, color: "text-orange-500", bg: "bg-orange-500/10" },
    { id: 'sub', name: "Substack", icon: Mail, color: "text-orange-400", bg: "bg-orange-400/10" },
    { id: 'gum', name: "Gumroad", icon: Box, color: "text-pink-500", bg: "bg-pink-500/10" },
    { id: 'tik', name: "TikTok", icon: Smartphone, color: "text-cyan-500", bg: "bg-cyan-500/10" },
    { id: 'api', name: "Custom API", icon: Code, color: "text-zinc-400", bg: "bg-zinc-500/10" },
    { id: 'apl', name: "Apple Pay", icon: Smartphone, color: "text-zinc-200", bg: "bg-zinc-200/10" },
    { id: 'gpy', name: "Google Pay", icon: Smartphone, color: "text-blue-500", bg: "bg-blue-500/10" },
    { id: 'sqr', name: "Square", icon: Box, color: "text-zinc-400", bg: "bg-zinc-400/10" },
    { id: 'ppl', name: "PayPal", icon: DollarSign, color: "text-blue-600", bg: "bg-blue-600/10" },
    { id: 'amz', name: "Amazon", icon: ShoppingBag, color: "text-yellow-500", bg: "bg-yellow-500/10" },
    { id: 'woo', name: "WooCommerce", icon: ShoppingBag, color: "text-purple-600", bg: "bg-purple-600/10" },
    { id: 'ads', name: "AdSense", icon: DollarSign, color: "text-green-600", bg: "bg-green-600/10" },
    { id: 'meta', name: "Meta", icon: Globe, color: "text-blue-400", bg: "bg-blue-400/10" },
    { id: 'x', name: "X / Twitter", icon: Globe, color: "text-white", bg: "bg-zinc-800" },
    { id: 'lin', name: "Linkedin", icon: Globe, color: "text-blue-700", bg: "bg-blue-700/10" },
    { id: 'kaj', name: "Kajabi", icon: Box, color: "text-blue-500", bg: "bg-blue-500/10" },
];

const STREAM_SPEED = 8; // Faster stream

const DashboardPreview = () => {
  const [activeAnalysis, setActiveAnalysis] = useState(null);
  const [analyzingStage, setAnalyzingStage] = useState('idle'); // idle, scanning, diffing, resolved
  const [bankDeposits, setBankDeposits] = useState([]);

  // Simulate bank feed
  useEffect(() => {
      let mounted = true;
      const interval = setInterval(() => {
          if (!mounted) return;
          const newDeposit = {
              id: Math.random().toString(36).substr(2, 9),
              amount: (Math.random() * 5000 + 100).toFixed(2),
              bank: "TRUE BANK DEPOSIT",
              ref: `ACH_${Math.floor(Math.random() * 999999)}`
          };
          setBankDeposits(prev => [newDeposit, ...prev].slice(0, 6));
      }, 1500);
      return () => { mounted = false; clearInterval(interval); };
  }, []);

  // Simulate picking an item from the stream to analyze
  useEffect(() => {
    let mounted = true;
    const interval = setInterval(() => {
        if (!mounted) return;

        // Pick a random platform
        const platform = PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)];
        const isAnomaly = Math.random() > 0.6; // 40% chance of anomaly

        setActiveAnalysis({
            ...platform,
            amount: (Math.random() * 1000 + 50).toFixed(2),
            id: `TX_${Math.floor(Math.random() * 99999)}`,
            isAnomaly
        });
        setAnalyzingStage('scanning');

        // Sequence
        setTimeout(() => mounted && setAnalyzingStage('diffing'), 600);
        setTimeout(() => mounted && setAnalyzingStage('resolved'), 1800);
        setTimeout(() => mounted && setActiveAnalysis(null), 3200);

    }, 3500); // Faster cycle

    return () => {
        mounted = false;
        clearInterval(interval);
    };
  }, []);

  return (
    <div className="w-full h-[600px] bg-[#09090b] rounded-xl overflow-hidden flex flex-col font-mono text-xs md:text-sm relative border border-zinc-800 shadow-2xl z-20">
      {/* Header */}
      <div className="h-10 bg-[#0c0c0e] border-b border-zinc-800 flex items-center px-4 justify-between shrink-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
          <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
        </div>
        <div className="text-zinc-500 tracking-widest text-[10px] font-medium flex items-center gap-2">
          <Shield className="w-3 h-3" />
          ZERITHUM_OPS // ENTERPRISE_GRID
        </div>
        <div className="flex items-center gap-2 text-emerald-500 text-[10px]">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <span>SYSTEM ONLINE</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">

        {/* LEFT COLUMN: INGESTION STREAM */}
        <div className="w-64 border-r border-zinc-800 bg-[#0a0a0b] flex flex-col relative z-10 hidden md:flex">
            <div className="p-3 border-b border-zinc-800 text-[10px] text-zinc-500 uppercase font-bold tracking-wider flex justify-between items-center">
                <span>Ingestion Stream</span>
                <span className="text-emerald-500 flex items-center gap-1"><Zap className="w-3 h-3" /> LIVE</span>
            </div>

            <div className="flex-1 overflow-hidden relative">
                {/* Infinite Scroll Container */}
                <motion.div
                    className="absolute inset-x-0 top-0"
                    animate={{ y: ["0%", "-50%"] }}
                    transition={{ duration: STREAM_SPEED, repeat: Infinity, ease: "linear" }}
                >
                    {/* Render list twice for seamless loop */}
                    {[...PLATFORMS, ...PLATFORMS, ...PLATFORMS].map((p, i) => (
                        <div key={i} className="px-3 py-2 border-b border-zinc-800/50 flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
                            <div className={cn("w-6 h-6 rounded flex items-center justify-center", p.bg, p.color)}>
                                <p.icon className="w-3 h-3" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-zinc-300 font-medium truncate">{p.name}</div>
                                <div className="text-[10px] text-zinc-600 font-mono">ID: {Math.floor(Math.random() * 10000)}</div>
                            </div>
                            <div className="text-[10px] text-emerald-500/80">SYNC</div>
                        </div>
                    ))}
                </motion.div>
                {/* Fade Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0b] via-transparent to-[#0a0a0b] pointer-events-none"></div>
            </div>
        </div>

        {/* CENTER COLUMN: AUTOPSY ENGINE */}
        <div className="flex-1 bg-[#09090b] relative flex flex-col items-center justify-center">
            {/* Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]"></div>

            <AnimatePresence mode="wait">
                {!activeAnalysis ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center gap-6 text-zinc-700 relative z-10"
                    >
                        <div className="w-24 h-24 rounded-full border border-zinc-800 flex items-center justify-center relative bg-zinc-900/50 backdrop-blur-sm">
                            <div className="w-full h-full absolute inset-0 animate-ping opacity-20 bg-emerald-500 rounded-full"></div>
                            <div className="absolute inset-0 border-t border-emerald-500/50 rounded-full animate-spin"></div>
                            <Search className="w-8 h-8 text-emerald-500" />
                        </div>
                        <div className="text-xs tracking-[0.2em] uppercase text-emerald-500/50 font-bold animate-pulse">
                            Awaiting Transaction
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key={activeAnalysis.id}
                        className="w-full max-w-3xl px-4 relative z-10"
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0, filter: "blur(10px)" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        <div className="bg-[#0c0c0e] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl relative">
                             {/* Scanning Laser Beam */}
                             {analyzingStage === 'scanning' && (
                                <motion.div
                                    className="absolute inset-x-0 h-[2px] bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,1)] z-50 pointer-events-none"
                                    initial={{ top: 0 }}
                                    animate={{ top: "100%" }}
                                    transition={{ duration: 0.8, ease: "linear", repeat: Infinity }}
                                />
                            )}

                            {/* Header */}
                            <div className="h-12 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between px-4 backdrop-blur-md">
                                <div className="flex items-center gap-3">
                                    <div className={cn("w-6 h-6 rounded flex items-center justify-center", activeAnalysis.bg, activeAnalysis.color)}>
                                        <activeAnalysis.icon className="w-3 h-3" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-zinc-200 font-bold text-xs uppercase tracking-wider">{activeAnalysis.name} Payload</span>
                                        <span className="text-[10px] text-zinc-500 font-mono">{activeAnalysis.id}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        "text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider transition-colors duration-300",
                                        analyzingStage === 'idle' ? "bg-zinc-800 text-zinc-500" :
                                        analyzingStage === 'scanning' ? "bg-blue-500/10 text-blue-500 animate-pulse" :
                                        analyzingStage === 'diffing' ? "bg-purple-500/10 text-purple-500" :
                                        activeAnalysis.isAnomaly ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
                                    )}>
                                        {analyzingStage === 'idle' && "Queued"}
                                        {analyzingStage === 'scanning' && "Scanning"}
                                        {analyzingStage === 'diffing' && "Comparing"}
                                        {analyzingStage === 'resolved' && (activeAnalysis.isAnomaly ? "Anomaly" : "Matched")}
                                    </span>
                                </div>
                            </div>

                            {/* Split Diff View */}
                            <div className="grid grid-cols-2 divide-x divide-zinc-800 bg-[#0a0a0b] font-mono text-[10px] md:text-xs">
                                {/* Left: Source JSON */}
                                <div className="p-4 relative">
                                    <div className="absolute top-2 right-2 text-[9px] text-zinc-600 uppercase font-bold tracking-wider">Source</div>
                                    <div className="space-y-1 opacity-80">
                                        <div className="text-zinc-500">{`{`}</div>
                                        <div className="pl-4 text-zinc-400"><span className="text-blue-400">"id"</span>: <span className="text-amber-400">"{activeAnalysis.id}"</span>,</div>
                                        <div className="pl-4 text-zinc-400"><span className="text-blue-400">"platform"</span>: <span className="text-amber-400">"{activeAnalysis.name}"</span>,</div>

                                        {/* Dynamic Amount Line */}
                                        <motion.div
                                            className="pl-4 text-zinc-400 relative"
                                            animate={analyzingStage === 'resolved' && activeAnalysis.isAnomaly ? {
                                                color: "#f87171", // red-400
                                                backgroundColor: "rgba(248, 113, 113, 0.1)",
                                            } : {}}
                                        >
                                            <span className="text-blue-400">"amount"</span>: <span className="text-emerald-400">{activeAnalysis.amount}</span>,
                                        </motion.div>

                                        <div className="pl-4 text-zinc-400"><span className="text-blue-400">"currency"</span>: <span className="text-amber-400">"USD"</span></div>
                                        <div className="text-zinc-500">{`}`}</div>
                                    </div>
                                </div>

                                {/* Right: Bank JSON */}
                                <div className="p-4 relative bg-zinc-900/20">
                                    <div className="absolute top-2 right-2 text-[9px] text-zinc-600 uppercase font-bold tracking-wider">Bank Ledger</div>
                                    {analyzingStage === 'scanning' ? (
                                        <div className="h-full flex items-center justify-center text-zinc-600 gap-2">
                                            <div className="w-3 h-3 border border-zinc-600 border-t-transparent rounded-full animate-spin"></div>
                                            Fetching...
                                        </div>
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="space-y-1 opacity-80"
                                        >
                                            <div className="text-zinc-500">{`{`}</div>
                                            <div className="pl-4 text-zinc-400"><span className="text-purple-400">"ref"</span>: <span className="text-amber-400">"ACH_{Math.floor(Math.random()*9999)}"</span>,</div>
                                            <div className="pl-4 text-zinc-400"><span className="text-purple-400">"status"</span>: <span className="text-amber-400">"CLEARED"</span>,</div>

                                            {/* Dynamic Amount Line */}
                                            <motion.div
                                                className="pl-4 text-zinc-400 relative"
                                                animate={analyzingStage === 'resolved' && activeAnalysis.isAnomaly ? {
                                                    color: "#f87171", // red-400
                                                    backgroundColor: "rgba(248, 113, 113, 0.1)",
                                                } : {}}
                                            >
                                                <span className="text-purple-400">"amount"</span>: <span className="text-emerald-400">
                                                    {activeAnalysis.isAnomaly
                                                        ? (parseFloat(activeAnalysis.amount) * 0.95).toFixed(2)
                                                        : activeAnalysis.amount
                                                    }
                                                </span>,
                                            </motion.div>

                                            <div className="pl-4 text-zinc-400"><span className="text-purple-400">"currency"</span>: <span className="text-amber-400">"USD"</span></div>
                                            <div className="text-zinc-500">{`}`}</div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            {/* Result Footer - Inline, Non-Overlapping */}
                            <motion.div
                                className="border-t border-zinc-800 bg-zinc-900/50 backdrop-blur"
                                initial={{ height: 0, opacity: 0 }}
                                animate={analyzingStage === 'resolved' ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                            >
                                <div className={cn(
                                    "p-3 flex items-center justify-between text-xs font-medium",
                                    activeAnalysis.isAnomaly ? "text-red-400" : "text-emerald-400"
                                )}>
                                    <div className="flex items-center gap-2">
                                        {activeAnalysis.isAnomaly ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                        <span className="uppercase tracking-wider">
                                            {activeAnalysis.isAnomaly ? "Discrepancy Detected" : "Reconciliation Successful"}
                                        </span>
                                    </div>
                                    {activeAnalysis.isAnomaly && (
                                        <div className="font-mono bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                                            DIFF: -${(parseFloat(activeAnalysis.amount) * 0.05).toFixed(2)}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* RIGHT COLUMN: BANK FEED */}
        <div className="w-64 border-l border-zinc-800 bg-[#0a0a0b] flex flex-col relative z-10 hidden md:flex">
            <div className="p-3 border-b border-zinc-800 text-[10px] text-zinc-500 uppercase font-bold tracking-wider flex justify-between items-center">
                <span>True Bank Deposit</span>
                <span className="text-emerald-500 flex items-center gap-1"><Shield className="w-3 h-3" /> SECURE</span>
            </div>
             <div className="flex-1 overflow-hidden relative p-4">
                <AnimatePresence initial={false}>
                    {bankDeposits.map((deposit) => (
                        <motion.div
                            key={deposit.id}
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.3 }}
                            className="bg-zinc-900/50 border border-zinc-800 rounded p-3 flex flex-col gap-1 mb-3 hover:border-zinc-700 transition-colors cursor-default"
                        >
                            <div className="flex justify-between items-center">
                                <span className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider">Deposit</span>
                                <span className="text-emerald-500 text-[10px] bg-emerald-500/10 px-1 rounded">VERIFIED</span>
                            </div>
                            <div className="flex justify-between items-end mt-1">
                                <div className="text-zinc-200 font-mono font-bold text-sm">${deposit.amount}</div>
                                <div className="text-zinc-600 text-[9px] font-mono">{deposit.ref}</div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] to-transparent pointer-events-none"></div>
             </div>
        </div>
      </div>

      {/* Terminal Footer */}
      <div className="h-8 bg-[#0c0c0e] border-t border-zinc-800 flex items-center px-4 gap-4 font-mono text-[10px] text-zinc-600 overflow-hidden">
        <Terminal className="w-3 h-3" />
        <div className="flex-1 flex gap-8 whitespace-nowrap overflow-hidden">
             <motion.div
                animate={{ x: ["0%", "-50%"] }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="flex gap-8"
             >
                <span>[SYSTEM] Connected to 24 data streams</span>
                <span>[AUDIT] Immutable log stream active</span>
                <span>[ENCRYPTION] AES-256 Enabled</span>
                <span>[LATENCY] 14ms average</span>
                <span>[SYSTEM] Connected to 24 data streams</span>
                <span>[AUDIT] Immutable log stream active</span>
                <span>[ENCRYPTION] AES-256 Enabled</span>
                <span>[LATENCY] 14ms average</span>
             </motion.div>
        </div>
      </div>

    </div>
  );
};

export default DashboardPreview;
