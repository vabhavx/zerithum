import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const DataDeletion = () => {
    useEffect(() => {
        document.title = 'Data deletion instructions | Zerithum';
    }, []);

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
                            If you use Zerithum, you control your data. This page explains how to delete your Zerithum account and how to request deletion of data associated with your use of Zerithum, including data imported from any connected platforms and services.
                        </p>

                        <p className="mb-8">
                            Zerithum is a revenue reconciliation and analytics platform. You may connect third party services such as video and social platforms, membership platforms, payment processors, storefronts, and bank data providers. Zerithum stores the data you authorize us to access so we can provide dashboards, reconciliation, exports, and insights.
                        </p>

                        <p className="mb-8">
                            This page is intended for all Zerithum users, including creators, accountants, and collaborators, and it also satisfies data deletion requirements for platforms that you connect to Zerithum, such as Facebook and Instagram.
                        </p>

                        <section className="mb-10">
                            <h2 className="mb-4">1. Scope of data covered</h2>
                            <p>
                                When we refer to "your data" in this document, we include, as applicable:
                            </p>
                            <ul>
                                <li>Account profile information, such as your name, email address, workspace name, and basic settings</li>
                                <li>Data we import from creator and revenue platforms that you connect to Zerithum using OAuth or API keys, for example Facebook, Instagram, YouTube, Patreon, Stripe, Gumroad, TikTok, newsletter tools, affiliate networks, and similar services</li>
                                <li>Data we import from banks and financial institutions through aggregation services or manual statement uploads</li>
                                <li>Transaction records, reconciliation results, and audit trails generated inside Zerithum</li>
                                <li>Reports, exports, and AI generated insights that are tied to your Zerithum account</li>
                            </ul>
                            <p>
                                The instructions below describe how you can request deletion of this data from Zerithum systems.
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2 className="mb-4">2. Deleting your Zerithum account in the product</h2>
                            <p>
                                The most direct way to remove your data is to delete your Zerithum account from inside the application.
                            </p>
                            <h3 className="mt-6 mb-3">Steps to delete your account</h3>
                            <ol>
                                <li>Sign in to your Zerithum account.</li>
                                <li>Open Account settings from the main navigation.</li>
                                <li>Locate the Delete account option.</li>
                                <li>Review the information on the deletion confirmation screen.</li>
                                <li>Confirm the deletion.</li>
                            </ol>
                            <p>
                                Once you confirm, the deletion process begins. This action is irreversible. After the process completes, you will not be able to restore your account, your workspaces, your reconciliations, or any historical data that was only stored in Zerithum.
                            </p>
                            <p>
                                When you delete your account in this way, Zerithum will:
                            </p>
                            <ul>
                                <li>Mark your account and related workspaces for deletion</li>
                                <li>Disconnect OAuth and API connections to the platforms you had linked</li>
                                <li>Queue associated data for deletion or de identification in our active systems</li>
                            </ul>
                        </section>

                        <section className="mb-10">
                            <h2 className="mb-4">3. Requesting data deletion by email</h2>
                            <p>
                                If you cannot access your account, if your login email has changed, or if you prefer to make a formal written request, you can ask us to delete your data by email.
                            </p>
                            <p>
                                To do this, send an email to:
                            </p>
                            <p>
                                <a href="mailto:privacy@zerithum.com" className="text-emerald-700 hover:text-emerald-800 underline">privacy@zerithum.com</a>
                            </p>
                            <p>
                                Send the request from the email address that is registered to your Zerithum account and include your legal name. Using the subject line "Data Deletion Request" helps us route your message correctly.
                            </p>
                            <p>
                                In your email, please include:
                            </p>
                            <ul>
                                <li>Your registered Zerithum email address</li>
                                <li>Your legal name</li>
                                <li>The name of your workspace or business, if you created one</li>
                                <li>Any connected platforms you remember linking to Zerithum, for example Facebook Page, Instagram account, YouTube channel, Patreon page, Stripe account, Gumroad store, or bank</li>
                            </ul>
                            <p>
                                We may contact you to verify your identity or to clarify the scope of your request before deletion begins.
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2 className="mb-4">4. Data we delete or de identify</h2>
                            <p>
                                Once we have verified a deletion request, we take steps to remove or de identify data associated with your account, as applicable. This can include:
                            </p>
                            <ul>
                                <li>Account and profile details, such as your name, email address, and workspace information</li>
                                <li>Connected platform records and stored authorization tokens for services you linked to Zerithum</li>
                                <li>Imported revenue and payout data retrieved from connected platforms</li>
                                <li>Imported bank transaction data and reconciliation matches created in Zerithum</li>
                                <li>Generated reports, exports, and AI insights that are tied to your user identity</li>
                                <li>Support interactions that can reasonably be removed without breaking legal or operational records</li>
                            </ul>
                            <p>
                                For OAuth based connections, deletion includes removing stored refresh tokens and access tokens from our secure storage, which prevents further data access from those platforms.
                            </p>
                            <p>
                                Where full deletion of specific records is not technically possible without breaking core audit or compliance requirements, we apply de identification techniques so that the data can no longer be associated with you as an identifiable individual.
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2 className="mb-4">5. Data we may need to retain</h2>
                            <p>
                                Certain categories of data must be retained for specific periods, even after a deletion request, because they are required for legal, regulatory, security, or accounting reasons. Typical examples include:
                            </p>
                            <ul>
                                <li>Records needed to comply with tax and accounting retention requirements</li>
                                <li>Logs and security events that help us detect and investigate abuse or fraudulent activity</li>
                                <li>Minimal information required to honor an opt out or deletion request in the future</li>
                                <li>Backup copies that are stored in disaster recovery systems and that expire on a fixed rotation schedule</li>
                            </ul>
                            <p>
                                When this applies, we restrict access to such data to a limited set of personnel and limit its use to the purposes listed above. When retention periods end, we delete or further de identify that data.
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2 className="mb-4">6. Connected platforms and revoking access</h2>
                            <p>
                                Zerithum never initiates payments or moves money on your behalf. Connected platforms use Zerithum in a read only way so we can reconcile and report on your earnings.
                            </p>
                            <p>
                                You can revoke Zerithum's access to each third party platform directly within that platform's own settings. Examples include:
                            </p>
                            <ul>
                                <li>Removing Zerithum from "Apps and Websites" or equivalent sections within social and video platforms</li>
                                <li>Disconnecting Zerithum as a connected app in payment processors or membership tools</li>
                                <li>Revoking access granted to Zerithum in your bank data aggregator dashboard, where one is provided</li>
                            </ul>
                            <p>
                                Revoking access in this way stops new data from being imported into Zerithum. It does not automatically erase data that has already been imported. To remove stored data, you still need to delete your Zerithum account or submit a data deletion request as described above.
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2 className="mb-4">7. Timeframes and process</h2>
                            <p>
                                Our goal is to handle deletion requests in a timely and predictable way.
                            </p>
                            <ul>
                                <li>We acknowledge email requests as soon as reasonably possible.</li>
                                <li>We verify your identity before processing the deletion, to protect your account from unauthorized requests.</li>
                                <li>After verification, we aim to complete deletion or de identification within 30 days, subject to technical and legal constraints.</li>
                                <li>If your request involves multiple workspaces, large historical datasets, or special legal requirements, processing may take longer. In those cases we will communicate the expected timeline.</li>
                            </ul>
                            <p>
                                Once processing is complete, we send a confirmation to the email address associated with your request. If we must retain any data as described in the retention section, we explain what type of data is retained and for which purpose.
                            </p>
                        </section>

                        <section className="mb-10">
                            <h2 className="mb-4">8. Contact and questions</h2>
                            <p>
                                If you have any questions about how we handle data deletion, or if you want to check the status of a request, contact us at:
                            </p>
                            <p>
                                <a href="mailto:privacy@zerithum.com" className="text-emerald-700 hover:text-emerald-800 underline">privacy@zerithum.com</a>
                            </p>
                            <p>
                                Please include enough information for us to locate your account, such as your registered email address and workspace name. We may ask for additional information where this is necessary to verify your identity or to protect the security of other users.
                            </p>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DataDeletion;
