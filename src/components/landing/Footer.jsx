import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-white text-zinc-900 py-24 relative z-10 border-t border-zinc-200">
             <div className="max-w-6xl mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-start gap-12">
                    <div className="space-y-4">
                        <div className="text-2xl font-serif font-bold tracking-tight">Zerithum.</div>
                        <p className="text-zinc-500 max-w-xs text-sm leading-relaxed">
                            The operating system for creator revenue operations.
                            San Francisco, CA.
                        </p>
                        <div className="flex gap-4 text-sm font-medium">
                            <Link to="/methodology" className="hover:text-emerald-600 transition-colors">Methodology</Link>
                            <Link to="/SignIn" className="hover:text-emerald-600 transition-colors">Sign In</Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-12 text-sm">
                        <div className="space-y-3">
                            <div className="font-bold text-zinc-900">Product</div>
                            <ul className="space-y-2 text-zinc-500">
                                <li><a href="#product" className="hover:text-zinc-900 transition-colors">Reconciliation</a></li>
                                <li><a href="#how-it-works" className="hover:text-zinc-900 transition-colors">How it works</a></li>
                                <li><a href="#accuracy" className="hover:text-zinc-900 transition-colors">Accuracy</a></li>
                                <li><Link to="/Security" className="hover:text-zinc-900 transition-colors">Security</Link></li>
                            </ul>
                        </div>
                        <div className="space-y-3">
                            <div className="font-bold text-zinc-900">Legal</div>
                            <ul className="space-y-2 text-zinc-500">
                                <li><Link to="/privacy" className="hover:text-zinc-900 transition-colors">Privacy Policy</Link></li>
                                <li><Link to="/terms" className="hover:text-zinc-900 transition-colors">Terms of Service</Link></li>
                                <li><a href="mailto:support@zerithum.com" className="hover:text-zinc-900 transition-colors">Contact</a></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="mt-16 pt-8 border-t border-zinc-100 flex justify-between items-center text-xs text-zinc-400 font-mono uppercase tracking-wider">
                    <div>© {new Date().getFullYear()} Zerithum Inc. All rights reserved.</div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        System Operational
                    </div>
                </div>
             </div>
        </footer>
    );
};

export default Footer;
