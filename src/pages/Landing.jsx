
import React from 'react';
import CardNav from '@/components/landing/CardNav';
// @ts-ignore
import logoSvg from '@/components/landing/logo.svg';

// Sections
import HeroSection from '@/components/landing/HeroSection';
import ProductShowcase from '@/components/landing/ProductShowcase';
import HowItWorks from '@/components/landing/HowItWorks';
import AccuracySection from '@/components/landing/AccuracySection';
import SecuritySection from '@/components/landing/SecuritySection';
import Footer from '@/components/landing/Footer';

const Landing = () => {
    // Nav items - Enterprise Structure
    const navItems = [
      {
        label: "Platform",
        bgColor: "#09090b", // zinc-950
        textColor: "#fff",
        links: [
          { label: "Product Features", href: "#product", ariaLabel: "Product Features" },
          { label: "Execution Logic", href: "#how-it-works", ariaLabel: "How it Works" },
          { label: "Audit & Verification", href: "#accuracy", ariaLabel: "Accuracy" }
        ]
      },
      {
        label: "Resources",
        bgColor: "#18181b", // zinc-900
        textColor: "#fff",
        links: [
          { label: "Security Specs", href: "/Security", ariaLabel: "Security" },
          { label: "Reconciliation Methodology", href: "/methodology", ariaLabel: "Methodology" }
        ]
      },
      {
        label: "System",
        bgColor: "#27272a", // zinc-800
        textColor: "#fff",
        links: [
          { label: "Console Login", href: "/SignIn", ariaLabel: "Sign In" },
          { label: "Create Instance", href: "/Signup", ariaLabel: "Sign Up" }
        ]
      }
    ];

    return (
        <div className="relative min-h-screen bg-white text-zinc-900 overflow-hidden font-sans selection:bg-emerald-500/30">

            {/* Global Technical Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] z-0"></div>

            <CardNav
                logo={logoSvg}
                logoAlt="Zerithum"
                items={navItems}
                baseColor="#ffffff"
                menuColor="#09090b"
                buttonBgColor="#09090b"
                buttonTextColor="#fff"
            />

            {/* Main Content */}
            <main className="relative z-10 pt-32">
                <HeroSection />
                <ProductShowcase />
                <HowItWorks />
                <AccuracySection />
                <SecuritySection />
            </main>

            <Footer />
        </div>
    );
};

export default Landing;
