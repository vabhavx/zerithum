import React from 'react';
import { Button } from '../ui/button';
import { Terminal, Activity, Server, ShieldCheck, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardPreview from './DashboardPreview';

const HeroSection = () => {
  const scrollToProduct = () => {
    const productSection = document.getElementById('product');
    if (productSection) {
      productSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative z-10 pt-20 pb-32 border-b border-zinc-200 bg-white overflow-hidden">
      {/* Background Grid - Technical Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent"></div>

      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">

          {/* Left Column: Command Interface */}
          <div className="space-y-8 relative z-30 pt-10">
            {/* System Status Pill */}
            <div className="inline-flex items-center gap-2 px-2 py-1 bg-zinc-50 border border-zinc-200 rounded text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              System Operational
              <span className="text-zinc-300">|</span>
              v4.2.0-stable
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-semibold text-zinc-900 tracking-tight leading-[1.1] font-sans">
                Revenue Operations <br />
                <span className="text-zinc-400">Control Plane.</span>
              </h1>
              <p className="text-sm md:text-base text-zinc-600 max-w-xl leading-relaxed font-mono">
                [SYSTEM_INIT]: Establishing secure uplink to 20+ revenue platforms.
                <br />
                [PROCESS]: reconciling_transactions...
                <br />
                <span className="text-zinc-500 mt-2 block">
                  Zerithum provides deterministic reconciliation between platform ingress and bank settlement. Immutable audit trails for tax compliance.
                </span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={scrollToProduct}
                className="bg-zinc-900 text-white hover:bg-zinc-800 h-10 px-6 rounded text-xs font-mono uppercase tracking-wider flex items-center gap-2"
              >
                <Terminal className="w-3 h-3" />
                Initialize Demo
              </Button>
              <Link to="/Signup">
                <Button
                  variant="outline"
                  className="bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 h-10 px-6 rounded text-xs font-mono uppercase tracking-wider"
                >
                  Create Account
                </Button>
              </Link>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-zinc-100 pt-8 mt-8">
               <div className="space-y-1">
                 <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 uppercase">
                   <Activity className="w-3 h-3" /> Uptime
                 </div>
                 <div className="text-lg font-mono font-medium text-zinc-900">99.99%</div>
               </div>
               <div className="space-y-1">
                 <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 uppercase">
                   <Server className="w-3 h-3" /> Latency
                 </div>
                 <div className="text-lg font-mono font-medium text-zinc-900">42ms</div>
               </div>
               <div className="space-y-1">
                 <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 uppercase">
                   <ShieldCheck className="w-3 h-3" /> Audited
                 </div>
                 <div className="text-lg font-mono font-medium text-zinc-900">SOC2</div>
               </div>
               <div className="space-y-1">
                 <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 uppercase">
                   <Cpu className="w-3 h-3" /> Processed
                 </div>
                 <div className="text-lg font-mono font-medium text-zinc-900">$2.4B+</div>
               </div>
            </div>
          </div>

          {/* Right Column: Visual Terminal */}
          <div className="relative w-full z-20">
            <div className="relative rounded bg-zinc-900 shadow-2xl border border-zinc-800 overflow-hidden transform hover:scale-[1.01] transition-transform duration-500 ease-out">
              {/* Terminal Header */}
              <div className="flex items-center justify-between px-4 py-2 bg-zinc-950 border-b border-zinc-800">
                 <div className="flex gap-1.5">
                   <div className="w-2.5 h-2.5 rounded-full bg-zinc-700"></div>
                   <div className="w-2.5 h-2.5 rounded-full bg-zinc-700"></div>
                   <div className="w-2.5 h-2.5 rounded-full bg-zinc-700"></div>
                 </div>
                 <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                   LIVE_FEED::US_EAST_1
                 </div>
              </div>

              {/* Terminal Content (Dashboard Preview) */}
              <div className="relative bg-zinc-900 min-h-[400px]">
                  <DashboardPreview />

                  {/* Overlay Vignette */}
                  <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.4)_100%)]"></div>

                  {/* Scan Line */}
                  <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,transparent_50%,rgba(16,185,129,0.02)_50%,rgba(16,185,129,0.05)_51%,transparent_51%)] bg-[size:100%_4px] animate-scanline"></div>
              </div>
            </div>

            {/* Reflection/Shadow */}
            <div className="absolute -bottom-12 left-4 right-4 h-12 bg-black/20 blur-xl rounded-[100%]"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
