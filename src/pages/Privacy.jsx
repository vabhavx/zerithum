import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Privacy = () => {
    // Hardcoded date for legal policy stability
    const currentDate = "October 2024";

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

            <div className="max-w-7xl mx-auto px-6 py-16 flex flex-col lg:flex-row gap-12 relative">
                {/* Main Content - First on Mobile, Second on Desktop */}
                <main className="order-1 lg:order-2 lg:w-3/4 max-w-none">
                    <header className="mb-12 border-b border-zinc-200 pb-8">
                        <h1 className="text-4xl font-serif font-bold text-zinc-900 mb-6 leading-tight">
                            Privacy Policy
                        </h1>
                        <p className="text-lg text-zinc-600 leading-relaxed font-serif">
                            Last updated: {currentDate}
                        </p>
                    </header>

                    {/* Removed prose wrapper, applied explicit styles */}
                    <div className="max-w-none">
                        <p className="text-xl text-zinc-600 mb-8 leading-relaxed">
                            Zerithum respects the privacy of creators and their businesses. This Privacy Policy explains how Zerithum collects, uses, shares, and protects information about you when you use zerithum.com, our web application, and related services (collectively, the "Services").
                        </p>

                        <p className="text-zinc-700 mb-4 leading-relaxed">
                            By using the Services, you agree to the practices described in this Privacy Policy. If you do not agree, you should not use the Services.
                        </p>

                        <p className="text-zinc-700 mb-4 leading-relaxed">
                            For the purposes of this Policy, "Zerithum", "we", and "us" refer to Zerithum and its operating entity. "You" refers to individual creators, accountants, and other users of the Services.
                        </p>

                        <section id="scope" className="mt-12 scroll-mt-32">
                            <h2 className="text-2xl font-serif font-bold text-zinc-900 mb-6">1. Scope and who this policy applies to</h2>
                            <p className="text-zinc-700 mb-4 leading-relaxed">This Privacy Policy applies to:</p>
                            <ul className="list-disc pl-6 space-y-2 mb-6 text-zinc-700">
                                <li className="pl-1">Visitors to our websites and landing pages</li>
                                <li className="pl-1">Individual creators and businesses who create an account with Zerithum</li>
                                <li className="pl-1">Accountants, tax professionals, and advisors who access creator data through Zerithum</li>
                                <li className="pl-1">Any person who contacts us by email, support channels, or forms</li>
                            </ul>
                            <p className="text-zinc-700 mb-4 leading-relaxed">This Policy does not apply to:</p>
                            <ul className="list-disc pl-6 space-y-2 mb-6 text-zinc-700">
                                <li className="pl-1">Third party platforms you connect to Zerithum, such as YouTube, Patreon, Stripe, Gumroad, or your bank</li>
                                <li className="pl-1">Third party websites or services that link to or from Zerithum, but that Zerithum does not control</li>
                            </ul>
                            <p className="text-zinc-700 mb-4 leading-relaxed">Those services have their own privacy policies. You should review them carefully.</p>
                        </section>

                        {/* Quick Summary Card */}
                        <section id="summary" className="mt-12 scroll-mt-32 bg-emerald-50 border border-emerald-200 rounded-lg p-8">
                            <h2 className="text-2xl font-serif font-bold text-emerald-900 mb-6">2. Quick summary for creators</h2>
                            <p className="text-zinc-700 mb-4 font-medium">This is an informal summary for clarity. The full Policy that follows is the binding version.</p>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <span className="text-emerald-600 mt-1 font-bold">•</span>
                                    <span className="text-zinc-700">Zerithum is accounting and revenue analytics software for creators</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-emerald-600 mt-1 font-bold">•</span>
                                    <span className="text-zinc-700">Zerithum connects to your revenue platforms and bank in a read only way</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-emerald-600 mt-1 font-bold">•</span>
                                    <span className="text-zinc-700">Zerithum does not hold your money, initiate payments, or act as a wallet or bank</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-emerald-600 mt-1 font-bold">•</span>
                                    <span className="text-zinc-700">Zerithum does not store your banking passwords or card numbers</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-emerald-600 mt-1 font-bold">•</span>
                                    <span className="text-zinc-700">Zerithum collects business and financial data so it can reconcile your income, generate reports, and provide insights</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-emerald-600 mt-1 font-bold">•</span>
                                    <span className="text-zinc-700">Zerithum does not sell your personal data to third party advertisers</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-emerald-600 mt-1 font-bold">•</span>
                                    <span className="text-zinc-700">Zerithum shares data with service providers that help operate the product, with your accountant or advisor when you authorize it, and when required by law</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-emerald-600 mt-1 font-bold">•</span>
                                    <span className="text-zinc-700">Zerithum follows data protection laws in key regions, including GDPR (EEA and UK), CCPA / CPRA (California), and India’s Digital Personal Data Protection law, as applicable</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-emerald-600 mt-1 font-bold">•</span>
                                    <span className="text-zinc-700">You have rights over your data, including access, correction, deletion, and export, subject to legal limits</span>
                                </li>
                            </ul>
                            <p className="mt-6 text-sm text-zinc-500 italic">The rest of this Policy gives full legal detail.</p>
                        </section>

                        <section id="collection" className="mt-12 scroll-mt-32">
                            <h2 className="text-2xl font-serif font-bold text-zinc-900 mb-6">3. What information Zerithum collects</h2>
                            <p className="text-zinc-700 mb-4 leading-relaxed">Zerithum collects different types of information depending on how you interact with the Services.</p>

                            <h3 id="collection-account" className="text-lg font-bold text-zinc-900 mt-8 mb-4 scroll-mt-32">3.1 Account and profile information</h3>
                            <p className="text-zinc-700 mb-4 leading-relaxed">When you create a Zerithum account or communicate with us, we collect:</p>
                            <ul className="list-disc pl-6 space-y-2 mb-6 text-zinc-700">
                                <li className="pl-1">Name, display name, and contact details such as email address and phone number</li>
                                <li className="pl-1">Password or authentication credentials, if you sign up with email and password</li>
                                <li className="pl-1">Organization or business name, if you provide one</li>
                                <li className="pl-1">Role or relationship, for example creator, accountant, advisor, team member</li>
                                <li className="pl-1">Country and time zone</li>
                                <li className="pl-1">Communication preferences and consents</li>
                            </ul>
                            <p className="text-zinc-700 mb-4 leading-relaxed">If you contact us directly, Zerithum also collects:</p>
                            <ul className="list-disc pl-6 space-y-2 mb-6 text-zinc-700">
                                <li className="pl-1">The content of your messages or support requests</li>
                                <li className="pl-1">Any attachments you send</li>
                                <li className="pl-1">Metadata about the communication, such as date, time, and channel</li>
                            </ul>

                            <h3 id="collection-platform" className="text-lg font-bold text-zinc-900 mt-8 mb-4 scroll-mt-32">3.2 Connected platform revenue data</h3>
                            <p className="text-zinc-700 mb-4 leading-relaxed">When you connect third party platforms to Zerithum, Zerithum collects revenue related data through those platforms’ APIs, based on the permissions you grant. This may include:</p>
                            <ul className="list-disc pl-6 space-y-2 mb-6 text-zinc-700">
                                <li className="pl-1">Platform identifiers, for example your YouTube channel ID, Patreon creator ID, Stripe account ID, or Gumroad account ID</li>
                                <li className="pl-1">Transaction level details from those platforms, such as:
                                    <ul className="list-disc pl-6 mt-2 space-y-1">
                                        <li className="pl-1">Amount, currency, and date of each payout or earning</li>
                                        <li className="pl-1">Revenue source or category, for example ad revenue, memberships, course sales, sponsorships, affiliate payouts</li>
                                        <li className="pl-1">Platform fees, refunds, chargebacks, or adjustments</li>
                                    </ul>
                                </li>
                                <li className="pl-1">Platform level metadata for reconciliation, such as transaction IDs, payout IDs, and reference numbers</li>
                                <li className="pl-1">Aggregated analytics related to revenue, such as monthly totals and trends</li>
                                <li className="pl-1">Limited business metadata related to your creator profile on those platforms, for example membership tiers or product names, where required for reporting</li>
                            </ul>
                            <p className="text-zinc-700 mb-4 leading-relaxed">Zerithum does not request or store your passwords for these third party platforms. Zerithum uses OAuth or equivalent delegated access that those platforms provide.</p>

                            <h3 id="collection-bank" className="text-lg font-bold text-zinc-900 mt-8 mb-4 scroll-mt-32">3.3 Bank and financial data</h3>
                            <p className="text-zinc-700 mb-4 leading-relaxed">When you connect a bank or financial institution to Zerithum through a third party aggregation service (for example a provider such as Plaid or similar), or when you upload statements manually, Zerithum may collect:</p>
                            <ul className="list-disc pl-6 space-y-2 mb-6 text-zinc-700">
                                <li className="pl-1">Bank or institution name</li>
                                <li className="pl-1">Account type, such as checking, savings, or business account</li>
                                <li className="pl-1">Limited account identifiers, such as the last digits of account numbers, used only for identification and reconciliation inside your dashboard</li>
                                <li className="pl-1">Transaction records, including:
                                    <ul className="list-disc pl-6 mt-2 space-y-1">
                                        <li className="pl-1">Amount, currency, date, and posting date</li>
                                        <li className="pl-1">Description and reference fields provided by the bank</li>
                                        <li className="pl-1">Counterparty information present on the statement, such as the name of the paying platform or client</li>
                                    </ul>
                                </li>
                                <li className="pl-1">For manual uploads, the content of your uploaded CSVs or statements</li>
                            </ul>
                            <p className="text-zinc-700 mb-4 leading-relaxed">Zerithum does not store your online banking passwords. Zerithum does not have permission to initiate payments or transfer funds from your accounts.</p>

                            <h3 id="collection-usage" className="text-lg font-bold text-zinc-900 mt-8 mb-4 scroll-mt-32">3.4 Usage and device information</h3>
                            <p className="text-zinc-700 mb-4 leading-relaxed">When you visit Zerithum websites or use the web application, Zerithum automatically collects certain technical information, such as:</p>
                            <ul className="list-disc pl-6 space-y-2 mb-6 text-zinc-700">
                                <li className="pl-1">Device identifiers, such as IP address, browser type and version, and operating system</li>
                                <li className="pl-1">Log data, including pages viewed, buttons clicked, features used, timestamps, and referring URLs</li>
                                <li className="pl-1">Session information, such as login time, access tokens, and approximate location inferred from IP address</li>
                                <li className="pl-1">Error logs and performance metrics to help debug and improve stability</li>
                            </ul>
                            <p className="text-zinc-700 mb-4 leading-relaxed">This information is used for security, analytics, and product improvement.</p>

                            <h3 id="collection-cookies" className="text-lg font-bold text-zinc-900 mt-8 mb-4 scroll-mt-32">3.5 Cookies and similar technologies</h3>
                            <p className="text-zinc-700 mb-4 leading-relaxed">Zerithum uses cookies and similar technologies in its websites and application. These can include:</p>
                            <ul className="list-disc pl-6 space-y-2 mb-6 text-zinc-700">
                                <li className="pl-1">Essential cookies, required for login sessions, security, and core functionality</li>
                                <li className="pl-1">Functional cookies, which remember your preferences, such as language, region, and layout</li>
                                <li className="pl-1">Analytics cookies, which measure traffic, feature use, and conversion metrics</li>
                                <li className="pl-1">In some cases, marketing or attribution cookies related to campaigns or referrals</li>
                            </ul>
                            <p className="text-zinc-700 mb-4 leading-relaxed">Where required by law, Zerithum will request your consent for non essential cookies. You can control cookies through your browser settings and, where available, through the in product cookie settings.</p>

                            <h3 id="collection-communications" className="text-lg font-bold text-zinc-900 mt-8 mb-4 scroll-mt-32">3.6 Communications, feedback, and support data</h3>
                            <p className="text-zinc-700 mb-4 leading-relaxed">If you:</p>
                            <ul className="list-disc pl-6 space-y-2 mb-6 text-zinc-700">
                                <li className="pl-1">Fill out a waitlist or feedback form</li>
                                <li className="pl-1">Respond to a survey</li>
                                <li className="pl-1">Participate in user research or interviews</li>
                                <li className="pl-1">Interact with beta features</li>
                            </ul>
                            <p className="text-zinc-700 mb-4 leading-relaxed">Zerithum may collect:</p>
                            <ul className="list-disc pl-6 space-y-2 mb-6 text-zinc-700">
                                <li className="pl-1">Your responses, opinions, and feedback</li>
                                <li className="pl-1">Details about your creator business, such as approximate revenue ranges, platforms used, and pain points</li>
                                <li className="pl-1">Audio or video recordings of user research sessions, if you consent</li>
                            </ul>
                            <p className="text-zinc-700 mb-4 leading-relaxed">Zerithum uses this information to improve the Services and inform product decisions.</p>
                        </section>

                        <section id="usage" className="mt-12 scroll-mt-32">
                            <h2 className="text-2xl font-serif font-bold text-zinc-900 mb-6">4. How Zerithum uses your information and legal bases</h2>
                            <p className="text-zinc-700 mb-4 leading-relaxed">Zerithum uses personal and business information for clearly defined purposes, under specific legal bases where data protection laws apply.</p>

                            <h3 id="usage-providing" className="text-lg font-bold text-zinc-900 mt-8 mb-4 scroll-mt-32">4.1 Providing and operating the Services</h3>
                            <p className="text-zinc-700 mb-4 leading-relaxed">Zerithum uses your information to:</p>
                            <ul className="list-disc pl-6 space-y-2 mb-6 text-zinc-700">
                                <li className="pl-1">Create and maintain your account</li>
                                <li className="pl-1">Connect to third party platforms and bank feeds, using the tokens you authorize</li>
                                <li className="pl-1">Ingest and organize revenue and transaction data from platforms and banks</li>
                                <li className="pl-1">Reconcile platform reported earnings against bank deposits</li>
                                <li className="pl-1">Generate dashboards, reports, exports, and visualizations</li>
                                <li className="pl-1">Provide tax ready summaries, categories, and exports compatible with tools such as QuickBooks and Xero</li>
                                <li className="pl-1">Enable you to share access or reports with accountants or advisors you choose</li>
                            </ul>
                            <p className="text-zinc-700 mb-4 leading-relaxed"><strong className="font-semibold text-zinc-900">Legal bases:</strong></p>
                            <ul className="list-disc pl-6 space-y-2 mb-6 text-zinc-700">
                                <li className="pl-1">Performance of a contract with you</li>
                                <li className="pl-1">Legitimate interests in operating a functional SaaS platform for creators</li>
                            </ul>

                            <h3 id="usage-security" className="text-lg font-bold text-zinc-900 mt-8 mb-4 scroll-mt-32">4.2 Security, fraud prevention, and abuse detection</h3>
                            <p className="text-zinc-700 mb-4 leading-relaxed">Zerithum uses your information to:</p>
                            <ul className="list-disc pl-6 space-y-2 mb-6 text-zinc-700">
                                <li className="pl-1">Authenticate your identity and manage sessions</li>
                                <li className="pl-1">Detect and prevent suspicious access or abuse of the platform</li>
                                <li className="pl-1">Maintain logs and audit trails of key actions within the app</li>
                                <li className="pl-1">Protect the integrity and availability of the Services</li>
                            </ul>
                            <p className="text-zinc-700 mb-4 leading-relaxed"><strong className="font-semibold text-zinc-900">Legal bases:</strong></p>
                            <ul className="list-disc pl-6 space-y-2 mb-6 text-zinc-700">
                                <li className="pl-1">Legitimate interests in securing systems and users</li>
                                <li className="pl-1">Compliance with legal obligations in some regions</li>
                            </ul>

                            <h3 id="usage-improvement" className="text-lg font-bold text-zinc-900 mt-8 mb-4 scroll-mt-32">4.3 Product improvement and analytics</h3>
                            <p className="text-zinc-700 mb-4 leading-relaxed">Zerithum uses aggregated and pseudonymized data to:</p>
                            <ul className="list-disc pl-6 space-y-2 mb-6 text-zinc-700">
                                <li className="pl-1">Understand which features are most used and which are ignored</li>
                                <li className="pl-1">Analyze performance, usage trends, and conversion funnels</li>
                                <li className="pl-1">Debug issues and improve reliability</li>
                                <li className="pl-1">Develop new features such as improved reconciliation, insights, and reporting</li>
                            </ul>
                            <p className="text-zinc-700 mb-4 leading-relaxed">Where possible, Zerithum does this using aggregated or de identified data that does not identify you directly.</p>
                            <p className="text-zinc-700 mb-4 leading-relaxed"><strong className="font-semibold text-zinc-900">Legal bases:</strong></p>
                            <ul className="list-disc pl-6 space-y-2 mb-6 text-zinc-700">
                                <li className="pl-1">Legitimate interests in improving and developing the Services</li>
                                <li className="pl-1">Consent for certain analytics cookies or tracking technologies, where required</li>
                            </ul>

                            <h3 id="usage-ai" className="text-lg font-bold text-zinc-900 mt-8 mb-4 scroll-mt-32">4.4 AI driven insights and recommendations</h3>
                            <p className="text-zinc-700 mb-4 leading-relaxed">Zerithum uses your historical revenue and transaction data to power AI and machine learning features, including:</p>
                            <ul className="list-disc pl-6 space-y-2 mb-6 text-zinc-700">
                                <li className="pl-1">Forecasting cash inflows based on past payouts</li>
                                <li className="pl-1">Highlighting revenue concentration risk across platforms</li>
                                <li className="pl-1">Suggesting pricing adjustments, for example when demand is consistently strong</li>
                                <li className="pl-1">Detecting anomalies, such as unusual payouts or mismatched transactions</li>
                                <li className="pl-1">Providing benchmarks based on anonymized, aggregated data from similar creators, where available</li>
                            </ul>
                            <p className="text-zinc-700 mb-4 leading-relaxed">Zerithum designs these AI features to assist your decision making. Zerithum does not use AI to make automated decisions that have legal or similarly significant effects on you.</p>
                            <p className="text-zinc-700 mb-4 leading-relaxed">Depending on your region, you may have the right to object to certain uses of your data for profiling or automated analysis. See the "Your privacy rights" section.</p>
                            <p className="text-zinc-700 mb-4 leading-relaxed"><strong className="font-semibold text-zinc-900">Legal bases:</strong></p>
                            <ul className="list-disc pl-6 space-y-2 mb-6 text-zinc-700">
                                <li className="pl-1">Performance of a contract, where insights are part of the core service you selected</li>
                                <li className="pl-1">Legitimate interests in providing analytics and insights that help creators run their businesses</li>
                            </ul>

                            <h3 id="usage-communications" className="text-lg font-bold text-zinc-900 mt-8 mb-4 scroll-mt-32">4.5 Communications, support, and marketing</h3>
                            <p className="text-zinc-700 mb-4 leading-relaxed">Zerithum uses your information to:</p>
                            <ul className="list-disc pl-6 space-y-2 mb-6 text-zinc-700">
                                <li className="pl-1">Respond to your questions and support tickets</li>
                                <li className="pl-1">Send important service messages, such as security alerts, feature announcements, or policy updates</li>
                                <li className="pl-1">Send product tips and educational content, where you have opted in or where the law allows based on an existing customer relationship</li>
                                <li className="pl-1">Manage webinars, beta programs, or user research sessions</li>
                            </ul>
                            <p className="text-zinc-700 mb-4 leading-relaxed">You can opt out of non essential marketing communications at any time by following unsubscribe links in emails or by updating your preferences in the app.</p>
                            <p className="text-zinc-700 mb-4 leading-relaxed"><strong className="font-semibold text-zinc-900">Legal bases:</strong></p>
                            <ul className="list-disc pl-6 space-y-2 mb-6 text-zinc-700">
                                <li className="pl-1">Performance of a contract and legitimate interests for service communications</li>
                                <li className="pl-1">Consent or legitimate interests for marketing, depending on your region</li>
                            </ul>

                            <h3 id="usage-compliance" className="text-lg font-bold text-zinc-900 mt-8 mb-4 scroll-mt-32">4.6 Compliance, legal obligations, and protection of rights</h3>
                            <p className="text-zinc-700 mb-4 leading-relaxed">Zerithum may use your information to:</p>
                            <ul className="list-disc pl-6 space-y-2 mb-6 text-zinc-700">
                                <li className="pl-1">Comply with applicable laws and regulations, including tax and accounting requirements</li>
                                <li className="pl-1">Respond to lawful requests from courts, regulators, or law enforcement agencies</li>
                                <li className="pl-1">Enforce Zerithum’s Terms of Service and other agreements</li>
                                <li className="pl-1">Protect Zerithum’s rights, property, safety, and that of users and third parties</li>
                            </ul>
                            <p className="text-zinc-700 mb-4 leading-relaxed"><strong className="font-semibold text-zinc-900">Legal bases:</strong></p>
                            <ul className="list-disc pl-6 space-y-2 mb-6 text-zinc-700">
                                <li className="pl-1">Compliance with legal obligations</li>
                                <li className="pl-1">Legitimate interests in protecting rights and safety</li>
                            </ul>
                        </section>

                        <section id="connections" className="mt-12 scroll-mt-32">
                            <h2 className="text-2xl font-serif font-bold text-zinc-900 mb-6">5. How Zerithum uses bank and platform connections</h2>
                            <p className="text-zinc-700 mb-4 leading-relaxed">Because Zerithum deals with financial data, this section describes the boundaries very clearly.</p>
                            <ul className="list-disc pl-6 space-y-2 mb-6 text-zinc-700">
                                <li className="pl-1">Zerithum uses third party providers to connect to banks and financial institutions in a read only mode, where possible</li>
                                <li className="pl-1">Zerithum never stores your online banking username or password</li>
                                <li className="pl-1">Zerithum never uses your bank connection to initiate payments or transfers</li>
                                <li className="pl-1">Earnings flow directly from platforms such as YouTube, Patreon, Stripe, or Gumroad to your bank, without passing through Zerithum</li>
                                <li className="pl-1">Zerithum reads transaction data after it has been posted, for reconciliation and reporting</li>
                            </ul>
                            <p className="text-zinc-700 mb-4 leading-relaxed">For platforms such as YouTube, Patreon, or Stripe:</p>
                            <ul className="list-disc pl-6 space-y-2 mb-6 text-zinc-700">
                                <li className="pl-1">Zerithum uses OAuth or similar mechanisms to access their APIs</li>
                                <li className="pl-1">Zerithum requests scopes that allow read only access to earnings and payout data, and does not request scopes for initiating payments on your behalf</li>
                            </ul>
                            <p className="text-zinc-700 mb-4 leading-relaxed">You can revoke Zerithum’s access at any time from the third party platform settings. This may limit or disable some Zerithum features for you.</p>
                        </section>

                        <section id="sharing" className="mt-12 scroll-mt-32">
                            <h2 className="text-2xl font-serif font-bold text-zinc-900 mb-6">6. How Zerithum shares information</h2>
                            <p className="text-zinc-700 mb-4 leading-relaxed">Zerithum does not sell your personal data to third party data brokers or advertisers.</p>
                            <p className="text-zinc-700 mb-4 leading-relaxed">Zerithum shares information in the following situations:</p>

                            <h3 id="sharing-providers" className="text-lg font-bold text-zinc-900 mt-8 mb-4 scroll-mt-32">6.1 Service providers and subprocessors</h3>
                            <p className="text-zinc-700 mb-4 leading-relaxed">Zerithum uses service providers to help operate and improve the Services. These include:</p>
                            <ul className="list-disc pl-6 space-y-2 mb-6 text-zinc-700">
                                <li className="pl-1">Cloud hosting providers and data centers</li>
                                <li className="pl-1">Database and storage providers</li>
                                <li className="pl-1">Authentication and security tools</li>
                                <li className="pl-1">Error monitoring and logging tools</li>
                                <li className="pl-1">Email delivery, notifications, and communication tools</li>
                                <li className="pl-1">Analytics and product usage tools</li>
                                <li className="pl-1">Third party connectors that link to banks and revenue platforms</li>
                            </ul>
                            <p className="text-zinc-700 mb-4 leading-relaxed">These service providers only access your information to perform tasks on Zerithum’s behalf and are bound by contractual obligations to protect your data and to process it only as instructed by Zerithum.</p>
                            <p className="text-zinc-700 mb-4 leading-relaxed">Zerithum maintains a list of key subprocessors and will provide it upon request where legally required.</p>

                            <h3 id="sharing-accountants" className="text-lg font-bold text-zinc-900 mt-8 mb-4 scroll-mt-32">6.2 Accountants, advisors, and collaborators you authorize</h3>
                            <p className="text-zinc-700 mb-4 leading-relaxed">One of Zerithum’s core purposes is to make it easier for you to work with your accountant or advisor. When you:</p>
                            <ul className="list-disc pl-6 space-y-2 mb-6 text-zinc-700">
                                <li className="pl-1">Invite an accountant to your workspace</li>
                                <li className="pl-1">Share exports or reports directly through the platform</li>
                                <li className="pl-1">Connect Zerithum to third party accounting systems such as QuickBooks or Xero</li>
                            </ul>
                            <p className="text-zinc-700 mb-4 leading-relaxed">Zerithum will share the data you choose with that third party, under your direction. Their use of your data is governed by their own terms and privacy policies.</p>
                            <p className="text-zinc-700 mb-4 leading-relaxed">You are responsible for the trust relationships you create by granting such access.</p>

                            <h3 id="sharing-corporate" className="text-lg font-bold text-zinc-900 mt-8 mb-4 scroll-mt-32">6.3 Corporate transactions</h3>
                            <p className="text-zinc-700 mb-4 leading-relaxed">If Zerithum is involved in a merger, acquisition, financing, sale of assets, reorganization, or similar transaction, your information may be transferred as part of that transaction. Zerithum will require any acquiring entity to honor this Policy or to notify you of material changes and choices you may have.</p>

                            <h3 id="sharing-legal" className="text-lg font-bold text-zinc-900 mt-8 mb-4 scroll-mt-32">6.4 Legal obligations and protection of rights</h3>
                            <p className="text-zinc-700 mb-4 leading-relaxed">Zerithum may disclose information to third parties when Zerithum believes in good faith that disclosure is reasonably necessary to:</p>
                            <ul className="list-disc pl-6 space-y-2 mb-6 text-zinc-700">
                                <li className="pl-1">Comply with a law, regulation, legal process, or governmental request</li>
                                <li className="pl-1">Enforce agreements or policies</li>
                                <li className="pl-1">Protect the security or integrity of Zerithum’s Services</li>
                                <li className="pl-1">Protect Zerithum, its users, or the public from harm or illegal activities</li>
                            </ul>
                            <p className="text-zinc-700 mb-4 leading-relaxed">Whenever possible, and where the law allows, Zerithum will notify you before sharing your information in response to legal demands.</p>
                        </section>

                        <section id="international" className="mt-12 scroll-mt-32">
                            <h2 className="text-2xl font-serif font-bold text-zinc-900 mb-6">7. International data transfers</h2>
                            <p className="text-zinc-700 mb-4 leading-relaxed">Zerithum may process and store your information in data centers located in jurisdictions that may have different data protection laws than your home country.</p>
                            <p className="text-zinc-700 mb-4 leading-relaxed">When Zerithum transfers personal data from the European Economic Area, the United Kingdom, or other regions with data transfer restrictions, Zerithum uses appropriate safeguards, which may include:</p>
                            <ul className="list-disc pl-6 space-y-2 mb-6 text-zinc-700">
                                <li className="pl-1">Standard Contractual Clauses approved by the European Commission or UK authorities</li>
                                <li className="pl-1">Data processing agreements with service providers that commit to adequate protection</li>
                                <li className="pl-1">Technical measures such as strong encryption in transit and at rest</li>
                            </ul>
                            <p className="text-zinc-700 mb-4 leading-relaxed">You can contact Zerithum using the details in the "Contact" section for more information about cross border transfer mechanisms.</p>
                        </section>

                        <section id="retention" className="mt-12 scroll-mt-32">
                            <h2 className="text-2xl font-serif font-bold text-zinc-900 mb-6">8. Data retention</h2>
                            <p className="text-zinc-700 mb-4 leading-relaxed">Zerithum keeps personal data for as long as it is reasonably necessary for the purposes described in this Policy, which includes:</p>
                            <ul className="list-disc pl-6 space-y-2 mb-6 text-zinc-700">
                                <li className="pl-1">The duration of your active account and reasonable periods thereafter, to allow reactivation or account recovery</li>
                                <li className="pl-1">Periods required or permitted by law, including tax and accounting record retention requirements</li>
                                <li className="pl-1">Time needed to resolve disputes, enforce agreements, and protect Zerithum’s legal interests</li>
                            </ul>
                            <p className="text-zinc-700 mb-4 leading-relaxed">When Zerithum no longer needs data for these purposes, Zerithum will take steps to delete it or anonymize it. In some cases, Zerithum may retain certain de identified or aggregated data for analytics and reporting, in a form that does not identify you personally.</p>
                            <p className="text-zinc-700 mb-4 leading-relaxed">You can request deletion of your personal data as described in the "Your privacy rights" section. Legal obligations may limit Zerithum’s ability to fully delete certain records immediately, for example where tax laws require retention of transaction history.</p>
                        </section>

                        <section id="security" className="mt-12 scroll-mt-32">
                            <h2 className="text-2xl font-serif font-bold text-zinc-900 mb-6">9. Security</h2>
                            <p className="text-zinc-700 mb-4 leading-relaxed">Zerithum uses technical and organizational measures designed to protect your information from unauthorized access, loss, misuse, or alteration. These measures include:</p>
                            <ul className="list-disc pl-6 space-y-2 mb-6 text-zinc-700">
                                <li className="pl-1">Encryption of data in transit using modern TLS protocols</li>
                                <li className="pl-1">Encryption of data at rest in databases and backups</li>
                                <li className="pl-1">Role based access controls and least privilege principles for internal access</li>
                                <li className="pl-1">Strict limits on production database access, with logging and approvals</li>
                                <li className="pl-1">Audit logging of key actions and access events within the application</li>
                                <li className="pl-1">Regular backups and tested recovery procedures</li>
                                <li className="pl-1">Use of reputable third party infrastructure providers with strong security programs</li>
                            </ul>
                            <p className="text-zinc-700 mb-4 leading-relaxed">No system can guarantee perfect security. Zerithum maintains incident response procedures and will notify you and regulators of certain types of data breaches when required by law.</p>
                        </section>

                        <section id="rights" className="mt-12 scroll-mt-32">
                            <h2 className="text-2xl font-serif font-bold text-zinc-900 mb-6">10. Your privacy rights</h2>
                            <p className="text-zinc-700 mb-4 leading-relaxed">Your rights over your personal data depend on where you live and which laws apply to you. Zerithum aims to honor reasonable requests from all users, within technical and legal limits.</p>

                            <h3 id="rights-global" className="text-lg font-bold text-zinc-900 mt-8 mb-4 scroll-mt-32">10.1 Global rights</h3>
                            <p className="text-zinc-700 mb-4 leading-relaxed">In general, you can:</p>
                            <ul className="list-disc pl-6 space-y-2 mb-6 text-zinc-700">
                                <li className="pl-1">Access your account and view most of your data directly through the app</li>
                                <li className="pl-1">Update or correct certain profile information in your account settings</li>
                                <li className="pl-1">Export reports and data through Zerithum’s export features</li>
                                <li className="pl-1">Delete or disconnect connected platforms and bank accounts</li>
                                <li className="pl-1">Request support to correct inaccuracies in data that you cannot edit yourself</li>
                            </ul>
                            <p className="text-zinc-700 mb-4 leading-relaxed">You can send additional requests by contacting Zerithum at the email address in the "Contact" section.</p>

                            <h3 id="rights-eea" className="text-lg font-bold text-zinc-900 mt-8 mb-4 scroll-mt-32">10.2 EEA and UK residents (GDPR)</h3>
                            <p className="text-zinc-700 mb-4 leading-relaxed">If you are located in the European Economic Area or the United Kingdom, you may have the following rights, subject to conditions and exceptions in law:</p>
                            <ul className="list-disc pl-6 space-y-2 mb-6 text-zinc-700">
                                <li className="pl-1"><strong className="font-semibold text-zinc-900">Right of access:</strong> to know whether Zerithum processes your personal data and to receive a copy</li>
                                <li className="pl-1"><strong className="font-semibold text-zinc-900">Right to rectification:</strong> to correct inaccurate or incomplete data</li>
                                <li className="pl-1"><strong className="font-semibold text-zinc-900">Right to erasure:</strong> to request deletion of your personal data in certain circumstances</li>
                                <li className="pl-1"><strong className="font-semibold text-zinc-900">Right to restriction:</strong> to restrict processing in specific situations</li>
                                <li className="pl-1"><strong className="font-semibold text-zinc-900">Right to data portability:</strong> to receive your personal data in a structured, commonly used format, and to transmit it to another controller where technically feasible</li>
                                <li className="pl-1"><strong className="font-semibold text-zinc-900">Right to object:</strong> to object to processing based on Zerithum’s legitimate interests, including some forms of profiling and analytics</li>
                                <li className="pl-1"><strong className="font-semibold text-zinc-900">Right to withdraw consent:</strong> where processing is based on consent, you can withdraw it at any time, without affecting prior processing</li>
                                <li className="pl-1"><strong className="font-semibold text-zinc-900">Right to lodge a complaint:</strong> with your local data protection authority</li>
                            </ul>
                            <p className="text-zinc-700 mb-4 leading-relaxed">To exercise these rights, contact Zerithum using the details in the "Contact" section. Zerithum may need to verify your identity before responding.</p>

                            <h3 id="rights-california" className="text-lg font-bold text-zinc-900 mt-8 mb-4 scroll-mt-32">10.3 California residents (CCPA / CPRA)</h3>
                            <p className="text-zinc-700 mb-4 leading-relaxed">If you are a resident of California, you may have additional rights under the California Consumer Privacy Act and the California Privacy Rights Act, including:</p>
                            <ul className="list-disc pl-6 space-y-2 mb-6 text-zinc-700">
                                <li className="pl-1"><strong className="font-semibold text-zinc-900">Right to know:</strong> to request disclosure of the categories and specific pieces of personal information collected, sources, purposes, and categories of third parties with whom information is shared</li>
                                <li className="pl-1"><strong className="font-semibold text-zinc-900">Right to delete:</strong> to request deletion of personal information, subject to certain exceptions</li>
                                <li className="pl-1"><strong className="font-semibold text-zinc-900">Right to correct:</strong> to request correction of inaccurate personal information</li>
                                <li className="pl-1"><strong className="font-semibold text-zinc-900">Right to opt out of sale or sharing:</strong> Zerithum does not sell personal information for monetary consideration. If Zerithum ever uses technologies that qualify as "selling" or "sharing" under California law, Zerithum will provide a clear mechanism to opt out.</li>
                                <li className="pl-1"><strong className="font-semibold text-zinc-900">Right to limit use and disclosure of sensitive personal information:</strong> where applicable, you may request limitations on certain uses</li>
                            </ul>
                            <p className="text-zinc-700 mb-4 leading-relaxed">Zerithum will not discriminate against you for exercising your privacy rights, for example by denying services or charging different prices solely because you made a privacy request, except where a difference in service is reasonably related to the value provided by your data.</p>
                            <p className="text-zinc-700 mb-4 leading-relaxed">You may exercise your California rights by contacting Zerithum using the details in the "Contact" section. Zerithum may request information to verify your identity and may allow authorized agents to submit requests on your behalf where permitted.</p>

                            <h3 id="rights-india" className="text-lg font-bold text-zinc-900 mt-8 mb-4 scroll-mt-32">10.4 India residents (Digital Personal Data Protection law)</h3>
                            <p className="text-zinc-700 mb-4 leading-relaxed">If you are located in India, you may have rights under India’s data protection framework, including:</p>
                            <ul className="list-disc pl-6 space-y-2 mb-6 text-zinc-700">
                                <li className="pl-1">Right to access information about the personal data Zerithum processes about you</li>
                                <li className="pl-1">Right to correction and completion of inaccurate or incomplete personal data</li>
                                <li className="pl-1">Right to deletion of personal data, subject to legal retention obligations</li>
                                <li className="pl-1">Right to withdraw consent, where processing is based on consent</li>
                                <li className="pl-1">Right to grievance redressal</li>
                            </ul>
                            <p className="text-zinc-700 mb-4 leading-relaxed">Zerithum will designate a point of contact for privacy and grievance redressal. You can reach out using the details in the "Contact" section. If you are not satisfied with the response, you may have the right to escalate to the appropriate authority, where one exists under applicable law.</p>
                        </section>

                        <section id="children" className="mt-12 scroll-mt-32">
                            <h2 className="text-2xl font-serif font-bold text-zinc-900 mb-6">11. Children’s privacy</h2>
                            <p className="text-zinc-700 mb-4 leading-relaxed">Zerithum is designed for adult creators and businesses. Zerithum does not knowingly collect personal data from children under the age where parental consent is required under applicable law.</p>
                            <p className="text-zinc-700 mb-4 leading-relaxed">If Zerithum becomes aware that it has collected personal data from a child in violation of this Policy or applicable law, Zerithum will take steps to delete that information. If you believe a child has provided Zerithum with personal data, please contact Zerithum using the details in the "Contact" section.</p>
                        </section>

                        <section id="links" className="mt-12 scroll-mt-32">
                            <h2 className="text-2xl font-serif font-bold text-zinc-900 mb-6">12. Third party links and services</h2>
                            <p className="text-zinc-700 mb-4 leading-relaxed">The Services may contain links to third party websites, platforms, or services, including revenue platforms, financial institutions, and accounting providers. Zerithum does not control these third parties and is not responsible for their privacy practices.</p>
                            <p className="text-zinc-700 mb-4 leading-relaxed">Your use of third party services is subject to their own terms and privacy policies. You should review those documents carefully.</p>
                        </section>

                        <section id="changes" className="mt-12 scroll-mt-32">
                            <h2 className="text-2xl font-serif font-bold text-zinc-900 mb-6">13. Changes to this Privacy Policy</h2>
                            <p className="text-zinc-700 mb-4 leading-relaxed">Zerithum may update this Privacy Policy from time to time, for example to reflect:</p>
                            <ul className="list-disc pl-6 space-y-2 mb-6 text-zinc-700">
                                <li className="pl-1">Changes in the Services</li>
                                <li className="pl-1">Changes in legal or regulatory requirements</li>
                                <li className="pl-1">Improvements or clarifications in how Zerithum explains its practices</li>
                            </ul>
                            <p className="text-zinc-700 mb-4 leading-relaxed">When Zerithum makes material changes, Zerithum will:</p>
                            <ul className="list-disc pl-6 space-y-2 mb-6 text-zinc-700">
                                <li className="pl-1">Update the "Last updated" date at the top of this Policy, and</li>
                                <li className="pl-1">Provide additional notice where required, which may include email, in app notifications, or a banner on the website</li>
                            </ul>
                            <p className="text-zinc-700 mb-4 leading-relaxed">Your continued use of the Services after an update will indicate that you have read and understood the updated Policy.</p>
                        </section>

                        <section id="contact" className="mt-12 scroll-mt-32">
                            <h2 className="text-2xl font-serif font-bold text-zinc-900 mb-6">14. Contacting Zerithum</h2>
                            <p className="text-zinc-700 mb-4 leading-relaxed">If you have any questions, concerns, or requests about this Privacy Policy or Zerithum’s data practices, you can Email us at:</p>
                            <p className="text-zinc-700 mb-4 leading-relaxed">
                                <strong className="font-semibold text-zinc-900">Email:</strong> <a href="mailto:privacy@zerithum.com" className="text-emerald-700 hover:text-emerald-800 underline">privacy@zerithum.com</a>
                            </p>
                        </section>
                    </div>

                    <footer className="mt-16 pt-12 border-t border-zinc-200">
                        <Link to="/contact">
                            <Button variant="outline" className="border-zinc-300 text-zinc-700 hover:bg-zinc-100">
                                Contact Support
                            </Button>
                        </Link>
                    </footer>
                </main>

                {/* TOC Sidebar - Order 2 on Mobile, Order 1 on Desktop */}
                <aside className="order-2 lg:order-1 w-full lg:w-1/4 h-fit lg:sticky lg:top-32 mb-8 lg:mb-0 max-h-[calc(100vh-10rem)] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-zinc-200">
                    <h2 className="lg:hidden font-bold text-lg mb-4 text-zinc-900">Table of Contents</h2>
                    <nav className="space-y-1 text-sm border-l border-zinc-200 pl-4">
                        <a href="#scope" className="block text-zinc-600 hover:text-emerald-700 py-1 text-left w-full">1. Scope</a>

                        <a href="#summary" className="block text-zinc-600 hover:text-emerald-700 py-1 text-left w-full font-medium">2. Quick Summary</a>

                        <a href="#collection" className="block text-zinc-600 hover:text-emerald-700 py-1 text-left w-full">3. Information Collection</a>
                        <div className="pl-3 border-l border-zinc-100 ml-1 space-y-1">
                            <a href="#collection-account" className="block text-zinc-500 hover:text-emerald-700 py-0.5 text-left w-full text-xs">3.1 Account & Profile</a>
                            <a href="#collection-platform" className="block text-zinc-500 hover:text-emerald-700 py-0.5 text-left w-full text-xs">3.2 Platform Revenue</a>
                            <a href="#collection-bank" className="block text-zinc-500 hover:text-emerald-700 py-0.5 text-left w-full text-xs">3.3 Bank Data</a>
                            <a href="#collection-usage" className="block text-zinc-500 hover:text-emerald-700 py-0.5 text-left w-full text-xs">3.4 Usage & Device</a>
                            <a href="#collection-cookies" className="block text-zinc-500 hover:text-emerald-700 py-0.5 text-left w-full text-xs">3.5 Cookies</a>
                            <a href="#collection-communications" className="block text-zinc-500 hover:text-emerald-700 py-0.5 text-left w-full text-xs">3.6 Communications</a>
                        </div>

                        <a href="#usage" className="block text-zinc-600 hover:text-emerald-700 py-1 text-left w-full">4. Usage & Legal Bases</a>
                        <div className="pl-3 border-l border-zinc-100 ml-1 space-y-1">
                            <a href="#usage-providing" className="block text-zinc-500 hover:text-emerald-700 py-0.5 text-left w-full text-xs">4.1 Providing Services</a>
                            <a href="#usage-security" className="block text-zinc-500 hover:text-emerald-700 py-0.5 text-left w-full text-xs">4.2 Security</a>
                            <a href="#usage-improvement" className="block text-zinc-500 hover:text-emerald-700 py-0.5 text-left w-full text-xs">4.3 Improvements</a>
                            <a href="#usage-ai" className="block text-zinc-500 hover:text-emerald-700 py-0.5 text-left w-full text-xs">4.4 AI Insights</a>
                            <a href="#usage-communications" className="block text-zinc-500 hover:text-emerald-700 py-0.5 text-left w-full text-xs">4.5 Communications</a>
                            <a href="#usage-compliance" className="block text-zinc-500 hover:text-emerald-700 py-0.5 text-left w-full text-xs">4.6 Compliance</a>
                        </div>

                        <a href="#connections" className="block text-zinc-600 hover:text-emerald-700 py-1 text-left w-full">5. Bank & Platform Connections</a>

                        <a href="#sharing" className="block text-zinc-600 hover:text-emerald-700 py-1 text-left w-full">6. Sharing Information</a>
                        <div className="pl-3 border-l border-zinc-100 ml-1 space-y-1">
                            <a href="#sharing-providers" className="block text-zinc-500 hover:text-emerald-700 py-0.5 text-left w-full text-xs">6.1 Service Providers</a>
                            <a href="#sharing-accountants" className="block text-zinc-500 hover:text-emerald-700 py-0.5 text-left w-full text-xs">6.2 Accountants</a>
                            <a href="#sharing-corporate" className="block text-zinc-500 hover:text-emerald-700 py-0.5 text-left w-full text-xs">6.3 Transactions</a>
                            <a href="#sharing-legal" className="block text-zinc-500 hover:text-emerald-700 py-0.5 text-left w-full text-xs">6.4 Legal Obligations</a>
                        </div>

                        <a href="#international" className="block text-zinc-600 hover:text-emerald-700 py-1 text-left w-full">7. International Transfers</a>
                        <a href="#retention" className="block text-zinc-600 hover:text-emerald-700 py-1 text-left w-full">8. Data Retention</a>
                        <a href="#security" className="block text-zinc-600 hover:text-emerald-700 py-1 text-left w-full">9. Security</a>

                        <a href="#rights" className="block text-zinc-600 hover:text-emerald-700 py-1 text-left w-full">10. Your Rights</a>
                        <div className="pl-3 border-l border-zinc-100 ml-1 space-y-1">
                            <a href="#rights-global" className="block text-zinc-500 hover:text-emerald-700 py-0.5 text-left w-full text-xs">10.1 Global Rights</a>
                            <a href="#rights-eea" className="block text-zinc-500 hover:text-emerald-700 py-0.5 text-left w-full text-xs">10.2 EEA & UK (GDPR)</a>
                            <a href="#rights-california" className="block text-zinc-500 hover:text-emerald-700 py-0.5 text-left w-full text-xs">10.3 California</a>
                            <a href="#rights-india" className="block text-zinc-500 hover:text-emerald-700 py-0.5 text-left w-full text-xs">10.4 India</a>
                        </div>

                        <a href="#children" className="block text-zinc-600 hover:text-emerald-700 py-1 text-left w-full">11. Children's Privacy</a>
                        <a href="#links" className="block text-zinc-600 hover:text-emerald-700 py-1 text-left w-full">12. Third Party Links</a>
                        <a href="#changes" className="block text-zinc-600 hover:text-emerald-700 py-1 text-left w-full">13. Changes</a>
                        <a href="#contact" className="block text-zinc-600 hover:text-emerald-700 py-1 text-left w-full">14. Contact</a>
                    </nav>
                </aside>
            </div>
        </div>
    );
};

export default Privacy;
