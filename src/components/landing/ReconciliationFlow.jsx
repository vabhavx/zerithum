import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * ReconciliationFlow — A silent, looping animation that visualizes the core value of Zerithum.
 *
 * Left column:  Platform transactions appear one by one (source + amount)
 * Right column: Bank deposits appear
 * Center:       Animated match-lines form between paired items
 *
 * The animation runs in an infinite loop. No user interaction required.
 * Shows the product from the angle of "what happens to your money."
 */

// ── Data ────────────────────────────────────────────────────────────────────

const PLATFORM_EVENTS = [
  { id: 'p1', source: 'YouTube', amount: 4200, color: '#FF0000', date: 'Oct 12' },
  { id: 'p2', source: 'Stripe', amount: 8000, color: '#635BFF', date: 'Oct 14' },
  { id: 'p3', source: 'Patreon', amount: 2600, color: '#FF424D', date: 'Oct 15' },
  { id: 'p4', source: 'YouTube', amount: 7150, color: '#FF0000', date: 'Oct 18' },
  { id: 'p5', source: 'Stripe', amount: 3500, color: '#635BFF', date: 'Oct 20' },
  { id: 'p6', source: 'Twitch', amount: 1400, color: '#9146FF', date: 'Oct 22' },
];

const BANK_DEPOSITS = [
  { id: 'b1', ref: 'ACH-7291', amount: 4200, date: 'Oct 14' },
  { id: 'b2', ref: 'WIRE-4482', amount: 8000, date: 'Oct 16' },
  { id: 'b3', ref: 'ACH-7305', amount: 2600, date: 'Oct 17' },
  { id: 'b4', ref: 'ACH-7318', amount: 7150, date: 'Oct 20' },
  { id: 'b5', ref: 'WIRE-4501', amount: 3500, date: 'Oct 22' },
  { id: 'b6', ref: 'ACH-7340', amount: 1380, date: 'Oct 24' }, // Discrepancy: 1400 vs 1380
];

const MATCHES = [
  { platformIdx: 0, bankIdx: 0, status: 'matched' },
  { platformIdx: 1, bankIdx: 1, status: 'matched' },
  { platformIdx: 2, bankIdx: 2, status: 'matched' },
  { platformIdx: 3, bankIdx: 3, status: 'matched' },
  { platformIdx: 4, bankIdx: 4, status: 'matched' },
  { platformIdx: 5, bankIdx: 5, status: 'discrepancy' }, // $20 difference
];

// ── Formatting ──────────────────────────────────────────────────────────────

const fmt = (cents) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents);

// ── SVG Match Line ──────────────────────────────────────────────────────────

function MatchLine({ x1, y1, x2, y2, status, delay }) {
  const isDisc = status === 'discrepancy';
  const color = isDisc ? '#DC2626' : '#059669';

  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay }}
    >
      {/* Glow filter */}
      <defs>
        <filter id={`glow-${status}-${delay}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* The line */}
      <motion.line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray="4 3"
        filter={`url(#glow-${status}-${delay})`}
        initial={{ pathLength: 0, opacity: 0.3 }}
        animate={{ pathLength: 1, opacity: 0.7 }}
        transition={{ duration: 0.8, delay, ease: 'easeOut' }}
      />

      {/* Midpoint indicator */}
      <motion.circle
        cx={(x1 + x2) / 2}
        cy={(y1 + y2) / 2}
        r={isDisc ? 5 : 4}
        fill={isDisc ? '#450A0A' : '#064E3B'}
        stroke={color}
        strokeWidth={1.5}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: delay + 0.6 }}
      />
      <motion.text
        x={(x1 + x2) / 2}
        y={(y1 + y2) / 2 + 0.5}
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        fontSize="6"
        fontFamily="monospace"
        fontWeight="700"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: delay + 0.7 }}
      >
        {isDisc ? '!' : '\u2713'}
      </motion.text>
    </motion.g>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function ReconciliationFlow() {
  const [phase, setPhase] = useState('idle'); // idle | platforms | banks | matching | hold
  const [visiblePlatforms, setVisiblePlatforms] = useState(0);
  const [visibleBanks, setVisibleBanks] = useState(0);
  const [visibleMatches, setVisibleMatches] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [discrepancyCount, setDiscrepancyCount] = useState(0);
  const mountedRef = useRef(true);

  const sleep = useCallback((ms) => new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    return () => clearTimeout(timer);
  }), []);

  useEffect(() => {
    mountedRef.current = true;

    const run = async () => {
      while (mountedRef.current) {
        // Reset
        setPhase('idle');
        setVisiblePlatforms(0);
        setVisibleBanks(0);
        setVisibleMatches(0);
        setMatchedCount(0);
        setDiscrepancyCount(0);
        await sleep(600);
        if (!mountedRef.current) return;

        // Phase 1: Platform events appear
        setPhase('platforms');
        for (let i = 1; i <= PLATFORM_EVENTS.length; i++) {
          if (!mountedRef.current) return;
          setVisiblePlatforms(i);
          await sleep(280);
        }
        await sleep(400);
        if (!mountedRef.current) return;

        // Phase 2: Bank deposits appear
        setPhase('banks');
        for (let i = 1; i <= BANK_DEPOSITS.length; i++) {
          if (!mountedRef.current) return;
          setVisibleBanks(i);
          await sleep(280);
        }
        await sleep(500);
        if (!mountedRef.current) return;

        // Phase 3: Match lines form
        setPhase('matching');
        for (let i = 1; i <= MATCHES.length; i++) {
          if (!mountedRef.current) return;
          setVisibleMatches(i);
          const match = MATCHES[i - 1];
          if (match.status === 'matched') {
            setMatchedCount((c) => c + 1);
          } else {
            setDiscrepancyCount((c) => c + 1);
          }
          await sleep(500);
        }
        await sleep(300);
        if (!mountedRef.current) return;

        // Phase 4: Hold result
        setPhase('hold');
        await sleep(4000);
      }
    };

    run();
    return () => { mountedRef.current = false; };
  }, [sleep]);

  // Row height for SVG line calculations
  const ROW_H = 52;
  const ROW_OFFSET = 14; // top offset to center on first row

  return (
    <section className="py-28 bg-zinc-950 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 md:px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-white tracking-tight mb-4">
            Every dollar, accounted for.
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto text-base md:text-lg">
            Platform payouts on the left. Bank deposits on the right. Zerithum draws the line between them.
          </p>
        </div>

        {/* The Animation Container */}
        <div className="relative bg-[#060608] border border-zinc-800/80 rounded-xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.5)]">
          {/* Top bar */}
          <div className="h-10 bg-[#0a0a0c] border-b border-zinc-800/60 flex items-center justify-between px-5">
            <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
              <span>
                Matched: <span className={cn("transition-colors duration-300", matchedCount > 0 ? "text-emerald-500" : "text-zinc-700")}>{matchedCount}</span>
              </span>
              <span>
                Flagged: <span className={cn("transition-colors duration-300", discrepancyCount > 0 ? "text-red-500" : "text-zinc-700")}>{discrepancyCount}</span>
              </span>
            </div>
          </div>

          {/* Main grid — 3 columns: Platforms | Match Lines (SVG) | Bank */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_100px_1fr] min-h-[420px] relative">

            {/* LEFT: Platform Events */}
            <div className="border-b md:border-b-0 md:border-r border-zinc-800/40 p-5">
              <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-4 flex items-center justify-between">
                <span>Platform Revenue</span>
                <span className="text-zinc-700">{visiblePlatforms}/{PLATFORM_EVENTS.length}</span>
              </div>
              <div className="space-y-1">
                <AnimatePresence>
                  {PLATFORM_EVENTS.slice(0, visiblePlatforms).map((evt, i) => {
                    const isMatched = visibleMatches > i;
                    const match = MATCHES[i];
                    const isDisc = isMatched && match?.status === 'discrepancy';
                    return (
                      <motion.div
                        key={evt.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className={cn(
                          "flex items-center justify-between px-3 py-2.5 rounded-md border transition-all duration-500",
                          isMatched
                            ? isDisc
                              ? "bg-red-950/20 border-red-900/30"
                              : "bg-emerald-950/15 border-emerald-900/20"
                            : "bg-white/[0.02] border-zinc-800/50"
                        )}
                        data-row={`platform-${i}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: evt.color }}
                          />
                          <span className="text-[11px] font-mono text-zinc-300 truncate">{evt.source}</span>
                          <span className="text-[10px] font-mono text-zinc-700 hidden sm:inline">{evt.date}</span>
                        </div>
                        <span className={cn(
                          "text-[12px] font-mono font-medium flex-shrink-0 tabular-nums transition-colors duration-500",
                          isMatched
                            ? isDisc ? "text-red-400" : "text-emerald-400"
                            : "text-zinc-300"
                        )}>
                          {fmt(evt.amount)}
                        </span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>

            {/* CENTER: SVG Match Lines (desktop only) */}
            <div className="hidden md:block relative">
              <svg
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="none"
                viewBox="0 0 100 420"
              >
                {MATCHES.slice(0, visibleMatches).map((match, i) => {
                  const y1 = ROW_OFFSET + match.platformIdx * ROW_H + 36;
                  const y2 = ROW_OFFSET + match.bankIdx * ROW_H + 36;
                  return (
                    <MatchLine
                      key={`match-${i}`}
                      x1={0}
                      y1={y1}
                      x2={100}
                      y2={y2}
                      status={match.status}
                      delay={0}
                    />
                  );
                })}
              </svg>
            </div>

            {/* RIGHT: Bank Deposits */}
            <div className="border-t md:border-t-0 md:border-l border-zinc-800/40 p-5">
              <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-4 flex items-center justify-between">
                <span>Bank Deposits</span>
                <span className="text-zinc-700">{visibleBanks}/{BANK_DEPOSITS.length}</span>
              </div>
              <div className="space-y-1">
                <AnimatePresence>
                  {BANK_DEPOSITS.slice(0, visibleBanks).map((dep, i) => {
                    const isMatched = visibleMatches > i;
                    const match = MATCHES[i];
                    const isDisc = isMatched && match?.status === 'discrepancy';
                    return (
                      <motion.div
                        key={dep.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className={cn(
                          "flex items-center justify-between px-3 py-2.5 rounded-md border transition-all duration-500",
                          isMatched
                            ? isDisc
                              ? "bg-red-950/20 border-red-900/30"
                              : "bg-emerald-950/15 border-emerald-900/20"
                            : "bg-white/[0.02] border-zinc-800/50"
                        )}
                        data-row={`bank-${i}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-[11px] font-mono text-zinc-400 truncate">{dep.ref}</span>
                          <span className="text-[10px] font-mono text-zinc-700 hidden sm:inline">{dep.date}</span>
                        </div>
                        <span className={cn(
                          "text-[12px] font-mono font-medium flex-shrink-0 tabular-nums transition-colors duration-500",
                          isMatched
                            ? isDisc ? "text-red-400" : "text-emerald-400"
                            : "text-zinc-300"
                        )}>
                          {fmt(dep.amount)}
                        </span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>

            {/* Mobile: match indicators (replaces SVG lines) */}
            <div className="md:hidden border-t border-zinc-800/40 p-4">
              <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-3">Match Results</div>
              <div className="flex flex-wrap gap-2">
                {MATCHES.slice(0, visibleMatches).map((match, i) => (
                  <motion.div
                    key={`mobile-match-${i}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono border",
                      match.status === 'matched'
                        ? "bg-emerald-950/30 border-emerald-900/30 text-emerald-400"
                        : "bg-red-950/30 border-red-900/30 text-red-400"
                    )}
                  >
                    <span>{PLATFORM_EVENTS[match.platformIdx].source}</span>
                    <span className="text-zinc-700">{'\u2192'}</span>
                    <span>{BANK_DEPOSITS[match.bankIdx].ref}</span>
                    <span className="ml-1 font-bold">
                      {match.status === 'matched' ? '\u2713' : '\u2717'}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom status bar */}
          <div className="h-10 bg-[#0a0a0c] border-t border-zinc-800/60 flex items-center justify-between px-5">
            <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
              <AnimatePresence mode="wait">
                <motion.span
                  key={phase}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    phase === 'hold' ? 'text-emerald-500' :
                    phase === 'matching' ? 'text-zinc-300' :
                    'text-zinc-500'
                  )}
                >
                  {phase === 'idle' && 'Initializing...'}
                  {phase === 'platforms' && 'Ingesting platform data...'}
                  {phase === 'banks' && 'Reading bank feed...'}
                  {phase === 'matching' && 'Running reconciliation...'}
                  {phase === 'hold' && 'Reconciliation complete'}
                </motion.span>
              </AnimatePresence>
            </div>
            {phase === 'hold' && discrepancyCount > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] font-mono text-red-500 uppercase tracking-widest flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {discrepancyCount} discrepancy flagged — ${Math.abs(PLATFORM_EVENTS[5].amount - BANK_DEPOSITS[5].amount)} variance
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
