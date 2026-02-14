/* eslint-disable react/no-unknown-property */
import React from 'react';
import CardNav from '@/components/landing/CardNav';
import logoSvg from '@/components/landing/logo.svg';

// Sections
import HeroSection from '@/components/landing/HeroSection';
import ProductShowcase from '@/components/landing/ProductShowcase';
import HowItWorks from '@/components/landing/HowItWorks';
import AccuracySection from '@/components/landing/AccuracySection';
import SecuritySection from '@/components/landing/SecuritySection';
import Footer from '@/components/landing/Footer';

const Landing = () => {
    // Nav items
    const navItems = [
      {
        label: "Platform",
        bgColor: "#18181b",
        textColor: "#fff",
        links: [
          { label: "Product", href: "#product", ariaLabel: "Product Features" },
          { label: "How it Works", href: "#how-it-works", ariaLabel: "How it Works" },
          { label: "Accuracy", href: "#accuracy", ariaLabel: "Accuracy" }
        ]
      },
      {
        label: "Resources",
        bgColor: "#27272a",
        textColor: "#fff",
        links: [
          { label: "Security", href: "/Security", ariaLabel: "Security" },
          { label: "Methodology", href: "/methodology", ariaLabel: "Methodology" }
        ]
      },
      {
        label: "Access",
        bgColor: "#3f3f46",
        textColor: "#fff",
        links: [
          { label: "Sign In", href: "/SignIn", ariaLabel: "Sign In" },
          { label: "Sign Up", href: "/Signup", ariaLabel: "Sign Up" }
        ]
      }
    ];

    return (
        <div className="relative min-h-screen bg-white text-zinc-900 overflow-hidden font-sans selection:bg-emerald-500/30"
             style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '24px 24px' }}>

            <CardNav
                logo={logoSvg}
                logoAlt="Zerithum"
                items={navItems}
                baseColor="#fff"
                menuColor="#000"
                buttonBgColor="#18181b"
                buttonTextColor="#fff"
            />

            {/* Main Content */}
            <main className="relative z-10 pt-32 md:pt-48">
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
