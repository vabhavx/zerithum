/* eslint-disable react/no-unknown-property */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Canvas } from "@react-three/fiber";
import { ShaderPlane } from "@/components/ui/background-paper-shaders";
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

// Sections
import HeroSection from '@/components/landing/HeroSection';
import ProductShowcase from '@/components/landing/ProductShowcase';
import HowItWorks from '@/components/landing/HowItWorks';
import AccuracySpecs from '@/components/landing/AccuracySpecs';
import SecuritySection from '@/components/landing/SecuritySection';
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
        <div className="relative min-h-screen bg-zinc-950 text-white overflow-hidden font-sans selection:bg-emerald-500/30">
            {/* Background Layer */}
            <div className="fixed inset-0 z-0 pointer-events-none w-full h-full">
                <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
                    <color attach="background" args={["#000000"]} />
                    <ShaderPlane
                        position={[0, 0, 0]}
                        color1="#3b82f6"
                        color2="#10b981"
                    />
                    <ambientLight intensity={1.5} />
                </Canvas>
                {/* Overlay for readability - Gradient Mask */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/80 backdrop-blur-[1px]"></div>
            </div>

            {/* Navbar */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 py-3' : 'bg-transparent py-6'}`}>
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                         <div className="font-serif font-bold text-xl tracking-tight">Zerithum.</div>
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
                        <button onClick={() => scrollToSection('product')} className="hover:text-white transition-colors">Product</button>
                        <button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors">How it works</button>
                        <button onClick={() => scrollToSection('accuracy')} className="hover:text-white transition-colors">Accuracy</button>
                        <Link to="/Security" className="hover:text-white transition-colors">Security</Link>
                        <Link to="/methodology" className="hover:text-white transition-colors">Methodology</Link>
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
                        <button onClick={() => scrollToSection('product')} className="text-left text-zinc-400 hover:text-white">Product</button>
                        <button onClick={() => scrollToSection('how-it-works')} className="text-left text-zinc-400 hover:text-white">How it works</button>
                        <button onClick={() => scrollToSection('accuracy')} className="text-left text-zinc-400 hover:text-white">Accuracy</button>
                        <Link to="/Security" className="text-zinc-400 hover:text-white">Security</Link>
                        <Link to="/methodology" className="text-zinc-400 hover:text-white">Methodology</Link>
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

                <ProductShowcase />

                <HowItWorks />
                <AccuracySpecs />
                <SecuritySection />
            </main>

            <Footer />
        </div>
    );
};

export default Landing;
