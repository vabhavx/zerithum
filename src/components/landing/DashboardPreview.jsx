import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Youtube, CreditCard, ShoppingBag, Video, Mail, Globe,
  Smartphone, Box, DollarSign, Code,
  Search, CheckCircle2, AlertCircle, FileJson,
  Database, Shield, Zap, Terminal
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

const STREAM_SPEED = 10; // Faster stream

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
      }, 2000);
      return () => { mounted = false; clearInterval(interval); };
  }, []);

  // Simulate picking an item from the stream to analyze
  useEffect(() => {
    let mounted = true;
    const interval = setInterval(() => {
        if (!mounted) return;

        // Pick a random platform
        const platform = PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)];
        const isAnomaly = Math.random() > 0.7; // 30% chance of anomaly

        setActiveAnalysis({
            ...platform,
            amount: (Math.random() * 1000 + 50).toFixed(2),
            id: `TX_${Math.floor(Math.random() * 99999)}`,
            isAnomaly
        });
        setAnalyzingStage('scanning');

        // Sequence
        setTimeout(() => mounted && setAnalyzingStage('diffing'), 800);
        setTimeout(() => mounted && setAnalyzingStage('resolved'), 2000);
        setTimeout(() => mounted && setActiveAnalysis(null), 3500);

    }, 3800); // Faster cycle

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
        <div className="w-64 border-r border-zinc-800 bg-[#0a0a0b] flex flex-col relative z-10">
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
        <div className="flex-1 bg-[#09090b] relative flex flex-col">
            {/* Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]"></div>

            <div className="p-3 border-b border-zinc-800 text-[10px] text-zinc-500 uppercase font-bold tracking-wider flex justify-between items-center z-20 bg-[#09090b]/80 backdrop-blur">
                <span>Live Autopsy Engine</span>
                <div className="flex gap-4">
                    <span>Latency: <span className="text-zinc-300">12ms</span></span>
                    <span>Queue: <span className="text-zinc-300">0</span></span>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-8 relative z-10">
                <AnimatePresence mode="wait">
                    {!activeAnalysis ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center gap-4 text-zinc-700"
                        >
                            <div className="w-16 h-16 rounded-full border-2 border-zinc-800 flex items-center justify-center relative">
                                <div className="w-full h-full absolute inset-0 animate-ping opacity-20 bg-zinc-800 rounded-full"></div>
                                <Search className="w-6 h-6" />
                            </div>
                            <div className="text-xs tracking-widest uppercase">Scanning for transactions...</div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={activeAnalysis.id}
                            className="w-full max-w-2xl bg-[#0c0c0e] border border-zinc-800 rounded-lg overflow-hidden shadow-2xl relative"
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, filter: "blur(10px)" }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        >
                            {/* Scanning Laser */}
                            {analyzingStage === 'scanning' && (
                                <motion.div
                                    className="absolute top-0 left-0 right-0 h-1 bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.8)] z-50"
                                    animate={{ top: ["0%", "100%"] }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                />
                            )}

                            {/* Card Header */}
                            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                                <div className="flex items-center gap-3">
                                    <div className={cn("w-8 h-8 rounded flex items-center justify-center", activeAnalysis.bg, activeAnalysis.color)}>
                                        <activeAnalysis.icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="text-zinc-200 font-bold">{activeAnalysis.name} Payload</div>
                                        <div className="text-[10px] text-zinc-500 font-mono">{activeAnalysis.id}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-zinc-400 text-[10px] uppercase">Amount</div>
                                    <div className="text-zinc-200 font-mono font-bold">${activeAnalysis.amount}</div>
                                </div>
                            </div>

                            {/* Autopsy Split View */}
                            <div className="grid grid-cols-2 divide-x divide-zinc-800 bg-[#0a0a0b] h-64">
                                {/* Left: Platform Data */}
                                <div className="p-4 font-mono text-[10px] text-zinc-400 overflow-hidden relative">
                                    <div className="text-blue-500 mb-2 font-bold flex items-center gap-1">
                                        <FileJson className="w-3 h-3" /> PLATFORM_DATA
                                    </div>
                                    <pre className="opacity-70">
                                        {`{
  "id": "${activeAnalysis.id}",
  "source": "${activeAnalysis.name}",
  "amount_gross": ${activeAnalysis.amount},
  "currency": "USD",
  "status": "paid",
  "payout_date": "${new Date().toISOString().split('T')[0]}"
}`}
                                    </pre>
                                </div>

                                {/* Right: Bank Data */}
                                <div className="p-4 font-mono text-[10px] text-zinc-400 overflow-hidden relative">
                                     <div className="text-emerald-500 mb-2 font-bold flex items-center gap-1">
                                        <Database className="w-3 h-3" /> BANK_DEPOSIT
                                    </div>
                                    {analyzingStage === 'scanning' ? (
                                        <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-2">
                                            <div className="w-4 h-4 border-2 border-zinc-600 border-t-transparent rounded-full animate-spin"></div>
                                            fetching...
                                        </div>
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                        >
                                            <pre className="opacity-70 text-zinc-300">
                                        {`{
  "trace_id": "BK_${activeAnalysis.id.split('_')[1]}",
  "amount": ${activeAnalysis.isAnomaly ? (parseFloat(activeAnalysis.amount) * 0.95).toFixed(2) : activeAnalysis.amount},
  "currency": "USD",
  "val_date": "${new Date().toISOString().split('T')[0]}"
}`}
                                            </pre>

                                            {/* Discrepancy Highlight */}
                                            {activeAnalysis.isAnomaly && analyzingStage !== 'idle' && (
                                                <motion.div
                                                    initial={{ scaleX: 0 }}
                                                    animate={{ scaleX: 1 }}
                                                    className="absolute top-20 left-4 right-4 h-6 bg-red-500/20 border border-red-500/50 rounded flex items-center px-2 origin-left"
                                                >
                                                    <span className="text-red-400 font-bold ml-auto">
                                                        Diff: -${(parseFloat(activeAnalysis.amount) * 0.05).toFixed(2)}
                                                    </span>
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            {/* Status Footer */}
                            <div className={cn(
                                "h-12 flex items-center justify-center gap-2 font-bold text-sm transition-colors duration-500",
                                analyzingStage === 'resolved'
                                    ? (activeAnalysis.isAnomaly ? "bg-red-500/10 text-red-500 border-t border-red-500/20" : "bg-emerald-500/10 text-emerald-500 border-t border-emerald-500/20")
                                    : "bg-zinc-900 border-t border-zinc-800 text-zinc-500"
                            )}>
                                {analyzingStage === 'scanning' && "ANALYZING PAYLOAD..."}
                                {analyzingStage === 'diffing' && "COMPARING LEDGERS..."}
                                {analyzingStage === 'resolved' && (
                                    activeAnalysis.isAnomaly ? (
                                        <>
                                            <AlertCircle className="w-4 h-4" /> DISCREPANCY DETECTED
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-4 h-4" /> RECONCILIATION COMPLETE
                                        </>
                                    )
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>

        {/* RIGHT COLUMN: BANK FEED */}
        <div className="w-64 border-l border-zinc-800 bg-[#0a0a0b] flex flex-col relative z-10">
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
                            className="bg-zinc-900/50 border border-zinc-800 rounded p-3 flex flex-col gap-1 mb-3"
                        >
                            <div className="flex justify-between items-center">
                                <span className="text-zinc-400 text-[10px]">{deposit.bank}</span>
                                <span className="text-emerald-500 text-[10px]">VERIFIED</span>
                            </div>
                            <div className="text-zinc-200 font-mono font-medium">${deposit.amount}</div>
                            <div className="text-zinc-600 text-[10px]">{deposit.ref}</div>
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
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
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
