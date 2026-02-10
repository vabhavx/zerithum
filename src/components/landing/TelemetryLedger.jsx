import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Database } from 'lucide-react';
import DatabaseWithRestApi from '@/components/ui/database-with-rest-api';

const LOG_SEQUENCE = [
  { type: 'info', text: 'ingest.youtube: fetch_revenue_api success', delay: 500 },
  { type: 'info', text: 'ingest.bank: fetch_plaid_transactions success', delay: 600 },
  { type: 'warn', text: 'match.init: discrepancy_detected (id: tx_8f2a)', delay: 400 },
  { type: 'process', text: 'analyze.gap: platform_amount=USD 1800.00 bank_amount=USD 1650.00', delay: 700 },
  { type: 'match', text: 'resolve.auto: fee_deduction_pattern_match (conf: 0.98)', delay: 500, stat: 'auto' },
  { type: 'audit', text: 'audit.write: ledger_entry_created hash:0x7b...9c', delay: 600 },
  { type: 'success', text: 'sync.complete: reconciliation_finalized', delay: 800 },
  { type: 'info', text: 'ingest.stripe: webhook_received charge.succeeded', delay: 400 },
  { type: 'match', text: 'match.exact: bank_deposit_found (conf: 1.00)', delay: 300, stat: 'auto' },
  { type: 'audit', text: 'audit.write: ledger_entry_created hash:0x3a...2f', delay: 300 },
];

export function TelemetryLedger() {
  const [logs, setLogs] = useState([]);
  const logEndRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    let currentIndex = 0;

    const runSequence = async () => {
      while (mounted) {
        if (currentIndex >= LOG_SEQUENCE.length) {
          await new Promise(r => setTimeout(r, 2000));
          if (!mounted) break;
          setLogs([]);
          currentIndex = 0;
          continue;
        }

        const item = LOG_SEQUENCE[currentIndex];
        await new Promise(r => setTimeout(r, item.delay));
        if (!mounted) break;

        setLogs(prev => [...prev.slice(-8), {
            ...item,
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString('en-US', {hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit", fractionalSecondDigits: 3})
        }]);

        currentIndex++;
      }
    };

    runSequence();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="w-full py-24 bg-neutral-900 border-t border-neutral-800 relative overflow-hidden">

      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
         <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-[128px]" />
         <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-[128px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">

        {/* Left Column: Visual Flow */}
        <div className="flex flex-col items-center justify-center">
            <div className="mb-8 text-center">
                <h3 className="text-2xl font-bold text-white mb-4 font-mono">Real-Time Ingestion</h3>
                <p className="text-neutral-400 text-sm max-w-md leading-relaxed">
                    Platform pulls both sides of the equation: platform APIs report what they claim happened, Plaid reports what the bank actually received, and your reconciliation engine fuzzy matches them with confidence scoring.
                </p>
            </div>

            <DatabaseWithRestApi
                className="w-full max-w-[500px]"
                circleText="LEDGER"
                title="Zerithum Sync Engine"
                badgeTexts={{
                    first: "YOUTUBE",
                    second: "STRIPE",
                    third: "TIKTOK",
                    fourth: "BANK"
                }}
                buttonTexts={{
                    first: "Ingesting",
                    second: "Matching"
                }}
                lightColor="#10b981"
            />
        </div>

        {/* Right Column: Live Log & Context */}
        <div className="space-y-8">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
            <h3 className="text-xl font-mono text-white font-semibold tracking-tight">Live Telemetry</h3>
          </div>

          <div className="bg-black border border-neutral-800 rounded-xl p-6 h-[400px] overflow-hidden relative font-mono text-xs shadow-2xl">
             <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 pointer-events-none z-10" />
             <div className="space-y-3 flex flex-col justify-end min-h-full pb-4">
                <AnimatePresence initial={false}>
                  {logs.map((log) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-start gap-3 ${
                        log.type === 'error' ? 'text-red-400' :
                        log.type === 'warn' ? 'text-amber-400' :
                        log.type === 'success' ? 'text-emerald-400' :
                        log.type === 'audit' ? 'text-purple-400' :
                        'text-blue-300'
                      }`}
                    >
                      <span className="text-neutral-600 shrink-0 select-none">
                         {log.timestamp}
                      </span>
                      <span className="break-all">
                        <span className="opacity-50 mr-2">[{log.type.toUpperCase()}]</span>
                        {log.text}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={logEndRef} />
             </div>
          </div>

          <div className="bg-neutral-800/30 border border-neutral-700/30 rounded-lg p-4 flex items-start gap-4">
             <div className="mt-1">
                <Database className="w-5 h-5 text-neutral-400" />
             </div>
             <div>
                <h4 className="text-white font-semibold text-sm mb-1">Source of Truth</h4>
                <p className="text-neutral-400 text-xs leading-relaxed">
                   Bank deposits are the final authority. When platform reports conflict with bank reality, Zerithum prioritizes the cash event and flags the discrepancy for audit.
                </p>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
