import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Lock, ShieldCheck, CheckCircle2, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import HeroVisual from './HeroVisual';
import SplitText from '../ui/SplitText';

const HeroSection = () => {
  const scrollToHowItWorks = () => {
    const section = document.getElementById('how-it-works');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative z-10 pt-28 md:pt-40 pb-8 md:pb-16">
      <div className="flex flex-col items-center justify-center px-4">
        <SplitText
          text="Know exactly where your money went."
          tag="h1"
          className="text-4xl sm:text-5xl md:text-7xl font-serif font-bold text-white tracking-tight leading-[1.1] text-center max-w-4xl"
          splitType="words"
          delay={60}
          duration={0.6}
          from={{ opacity: 0, y: 30 }}
          to={{ opacity: 1, y: 0 }}
          rootMargin="0px"
          textAlign="center"
        />

        <motion.p
          className="text-base md:text-xl text-zinc-400 max-w-2xl text-center leading-relaxed mt-6 md:mt-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Zerithum connects your revenue platforms to your bank account, matches every payout
          to a deposit, and gives you a single view of what arrived — and what didn't.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full mt-8 md:mt-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Link to="/Signup">
            <Button
              size="lg"
              className="bg-white text-zinc-900 hover:bg-zinc-200 font-medium px-8 h-12 rounded-full text-base"
            >
              Get started
            </Button>
          </Link>
          <Button
            onClick={scrollToHowItWorks}
            variant="outline"
            size="lg"
            className="bg-transparent border-zinc-700 text-zinc-300 hover:text-white hover:bg-white/10 font-medium px-8 h-12 rounded-full text-base"
          >
            See how it works
          </Button>
        </motion.div>

        <motion.div
          className="flex flex-wrap justify-center gap-4 md:gap-8 mt-10 text-[11px] md:text-xs text-zinc-500 font-mono uppercase tracking-wider"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.7 }}
        >
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-500/70" />
            <span>Bank-grade encryption</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/70" />
            <span>Read-only bank access</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/70" />
            <span>Full audit trail</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-emerald-500/70" />
            <span>Tax-ready exports</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          <HeroVisual />
        </motion.div>
      </div>
    </div>
  );
};

export default HeroSection;
