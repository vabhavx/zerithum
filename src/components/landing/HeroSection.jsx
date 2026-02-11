import React from 'react';
import { ContainerScroll } from '../ui/container-scroll-animation';
import { Button } from '../ui/button';
import { CheckCircle2, ShieldCheck, FileText, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  const scrollToProduct = () => {
    const productSection = document.getElementById('product');
    if (productSection) {
      productSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative z-10">
      <ContainerScroll
        titleComponent={
          <div className="flex flex-col items-center justify-center space-y-8 mb-10">
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-white tracking-tight leading-[1.1] text-center max-w-4xl">
              Reconcile creator payouts <br /> to bank deposits.
            </h1>

            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl text-center leading-relaxed">
              Connect your revenue platforms. Zerithum matches platform reported earnings to bank deposits, flags discrepancies with reason codes, and stores an audit trail you can export to your accountant.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full">
              <Button
                onClick={scrollToProduct}
                size="lg"
                className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 font-medium px-8 h-12 rounded-full text-base transition-all"
              >
                View demo reconciliation
              </Button>
              <Link to="/Signup">
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-transparent border-zinc-700 text-zinc-300 hover:text-white hover:bg-white/10 font-medium px-8 h-12 rounded-full text-base"
                >
                  Create account
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-4 md:gap-8 mt-8 text-xs md:text-sm text-zinc-500 font-mono uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-500/80" />
                <span>Read-only OAuth</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500/80" />
                <span>Bank via Plaid</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500/80" />
                <span>Audit Trail</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500/80" />
                <span>Tax Ready</span>
              </div>
            </div>
          </div>
        }
      >
        <div className="flex flex-col h-full w-full bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden font-sans text-sm">
          {/* Mock Console Header */}
          <div className="h-10 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
            </div>
            <div className="text-xs text-zinc-500 font-mono">ZERITHUM // RECONCILIATION_CONSOLE</div>
            <div className="w-16"></div>
          </div>

          {/* Mock Console Body */}
          <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto">
            {/* Left: Platform Reported */}
            <div className="bg-zinc-900/50 rounded-lg border border-zinc-800/50 p-4 flex flex-col gap-4">
              <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Platform Reported</div>
              <div className="flex items-center justify-between p-3 bg-zinc-900 rounded border border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center font-bold text-white text-xs">YT</div>
                  <div>
                    <div className="text-zinc-200 font-medium">YouTube Earnings</div>
                    <div className="text-xs text-zinc-500">Oct 01 - Oct 31</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-zinc-200 font-mono">USD 1,800.00</div>
                  <div className="text-xs text-emerald-500">Reported</div>
                </div>
              </div>
            </div>

            {/* Center: Match Status */}
            <div className="flex flex-col items-center justify-center gap-4 relative">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-900/10 to-transparent pointer-events-none"></div>

              <div className="flex flex-col items-center gap-2 z-10">
                <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-medium flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  Discrepancy Detected
                </div>
                <div className="text-2xl font-mono text-white font-bold tracking-tight">
                  -$150.00
                </div>
                <div className="text-xs text-zinc-500 text-center max-w-[140px]">
                  Reason: Platform fees / Payout hold
                </div>
              </div>

              {/* Connector Lines (CSS only for now) */}
              <div className="w-full h-[1px] bg-zinc-800 absolute top-1/2 -z-10"></div>
            </div>

            {/* Right: Bank Deposit */}
            <div className="bg-zinc-900/50 rounded-lg border border-zinc-800/50 p-4 flex flex-col gap-4">
              <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Bank Deposit</div>
              <div className="flex items-center justify-between p-3 bg-zinc-900 rounded border border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold text-white text-xs">CH</div>
                  <div>
                    <div className="text-zinc-200 font-medium">Chase Checking</div>
                    <div className="text-xs text-zinc-500">Nov 21</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-zinc-200 font-mono">USD 1,650.00</div>
                  <div className="text-xs text-blue-400">Received</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom: Audit Log */}
          <div className="h-32 bg-zinc-950 border-t border-zinc-800 p-4 font-mono text-xs overflow-hidden">
             <div className="text-zinc-600 mb-2 uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-3 h-3" /> Audit Log
             </div>
             <div className="space-y-2 text-zinc-400">
                <div className="flex gap-4 opacity-50">
                    <span className="text-zinc-600">2023-11-21 14:02:11</span>
                    <span>INGESTION_COMPLETE: YouTube payout id_88291</span>
                </div>
                <div className="flex gap-4 opacity-50">
                    <span className="text-zinc-600">2023-11-21 14:02:15</span>
                    <span>BANK_FEED_SYNC: Chase batch #9921</span>
                </div>
                <div className="flex gap-4 text-emerald-500/80">
                    <span className="text-zinc-600">2023-11-21 14:02:18</span>
                    <span>MATCH_EVENT: Confidence 0.92 | Reason: Fee Deduction (8.3%) | Flagged for review</span>
                </div>
             </div>
          </div>
        </div>
      </ContainerScroll>
    </div>
  );
};

export default HeroSection;
