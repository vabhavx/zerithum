import React from 'react';
import { ContainerScroll } from '../ui/container-scroll-animation';
import { Button } from '../ui/button';
import { CheckCircle2, ShieldCheck, FileText, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardPreview from './DashboardPreview';
import SplitText from '../ui/SplitText';

const HeroSection = () => {
  const scrollToProduct = () => {
    const productSection = document.getElementById('product');
    if (productSection) {
      productSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative z-10 pt-20 md:pt-32">
      <ContainerScroll
        titleComponent={
          <div className="flex flex-col items-center justify-center space-y-8 mb-10 mt-10 md:mt-0">
            <SplitText
              text={`Reconcile creator payouts
to bank deposits.`}
              className="text-5xl md:text-7xl font-serif font-bold text-white tracking-tight leading-[1.1] text-center max-w-4xl drop-shadow-2xl !whitespace-pre-line"
              delay={130}
              duration={0.8}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 40 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.1}
              rootMargin="-100px"
              textAlign="center"
            />

            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl text-center leading-relaxed">
              Connect your revenue platforms. Zerithum matches platform reported earnings to bank deposits, flags discrepancies with reason codes, and stores an audit trail you can export to your accountant.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full">
              <Button
                onClick={scrollToProduct}
                size="lg"
                className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 font-medium px-8 h-12 rounded-full text-base transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              >
                View demo reconciliation
              </Button>
              <Link to="/Signup">
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-transparent border-zinc-700 text-zinc-300 hover:text-white hover:bg-white/10 font-medium px-8 h-12 rounded-full text-base"
                >
                  Create account
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-4 md:gap-8 mt-8 text-xs md:text-sm text-zinc-500 font-mono uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-500/80" />
                <span>Read-only OAuth</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500/80" />
                <span>Bank via Plaid</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500/80" />
                <span>Audit Trail</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500/80" />
                <span>Tax Ready</span>
              </div>
            </div>
          </div>
        }
      >
        <DashboardPreview />
      </ContainerScroll>
    </div>
  );
};

export default HeroSection;
