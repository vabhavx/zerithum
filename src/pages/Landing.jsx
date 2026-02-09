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
    const y1 = useTransform(scrollYProgress, [0, 0.2, 0.3], [20, 0, -20]);
    const y2 = useTransform(scrollYProgress, [0.3, 0.5, 0.6], [20, 0, -20]);
    const y3 = useTransform(scrollYProgress, [0.6, 0.8, 0.9], [20, 0, -20]);


    return (
        <BeamsBackground className="overflow-visible">
            <div className="relative z-50 w-full p-6 flex justify-between items-center max-w-7xl mx-auto">
                 <div className="text-white font-bold text-xl tracking-tight">Zerithum</div>
                 <Link to="/SignIn">
                    <Button variant="ghost" className="text-white hover:text-white/80 hover:bg-white/10">
                        Sign In
                    </Button>
                </Link>
            </div>

            <div className="relative flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-6xl md:text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600 font-sans tracking-tight"
                >
                    ZERITHUM
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="mt-4 text-neutral-400 text-lg md:text-xl max-w-lg mx-auto"
                >
                    The operating system for creator revenue.
                    <br/>
                    <span className="text-sm opacity-50 mt-2 block">Scroll to explore</span>
                </motion.p>
            </div>

            <div ref={containerRef} className="relative h-[300vh] w-full">
                <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
                    <motion.div style={{ opacity: opacity1, y: y1 }} className="absolute text-center px-4 w-full max-w-4xl">
                        <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">Reconciliation</h2>
                        <p className="text-xl md:text-2xl text-neutral-400 leading-relaxed">
                            Automated matching with bank-grade precision.
                            <br/>
                            We align every transaction to the penny.
                        </p>
                        {/* Placeholder for scroll frame image */}
                        <div className="mt-8 w-full h-64 bg-neutral-900/50 border border-neutral-800 rounded-xl flex items-center justify-center text-neutral-600 text-sm">
                            [Animation Frame: Reconciliation Flow]
                        </div>
                    </motion.div>

                    <motion.div style={{ opacity: opacity2, y: y2 }} className="absolute text-center px-4 w-full max-w-4xl">
                        <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">Analytics</h2>
                        <p className="text-xl md:text-2xl text-neutral-400 leading-relaxed">
                            Real-time insights into your revenue streams.
                            <br/>
                            Know exactly what you earn, when you earn it.
                        </p>
                         {/* Placeholder for scroll frame image */}
                         <div className="mt-8 w-full h-64 bg-neutral-900/50 border border-neutral-800 rounded-xl flex items-center justify-center text-neutral-600 text-sm">
                            [Animation Frame: Analytics Dashboard]
                        </div>
                    </motion.div>

                    <motion.div style={{ opacity: opacity3, y: y3 }} className="absolute text-center px-4 w-full max-w-4xl">
                        <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">Tax Ready</h2>
                        <p className="text-xl md:text-2xl text-neutral-400 leading-relaxed">
                            Instant categorization for stress-free filing.
                            <br/>
                            Export reports in seconds.
                        </p>
                         {/* Placeholder for scroll frame image */}
                         <div className="mt-8 w-full h-64 bg-neutral-900/50 border border-neutral-800 rounded-xl flex items-center justify-center text-neutral-600 text-sm">
                            [Animation Frame: Tax Report Export]
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="relative min-h-[50vh] flex flex-col items-center justify-center px-4 pb-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="text-center"
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">Ready to take control?</h2>
                    <Link to="/Signup">
                        <Button size="lg" className="bg-white text-black hover:bg-neutral-200 text-lg h-14 px-8 rounded-full font-medium transition-transform hover:scale-105">
                            Setup your Zerithum
                        </Button>
                    </Link>

                    <div className="mt-8 flex justify-center gap-4 text-sm text-neutral-500">
                        <Link to="/SignIn" className="hover:text-neutral-300 transition-colors">
                            Already have an account? Sign In
                        </Link>
                    </div>
                </motion.div>
            </div>

            <footer className="w-full py-8 border-t border-white/5 text-center text-neutral-600 text-sm">
                &copy; {new Date().getFullYear()} Zerithum. All rights reserved.
            </footer>
        </BeamsBackground>
    );
}
