import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const DataDeletion = () => {
    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-emerald-100">
            {/* Nav */}
            <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-zinc-200 px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2 text-zinc-900 hover:text-emerald-700 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </Link>
                    <div className="font-serif font-bold text-lg tracking-tight">Zerithum.</div>
                    <div className="w-24"></div> {/* Spacer */}
                </div>
            </nav>

            <div className="max-w-3xl mx-auto px-6 py-16 relative">
                <main className="max-w-none">
                    <header className="mb-12 border-b border-zinc-200 pb-8">
                        <h1 className="text-4xl font-serif font-bold text-zinc-900 mb-6 leading-tight">
                            Data deletion instructions
                        </h1>
                    </header>

                    <div className="prose prose-zinc max-w-none prose-h2:font-serif prose-h2:text-2xl prose-h2:text-zinc-900 prose-h3:font-sans prose-h3:text-lg prose-h3:font-semibold prose-h3:text-zinc-800 prose-p:text-zinc-700 prose-li:text-zinc-700">
                        <p className="mb-8">
                            If you used Zerithum with Facebook Login or connected Meta platforms such as Facebook Pages or Instagram professional accounts, you can request deletion of your data stored in Zerithum.
                        </p>

                        <section className="mb-10">
                            <h2 className="mb-4">How to request deletion</h2>
                            <p>
                                Email <a href="mailto:privacy@zerithum.com" className="text-emerald-700 hover:text-emerald-800 underline">privacy@zerithum.com</a> from your registered Zerithum email address and include your legal name. Use subject line: Data Deletion Request.
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2 className="mb-4">What we will do</h2>
                            <p>
                                After verifying your request, we will delete or de identify personal data associated with your Zerithum account and disconnect connected Meta platform tokens stored by Zerithum.
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2 className="mb-4">What we may retain</h2>
                            <p>
                                We may retain limited information when required by law, for security, fraud prevention, dispute resolution, or accounting record retention.
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2 className="mb-4">Timing</h2>
                            <p>
                                We aim to complete deletion within 30 days after verification. If we cannot delete specific data immediately due to legal obligations, we will explain what we retained and why.
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2 className="mb-4">Disconnecting Meta access</h2>
                            <p>
                                You can also remove Zerithum from your Facebook settings under Apps and Websites to stop future data sharing from Meta. Removing access does not delete data already stored in Zerithum.
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2 className="mb-4">Contact</h2>
                            <p>
                                <a href="mailto:privacy@zerithum.com" className="text-emerald-700 hover:text-emerald-800 underline">privacy@zerithum.com</a>
                            </p>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DataDeletion;
