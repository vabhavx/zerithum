import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { BeamsBackground } from '@/components/ui/beams-background';
import { Button } from '@/components/ui/button';

export default function Landing() {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const opacity1 = useTransform(scrollYProgress, [0, 0.2, 0.3], [0, 1, 0]);
    const opacity2 = useTransform(scrollYProgress, [0.3, 0.5, 0.6], [0, 1, 0]);
    const opacity3 = useTransform(scrollYProgress, [0.6, 0.8, 0.9], [0, 1, 0]);

    // Y-axis movement for the "schematics"
    const y1 = useTransform(scrollYProgress, [0, 0.2, 0.3], [20, 0, -20]);
    const y2 = useTransform(scrollYProgress, [0.3, 0.5, 0.6], [20, 0, -20]);
    const y3 = useTransform(scrollYProgress, [0.6, 0.8, 0.9], [20, 0, -20]);


    return (
        <BeamsBackground className="overflow-visible" intensity="medium">
            {/* Tech Grid Overlay */}
            <div className="absolute inset-0 z-0 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            {/* Top Navigation / Status Bar */}
            <div className="relative z-50 w-full p-6 flex justify-between items-end max-w-7xl mx-auto border-b border-white/5 pb-4">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-neutral-500 tracking-widest uppercase mb-1">System Status: Online</span>
                    <div className="text-white font-bold text-lg tracking-tight flex items-center gap-2">
                        ZERITHUM <span className="text-neutral-600 font-normal">/ OPS</span>
                    </div>
                 </div>
                 <Link to="/SignIn">
                    <Button variant="outline" className="h-8 text-xs font-mono tracking-wide bg-transparent border-white/10 text-neutral-300 hover:text-white hover:bg-white/5 hover:border-white/20 rounded-sm">
                        [ ACCESS TERMINAL ]
                    </Button>
                </Link>
            </div>

            {/* Hero Section */}
            <div className="relative flex flex-col items-center justify-center min-h-[85vh] px-4 text-center z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="mb-6 inline-flex items-center justify-center px-3 py-1 rounded border border-white/10 bg-white/5 backdrop-blur-sm"
                >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                    <span className="text-[10px] font-mono text-neutral-300 tracking-[0.2em] uppercase">Revenue Control Plane v1.0</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-5xl md:text-7xl font-semibold text-white tracking-tighter leading-tight"
                >
                    Complete Financial <br/> Visibility
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="mt-6 text-neutral-400 text-lg md:text-xl max-w-xl mx-auto font-light leading-relaxed"
                >
                    The operating system for creator revenue. Automated reconciliation, audit-ready logs, and real-time cashflow forecasting.
                </motion.p>

                <motion.div
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     transition={{ duration: 1, delay: 0.5 }}
                     className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                >
                    <div className="w-[1px] h-12 bg-gradient-to-b from-transparent via-neutral-500 to-transparent"></div>
                    <span className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest">Scroll to Initialize</span>
                </motion.div>
            </div>

            {/* Scroll Interaction Section */}
            <div ref={containerRef} className="relative h-[300vh] w-full z-10">
                <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">

                    {/* Frame 1: Reconciliation */}
                    <motion.div style={{ opacity: opacity1, y: y1 }} className="absolute flex flex-col items-center w-full max-w-4xl px-4">
                        <div className="w-full bg-neutral-950/80 border border-white/10 rounded-lg backdrop-blur-md overflow-hidden shadow-2xl">
                             {/* Mock UI Header */}
                            <div className="h-8 border-b border-white/5 flex items-center px-3 bg-white/5">
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-neutral-700"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-neutral-700"></div>
                                </div>
                                <div className="ml-4 text-[10px] font-mono text-neutral-500">reconcile_batch_041.json</div>
                            </div>
                            {/* Mock UI Content */}
                            <div className="p-6 font-mono text-xs">
                                <div className="flex justify-between border-b border-white/5 pb-2 mb-2 text-neutral-500 uppercase tracking-wider">
                                    <span>Transaction ID</span>
                                    <span>Amount</span>
                                    <span>Status</span>
                                </div>
                                <div className="space-y-2 text-neutral-400">
                                    <div className="flex justify-between items-center group">
                                        <span className="text-white">tx_99a8_stripe</span>
                                        <span className="text-white">$1,250.00</span>
                                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px]">MATCHED</span>
                                    </div>
                                    <div className="flex justify-between items-center opacity-50">
                                        <span>tx_99a9_paypal</span>
                                        <span>$420.50</span>
                                        <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-500 text-[10px]">PENDING</span>
                                    </div>
                                    <div className="flex justify-between items-center opacity-50">
                                        <span>tx_99b0_bank</span>
                                        <span>$3,100.00</span>
                                        <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-500 text-[10px]">PENDING</span>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between text-neutral-500">
                                     <span>Auto-match confidence</span>
                                     <span className="text-emerald-500">99.9%</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 text-center">
                            <h2 className="text-3xl font-bold text-white mb-2">Precision Reconciliation</h2>
                            <p className="text-neutral-400 max-w-md mx-auto">Bank-grade matching logic aligns every cent across platforms. No more spreadsheets.</p>
                        </div>
                    </motion.div>

                    {/* Frame 2: Analytics */}
                    <motion.div style={{ opacity: opacity2, y: y2 }} className="absolute flex flex-col items-center w-full max-w-4xl px-4">
                        <div className="w-full bg-neutral-950/80 border border-white/10 rounded-lg backdrop-blur-md overflow-hidden shadow-2xl p-6">
                            {/* Mock Chart UI */}
                            <div className="flex justify-between items-end h-32 gap-2">
                                {[30, 45, 35, 60, 55, 75, 80].map((h, i) => (
                                    <div key={i} className="w-full bg-neutral-800 relative group">
                                        <div
                                            className="absolute bottom-0 left-0 right-0 bg-neutral-600 transition-all duration-500"
                                            style={{ height: `${h}%` }}
                                        >
                                            <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/20"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 flex justify-between text-[10px] font-mono text-neutral-500 uppercase">
                                <span>Mon</span>
                                <span>Tue</span>
                                <span>Wed</span>
                                <span>Thu</span>
                                <span>Fri</span>
                                <span>Sat</span>
                                <span>Sun</span>
                            </div>
                             <div className="mt-4 pt-4 border-t border-white/5 flex gap-8">
                                <div>
                                    <div className="text-[10px] font-mono text-neutral-500 uppercase">Total Revenue</div>
                                    <div className="text-xl text-white font-mono">$24,500.00</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-mono text-neutral-500 uppercase">Growth</div>
                                    <div className="text-xl text-emerald-500 font-mono flex items-center gap-1">
                                        ▲ 12.5%
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 text-center">
                            <h2 className="text-3xl font-bold text-white mb-2">Live Telemetry</h2>
                            <p className="text-neutral-400 max-w-md mx-auto">Real-time dashboards for cashflow, tax liability, and platform performance.</p>
                        </div>
                    </motion.div>

                    {/* Frame 3: Audit/Export */}
                    <motion.div style={{ opacity: opacity3, y: y3 }} className="absolute flex flex-col items-center w-full max-w-4xl px-4">
                        <div className="w-full bg-neutral-950/80 border border-white/10 rounded-lg backdrop-blur-md overflow-hidden shadow-2xl flex flex-col md:flex-row">
                             <div className="p-6 flex-1 border-r border-white/5">
                                <div className="text-[10px] font-mono text-neutral-500 uppercase mb-4">Export Configuration</div>
                                <div className="space-y-3">
                                    <div className="h-2 w-3/4 bg-neutral-800 rounded"></div>
                                    <div className="h-2 w-1/2 bg-neutral-800 rounded"></div>
                                    <div className="h-2 w-5/6 bg-neutral-800 rounded"></div>
                                </div>
                                <div className="mt-6 flex gap-2">
                                    <div className="px-3 py-1 bg-white/10 text-white text-xs rounded border border-white/10 font-mono">PDF</div>
                                    <div className="px-3 py-1 bg-transparent text-neutral-500 text-xs rounded border border-white/10 font-mono">CSV</div>
                                    <div className="px-3 py-1 bg-transparent text-neutral-500 text-xs rounded border border-white/10 font-mono">JSON</div>
                                </div>
                             </div>
                             <div className="p-6 flex-1 flex items-center justify-center bg-white/5">
                                <div className="text-center">
                                    <div className="w-12 h-12 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center mb-3">
                                        <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div className="text-white font-medium text-sm">Export Complete</div>
                                    <div className="text-neutral-500 text-xs mt-1">Report_Q1_2024.pdf</div>
                                </div>
                             </div>
                        </div>
                        <div className="mt-8 text-center">
                            <h2 className="text-3xl font-bold text-white mb-2">Audit Ready</h2>
                            <p className="text-neutral-400 max-w-md mx-auto">Generate comprehensive tax reports and audit logs with a single click.</p>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Final CTA Section */}
            <div className="relative min-h-[60vh] flex flex-col items-center justify-center px-4 pb-20 z-10 bg-gradient-to-t from-neutral-950 to-transparent">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="text-center max-w-2xl mx-auto"
                >
                    <div className="w-16 h-[1px] bg-neutral-700 mx-auto mb-8"></div>
                    <h2 className="text-4xl font-semibold text-white mb-6 tracking-tight">Deploy Your System</h2>
                    <p className="text-neutral-400 mb-10 text-lg">
                        Join the creators who treat their business like a business.
                        <br/>Start your operations today.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link to="/Signup">
                            <Button size="lg" className="bg-white text-black hover:bg-neutral-200 h-12 px-8 rounded-md font-medium text-sm tracking-wide transition-all border border-transparent shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                                SETUP ZERITHUM
                            </Button>
                        </Link>
                         <Link to="/SignIn">
                            <Button size="lg" variant="outline" className="bg-transparent text-neutral-300 border-white/10 hover:bg-white/5 hover:text-white h-12 px-8 rounded-md font-mono text-xs tracking-wide">
                                LOGIN // TERMINAL
                            </Button>
                        </Link>
                    </div>

                    <div className="mt-12 pt-8 border-t border-white/5 w-full flex justify-between text-[10px] text-neutral-600 font-mono uppercase tracking-wider">
                         <span>© {new Date().getFullYear()} Zerithum Inc.</span>
                         <span>System Status: Operational</span>
                    </div>
                </motion.div>
            </div>
        </BeamsBackground>
    );
}
