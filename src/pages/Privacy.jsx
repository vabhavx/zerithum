import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Privacy = () => {
    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-emerald-100">
            {/* Nav */}
            <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-zinc-200 px-6 py-4">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2 text-zinc-900 hover:text-emerald-700 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </Link>
                    <div className="font-serif font-bold text-lg tracking-tight">Zerithum.</div>
                    <div className="w-24"></div> {/* Spacer */}
                </div>
            </nav>

            <main className="max-w-3xl mx-auto px-6 py-16">
                <header className="mb-12 border-b border-zinc-200 pb-8">
                    <h1 className="text-4xl font-serif font-bold text-zinc-900 mb-6 leading-tight">
                        Privacy Policy
                    </h1>
                    <p className="text-lg text-zinc-600 leading-relaxed font-serif">
                        Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                </header>

                <div className="prose prose-zinc max-w-none">
                    <p className="lead text-xl text-zinc-600 mb-8">
                        At Zerithum, we take your privacy seriously. This policy describes how we collect, use, and protect your personal and financial data.
                    </p>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-zinc-900 mb-4">1. Data Collection</h2>
                        <p className="text-zinc-700 mb-4">
                            We collect information necessary to provide our reconciliation services, including:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-zinc-700">
                            <li>Account information (name, email, password).</li>
                            <li>Financial transaction data from connected platforms (e.g., Stripe, Patreon) via secure APIs.</li>
                            <li>Bank transaction data via Plaid or manual upload.</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-zinc-900 mb-4">2. Data Usage</h2>
                        <p className="text-zinc-700 mb-4">
                            Your data is used exclusively for:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-zinc-700">
                            <li>Reconciling your revenue against bank deposits.</li>
                            <li>Providing analytics and financial insights.</li>
                            <li>Improving our service accuracy.</li>
                        </ul>
                        <p className="mt-4 font-semibold text-zinc-900">
                            We do not sell your data to third parties.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-zinc-900 mb-4">3. Security</h2>
                        <p className="text-zinc-700 mb-4">
                            We employ industry-standard security measures:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-zinc-700">
                            <li>All data is encrypted in transit (TLS 1.2+) and at rest (AES-256).</li>
                            <li>OAuth tokens are stored securely and never exposed to the client.</li>
                            <li>Regular security audits and vulnerability assessments.</li>
                        </ul>
                    </section>

                     <section className="mb-10">
                        <h2 className="text-2xl font-bold text-zinc-900 mb-4">4. Your Rights</h2>
                        <p className="text-zinc-700 mb-4">
                            You have the right to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-zinc-700">
                            <li>Access the personal data we hold about you.</li>
                            <li>Request correction of inaccurate data.</li>
                            <li>Request deletion of your account and all associated data ("Right to be Forgotten").</li>
                        </ul>
                    </section>
                </div>

                <footer className="mt-16 pt-12 border-t border-zinc-200">
                    <p className="text-zinc-500 text-sm mb-4">
                        If you have any questions about this policy, please contact us.
                    </p>
                    <Link to="/contact">
                        <Button variant="outline" className="border-zinc-300 text-zinc-700 hover:bg-zinc-100">
                            Contact Support
                        </Button>
                    </Link>
                </footer>
            </main>
        </div>
    );
};

export default Privacy;
