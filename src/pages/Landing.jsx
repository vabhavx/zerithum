import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Activity,
  AlertTriangle,
  FileText,
  Database,
  Search,
  Lock,
  Globe,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { DashboardPreview } from "@/components/landing/DashboardPreview";
import { WedgeReconciliation } from "@/components/landing/WedgeReconciliation";
import { TelemetryLedger } from "@/components/landing/TelemetryLedger";
import DemoOne from "@/components/ui/demo";
import { cn } from "@/lib/utils";

// --- Animation Components ---

// 1. Data Ingestion Animation (Platforms -> Dashboard)
const DataIngestionAnimation = () => {
    const platforms = [
        { name: "YouTube", icon: "video", color: "text-red-500" },
        { name: "Patreon", icon: "users", color: "text-orange-500" },
        { name: "Stripe", icon: "credit-card", color: "text-indigo-500" },
        { name: "TikTok", icon: "music", color: "text-black dark:text-white" },
        { name: "Twitch", icon: "tv", color: "text-purple-500" }
    ];

    return (
        <div className="relative h-[400px] w-full bg-black/5 border border-white/10 overflow-hidden flex items-center justify-center rounded-none">
            {/* Central Hub (Zerithum) */}
            <div className="z-20 w-32 h-32 bg-black border border-white/20 flex flex-col items-center justify-center relative">
                 <div className="absolute inset-0 bg-white/5 animate-pulse" />
                 <Database className="w-8 h-8 text-white mb-2" />
                 <span className="text-[10px] font-mono uppercase tracking-widest text-white">Ingest</span>
            </div>

            {/* Orbiting Platforms */}
            {platforms.map((platform, i) => {
                const angle = (i / platforms.length) * 2 * Math.PI;
                const radius = 140;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;

                return (
                    <motion.div
                        key={platform.name}
                        className="absolute z-10 flex flex-col items-center"
                        initial={{ x, y, opacity: 0 }}
                        animate={{
                            x,
                            y,
                            opacity: 1,
                            scale: [1, 1.1, 1]
                        }}
                        transition={{
                            duration: 0.5,
                            delay: i * 0.2,
                            scale: { repeat: Infinity, duration: 2 }
                        }}
                    >
                        <div className={cn("w-12 h-12 bg-black border border-white/10 flex items-center justify-center rounded-full mb-2", platform.color)}>
                            {/* Simple icon representation */}
                            <div className="w-6 h-6 bg-current opacity-20 rounded-sm" />
                        </div>
                        <div className="absolute top-1/2 left-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-1/2 -translate-y-1/2 rotate-[calc(angle*180/PI)]"
                             style={{
                                 width: radius,
                                 transformOrigin: "center right",
                                 transform: `translate(-50%, -50%) rotate(${angle + Math.PI}rad) translateX(50%)`
                             }}
                        >
                            <motion.div
                                className="w-2 h-1 bg-white absolute right-0"
                                animate={{ x: [-radius, 0] }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: "linear", delay: i * 0.3 }}
                            />
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

// 2. Real-time Autopsy Animation
const AutopsyAnimation = () => {
    const [scanLine, setScanLine] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setScanLine(prev => (prev + 1) % 100);
        }, 20);
        return () => clearInterval(interval);
    }, []);

    const transactions = [
        { id: "TX-8921", platform: "Stripe", amount: 450.00, status: "match" },
        { id: "TX-8922", platform: "Patreon", amount: 120.00, status: "mismatch" },
        { id: "TX-8923", platform: "YouTube", amount: 890.50, status: "match" },
        { id: "TX-8924", platform: "Twitch", amount: 55.00, status: "pending" },
    ];

    return (
         <div className="relative h-[400px] w-full bg-black border border-white/10 overflow-hidden flex flex-col p-8 font-mono text-xs rounded-none">
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/50" style={{ top: `${scanLine}%`, boxShadow: "0 0 10px #10b981" }} />

            <div className="flex justify-between border-b border-white/10 pb-2 mb-4">
                <span className="text-white/50">AUTOPSY_DAEMON_V2</span>
                <span className="text-emerald-500 animate-pulse">LIVE_SCANNING</span>
            </div>

            <div className="space-y-2 relative z-10">
                {transactions.map((tx, i) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 border border-white/5 bg-white/5">
                        <span className="text-white/70">{tx.id}</span>
                        <span className="text-white">{tx.platform}</span>
                        <span className="text-white">${tx.amount.toFixed(2)}</span>
                        <div className="flex items-center gap-2">
                            {tx.status === "match" && <span className="text-emerald-500 flex items-center"><CheckCircle2 className="w-3 h-3 mr-1"/> MATCH</span>}
                            {tx.status === "mismatch" && <span className="text-red-500 flex items-center animate-pulse"><AlertTriangle className="w-3 h-3 mr-1"/> VARIANCE</span>}
                            {tx.status === "pending" && <span className="text-amber-500 flex items-center"><Activity className="w-3 h-3 mr-1"/> ANALYZING</span>}
                        </div>
                    </div>
                ))}
            </div>

            {/* Discrepancy Alert Overlay */}
            <motion.div
                className="absolute bottom-4 right-4 bg-red-900/20 border border-red-500/50 p-4 w-64 backdrop-blur-md"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: [0, 1, 1, 0], x: [20, 0, 0, 20] }}
                transition={{ repeat: Infinity, duration: 4, repeatDelay: 2 }}
            >
                <div className="flex items-center gap-2 text-red-500 mb-1">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-bold">ANOMALY DETECTED</span>
                </div>
                <div className="text-red-200/80 text-[10px]">
                    Platform reported $125.00 but Bank received $120.00. Fee variance exceeding threshold.
                </div>
            </motion.div>
         </div>
    );
};


// 3. Global Reconciliation Map (Abstract)
const GlobalMapAnimation = () => {
    return (
        <div className="relative h-[400px] w-full bg-black/20 border border-white/10 overflow-hidden flex items-center justify-center rounded-none">
             <div className="absolute inset-0 grid grid-cols-[repeat(20,minmax(0,1fr))] grid-rows-[repeat(20,minmax(0,1fr))] opacity-10">
                {Array.from({ length: 400 }).map((_, i) => (
                    <div key={i} className="border border-white/20" />
                ))}
            </div>

            {/* Nodes */}
            {Array.from({ length: 8 }).map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-emerald-500 rounded-full"
                    style={{
                        left: `${20 + Math.random() * 60}%`,
                        top: `${20 + Math.random() * 60}%`
                    }}
                    animate={{
                        scale: [1, 2, 1],
                        opacity: [0.5, 1, 0.5],
                        boxShadow: ["0 0 0px #10b981", "0 0 20px #10b981", "0 0 0px #10b981"]
                    }}
                    transition={{
                        duration: 2 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 2
                    }}
                />
            ))}

            {/* Connecting Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
                <motion.path
                    d="M100,200 Q200,100 300,200 T500,200"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
            </svg>

            <div className="absolute bottom-4 left-4 font-mono text-xs text-emerald-500/80 bg-black/50 px-2 py-1 border border-emerald-500/20">
                GLOBAL_SYNC_STATUS: ACTIVE
            </div>
        </div>
    );
};


export default function Landing() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  return (
    <div ref={containerRef} className="bg-black text-foreground min-h-screen selection:bg-white/20">

      {/* 1. Hero Section with Shader Background */}
      <section className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden border-b border-white/10">
         {/* Background */}
         <div className="absolute inset-0 z-0 opacity-40">
             <DemoOne />
         </div>

         <div className="z-10 text-center space-y-8 max-w-4xl px-4 mt-20">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-xs font-mono text-white/70 tracking-widest uppercase">System Operational</span>
             </div>

             <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-medium tracking-tight text-white leading-[0.9]">
                The Source of <br/>
                <span className="italic font-light opacity-80">Financial Truth</span>
             </h1>

             <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto font-light leading-relaxed">
                Platforms lie. Banks don't. <br/>
                Zerithum reconciles creator earnings against actual cash deposits, exposing variances and automating the audit trail.
             </p>

             <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                 <Link to="/auth/signup">
                    <Button size="lg" className="h-14 px-8 text-base bg-white text-black hover:bg-white/90 rounded-none font-mono uppercase tracking-wider min-w-[200px]">
                        Start Integration
                    </Button>
                 </Link>
                 <Link to="/auth/login">
                    <Button size="lg" variant="outline" className="h-14 px-8 text-base border-white/20 text-white hover:bg-white/5 rounded-none font-mono uppercase tracking-wider min-w-[200px]">
                        System Login
                    </Button>
                 </Link>
             </div>
         </div>

         {/* Scroll Indicator */}
         <motion.div
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50"
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
         >
             <div className="w-[1px] h-12 bg-gradient-to-b from-transparent via-white to-transparent" />
             <span className="text-[10px] font-mono uppercase tracking-widest">Scroll to Audit</span>
         </motion.div>
      </section>

      {/* 2. The Problem (The Wedge) */}
      <section className="py-32 border-b border-white/10 bg-black relative">
          <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                  <h2 className="text-4xl md:text-5xl font-serif leading-tight">
                      The Reconciliation <span className="text-white/40">Gap</span>
                  </h2>
                  <div className="space-y-6 text-lg text-white/60 font-light">
                      <p>
                          Most dashboards report what a platform <em>says</em> you earned.
                          Zerithum verifies what you actually received.
                      </p>
                      <p>
                          Stripe fires webhooks for charges that later get refunded.
                          YouTube reports gross revenue before currency conversion fees.
                          Patreon holds funds during processing windows.
                      </p>
                      <p className="text-white">
                          Without reconciliation, you are flying blind on cash flow.
                      </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                      {[
                          { label: "Platform Report", val: "$1,800.00", color: "text-white/40" },
                          { label: "Bank Deposit", val: "$1,650.00", color: "text-white" }
                      ].map((item, i) => (
                          <div key={i} className="border border-white/10 p-4 bg-white/5">
                              <div className="text-xs font-mono uppercase text-white/50 mb-1">{item.label}</div>
                              <div className={cn("text-2xl font-mono", item.color)}>{item.val}</div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Animation 1: Data Ingestion */}
              <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-500 opacity-20 blur-lg" />
                  <DataIngestionAnimation />
                  <div className="mt-4 flex justify-between text-xs font-mono text-white/40">
                      <span>FIG 01. MULTI-SOURCE INGESTION</span>
                      <span>STATUS: ONLINE</span>
                  </div>
              </div>
          </div>
      </section>

      {/* 3. The Solution (Autopsy) */}
      <section className="py-32 border-b border-white/10 bg-zinc-950 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

          <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-16 items-center lg:flex-row-reverse">
               {/* Animation 2: Autopsy */}
               <div className="order-2 lg:order-1 relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-orange-500 opacity-10 blur-lg" />
                  <AutopsyAnimation />
                  <div className="mt-4 flex justify-between text-xs font-mono text-white/40">
                      <span>FIG 02. ANOMALY DETECTION ENGINE</span>
                      <span>LATENCY: 12ms</span>
                  </div>
              </div>

              <div className="order-1 lg:order-2 space-y-8">
                  <h2 className="text-4xl md:text-5xl font-serif leading-tight">
                      Forensic <span className="text-white/40">Autopsy</span>
                  </h2>
                  <p className="text-lg text-white/60 font-light">
                      Every transaction is an investigation. We match platform IDs to bank statement descriptors, flagging holds, fees, and currency slippage instantly.
                  </p>

                  <ul className="space-y-4">
                      {[
                          "Immutable Audit Trail",
                          "Fee & Tax Categorization",
                          "Currency Conversion Tracking",
                          "Dispute & Refund Monitoring"
                      ].map((feature, i) => (
                          <li key={i} className="flex items-center gap-3 text-white/80">
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                              <span className="font-mono text-sm uppercase tracking-wider">{feature}</span>
                          </li>
                      ))}
                  </ul>
              </div>
          </div>
      </section>

      {/* 4. Global Infrastructure */}
      <section className="py-32 border-b border-white/10 bg-black relative">
          <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                  <h2 className="text-4xl md:text-5xl font-serif leading-tight">
                      Enterprise <span className="text-white/40">Grade</span>
                  </h2>
                  <p className="text-lg text-white/60 font-light">
                      Built for high-volume creators and agencies. Handle thousands of transactions per second with sub-second reconciliation latency.
                  </p>
                  <Button variant="outline" className="rounded-none border-white/20 text-white font-mono uppercase tracking-wider">
                      View System Status
                  </Button>
              </div>

              {/* Animation 3: Global Map */}
              <div className="relative">
                  <GlobalMapAnimation />
                  <div className="mt-4 flex justify-between text-xs font-mono text-white/40">
                      <span>FIG 03. GLOBAL INFRASTRUCTURE</span>
                      <span>UPTIME: 99.99%</span>
                  </div>
              </div>
          </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/10 bg-zinc-950">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="text-center md:text-left">
                  <h3 className="text-2xl font-serif text-white mb-2">ZERITHUM</h3>
                  <p className="text-xs font-mono text-white/40 uppercase tracking-widest">
                      © 2024 Zerithum Inc. All rights reserved.
                  </p>
              </div>
              <div className="flex gap-8 text-sm font-mono text-white/60 uppercase tracking-wider">
                  <a href="#" className="hover:text-white transition-colors">Privacy</a>
                  <a href="#" className="hover:text-white transition-colors">Terms</a>
                  <a href="#" className="hover:text-white transition-colors">Security</a>
                  <a href="#" className="hover:text-white transition-colors">Status</a>
              </div>
          </div>
      </footer>

    </div>
  );
}
