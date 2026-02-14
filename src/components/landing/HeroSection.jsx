import React from 'react';
import { ContainerScroll } from '../ui/container-scroll-animation';
import { Button } from '../ui/button';
import { CheckCircle2, ShieldCheck, FileText, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardPreview from './DashboardPreview';

const HeroSection = () => {
  const scrollToProduct = () => {
    const productSection = document.getElementById('product');
    if (productSection) {
      productSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative z-10">
      <ContainerScroll
        titleComponent={
          <div className="flex flex-col items-center justify-center space-y-8 mb-10 mt-10 md:mt-0">
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-zinc-900 tracking-tight leading-[1.1] text-center max-w-4xl drop-shadow-sm">
              Reconcile creator payouts <br /> to bank deposits.
            </h1>

            <p className="text-lg md:text-xl text-zinc-600 max-w-2xl text-center leading-relaxed">
              Connect your revenue platforms. Zerithum matches platform reported earnings to bank deposits, flags discrepancies with reason codes, and stores an audit trail you can export to your accountant.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full">
              <Button
                onClick={scrollToProduct}
                size="lg"
                className="bg-zinc-900 text-white hover:bg-zinc-800 font-medium px-8 h-12 rounded-full text-base transition-all shadow-lg"
              >
                View demo reconciliation
              </Button>
              <Link to="/Signup">
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 font-medium px-8 h-12 rounded-full text-base shadow-sm"
                >
                  Create account
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-4 md:gap-8 mt-8 text-xs md:text-sm text-zinc-500 font-mono uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>Read-only OAuth</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Bank via Plaid</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Audit Trail</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
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
