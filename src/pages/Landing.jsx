import React, { useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'motion/react';
import { BeamsBackground } from '@/components/ui/beams-background';
import { Button } from '@/components/ui/button';
import LandingReconciliation from '@/components/landing/LandingReconciliation';
import LandingTelemetry from '@/components/landing/LandingTelemetry';
import LandingExport from '@/components/landing/LandingExport';
import { ArrowRight } from 'lucide-react';

// Internal component to handle scroll state and logic
// This isolates the re-renders caused by activeFrame state changes
// so the heavy BeamsBackground (which is a parent in the main component) doesn't re-render.
function LandingScrollSections() {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const [activeFrame, setActiveFrame] = React.useState(1);

    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        if (latest < 0.35) {
            if (activeFrame !== 1) setActiveFrame(1);
        } else if (latest >= 0.35 && latest < 0.65) {
            if (activeFrame !== 2) setActiveFrame(2);
        } else if (latest >= 0.65) {
            if (activeFrame !== 3) setActiveFrame(3);
        }
    });

    // Transform logic for 3 frames
    const opacity1 = useTransform(scrollYProgress, [0, 0.3, 0.35], [1, 1, 0]);
    const scale1 = useTransform(scrollYProgress, [0, 0.3, 0.35], [1, 1, 0.95]);
    const pointerEvents1 = useTransform(scrollYProgress, (val) => val < 0.35 ? 'auto' : 'none');
    const visibility1 = useTransform(scrollYProgress, (val) => val < 0.35 ? 'visible' : 'hidden');

    const opacity2 = useTransform(scrollYProgress, [0.35, 0.4, 0.6, 0.65], [0, 1, 1, 0]);
    const scale2 = useTransform(scrollYProgress, [0.35, 0.4, 0.6, 0.65], [0.95, 1, 1, 0.95]);
    const pointerEvents2 = useTransform(scrollYProgress, (val) => val > 0.35 && val < 0.65 ? 'auto' : 'none');
    const visibility2 = useTransform(scrollYProgress, (val) => val > 0.35 && val < 0.65 ? 'visible' : 'hidden');

    const opacity3 = useTransform(scrollYProgress, [0.65, 0.7, 1.0], [0, 1, 1]);
    const scale3 = useTransform(scrollYProgress, [0.65, 0.7, 1.0], [0.95, 1, 1]);
    const pointerEvents3 = useTransform(scrollYProgress, (val) => val > 0.65 ? 'auto' : 'none');
    const visibility3 = useTransform(scrollYProgress, (val) => val > 0.65 ? 'visible' : 'hidden');

    return (
        <div ref={containerRef} className="relative h-[400vh] w-full z-10">
            <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">

                {/* Frame 1: Reconciliation */}
                <motion.div
                    style={{ opacity: opacity1, scale: scale1, pointerEvents: pointerEvents1, visibility: visibility1 }}
                    className="absolute w-full flex justify-center items-center will-change-transform"
                >
                    <LandingReconciliation isActive={activeFrame === 1} />
                </motion.div>

                {/* Frame 2: Telemetry */}
                <motion.div
                    style={{ opacity: opacity2, scale: scale2, pointerEvents: pointerEvents2, visibility: visibility2 }}
                    className="absolute w-full flex justify-center items-center will-change-transform"
                >
                    <LandingTelemetry isActive={activeFrame === 2} />
                </motion.div>

                {/* Frame 3: Export */}
                <motion.div
                    style={{ opacity: opacity3, scale: scale3, pointerEvents: pointerEvents3, visibility: visibility3 }}
                    className="absolute w-full flex justify-center items-center will-change-transform"
                >
                    <LandingExport isActive={activeFrame === 3} />
                </motion.div>

            </div>
        </div>
    );
}

export default function Landing() {
    return (
        <BeamsBackground className="overflow-visible" intensity="medium">
            {/* Tech Grid Overlay */}
            <div className="absolute inset-0 z-0 pointer-events-none bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            {/* Navigation / Status Bar */}
            <nav className="fixed top-0 left-0 right-0 z-50 w-full p-6 flex justify-between items-start max-w-7xl mx-auto mix-blend-difference">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-neutral-400 tracking-widest uppercase mb-1">System Status: Online</span>
                    <div className="text-white font-bold text-xl tracking-tight flex items-center gap-2">
                        ZERITHUM <span className="text-neutral-500 font-normal">/ OPS</span>
                    </div>
                 </div>
                 <Link to="/SignIn">
                    <Button variant="outline" className="h-8 text-xs font-mono tracking-wide bg-black/20 backdrop-blur-md border-white/10 text-neutral-300 hover:text-white hover:bg-white/10 hover:border-white/20 rounded-sm">
                        [ ACCESS TERMINAL ]
                    </Button>
                </Link>
            </nav>

            {/* Hero Section */}
            <div className="relative flex flex-col items-center justify-center min-h-screen px-4 text-center z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="mb-8 inline-flex items-center justify-center px-3 py-1 rounded border border-white/10 bg-white/5 backdrop-blur-sm"
                >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse shadow-[0_0_10px_#10b981]"></span>
                    <span className="text-[10px] font-mono text-neutral-300 tracking-[0.2em] uppercase">Revenue Control Plane v1.0</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-5xl md:text-7xl lg:text-8xl font-semibold text-white tracking-tighter leading-[0.9]"
                >
                    Complete Financial <br/> Visibility
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="mt-8 text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed"
                >
                    The operating system for creator revenue. Automated reconciliation, audit-ready logs, and real-time cashflow forecasting.
                </motion.p>

                <motion.div
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     transition={{ duration: 1, delay: 0.8 }}
                     className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
                >
                    <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Initialize System</div>
                    <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-neutral-500 to-transparent animate-pulse"></div>
                </motion.div>
            </div>

            {/* Sticky Scroll Logic Isolated */}
            <LandingScrollSections />

            {/* Final CTA Section */}
            <div className="relative min-h-[70vh] flex flex-col items-center justify-center px-4 z-10 bg-gradient-to-b from-transparent via-neutral-950/50 to-neutral-950">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="text-center max-w-3xl mx-auto"
                >
                    <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-neutral-500 to-transparent mx-auto mb-10"></div>

                    <h2 className="text-4xl md:text-6xl font-semibold text-white mb-8 tracking-tight leading-tight">
                        Deploy Your <br/> Financial Stack
                    </h2>

                    <p className="text-neutral-400 mb-12 text-lg md:text-xl font-light">
                        Join the creators who treat their business like a business.
                        <br/>Start your operations today.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                        <Link to="/Signup">
                            <Button size="lg" className="bg-white text-black hover:bg-neutral-200 h-14 px-10 rounded-full font-medium text-sm tracking-wide transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105">
                                Setup your zerithum <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </Link>
                         <Link to="/SignIn">
                            <Button size="lg" variant="ghost" className="text-neutral-400 hover:text-white hover:bg-white/5 h-14 px-8 rounded-full font-mono text-xs tracking-widest border border-transparent hover:border-white/10">
                                LOGIN // TERMINAL
                            </Button>
                        </Link>
                    </div>

                    <div className="mt-20 pt-8 border-t border-white/5 w-full flex justify-between text-[10px] text-neutral-600 font-mono uppercase tracking-wider">
                         <span>© {new Date().getFullYear()} Zerithum Inc.</span>
                         <span>System Status: Operational</span>
                    </div>
                </motion.div>
            </div>
        </BeamsBackground>
    );
}
