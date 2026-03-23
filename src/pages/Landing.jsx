
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

// Sections
import HeroSection from '@/components/landing/HeroSection';
import ProblemSection from '@/components/landing/ProblemSection';
import HowItWorks from '@/components/landing/HowItWorks';
import ReconciliationFlow from '@/components/landing/ReconciliationFlow';
import OutcomesSection from '@/components/landing/OutcomesSection';
import TaxWorkflowSection from '@/components/landing/TaxWorkflowSection';
import SecuritySection from '@/components/landing/SecuritySection';
import FAQSection from '@/components/landing/FAQSection';
import CTASection from '@/components/landing/CTASection';
import Footer from '@/components/landing/Footer';

const Landing = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id) => {
        setMobileMenuOpen(false);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="relative min-h-screen bg-[radial-gradient(ellipse_at_top,_#18181b_0%,_#09090b_50%)] text-white overflow-hidden font-sans selection:bg-emerald-500/30">
            {/* Navbar */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 py-3' : 'bg-transparent py-6'}`}>
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                         <div className="font-serif font-bold text-xl tracking-tight">Zerithum.</div>
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
                        <button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors">How it works</button>
                        <button onClick={() => scrollToSection('outcomes')} className="hover:text-white transition-colors">Features</button>
                        <Link to="/Security" className="hover:text-white transition-colors">Security</Link>
                        <button onClick={() => scrollToSection('faq')} className="hover:text-white transition-colors">FAQ</button>
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                        <Link to="/SignIn" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Sign in</Link>
                        <Link to="/Signup">
                            <Button size="sm" className="bg-white text-zinc-950 hover:bg-zinc-200 font-medium rounded-full px-5">
                                Sign up
                            </Button>
                        </Link>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button className="md:hidden text-zinc-400" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden absolute top-full left-0 right-0 bg-zinc-950 border-b border-zinc-800 p-6 flex flex-col gap-6 shadow-2xl">
                        <button onClick={() => scrollToSection('how-it-works')} className="text-left text-zinc-400 hover:text-white">How it works</button>
                        <button onClick={() => scrollToSection('outcomes')} className="text-left text-zinc-400 hover:text-white">Features</button>
                        <Link to="/Security" className="text-zinc-400 hover:text-white">Security</Link>
                        <button onClick={() => scrollToSection('faq')} className="text-left text-zinc-400 hover:text-white">FAQ</button>
                        <div className="h-[1px] bg-zinc-800 w-full"></div>
                        <Link to="/SignIn" className="text-zinc-400 hover:text-white">Sign in</Link>
                        <Link to="/Signup">
                             <Button className="w-full bg-white text-zinc-950 rounded-full">Sign up</Button>
                        </Link>
                    </div>
                )}
            </nav>

            {/* Main Content */}
            <main className="relative z-10">
                <HeroSection />
                <ProblemSection />
                <HowItWorks />
                <ReconciliationFlow />
                <OutcomesSection />
                <TaxWorkflowSection />
                <SecuritySection />
                <FAQSection />
                <CTASection />
            </main>

            <Footer />
        </div>
    );
};

export default Landing;
