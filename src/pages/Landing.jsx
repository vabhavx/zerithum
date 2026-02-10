import React from 'react';
import { Link } from 'react-router-dom';
import { BeamsBackground } from '@/components/ui/beams-background';
import { Button } from '@/components/ui/button';
import { Hero } from '@/components/landing/Hero';
import { WedgeReconciliation } from '@/components/landing/WedgeReconciliation';
import { TelemetryLedger } from '@/components/landing/TelemetryLedger';
import { ProofBar } from '@/components/landing/ProofBar';

export default function Landing() {
    return (
        <BeamsBackground className="overflow-hidden bg-black">
            {/* Navbar */}
            <div className="relative z-50 w-full p-6 flex justify-between items-center max-w-7xl mx-auto">
                 <div className="text-white font-bold text-xl tracking-tight font-mono">Zerithum</div>
                 <div className="flex items-center gap-4">
                     <Link to="/SignIn">
                        <Button variant="ghost" className="text-neutral-400 hover:text-white hover:bg-white/10">
                            Sign In
                        </Button>
                    </Link>
                    <Link to="/Signup">
                        <Button className="bg-white text-black hover:bg-neutral-200 rounded-full px-6">
                            Get Started
                        </Button>
                    </Link>
                 </div>
            </div>

            {/* Main Content Stack */}
            <div className="relative w-full flex flex-col items-center">

                {/* Hero Section */}
                <Hero />

                {/* Social Proof */}
                <ProofBar />

                {/* The Wedge: Interactive Reconciliation */}
                <WedgeReconciliation />

                {/* Live Telemetry & Ledger */}
                <TelemetryLedger />

                {/* Final CTA / Footer Area */}
                <div className="relative w-full py-32 bg-neutral-950 border-t border-neutral-900 flex flex-col items-center text-center px-4">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 max-w-2xl">
                        Stop guessing. Start reconciling.
                    </h2>
                    <Link to="/Signup">
                        <Button size="lg" className="bg-white text-black hover:bg-neutral-200 text-lg h-14 px-10 rounded-full font-medium transition-transform hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                            Create your account
                        </Button>
                    </Link>
                    <div className="mt-16 pt-8 border-t border-white/5 w-full max-w-7xl flex flex-col md:flex-row justify-between items-center text-neutral-600 text-sm">
                        <div>&copy; {new Date().getFullYear()} Zerithum Inc.</div>
                        <div className="flex gap-6 mt-4 md:mt-0">
                            <span className="hover:text-neutral-400 cursor-pointer">Privacy</span>
                            <span className="hover:text-neutral-400 cursor-pointer">Terms</span>
                            <span className="hover:text-neutral-400 cursor-pointer">Security</span>
                        </div>
                    </div>
                </div>

            </div>
        </BeamsBackground>
    );
}
