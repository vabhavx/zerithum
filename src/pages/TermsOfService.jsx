import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUp } from 'lucide-react';

const TermsOfService = () => {
    const [activeSection, setActiveSection] = useState('section-1');
    const [showScrollTop, setShowScrollTop] = useState(false);
    const observer = useRef(null);

    useEffect(() => {
        // Observer for active section highlighting
        const options = {
            root: null,
            rootMargin: '-20% 0px -60% 0px', // Trigger when section is near top
            threshold: 0
        };

        observer.current = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        }, options);

        const sections = document.querySelectorAll('section[id^="section-"]');
        sections.forEach(section => observer.current.observe(section));

        // Scroll listener for back-to-top button
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 400);
        };
        window.addEventListener('scroll', handleScroll);

        return () => {
            if (observer.current) observer.current.disconnect();
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            // Offset for fixed header/sticky TOC if needed
            const offset = 20;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
            setActiveSection(id);
        }
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const sections = [
        { id: 'section-1', title: '1. Definitions' },
        { id: 'section-2', title: '2. Acceptance of Terms' },
        { id: 'section-3', title: '3. Description of Service' },
        { id: 'section-4', title: '4. Eligibility and Account Registration' },
        { id: 'section-5', title: '5. Subscription Plans and Billing' },
        { id: 'section-6', title: '6. Free Trials' },
        { id: 'section-7', title: '7. Cancellation and Termination' },
        { id: 'section-8', title: '8. Platform Connections and Data Access' },
        { id: 'section-9', title: '9. Data Privacy and Security' },
        { id: 'section-10', title: '10. Acceptable Use Policy' },
        { id: 'section-11', title: '11. Intellectual Property Rights' },
        { id: 'section-12', title: '12. Disclaimers and Warranties' },
        { id: 'section-13', title: '13. Limitation of Liability' },
        { id: 'section-14', title: '14. Indemnification' },
        { id: 'section-15', title: '15. Dispute Resolution' },
        { id: 'section-16', title: '16. Changes to the Service' },
        { id: 'section-17', title: '17. Miscellaneous Provisions' },
        { id: 'section-18', title: '18. Contact Information' },
        { id: 'section-19', title: '19. Acknowledgment' },
    ];

    const legalWarningClass = "text-sm md:text-[15px] font-semibold text-[#d32f2f] leading-relaxed bg-[#fef5f5] p-5 border-l-4 border-[#d32f2f] my-6 uppercase print:border print:border-black print:text-black print:bg-transparent not-prose";
    const contactSectionClass = "contact-section bg-[#f8f9fa] p-8 rounded-lg mt-12 print:bg-transparent print:border print:border-black not-prose";
    const acknowledgmentSectionClass = "acknowledgment-section bg-[#f0f7f8] p-8 rounded-lg border-2 border-[#208D9E] my-12 print:bg-transparent print:border print:border-black not-prose";
    const contactLinkClass = "contact-link text-[#208D9E] no-underline border-b border-transparent hover:border-[#208D9E] transition-colors print:text-black print:no-underline";

    return (
        <div className="min-h-screen bg-white text-[#3a3a3a] font-sans selection:bg-[#e5f9fb] print:bg-white print:text-black">

            {/* Navigation */}
            <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 md:px-8 py-4 print:hidden">
                <div className="max-w-[1200px] mx-auto flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2 text-gray-800 hover:text-[#208D9E] transition-colors group font-medium text-sm md:text-base">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Home
                    </Link>
                    <div className="hidden md:block text-sm text-gray-500 font-medium">
                        Legal &gt; Terms of Service
                    </div>
                </div>
            </nav>

            <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row gap-8 lg:gap-16 px-4 md:px-8 py-8 md:py-12 relative">
                {/* Table of Contents Sidebar */}
                <aside className="hidden md:block w-64 lg:w-72 flex-shrink-0 relative print:hidden">
                    <div className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto pr-4 custom-scrollbar">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 pl-3">Contents</h4>
                        <nav className="flex flex-col space-y-1">
                            {sections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => scrollToSection(section.id)}
                                    className={`text-left text-sm py-2 px-3 rounded-md transition-colors duration-200 border-l-2 ${
                                        activeSection === section.id
                                            ? 'border-[#208D9E] bg-[#f0f7f8] text-[#208D9E] font-medium'
                                            : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                    {section.title}
                                </button>
                            ))}
                        </nav>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 max-w-[800px] mx-auto w-full pb-16 print:w-full print:m-0 print:p-0">
                    <article className="prose prose-zinc max-w-none prose-headings:font-sans [&_h1]:text-[28px] md:[&_h1]:text-4xl [&_h1]:font-bold [&_h1]:text-[#1a1a1a] [&_h1]:mb-4 [&_h2]:text-xl md:[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-[#1a1a1a] [&_h2]:mt-12 [&_h2]:mb-5 [&_h2]:border-b-2 [&_h2]:border-[#e5e5e5] [&_h2]:pb-3 [&_h3]:text-base md:[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-[#2a2a2a] [&_h3]:mt-8 [&_h3]:mb-4 [&_p]:text-[15px] md:[&_p]:text-base [&_p]:text-[#3a3a3a] [&_p]:leading-relaxed [&_li]:text-[15px] md:[&_li]:text-base [&_li]:text-[#3a3a3a] [&_strong]:font-semibold [&_strong]:text-[#1a1a1a] print:[&_h1]:text-black print:[&_h2]:text-black print:[&_h3]:text-black print:[&_p]:text-black print:[&_li]:text-black">
                        <header className="mb-8 md:mb-12">
                            <h1>Terms of Service</h1>
                            <div className="flex flex-col sm:flex-row sm:gap-8 text-sm text-gray-500 border-b border-gray-200 pb-4 mb-8 not-prose">
                                <p className="mb-1 sm:mb-0"><strong>Last Updated:</strong> February 15, 2026</p>
                                <p className="mb-0"><strong>Effective Date:</strong> February 15, 2026</p>
                            </div>
                            <p className="lead text-lg mb-6">
                                Welcome to Zerithum. We built this platform to help content creators like you manage revenue across multiple platforms without the stress of manual tracking and reconciliation. These Terms of Service govern your use of our services and establish a clear, fair relationship between us.
                            </p>
                            <p>
                                Please read these terms carefully. By creating an account or using Zerithum, you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.
                            </p>
                        </header>

                        <section id="section-1">
                            <h2>1. Definitions</h2>
                            <p>For clarity, these terms have the following meanings throughout this agreement:</p>
                            <p>
                                <dfn>"Service"</dfn> or <dfn>"Platform"</dfn> means the Zerithum software application, website (zerithum.com), and all related services provided by us.
                            </p>
                            <p>
                                <dfn>"We,"</dfn> <dfn>"Us,"</dfn> <dfn>"Our,"</dfn> or <dfn>"Zerithum"</dfn> refers to Zerithum and its affiliates, employees, and agents.
                            </p>
                            <p>
                                <dfn>"You,"</dfn> <dfn>"Your,"</dfn> or <dfn>"Creator"</dfn> refers to the individual or entity using our Service.
                            </p>
                            <p>
                                <dfn>"Account"</dfn> means the registered user account you create to access our Service.
                            </p>
                            <p>
                                <dfn>"Content Platforms"</dfn> means third-party services such as YouTube, Patreon, Stripe, Gumroad, and other platforms you connect to Zerithum.
                            </p>
                            <p>
                                <dfn>"Revenue Data"</dfn> means transaction information, earnings data, and financial records pulled from your connected Content Platforms.
                            </p>
                            <p>
                                <dfn>"Bank Data"</dfn> means transaction information from your linked bank accounts accessed via read-only connection through Plaid or similar services.
                            </p>
                            <p>
                                <dfn>"Subscription"</dfn> means your paid or free tier plan with Zerithum.
                            </p>
                        </section>

                        <section id="section-2">
                            <h2>2. Acceptance of Terms</h2>
                            <p>By accessing or using Zerithum, you confirm that:</p>
                            <ul className="list-disc">
                                <li>You are at least 18 years old or the age of legal majority in your jurisdiction</li>
                                <li>You have the legal capacity to enter into binding contracts</li>
                                <li>If representing an organization, you have authority to bind that entity to these terms</li>
                                <li>You have read and understood these Terms of Service</li>
                                <li>You agree to comply with all applicable laws and regulations</li>
                            </ul>
                            <p>
                                We may update these Terms of Service from time to time. When we make material changes, we will notify you via email or through a prominent notice on our Platform. Your continued use of the Service after changes take effect constitutes acceptance of the updated terms.
                            </p>
                        </section>

                        <section id="section-3">
                            <h2>3. Description of Service</h2>

                            <h3>3.1 What Zerithum Does</h3>
                            <p>Zerithum is an accounting software platform that helps you:</p>
                            <ul className="list-disc">
                                <li>Aggregate revenue data from multiple Content Platforms in one dashboard</li>
                                <li>Reconcile platform-reported earnings against actual bank deposits</li>
                                <li>Generate tax-ready reports and exports for accounting purposes</li>
                                <li>Analyze revenue patterns using insights and forecasting</li>
                                <li>Track cashflow and payment timing across platforms</li>
                            </ul>

                            <h3>3.2 What Zerithum Does NOT Do</h3>
                            <p>We want to be crystal clear about what we are NOT:</p>
                            <ul className="list-disc">
                                <li><strong>Not a payment processor</strong>: We never process, hold, or transfer your money</li>
                                <li><strong>Not a bank or financial institution</strong>: We do not provide banking services</li>
                                <li><strong>Not a money transmitter</strong>: We are not regulated under money transmission laws</li>
                                <li><strong>Not a tax advisor</strong>: We do not provide tax advice or file taxes on your behalf</li>
                                <li><strong>Not an investment platform</strong>: We do not offer investment advice or services</li>
                                <li><strong>Not a wallet or custody service</strong>: We never hold funds on your behalf</li>
                            </ul>
                            <p>
                                Zerithum is accounting software. We observe and report on your financial data but never touch your money. All payments flow directly from your Content Platforms to your bank account. We simply help you see, track, and reconcile those earnings.
                            </p>
                        </section>

                        <section id="section-4">
                            <h2>4. Eligibility and Account Registration</h2>

                            <h3>4.1 Account Creation</h3>
                            <p>To use Zerithum, you must create an account by providing:</p>
                            <ul className="list-disc">
                                <li>A valid email address</li>
                                <li>Your name</li>
                                <li>A secure password</li>
                                <li>Any additional information required for your chosen subscription tier</li>
                            </ul>
                            <p>
                                You agree that all information you provide is accurate, current, and complete. You are responsible for maintaining the accuracy of your account information.
                            </p>

                            <h3>4.2 Account Security</h3>
                            <p>You are solely responsible for:</p>
                            <ul className="list-disc">
                                <li>Maintaining the confidentiality of your account credentials</li>
                                <li>All activities that occur under your account</li>
                                <li>Notifying us immediately of any unauthorized access or security breach</li>
                            </ul>
                            <p>
                                We recommend using a strong, unique password and enabling two-factor authentication when available.
                            </p>

                            <h3>4.3 One Account Per User</h3>
                            <p>
                                Each account is personal to you. You may not share, sell, or transfer your account to another person without our written consent.
                            </p>
                        </section>

                        <section id="section-5">
                            <h2>5. Subscription Plans and Billing</h2>

                            <h3>5.1 Subscription Tiers</h3>
                            <p>Zerithum offers multiple subscription tiers:</p>
                            <ul className="list-disc">
                                <li><strong>Free Tier</strong>: Limited platform connections and basic features at no cost</li>
                                <li><strong>Creator Pro</strong>: Expanded platform connections and full features at $49/month</li>
                                <li><strong>Creator Max</strong>: Unlimited platforms and advanced features at $199/month</li>
                                <li><strong>Agency</strong>: Multi-creator management for agencies and MCNs at custom pricing</li>
                            </ul>
                            <p>
                                Current pricing and feature details are available at zerithum.com/pricing.
                            </p>

                            <h3>5.2 Free Tier</h3>
                            <p>Our Free Tier is provided at no charge with limitations on:</p>
                            <ul className="list-disc">
                                <li>Number of connected platforms (typically 2 maximum)</li>
                                <li>Access to certain premium features</li>
                                <li>Export and reporting capabilities</li>
                            </ul>
                            <p>
                                We may modify Free Tier limitations at any time with reasonable notice.
                            </p>

                            <h3>5.3 Paid Subscriptions</h3>
                            <p>For paid subscriptions:</p>
                            <ul className="list-disc">
                                <li><strong>Billing Cycle</strong>: You will be billed monthly or annually depending on your selected plan</li>
                                <li><strong>Payment Methods</strong>: We accept major credit cards and other payment methods via our payment processor (Stripe, Paddle, or Razorpay)</li>
                                <li><strong>Auto-Renewal</strong>: Paid subscriptions automatically renew unless canceled before the renewal date</li>
                                <li><strong>Price Changes</strong>: We will notify you at least 30 days before any price increase takes effect</li>
                            </ul>

                            <h3>5.4 Payment Processing</h3>
                            <p>
                                We use third-party payment processors to handle all payment transactions. We do not store your complete credit card information on our servers. By providing payment information, you:
                            </p>
                            <ul className="list-disc">
                                <li>Authorize us to charge your payment method for the subscription fees</li>
                                <li>Represent that you are authorized to use the payment method provided</li>
                                <li>Agree to pay all charges incurred under your account</li>
                            </ul>

                            <h3>5.5 Billing Issues</h3>
                            <p>If a payment fails:</p>
                            <ul className="list-disc">
                                <li>We will attempt to notify you via email</li>
                                <li>We may retry charging your payment method</li>
                                <li>Your access may be suspended until payment is resolved</li>
                                <li>Your account may be downgraded to Free Tier if payment cannot be processed</li>
                            </ul>
                            <p>
                                You are responsible for keeping your payment information current.
                            </p>

                            <h3>5.6 Refunds</h3>
                            <p>Subscription fees are generally non-refundable except:</p>
                            <ul className="list-disc">
                                <li>As required by applicable law</li>
                                <li>At our sole discretion for extraordinary circumstances</li>
                                <li>Within the first 14 days of your initial paid subscription if you are unsatisfied</li>
                            </ul>
                            <p>
                                To request a refund, contact us at <a href="mailto:support@zerithum.com" className={contactLinkClass}>support@zerithum.com</a> with your account details and reason for the request.
                            </p>
                        </section>

                        <section id="section-6">
                            <h2>6. Free Trials</h2>
                            <p>We may offer free trial periods for certain subscription tiers. Free trial terms:</p>
                            <ul className="list-disc">
                                <li>Trial period duration will be clearly stated at signup (typically 14 days)</li>
                                <li>Payment information may be required to start a trial</li>
                                <li>You will not be charged during the trial period</li>
                                <li>Your subscription will NOT automatically convert to paid unless you explicitly opt in</li>
                                <li>You may cancel anytime during the trial period without charge</li>
                                <li>Each user is eligible for one free trial per subscription tier</li>
                            </ul>
                            <p>
                                We will send reminder notifications before any trial period ends.
                            </p>
                        </section>

                        <section id="section-7">
                            <h2>7. Cancellation and Termination</h2>

                            <h3>7.1 Your Right to Cancel</h3>
                            <p>You may cancel your subscription at any time through:</p>
                            <ul className="list-disc">
                                <li>Your account settings on the Platform</li>
                                <li>Contacting our support team at <a href="mailto:support@zerithum.com" className={contactLinkClass}>support@zerithum.com</a></li>
                            </ul>
                            <p>When you cancel:</p>
                            <ul className="list-disc">
                                <li>You will retain access until the end of your current billing period</li>
                                <li>You will not be charged for subsequent billing periods</li>
                                <li>Your data will be retained according to our Privacy Policy</li>
                            </ul>

                            <h3>7.2 Our Right to Suspend or Terminate</h3>
                            <p>We may suspend or terminate your account if:</p>
                            <ul className="list-disc">
                                <li>You breach these Terms of Service</li>
                                <li>You engage in fraudulent or illegal activity</li>
                                <li>You abuse or misuse the Platform</li>
                                <li>Your payment fails and remains unresolved</li>
                                <li>Required by law or legal process</li>
                                <li>We discontinue the Service entirely</li>
                            </ul>
                            <p>We will provide reasonable notice before termination unless:</p>
                            <ul className="list-disc">
                                <li>Immediate action is required to prevent harm or legal liability</li>
                                <li>You have materially breached these terms</li>
                                <li>Notification is prohibited by law</li>
                            </ul>

                            <h3>7.3 Effect of Termination</h3>
                            <p>Upon termination:</p>
                            <ul className="list-disc">
                                <li>Your access to the Service will cease immediately</li>
                                <li>Outstanding fees remain due and payable</li>
                                <li>You may request an export of your data within 30 days</li>
                                <li>We may delete your data according to our retention policies</li>
                            </ul>
                            <p>
                                Provisions regarding intellectual property, disclaimers, limitation of liability, and dispute resolution survive termination.
                            </p>
                        </section>

                        <section id="section-8">
                            <h2>8. Platform Connections and Data Access</h2>

                            <h3>8.1 Authorization to Access Your Data</h3>
                            <p>To provide the Service, you authorize us to:</p>
                            <ul className="list-disc">
                                <li>Access your Revenue Data from connected Content Platforms via OAuth or API connections</li>
                                <li>Access your Bank Data via read-only connections through Plaid or similar services</li>
                                <li>Store and process this data to generate reconciliations, reports, and insights</li>
                                <li>Retain this data for the duration of your account and as required by law</li>
                            </ul>

                            <h3>8.2 How We Access Your Data</h3>
                            <p>We access your data through:</p>
                            <ul className="list-disc">
                                <li><strong>OAuth Authentication</strong>: You grant us permission through official platform authentication flows</li>
                                <li><strong>API Connections</strong>: We use official APIs provided by Content Platforms</li>
                                <li><strong>Read-Only Bank Access</strong>: We use Plaid or similar services for secure, read-only bank data access</li>
                            </ul>
                            <p>We never:</p>
                            <ul className="list-disc">
                                <li>Store your bank account passwords or login credentials</li>
                                <li>Request or store your Content Platform passwords</li>
                                <li>Access data beyond what is necessary to provide the Service</li>
                                <li>Use credentials for any purpose other than providing our Service</li>
                            </ul>

                            <h3>8.3 Your Responsibilities for Platform Connections</h3>
                            <p>You are responsible for:</p>
                            <ul className="list-disc">
                                <li>Ensuring you have authority to connect accounts and grant data access</li>
                                <li>Maintaining valid connections to your Content Platforms</li>
                                <li>Promptly notifying us if you revoke access or close connected accounts</li>
                                <li>Compliance with the terms of service of your Content Platforms</li>
                            </ul>

                            <h3>8.4 Third-Party Platform Terms</h3>
                            <p>
                                Your use of Content Platforms remains subject to their respective terms of service. We are not responsible for:
                            </p>
                            <ul className="list-disc">
                                <li>Changes to third-party APIs or data availability</li>
                                <li>Third-party platform outages or service interruptions</li>
                                <li>Third-party platform policy changes that affect data access</li>
                                <li>Actions taken by Content Platforms regarding your account</li>
                            </ul>
                        </section>

                        <section id="section-9">
                            <h2>9. Data Privacy and Security</h2>

                            <h3>9.1 Our Commitment to Privacy</h3>
                            <p>
                                We take data privacy seriously. Our collection, use, and protection of your information is governed by our Privacy Policy, available at <a href="/privacy" className={contactLinkClass}>zerithum.com/privacy</a>.
                            </p>

                            <h3>9.2 Data Security Measures</h3>
                            <p>We implement industry-standard security measures including:</p>
                            <ul className="list-disc">
                                <li>Encryption of data at rest using AES-256</li>
                                <li>Encryption of data in transit using TLS 1.3</li>
                                <li>Secure authentication with optional two-factor authentication</li>
                                <li>Regular security audits and monitoring</li>
                                <li>Access controls limiting employee access to your data</li>
                                <li>Secure data centers with physical and digital safeguards</li>
                            </ul>

                            <h3>9.3 Data Minimization</h3>
                            <p>We collect and retain only data necessary to provide the Service:</p>
                            <ul className="list-disc">
                                <li>Transaction amounts, dates, sources, and categories</li>
                                <li>Revenue reconciliation records and matching data</li>
                                <li>Aggregated statistics for analytics and insights</li>
                            </ul>
                            <p>We do NOT store:</p>
                            <ul className="list-disc">
                                <li>Complete bank account numbers</li>
                                <li>Credit card details (handled by payment processors)</li>
                                <li>Bank login credentials (handled by Plaid)</li>
                                <li>Unnecessary personal information</li>
                            </ul>

                            <h3>9.4 Your Data Rights</h3>
                            <p>You have the right to:</p>
                            <ul className="list-disc">
                                <li>Access your data stored on our Platform</li>
                                <li>Export your data in standard formats (CSV, JSON, PDF)</li>
                                <li>Request correction of inaccurate data</li>
                                <li>Request deletion of your data (subject to legal retention requirements)</li>
                                <li>Opt out of certain data processing activities</li>
                            </ul>
                            <p>
                                To exercise these rights, contact us at <a href="mailto:privacy@zerithum.com" className={contactLinkClass}>privacy@zerithum.com</a>.
                            </p>

                            <h3>9.5 Data Retention</h3>
                            <p>We retain your data:</p>
                            <ul className="list-disc">
                                <li>For the duration of your active account</li>
                                <li>For up to 7 years after account deletion for tax and legal compliance purposes</li>
                                <li>As required by applicable law or legal process</li>
                                <li>Until you request deletion (subject to legal obligations)</li>
                            </ul>
                        </section>

                        <section id="section-10">
                            <h2>10. Acceptable Use Policy</h2>

                            <h3>10.1 Permitted Uses</h3>
                            <p>You may use Zerithum for:</p>
                            <ul className="list-disc">
                                <li>Tracking and reconciling your creator revenue</li>
                                <li>Generating tax reports and financial exports</li>
                                <li>Analyzing your revenue patterns and trends</li>
                                <li>Managing your creator business finances</li>
                            </ul>

                            <h3>10.2 Prohibited Conduct</h3>
                            <p>You may NOT:</p>
                            <ul className="list-disc">
                                <li>Use the Service for any illegal purpose or in violation of any laws</li>
                                <li>Attempt to gain unauthorized access to our systems, servers, or networks</li>
                                <li>Interfere with or disrupt the Service or servers</li>
                                <li>Use automated scripts, bots, or scrapers without written permission</li>
                                <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
                                <li>Upload viruses, malware, or malicious code</li>
                                <li>Harass, abuse, or harm other users or our team</li>
                                <li>Impersonate another person or entity</li>
                                <li>Violate the terms of service of connected Content Platforms</li>
                                <li>Use the Service to launder money or engage in fraud</li>
                                <li>Share your account credentials with unauthorized parties</li>
                                <li>Circumvent usage limitations or access restrictions</li>
                                <li>Copy, modify, or create derivative works of the Service</li>
                            </ul>

                            <h3>10.3 Consequences of Violations</h3>
                            <p>Violations may result in:</p>
                            <ul className="list-disc">
                                <li>Warning and required corrective action</li>
                                <li>Temporary suspension of access</li>
                                <li>Permanent account termination</li>
                                <li>Legal action and reporting to authorities if required</li>
                            </ul>
                        </section>

                        <section id="section-11">
                            <h2>11. Intellectual Property Rights</h2>

                            <h3>11.1 Our Intellectual Property</h3>
                            <p>Zerithum retains all rights, title, and interest in:</p>
                            <ul className="list-disc">
                                <li>The Platform software, code, and algorithms</li>
                                <li>Our trademarks, logos, and branding</li>
                                <li>Documentation, guides, and help content</li>
                                <li>Design elements, layouts, and user interfaces</li>
                                <li>Any patents, copyrights, or trade secrets</li>
                            </ul>
                            <p>
                                Your use of the Service does not grant you ownership of any intellectual property. You are granted only a limited, non-exclusive, non-transferable license to use the Service according to these terms.
                            </p>

                            <h3>11.2 Your Data Ownership</h3>
                            <p>You retain all ownership rights to:</p>
                            <ul className="list-disc">
                                <li>Your Revenue Data and Bank Data</li>
                                <li>Your account information</li>
                                <li>Any content you create using the Service</li>
                                <li>Reports, exports, and analyses generated from your data</li>
                            </ul>
                            <p>
                                By using our Service, you grant us a limited license to:
                            </p>
                            <ul className="list-disc">
                                <li>Use your data to provide the Service</li>
                                <li>Generate aggregated, anonymized statistics for product improvement</li>
                                <li>Display your data in your dashboard and reports</li>
                            </ul>
                            <p>
                                We will never sell your personal data to third parties.
                            </p>

                            <h3>11.3 Feedback and Suggestions</h3>
                            <p>If you provide feedback, suggestions, or ideas for improvement:</p>
                            <ul className="list-disc">
                                <li>You grant us a perpetual, royalty-free license to use such feedback</li>
                                <li>We are not obligated to implement your suggestions</li>
                                <li>You will not be compensated for feedback provided</li>
                                <li>We may use feedback to improve the Service for all users</li>
                            </ul>
                        </section>

                        <section id="section-12">
                            <h2>12. Disclaimers and Warranties</h2>

                            <h3>12.1 Service Provided "AS IS"</h3>
                            <div className={legalWarningClass}>
                                <p>THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.</p>
                                <p>TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, INCLUDING:</p>
                                <ul className="list-disc">
                                    <li>IMPLIED WARRANTIES OF MERCHANTABILITY</li>
                                    <li>IMPLIED WARRANTIES OF FITNESS FOR A PARTICULAR PURPOSE</li>
                                    <li>WARRANTIES OF NON-INFRINGEMENT</li>
                                    <li>WARRANTIES OF ACCURACY, RELIABILITY, OR COMPLETENESS</li>
                                    <li>WARRANTIES OF UNINTERRUPTED OR ERROR-FREE SERVICE</li>
                                </ul>
                            </div>

                            <h3>12.2 No Financial or Tax Advice</h3>
                            <p>Zerithum provides financial data aggregation and reporting tools. We do NOT provide:</p>
                            <ul className="list-disc">
                                <li>Financial advice or recommendations</li>
                                <li>Tax advice or tax preparation services</li>
                                <li>Investment guidance or recommendations</li>
                                <li>Accounting or bookkeeping services</li>
                                <li>Legal advice</li>
                            </ul>
                            <p>You are solely responsible for:</p>
                            <ul className="list-disc">
                                <li>Interpreting your financial data</li>
                                <li>Making business decisions based on your data</li>
                                <li>Filing taxes and meeting tax obligations</li>
                                <li>Consulting with qualified professionals (accountants, tax advisors, lawyers)</li>
                                <li>Verifying the accuracy of reconciliations and reports</li>
                            </ul>

                            <h3>12.3 Third-Party Services</h3>
                            <p>We rely on third-party services (Content Platforms, Plaid, payment processors) to provide our Service. We are not responsible for:</p>
                            <ul className="list-disc">
                                <li>Availability, reliability, or performance of third-party services</li>
                                <li>Changes to third-party APIs or data formats</li>
                                <li>Errors or omissions in data provided by third parties</li>
                                <li>Security breaches at third-party providers</li>
                                <li>Third-party service interruptions or downtime</li>
                            </ul>

                            <h3>12.4 Data Accuracy</h3>
                            <p>While we strive for accuracy, we do NOT guarantee:</p>
                            <ul className="list-disc">
                                <li>That reconciliation matches are 100% accurate</li>
                                <li>That all transactions will be captured from Content Platforms</li>
                                <li>That timing of data syncs will be instant or consistent</li>
                                <li>That AI-generated insights are completely accurate or applicable to your situation</li>
                                <li>That exports are error-free or complete</li>
                            </ul>
                            <p>
                                You are responsible for reviewing and verifying all data, reconciliations, and reports generated by the Service.
                            </p>

                            <h3>12.5 Uptime and Availability</h3>
                            <p>We aim to provide reliable service but do NOT guarantee:</p>
                            <ul className="list-disc">
                                <li>100% uptime or availability</li>
                                <li>Uninterrupted access to the Service</li>
                                <li>Freedom from bugs, errors, or defects</li>
                                <li>That the Service will meet all your requirements</li>
                            </ul>
                            <p>
                                Scheduled maintenance and emergency repairs may result in temporary downtime. We will provide advance notice when reasonably possible.
                            </p>
                        </section>

                        <section id="section-13">
                            <h2>13. Limitation of Liability</h2>

                            <h3>13.1 General Limitation</h3>
                            <div className={legalWarningClass}>
                                <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, ZERITHUM AND ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AND LICENSORS SHALL NOT BE LIABLE FOR:</p>
                                <ul className="list-disc">
                                    <li>INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR PUNITIVE DAMAGES</li>
                                    <li>LOSS OF PROFITS, REVENUE, DATA, OR BUSINESS OPPORTUNITIES</li>
                                    <li>LOSS OF USE OR LOSS OF GOODWILL</li>
                                    <li>SERVICE INTERRUPTIONS OR DOWNTIME</li>
                                    <li>ERRORS, OMISSIONS, OR INACCURACIES IN DATA</li>
                                    <li>DAMAGES RESULTING FROM THIRD-PARTY SERVICES OR PLATFORMS</li>
                                    <li>DAMAGES ARISING FROM UNAUTHORIZED ACCESS TO YOUR ACCOUNT</li>
                                </ul>
                                <p>THIS LIMITATION APPLIES REGARDLESS OF THE LEGAL THEORY (CONTRACT, TORT, NEGLIGENCE, STRICT LIABILITY, OR OTHERWISE) AND EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</p>
                            </div>

                            <h3>13.2 Maximum Liability Cap</h3>
                            <div className={legalWarningClass}>
                                <p>TO THE EXTENT PERMITTED BY LAW, OUR TOTAL LIABILITY TO YOU FOR ANY CLAIMS ARISING FROM OR RELATED TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE GREATER OF:</p>
                                <ul className="list-disc">
                                    <li>THE AMOUNT YOU PAID TO US IN THE 12 MONTHS PRECEDING THE CLAIM, OR</li>
                                    <li>$100 USD</li>
                                </ul>
                            </div>

                            <h3>13.3 Exceptions</h3>
                            <p>
                                Some jurisdictions do not allow certain limitations on liability. In such jurisdictions, our liability is limited to the maximum extent permitted by law.
                            </p>
                            <p>Nothing in these terms limits liability for:</p>
                            <ul className="list-disc">
                                <li>Death or personal injury caused by our negligence</li>
                                <li>Fraud or fraudulent misrepresentation</li>
                                <li>Any liability that cannot be excluded by applicable law</li>
                            </ul>

                            <h3>13.4 User Responsibility</h3>
                            <p>You acknowledge and agree that:</p>
                            <ul className="list-disc">
                                <li>You use the Service at your own risk</li>
                                <li>You are solely responsible for decisions made based on data from the Service</li>
                                <li>We are not liable for tax penalties, audit findings, or compliance failures</li>
                                <li>You should maintain independent records and verify all data</li>
                            </ul>
                        </section>

                        <section id="section-14">
                            <h2>14. Indemnification</h2>
                            <p>
                                You agree to indemnify, defend, and hold harmless Zerithum and its affiliates, officers, directors, employees, agents, and licensors from and against any and all claims, liabilities, damages, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising from:
                            </p>
                            <ul className="list-disc">
                                <li>Your use or misuse of the Service</li>
                                <li>Your violation of these Terms of Service</li>
                                <li>Your violation of any rights of third parties</li>
                                <li>Your violation of applicable laws or regulations</li>
                                <li>Your breach of representations or warranties made in these terms</li>
                                <li>Content or data you submit to the Service</li>
                                <li>Unauthorized use of your account due to your failure to safeguard credentials</li>
                            </ul>
                            <p>
                                We reserve the right to assume exclusive defense and control of any matter subject to indemnification, at your expense. You agree to cooperate with our defense of such claims.
                            </p>
                        </section>

                        <section id="section-15">
                            <h2>15. Dispute Resolution</h2>

                            <h3>15.1 Governing Law</h3>
                            <p>
                                These Terms of Service are governed by the laws of the jurisdiction where Zerithum is incorporated (to be specified: Delaware, United States or appropriate jurisdiction), without regard to conflict of law principles.
                            </p>

                            <h3>15.2 Informal Resolution</h3>
                            <p>
                                Before initiating formal legal proceedings, you agree to first contact us at <a href="mailto:legal@zerithum.com" className={contactLinkClass}>legal@zerithum.com</a> to seek informal resolution. We will attempt to resolve disputes amicably within 30 days of receiving notice.
                            </p>

                            <h3>15.3 Arbitration Agreement</h3>
                            <p>
                                For any dispute not resolved informally, you and Zerithum agree to binding arbitration on an individual basis, except where prohibited by law.
                            </p>
                            <p>Arbitration terms:</p>
                            <ul className="list-disc">
                                <li>Administered by a recognized arbitration organization (e.g., American Arbitration Association)</li>
                                <li>Conducted under applicable arbitration rules</li>
                                <li>Located in the jurisdiction where Zerithum is incorporated or another mutually agreed location</li>
                                <li>Decided by a single arbitrator</li>
                                <li>Judgment on the award may be entered in any court with jurisdiction</li>
                            </ul>

                            <h3>15.4 Class Action Waiver</h3>
                            <div className={legalWarningClass}>
                                <p>YOU AND ZERITHUM AGREE THAT DISPUTES WILL BE RESOLVED ON AN INDIVIDUAL BASIS ONLY. YOU WAIVE ANY RIGHT TO PARTICIPATE IN A CLASS ACTION, CLASS ARBITRATION, OR REPRESENTATIVE ACTION.</p>
                            </div>
                            <p>
                                This class action waiver does not apply where prohibited by law.
                            </p>

                            <h3>15.5 Exceptions to Arbitration</h3>
                            <p>Either party may seek relief in court for:</p>
                            <ul className="list-disc">
                                <li>Injunctive or equitable relief to protect intellectual property rights</li>
                                <li>Claims within the jurisdiction of small claims court</li>
                                <li>Matters that cannot be arbitrated under applicable law</li>
                            </ul>

                            <h3>15.6 Jurisdiction</h3>
                            <p>
                                If arbitration does not apply or is unenforceable, you consent to the exclusive jurisdiction of courts located in (jurisdiction to be specified) for resolution of disputes.
                            </p>
                        </section>

                        <section id="section-16">
                            <h2>16. Changes to the Service</h2>

                            <h3>16.1 Modifications</h3>
                            <p>We reserve the right to:</p>
                            <ul className="list-disc">
                                <li>Modify, update, or discontinue features of the Service</li>
                                <li>Change pricing and subscription tiers with reasonable notice</li>
                                <li>Add or remove Content Platform integrations</li>
                                <li>Update APIs, user interfaces, and functionality</li>
                                <li>Impose new limitations or restrictions on usage</li>
                            </ul>
                            <p>
                                We will notify you of material changes via email or prominent notice on the Platform.
                            </p>

                            <h3>16.2 No Guarantee of Continuity</h3>
                            <p>We do not guarantee that:</p>
                            <ul className="list-disc">
                                <li>The Service will continue indefinitely</li>
                                <li>Specific features will remain available</li>
                                <li>Content Platform integrations will continue</li>
                                <li>Pricing will remain unchanged</li>
                            </ul>

                            <h3>16.3 Service Discontinuation</h3>
                            <p>If we discontinue the Service entirely:</p>
                            <ul className="list-disc">
                                <li>We will provide at least 60 days' advance notice when reasonably possible</li>
                                <li>You will have opportunity to export your data</li>
                                <li>Prorated refunds may be provided for unused subscription periods at our discretion</li>
                            </ul>
                        </section>

                        <section id="section-17">
                            <h2>17. Miscellaneous Provisions</h2>

                            <h3>17.1 Entire Agreement</h3>
                            <p>
                                These Terms of Service, together with our Privacy Policy and any additional terms presented at signup, constitute the entire agreement between you and Zerithum regarding the Service.
                            </p>

                            <h3>17.2 Severability</h3>
                            <p>
                                If any provision of these terms is found to be invalid, unlawful, or unenforceable, the remaining provisions will continue in full force and effect.
                            </p>

                            <h3>17.3 Waiver</h3>
                            <p>
                                Our failure to enforce any provision of these terms does not constitute a waiver of that provision or our right to enforce it in the future.
                            </p>

                            <h3>17.4 Assignment</h3>
                            <p>
                                You may not assign or transfer these terms or your account without our written consent. We may assign these terms to any affiliate, successor, or purchaser of our business without restriction.
                            </p>

                            <h3>17.5 Force Majeure</h3>
                            <p>
                                We are not liable for delays or failures in performance resulting from circumstances beyond our reasonable control, including:
                            </p>
                            <ul className="list-disc">
                                <li>Natural disasters, pandemics, or acts of God</li>
                                <li>War, terrorism, riots, or civil unrest</li>
                                <li>Government actions, laws, or regulations</li>
                                <li>Internet or telecommunications failures</li>
                                <li>Third-party service provider failures</li>
                            </ul>

                            <h3>17.6 No Third-Party Beneficiaries</h3>
                            <p>
                                These terms do not create any third-party beneficiary rights except as explicitly stated.
                            </p>

                            <h3>17.7 Relationship</h3>
                            <p>
                                Nothing in these terms creates a partnership, joint venture, employment, or agency relationship between you and Zerithum.
                            </p>

                            <h3>17.8 Export Compliance</h3>
                            <p>
                                You agree to comply with all applicable export control laws and regulations. You represent that you are not located in, or a national of, any country subject to U.S. government embargo or designated as a "terrorist supporting" country.
                            </p>

                            <h3>17.9 Language</h3>
                            <p>
                                These Terms of Service are written in English. Any translations are provided for convenience only. In case of conflict, the English version prevails.
                            </p>
                        </section>

                        <section id="section-18" className={contactSectionClass}>
                            <h2>18. Contact Information</h2>
                            <p>If you have questions, concerns, or requests regarding these Terms of Service, please contact us:</p>
                            <p>
                                <strong>Zerithum Support</strong><br />
                                Email: <a href="mailto:support@zerithum.com" className={contactLinkClass}>support@zerithum.com</a><br />
                                Legal Inquiries: <a href="mailto:legal@zerithum.com" className={contactLinkClass}>legal@zerithum.com</a><br />
                                Privacy Inquiries: <a href="mailto:privacy@zerithum.com" className={contactLinkClass}>privacy@zerithum.com</a><br />
                                Website: <a href="https://zerithum.com" target="_blank" rel="noopener noreferrer" className={contactLinkClass}>https://zerithum.com</a>
                            </p>
                            <p>Mailing Address: (To be specified based on registered business address)</p>
                        </section>

                        <section id="section-19" className={acknowledgmentSectionClass}>
                            <h2>19. Acknowledgment</h2>
                            <p className="font-bold">BY USING ZERITHUM, YOU ACKNOWLEDGE THAT:</p>
                            <ul className="list-disc">
                                <li>You have read and understood these Terms of Service</li>
                                <li>You agree to be bound by these terms</li>
                                <li>You understand what Zerithum does and does not do</li>
                                <li>You are solely responsible for your financial and tax decisions</li>
                                <li>You will consult qualified professionals for advice as needed</li>
                                <li>You accept all risks associated with using the Service</li>
                            </ul>
                            <p className="mt-4">
                                Thank you for choosing Zerithum. We are here to help you manage your creator revenue with less stress and more clarity.
                            </p>
                        </section>
                    </article>
                </main>
            </div>

            {/* Back to Top Button */}
            <button
                onClick={scrollToTop}
                className={`fixed bottom-8 right-8 z-50 p-3 rounded-full bg-[#208D9E] text-white shadow-lg transition-all duration-300 hover:bg-[#1a7a8a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#208D9E] print:hidden ${
                    showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
                }`}
                aria-label="Back to top"
            >
                <ArrowUp className="w-5 h-5" />
            </button>
        </div>
    );
};

export default TermsOfService;
