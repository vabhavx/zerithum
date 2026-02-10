import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, CheckCircle2, AlertTriangle, FileText, Database } from 'lucide-react';
import { Card } from '@/components/ui/card';

const LOG_SEQUENCE = [
  { type: 'info', text: 'oauth.youtube connected, scope readonly', delay: 500 },
  { type: 'success', text: 'sync.youtube success, 42 tx ingested', delay: 800 },
  { type: 'success', text: 'plaid.sync success, 18 deposits ingested', delay: 600 },
  { type: 'process', text: 'reconcile.run started', delay: 400 },
  { type: 'match', text: 'match.suggested fee_window, conf 0.85', delay: 700, stat: 'review' },
  { type: 'match', text: 'match.auto exact, conf 0.99', delay: 300, stat: 'auto' },
  { type: 'match', text: 'match.auto exact, conf 0.99', delay: 200, stat: 'auto' },
  { type: 'match', text: 'match.auto exact, conf 0.99', delay: 200, stat: 'auto' },
  { type: 'warn', text: 'discrepancy.flagged hold_period, conf 0.60', delay: 800, stat: 'review' },
  { type: 'audit', text: 'audit.append reconciliation_id 8f2a', delay: 500 },
];

export function TelemetryLedger() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ auto: 10, review: 2, unmatched: 1 });
  const logEndRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    let currentIndex = 0;

    const runSequence = async () => {
      while (mounted) {
        if (currentIndex >= LOG_SEQUENCE.length) {
          await new Promise(r => setTimeout(r, 3000)); // Pause at end
          if (!mounted) break;
          setLogs([]); // Clear logs
          setStats({ auto: 10, review: 2, unmatched: 1 }); // Reset stats slightly
          currentIndex = 0;
          continue;
        }

        const item = LOG_SEQUENCE[currentIndex];
        await new Promise(r => setTimeout(r, item.delay));
        if (!mounted) break;

        setLogs(prev => [...prev.slice(-7), {
            ...item,
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString('en-US', {hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit"})
        }]); // Keep last 8 logs

        if (item.stat === 'auto') {
            setStats(s => ({ ...s, auto: s.auto + 1 }));
        } else if (item.stat === 'review') {
            setStats(s => ({ ...s, review: s.review + 1 }));
        }

        currentIndex++;
      }
    };

    runSequence();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="w-full py-24 bg-neutral-900 border-t border-neutral-800">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

        {/* Left Column: Live Log */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-blue-500 animate-pulse" />
            <h3 className="text-xl font-mono text-white font-semibold">System Telemetry</h3>
          </div>

          <div className="bg-black border border-neutral-800 rounded-lg p-4 h-[400px] overflow-hidden relative font-mono text-sm shadow-inner">
             <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/20 pointer-events-none z-10" />
             <div className="space-y-2 flex flex-col justify-end min-h-full">
                <AnimatePresence initial={false}>
                  {logs.map((log) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center gap-2 ${
                        log.type === 'error' ? 'text-red-400' :
                        log.type === 'warn' ? 'text-yellow-400' :
                        log.type === 'success' ? 'text-emerald-400' :
                        log.type === 'audit' ? 'text-purple-400' :
                        'text-blue-300'
                      }`}
                    >
                      <span className="text-neutral-600 text-xs">
                         {log.timestamp}
                      </span>
                      <span>{log.text}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={logEndRef} />
             </div>
          </div>
        </div>

        {/* Right Column: Ledger Stats */}
        <div className="space-y-8">
           <div className="space-y-6">
              <h3 className="text-xl font-mono text-white font-semibold flex items-center gap-2">
                 <Database className="w-5 h-5 text-neutral-400" />
                 Ledger Status
              </h3>

              <div className="grid grid-cols-1 gap-4">
                 {/* Stat 1: Auto Reconciled */}
                 <Card className="bg-neutral-800/50 border-neutral-700 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                       <div>
                          <div className="text-neutral-400 text-sm">Auto Reconciled</div>
                          <div className="text-3xl font-mono font-bold text-white">{stats.auto}</div>
                       </div>
                    </div>
                    <div className="text-emerald-500/20">
                       <Activity className="w-12 h-12" />
                    </div>
                 </Card>

                 {/* Stat 2: Needs Review */}
                 <Card className="bg-neutral-800/50 border-neutral-700 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <AlertTriangle className="w-8 h-8 text-yellow-500" />
                       <div>
                          <div className="text-neutral-400 text-sm">Needs Review</div>
                          <div className="text-3xl font-mono font-bold text-white">{stats.review}</div>
                       </div>
                    </div>
                 </Card>

                 {/* Stat 3: Unmatched */}
                 <Card className="bg-neutral-800/50 border-neutral-700 p-6 flex items-center justify-between opacity-50">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full border-2 border-dashed border-neutral-600 flex items-center justify-center text-neutral-500">?</div>
                       <div>
                          <div className="text-neutral-400 text-sm">Unmatched</div>
                          <div className="text-3xl font-mono font-bold text-neutral-300">{stats.unmatched}</div>
                       </div>
                    </div>
                 </Card>
              </div>
           </div>

           {/* Differentiator Callout */}
           <div className="bg-blue-950/30 border border-blue-900/50 rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                 <FileText className="w-24 h-24 text-blue-400" />
              </div>
              <h4 className="text-blue-400 font-bold mb-2 flex items-center gap-2">
                 <FileText className="w-4 h-4" />
                 Immutable Audit Trail
              </h4>
              <p className="text-blue-200/70 text-sm leading-relaxed max-w-md">
                 Every match decision is cryptographically signed and appended to the ledger with a confidence score and reason code. History cannot be rewritten.
              </p>
           </div>
        </div>

      </div>
    </div>
  );
}
