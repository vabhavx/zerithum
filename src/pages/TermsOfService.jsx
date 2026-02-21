import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUp } from 'lucide-react';
import { termsSections, IntroContent, lastUpdated, effectiveDate } from './TermsOfServiceContent';

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
                            {termsSections.map((section) => (
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
                                <p className="mb-1 sm:mb-0"><strong>Last Updated:</strong> {lastUpdated}</p>
                                <p className="mb-0"><strong>Effective Date:</strong> {effectiveDate}</p>
                            </div>
                            <IntroContent />
                        </header>

                        {termsSections.map((section) => (
                            <section key={section.id} id={section.id} className={section.className || ''}>
                                <h2>{section.title}</h2>
                                {section.content}
                            </section>
                        ))}
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
