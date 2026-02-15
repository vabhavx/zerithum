import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Privacy = () => {
    const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

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
                {/* TOC Sidebar - Sticky on Desktop, Static on Mobile */}
                <aside className="w-full lg:w-1/4 h-fit lg:sticky lg:top-32 mb-8 lg:mb-0">
                    <h2 className="lg:hidden font-bold text-lg mb-4 text-zinc-900">Table of Contents</h2>
                    <nav className="space-y-1 text-sm border-l border-zinc-200 pl-4">
                        <button onClick={() => scrollToSection('scope')} className="block text-zinc-600 hover:text-emerald-700 py-1 text-left w-full">1. Scope</button>
                        <button onClick={() => scrollToSection('summary')} className="block text-zinc-600 hover:text-emerald-700 py-1 text-left w-full font-medium">2. Quick Summary</button>
                        <button onClick={() => scrollToSection('collection')} className="block text-zinc-600 hover:text-emerald-700 py-1 text-left w-full">3. Information Collection</button>
                        <button onClick={() => scrollToSection('usage')} className="block text-zinc-600 hover:text-emerald-700 py-1 text-left w-full">4. Usage & Legal Bases</button>
                        <button onClick={() => scrollToSection('connections')} className="block text-zinc-600 hover:text-emerald-700 py-1 text-left w-full">5. Bank & Platform Connections</button>
                        <button onClick={() => scrollToSection('sharing')} className="block text-zinc-600 hover:text-emerald-700 py-1 text-left w-full">6. Sharing Information</button>
                        <button onClick={() => scrollToSection('international')} className="block text-zinc-600 hover:text-emerald-700 py-1 text-left w-full">7. International Transfers</button>
                        <button onClick={() => scrollToSection('retention')} className="block text-zinc-600 hover:text-emerald-700 py-1 text-left w-full">8. Data Retention</button>
                        <button onClick={() => scrollToSection('security')} className="block text-zinc-600 hover:text-emerald-700 py-1 text-left w-full">9. Security</button>
                        <button onClick={() => scrollToSection('rights')} className="block text-zinc-600 hover:text-emerald-700 py-1 text-left w-full">10. Your Rights</button>
                        <button onClick={() => scrollToSection('children')} className="block text-zinc-600 hover:text-emerald-700 py-1 text-left w-full">11. Children's Privacy</button>
                        <button onClick={() => scrollToSection('links')} className="block text-zinc-600 hover:text-emerald-700 py-1 text-left w-full">12. Third Party Links</button>
                        <button onClick={() => scrollToSection('changes')} className="block text-zinc-600 hover:text-emerald-700 py-1 text-left w-full">13. Changes</button>
                        <button onClick={() => scrollToSection('contact')} className="block text-zinc-600 hover:text-emerald-700 py-1 text-left w-full">14. Contact</button>
                    </nav>
                </aside>

                <main className="lg:w-3/4 max-w-none">
                    <header className="mb-12 border-b border-zinc-200 pb-8">
                        <h1 className="text-4xl font-serif font-bold text-zinc-900 mb-6 leading-tight">
                            Privacy Policy
                        </h1>
                        <p className="text-lg text-zinc-600 leading-relaxed font-serif">
                            Last updated: {currentDate}
                        </p>
                    </header>

                    <div className="prose prose-zinc max-w-none prose-h2:font-serif prose-h2:text-2xl prose-h2:text-zinc-900 prose-h3:font-sans prose-h3:text-lg prose-h3:font-semibold prose-h3:text-zinc-800 prose-p:text-zinc-700 prose-li:text-zinc-700">
                        <p className="lead text-xl text-zinc-600 mb-8">
                            Zerithum respects the privacy of creators and their businesses. This Privacy Policy explains how Zerithum collects, uses, shares, and protects information about you when you use zerithum.com, our web application, and related services (collectively, the "Services").
                        </p>

                        <p>
                            By using the Services, you agree to the practices described in this Privacy Policy. If you do not agree, you should not use the Services.
                        </p>

                        <p>
                            For the purposes of this Policy, "Zerithum", "we", and "us" refer to Zerithum and its operating entity. "You" refers to individual creators, accountants, and other users of the Services.
                        </p>

                        <section id="scope" className="mt-12 scroll-mt-32">
                            <h2>1. Scope and who this policy applies to</h2>
                            <p>This Privacy Policy applies to:</p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>Visitors to our websites and landing pages</li>
                                <li>Individual creators and businesses who create an account with Zerithum</li>
                                <li>Accountants, tax professionals, and advisors who access creator data through Zerithum</li>
                                <li>Any person who contacts us by email, support channels, or forms</li>
                            </ol>
                            <p>This Policy does not apply to:</p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>Third party platforms you connect to Zerithum, such as YouTube, Patreon, Stripe, Gumroad, or your bank</li>
                                <li>Third party websites or services that link to or from Zerithum, but that Zerithum does not control</li>
                            </ol>
                            <p>Those services have their own privacy policies. You should review them carefully.</p>
                        </section>

                        {/* Quick Summary Card */}
                        <section id="summary" className="mt-12 scroll-mt-32 bg-emerald-50 border border-emerald-200 rounded-lg p-8 not-prose">
                            <h2 className="text-2xl font-serif font-bold text-emerald-900 mb-6">2. Quick summary for creators</h2>
                            <p className="text-zinc-700 mb-4 font-medium">This is an informal summary for clarity. The full Policy that follows is the binding version.</p>
                            <ol className="space-y-3 list-decimal pl-5 marker:text-emerald-600 marker:font-bold">
                                <li className="pl-1 text-zinc-700">
                                    Zerithum is accounting and revenue analytics software for creators
                                </li>
                                <li className="pl-1 text-zinc-700">
                                    Zerithum connects to your revenue platforms and bank in a read only way
                                </li>
                                <li className="pl-1 text-zinc-700">
                                    Zerithum does not hold your money, initiate payments, or act as a wallet or bank
                                </li>
                                <li className="pl-1 text-zinc-700">
                                    Zerithum does not store your banking passwords or card numbers
                                </li>
                                <li className="pl-1 text-zinc-700">
                                    Zerithum collects business and financial data so it can reconcile your income, generate reports, and provide insights
                                </li>
                                <li className="pl-1 text-zinc-700">
                                    Zerithum does not sell your personal data to third party advertisers
                                </li>
                                <li className="pl-1 text-zinc-700">
                                    Zerithum shares data with service providers that help operate the product, with your accountant or advisor when you authorize it, and when required by law
                                </li>
                                <li className="pl-1 text-zinc-700">
                                    Zerithum follows data protection laws in key regions, including GDPR (EEA and UK), CCPA / CPRA (California), and India’s Digital Personal Data Protection law, as applicable
                                </li>
                                <li className="pl-1 text-zinc-700">
                                    You have rights over your data, including access, correction, deletion, and export, subject to legal limits
                                </li>
                            </ol>
                            <p className="mt-6 text-sm text-zinc-500 italic">The rest of this Policy gives full legal detail.</p>
                        </section>

                        <section id="collection" className="mt-12 scroll-mt-32">
                            <h2>3. What information Zerithum collects</h2>
                            <p>Zerithum collects different types of information depending on how you interact with the Services.</p>

                            <h3>3.1 Account and profile information</h3>
                            <p>When you create a Zerithum account or communicate with us, we collect:</p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>Name, display name, and contact details such as email address and phone number</li>
                                <li>Password or authentication credentials, if you sign up with email and password</li>
                                <li>Organization or business name, if you provide one</li>
                                <li>Role or relationship, for example creator, accountant, advisor, team member</li>
                                <li>Country and time zone</li>
                                <li>Communication preferences and consents</li>
                            </ol>
                            <p>If you contact us directly, Zerithum also collects:</p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>The content of your messages or support requests</li>
                                <li>Any attachments you send</li>
                                <li>Metadata about the communication, such as date, time, and channel</li>
                            </ol>

                            <h3>3.2 Connected platform revenue data</h3>
                            <p>When you connect third party platforms to Zerithum, Zerithum collects revenue related data through those platforms’ APIs, based on the permissions you grant. This may include:</p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>Platform identifiers, for example your YouTube channel ID, Patreon creator ID, Stripe account ID, or Gumroad account ID</li>
                                <li>Transaction level details from those platforms, such as:
                                    <ol className="list-[lower-alpha] pl-5 mt-2">
                                        <li>Amount, currency, and date of each payout or earning</li>
                                        <li>Revenue source or category, for example ad revenue, memberships, course sales, sponsorships, affiliate payouts</li>
                                        <li>Platform fees, refunds, chargebacks, or adjustments</li>
                                    </ol>
                                </li>
                                <li>Platform level metadata for reconciliation, such as transaction IDs, payout IDs, and reference numbers</li>
                                <li>Aggregated analytics related to revenue, such as monthly totals and trends</li>
                                <li>Limited business metadata related to your creator profile on those platforms, for example membership tiers or product names, where required for reporting</li>
                            </ol>
                            <p>Zerithum does not request or store your passwords for these third party platforms. Zerithum uses OAuth or equivalent delegated access that those platforms provide.</p>

                            <h3>3.3 Bank and financial data</h3>
                            <p>When you connect a bank or financial institution to Zerithum through a third party aggregation service (for example a provider such as Plaid or similar), or when you upload statements manually, Zerithum may collect:</p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>Bank or institution name</li>
                                <li>Account type, such as checking, savings, or business account</li>
                                <li>Limited account identifiers, such as the last digits of account numbers, used only for identification and reconciliation inside your dashboard</li>
                                <li>Transaction records, including:
                                    <ol className="list-[lower-alpha] pl-5 mt-2">
                                        <li>Amount, currency, date, and posting date</li>
                                        <li>Description and reference fields provided by the bank</li>
                                        <li>Counterparty information present on the statement, such as the name of the paying platform or client</li>
                                    </ol>
                                </li>
                                <li>For manual uploads, the content of your uploaded CSVs or statements</li>
                            </ol>
                            <p>Zerithum does not store your online banking passwords. Zerithum does not have permission to initiate payments or transfer funds from your accounts.</p>

                            <h3>3.4 Usage and device information</h3>
                            <p>When you visit Zerithum websites or use the web application, Zerithum automatically collects certain technical information, such as:</p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>Device identifiers, such as IP address, browser type and version, and operating system</li>
                                <li>Log data, including pages viewed, buttons clicked, features used, timestamps, and referring URLs</li>
                                <li>Session information, such as login time, access tokens, and approximate location inferred from IP address</li>
                                <li>Error logs and performance metrics to help debug and improve stability</li>
                            </ol>
                            <p>This information is used for security, analytics, and product improvement.</p>

                            <h3>3.5 Cookies and similar technologies</h3>
                            <p>Zerithum uses cookies and similar technologies in its websites and application. These can include:</p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>Essential cookies, required for login sessions, security, and core functionality</li>
                                <li>Functional cookies, which remember your preferences, such as language, region, and layout</li>
                                <li>Analytics cookies, which measure traffic, feature use, and conversion metrics</li>
                                <li>In some cases, marketing or attribution cookies related to campaigns or referrals</li>
                            </ol>
                            <p>Where required by law, Zerithum will request your consent for non essential cookies. You can control cookies through your browser settings and, where available, through the in product cookie settings.</p>

                            <h3>3.6 Communications, feedback, and support data</h3>
                            <p>If you:</p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>Fill out a waitlist or feedback form</li>
                                <li>Respond to a survey</li>
                                <li>Participate in user research or interviews</li>
                                <li>Interact with beta features</li>
                            </ol>
                            <p>Zerithum may collect:</p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>Your responses, opinions, and feedback</li>
                                <li>Details about your creator business, such as approximate revenue ranges, platforms used, and pain points</li>
                                <li>Audio or video recordings of user research sessions, if you consent</li>
                            </ol>
                            <p>Zerithum uses this information to improve the Services and inform product decisions.</p>
                        </section>

                        <section id="usage" className="mt-12 scroll-mt-32">
                            <h2>4. How Zerithum uses your information and legal bases</h2>
                            <p>Zerithum uses personal and business information for clearly defined purposes, under specific legal bases where data protection laws apply.</p>

                            <h3>4.1 Providing and operating the Services</h3>
                            <p>Zerithum uses your information to:</p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>Create and maintain your account</li>
                                <li>Connect to third party platforms and bank feeds, using the tokens you authorize</li>
                                <li>Ingest and organize revenue and transaction data from platforms and banks</li>
                                <li>Reconcile platform reported earnings against bank deposits</li>
                                <li>Generate dashboards, reports, exports, and visualizations</li>
                                <li>Provide tax ready summaries, categories, and exports compatible with tools such as QuickBooks and Xero</li>
                                <li>Enable you to share access or reports with accountants or advisors you choose</li>
                            </ol>
                            <p><strong>Legal bases:</strong></p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>Performance of a contract with you</li>
                                <li>Legitimate interests in operating a functional SaaS platform for creators</li>
                            </ol>

                            <h3>4.2 Security, fraud prevention, and abuse detection</h3>
                            <p>Zerithum uses your information to:</p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>Authenticate your identity and manage sessions</li>
                                <li>Detect and prevent suspicious access or abuse of the platform</li>
                                <li>Maintain logs and audit trails of key actions within the app</li>
                                <li>Protect the integrity and availability of the Services</li>
                            </ol>
                            <p><strong>Legal bases:</strong></p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>Legitimate interests in securing systems and users</li>
                                <li>Compliance with legal obligations in some regions</li>
                            </ol>

                            <h3>4.3 Product improvement and analytics</h3>
                            <p>Zerithum uses aggregated and pseudonymized data to:</p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>Understand which features are most used and which are ignored</li>
                                <li>Analyze performance, usage trends, and conversion funnels</li>
                                <li>Debug issues and improve reliability</li>
                                <li>Develop new features such as improved reconciliation, insights, and reporting</li>
                            </ol>
                            <p>Where possible, Zerithum does this using aggregated or de identified data that does not identify you directly.</p>
                            <p><strong>Legal bases:</strong></p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>Legitimate interests in improving and developing the Services</li>
                                <li>Consent for certain analytics cookies or tracking technologies, where required</li>
                            </ol>

                            <h3>4.4 AI driven insights and recommendations</h3>
                            <p>Zerithum uses your historical revenue and transaction data to power AI and machine learning features, including:</p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>Forecasting cash inflows based on past payouts</li>
                                <li>Highlighting revenue concentration risk across platforms</li>
                                <li>Suggesting pricing adjustments, for example when demand is consistently strong</li>
                                <li>Detecting anomalies, such as unusual payouts or mismatched transactions</li>
                                <li>Providing benchmarks based on anonymized, aggregated data from similar creators, where available</li>
                            </ol>
                            <p>Zerithum designs these AI features to assist your decision making. Zerithum does not use AI to make automated decisions that have legal or similarly significant effects on you.</p>
                            <p>Depending on your region, you may have the right to object to certain uses of your data for profiling or automated analysis. See the "Your privacy rights" section.</p>
                            <p><strong>Legal bases:</strong></p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>Performance of a contract, where insights are part of the core service you selected</li>
                                <li>Legitimate interests in providing analytics and insights that help creators run their businesses</li>
                            </ol>

                            <h3>4.5 Communications, support, and marketing</h3>
                            <p>Zerithum uses your information to:</p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>Respond to your questions and support tickets</li>
                                <li>Send important service messages, such as security alerts, feature announcements, or policy updates</li>
                                <li>Send product tips and educational content, where you have opted in or where the law allows based on an existing customer relationship</li>
                                <li>Manage webinars, beta programs, or user research sessions</li>
                            </ol>
                            <p>You can opt out of non essential marketing communications at any time by following unsubscribe links in emails or by updating your preferences in the app.</p>
                            <p><strong>Legal bases:</strong></p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>Performance of a contract and legitimate interests for service communications</li>
                                <li>Consent or legitimate interests for marketing, depending on your region</li>
                            </ol>

                            <h3>4.6 Compliance, legal obligations, and protection of rights</h3>
                            <p>Zerithum may use your information to:</p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>Comply with applicable laws and regulations, including tax and accounting requirements</li>
                                <li>Respond to lawful requests from courts, regulators, or law enforcement agencies</li>
                                <li>Enforce Zerithum’s Terms of Service and other agreements</li>
                                <li>Protect Zerithum’s rights, property, safety, and that of users and third parties</li>
                            </ol>
                            <p><strong>Legal bases:</strong></p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>Compliance with legal obligations</li>
                                <li>Legitimate interests in protecting rights and safety</li>
                            </ol>
                        </section>

                        <section id="connections" className="mt-12 scroll-mt-32">
                            <h2>5. How Zerithum uses bank and platform connections</h2>
                            <p>Because Zerithum deals with financial data, this section describes the boundaries very clearly.</p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>Zerithum uses third party providers to connect to banks and financial institutions in a read only mode, where possible</li>
                                <li>Zerithum never stores your online banking username or password</li>
                                <li>Zerithum never uses your bank connection to initiate payments or transfers</li>
                                <li>Earnings flow directly from platforms such as YouTube, Patreon, Stripe, or Gumroad to your bank, without passing through Zerithum</li>
                                <li>Zerithum reads transaction data after it has been posted, for reconciliation and reporting</li>
                            </ol>
                            <p>For platforms such as YouTube, Patreon, or Stripe:</p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>Zerithum uses OAuth or similar mechanisms to access their APIs</li>
                                <li>Zerithum requests scopes that allow read only access to earnings and payout data, and does not request scopes for initiating payments on your behalf</li>
                            </ol>
                            <p>You can revoke Zerithum’s access at any time from the third party platform settings. This may limit or disable some Zerithum features for you.</p>
                        </section>

                        <section id="sharing" className="mt-12 scroll-mt-32">
                            <h2>6. How Zerithum shares information</h2>
                            <p>Zerithum does not sell your personal data to third party data brokers or advertisers.</p>
                            <p>Zerithum shares information in the following situations:</p>

                            <h3>6.1 Service providers and subprocessors</h3>
                            <p>Zerithum uses service providers to help operate and improve the Services. These include:</p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>Cloud hosting providers and data centers</li>
                                <li>Database and storage providers</li>
                                <li>Authentication and security tools</li>
                                <li>Error monitoring and logging tools</li>
                                <li>Email delivery, notifications, and communication tools</li>
                                <li>Analytics and product usage tools</li>
                                <li>Third party connectors that link to banks and revenue platforms</li>
                            </ol>
                            <p>These service providers only access your information to perform tasks on Zerithum’s behalf and are bound by contractual obligations to protect your data and to process it only as instructed by Zerithum.</p>
                            <p>Zerithum maintains a list of key subprocessors and will provide it upon request where legally required.</p>

                            <h3>6.2 Accountants, advisors, and collaborators you authorize</h3>
                            <p>One of Zerithum’s core purposes is to make it easier for you to work with your accountant or advisor. When you:</p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>Invite an accountant to your workspace</li>
                                <li>Share exports or reports directly through the platform</li>
                                <li>Connect Zerithum to third party accounting systems such as QuickBooks or Xero</li>
                            </ol>
                            <p>Zerithum will share the data you choose with that third party, under your direction. Their use of your data is governed by their own terms and privacy policies.</p>
                            <p>You are responsible for the trust relationships you create by granting such access.</p>

                            <h3>6.3 Corporate transactions</h3>
                            <p>If Zerithum is involved in a merger, acquisition, financing, sale of assets, reorganization, or similar transaction, your information may be transferred as part of that transaction. Zerithum will require any acquiring entity to honor this Policy or to notify you of material changes and choices you may have.</p>

                            <h3>6.4 Legal obligations and protection of rights</h3>
                            <p>Zerithum may disclose information to third parties when Zerithum believes in good faith that disclosure is reasonably necessary to:</p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>Comply with a law, regulation, legal process, or governmental request</li>
                                <li>Enforce agreements or policies</li>
                                <li>Protect the security or integrity of Zerithum’s Services</li>
                                <li>Protect Zerithum, its users, or the public from harm or illegal activities</li>
                            </ol>
                            <p>Whenever possible, and where the law allows, Zerithum will notify you before sharing your information in response to legal demands.</p>
                        </section>

                        <section id="international" className="mt-12 scroll-mt-32">
                            <h2>7. International data transfers</h2>
                            <p>Zerithum may process and store your information in data centers located in jurisdictions that may have different data protection laws than your home country.</p>
                            <p>When Zerithum transfers personal data from the European Economic Area, the United Kingdom, or other regions with data transfer restrictions, Zerithum uses appropriate safeguards, which may include:</p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>Standard Contractual Clauses approved by the European Commission or UK authorities</li>
                                <li>Data processing agreements with service providers that commit to adequate protection</li>
                                <li>Technical measures such as strong encryption in transit and at rest</li>
                            </ol>
                            <p>You can contact Zerithum using the details in the "Contact" section for more information about cross border transfer mechanisms.</p>
                        </section>

                        <section id="retention" className="mt-12 scroll-mt-32">
                            <h2>8. Data retention</h2>
                            <p>Zerithum keeps personal data for as long as it is reasonably necessary for the purposes described in this Policy, which includes:</p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>The duration of your active account and reasonable periods thereafter, to allow reactivation or account recovery</li>
                                <li>Periods required or permitted by law, including tax and accounting record retention requirements</li>
                                <li>Time needed to resolve disputes, enforce agreements, and protect Zerithum’s legal interests</li>
                            </ol>
                            <p>When Zerithum no longer needs data for these purposes, Zerithum will take steps to delete it or anonymize it. In some cases, Zerithum may retain certain de identified or aggregated data for analytics and reporting, in a form that does not identify you personally.</p>
                            <p>You can request deletion of your personal data as described in the "Your privacy rights" section. Legal obligations may limit Zerithum’s ability to fully delete certain records immediately, for example where tax laws require retention of transaction history.</p>
                        </section>

                        <section id="security" className="mt-12 scroll-mt-32">
                            <h2>9. Security</h2>
                            <p>Zerithum uses technical and organizational measures designed to protect your information from unauthorized access, loss, misuse, or alteration. These measures include:</p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>Encryption of data in transit using modern TLS protocols</li>
                                <li>Encryption of data at rest in databases and backups</li>
                                <li>Role based access controls and least privilege principles for internal access</li>
                                <li>Strict limits on production database access, with logging and approvals</li>
                                <li>Audit logging of key actions and access events within the application</li>
                                <li>Regular backups and tested recovery procedures</li>
                                <li>Use of reputable third party infrastructure providers with strong security programs</li>
                            </ol>
                            <p>No system can guarantee perfect security. Zerithum maintains incident response procedures and will notify you and regulators of certain types of data breaches when required by law.</p>
                        </section>

                        <section id="rights" className="mt-12 scroll-mt-32">
                            <h2>10. Your privacy rights</h2>
                            <p>Your rights over your personal data depend on where you live and which laws apply to you. Zerithum aims to honor reasonable requests from all users, within technical and legal limits.</p>

                            <h3>10.1 Global rights</h3>
                            <p>In general, you can:</p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>Access your account and view most of your data directly through the app</li>
                                <li>Update or correct certain profile information in your account settings</li>
                                <li>Export reports and data through Zerithum’s export features</li>
                                <li>Delete or disconnect connected platforms and bank accounts</li>
                                <li>Request support to correct inaccuracies in data that you cannot edit yourself</li>
                            </ol>
                            <p>You can send additional requests by contacting Zerithum at the email address in the "Contact" section.</p>

                            <h3>10.2 EEA and UK residents (GDPR)</h3>
                            <p>If you are located in the European Economic Area or the United Kingdom, you may have the following rights, subject to conditions and exceptions in law:</p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li><strong>Right of access:</strong> to know whether Zerithum processes your personal data and to receive a copy</li>
                                <li><strong>Right to rectification:</strong> to correct inaccurate or incomplete data</li>
                                <li><strong>Right to erasure:</strong> to request deletion of your personal data in certain circumstances</li>
                                <li><strong>Right to restriction:</strong> to restrict processing in specific situations</li>
                                <li><strong>Right to data portability:</strong> to receive your personal data in a structured, commonly used format, and to transmit it to another controller where technically feasible</li>
                                <li><strong>Right to object:</strong> to object to processing based on Zerithum’s legitimate interests, including some forms of profiling and analytics</li>
                                <li><strong>Right to withdraw consent:</strong> where processing is based on consent, you can withdraw it at any time, without affecting prior processing</li>
                                <li><strong>Right to lodge a complaint:</strong> with your local data protection authority</li>
                            </ol>
                            <p>To exercise these rights, contact Zerithum using the details in the "Contact" section. Zerithum may need to verify your identity before responding.</p>

                            <h3>10.3 California residents (CCPA / CPRA)</h3>
                            <p>If you are a resident of California, you may have additional rights under the California Consumer Privacy Act and the California Privacy Rights Act, including:</p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li><strong>Right to know:</strong> to request disclosure of the categories and specific pieces of personal information collected, sources, purposes, and categories of third parties with whom information is shared</li>
                                <li><strong>Right to delete:</strong> to request deletion of personal information, subject to certain exceptions</li>
                                <li><strong>Right to correct:</strong> to request correction of inaccurate personal information</li>
                                <li><strong>Right to opt out of sale or sharing:</strong> Zerithum does not sell personal information for monetary consideration. If Zerithum ever uses technologies that qualify as "selling" or "sharing" under California law, Zerithum will provide a clear mechanism to opt out.</li>
                                <li><strong>Right to limit use and disclosure of sensitive personal information:</strong> where applicable, you may request limitations on certain uses</li>
                            </ol>
                            <p>Zerithum will not discriminate against you for exercising your privacy rights, for example by denying services or charging different prices solely because you made a privacy request, except where a difference in service is reasonably related to the value provided by your data.</p>
                            <p>You may exercise your California rights by contacting Zerithum using the details in the "Contact" section. Zerithum may request information to verify your identity and may allow authorized agents to submit requests on your behalf where permitted.</p>

                            <h3>10.4 India residents (Digital Personal Data Protection law)</h3>
                            <p>If you are located in India, you may have rights under India’s data protection framework, including:</p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>Right to access information about the personal data Zerithum processes about you</li>
                                <li>Right to correction and completion of inaccurate or incomplete personal data</li>
                                <li>Right to deletion of personal data, subject to legal retention obligations</li>
                                <li>Right to withdraw consent, where processing is based on consent</li>
                                <li>Right to grievance redressal</li>
                            </ol>
                            <p>Zerithum will designate a point of contact for privacy and grievance redressal. You can reach out using the details in the "Contact" section. If you are not satisfied with the response, you may have the right to escalate to the appropriate authority, where one exists under applicable law.</p>
                        </section>

                        <section id="children" className="mt-12 scroll-mt-32">
                            <h2>11. Children’s privacy</h2>
                            <p>Zerithum is designed for adult creators and businesses. Zerithum does not knowingly collect personal data from children under the age where parental consent is required under applicable law.</p>
                            <p>If Zerithum becomes aware that it has collected personal data from a child in violation of this Policy or applicable law, Zerithum will take steps to delete that information. If you believe a child has provided Zerithum with personal data, please contact Zerithum using the details in the "Contact" section.</p>
                        </section>

                        <section id="links" className="mt-12 scroll-mt-32">
                            <h2>12. Third party links and services</h2>
                            <p>The Services may contain links to third party websites, platforms, or services, including revenue platforms, financial institutions, and accounting providers. Zerithum does not control these third parties and is not responsible for their privacy practices.</p>
                            <p>Your use of third party services is subject to their own terms and privacy policies. You should review those documents carefully.</p>
                        </section>

                        <section id="changes" className="mt-12 scroll-mt-32">
                            <h2>13. Changes to this Privacy Policy</h2>
                            <p>Zerithum may update this Privacy Policy from time to time, for example to reflect:</p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>Changes in the Services</li>
                                <li>Changes in legal or regulatory requirements</li>
                                <li>Improvements or clarifications in how Zerithum explains its practices</li>
                            </ol>
                            <p>When Zerithum makes material changes, Zerithum will:</p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>Update the "Last updated" date at the top of this Policy, and</li>
                                <li>Provide additional notice where required, which may include email, in app notifications, or a banner on the website</li>
                            </ol>
                            <p>Your continued use of the Services after an update will indicate that you have read and understood the updated Policy.</p>
                        </section>

                        <section id="contact" className="mt-12 scroll-mt-32">
                            <h2>14. Contacting Zerithum</h2>
                            <p>If you have any questions, concerns, or requests about this Privacy Policy or Zerithum’s data practices, you can Email us at:</p>
                            <p>
                                <strong>Email:</strong> <a href="mailto:privacy@zerithum.com" className="text-emerald-700 hover:text-emerald-800 underline">privacy@zerithum.com</a>
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
            </div>
        </div>
    );
};

export default Privacy;
