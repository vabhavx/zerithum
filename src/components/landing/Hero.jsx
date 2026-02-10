import React from 'react';
import { ContainerScroll } from '@/components/ui/container-scroll-animation';
import { DashboardPreview } from '@/components/landing/DashboardPreview';
import { Button } from '@/components/ui/button';
import { ArrowRight, PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DemoModal } from './DemoModal';

export function Hero() {
  return (
    <section className="bg-neutral-950 relative w-full overflow-hidden flex flex-col items-center">
      <ContainerScroll
        titleComponent={
          <div className="flex flex-col items-center justify-center px-4 md:px-0">
            <h1 className="text-4xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
              Match every payout to <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-200 to-neutral-500">
                your bank deposits.
              </span>
            </h1>
            <p className="text-neutral-400 max-w-2xl mx-auto text-lg md:text-xl font-mono mb-10 text-center leading-relaxed">
              Multi platform income, reconciled weekly, tax ready exports for accountants.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-20">
               <Link to="/Signup">
                  <Button size="lg" className="bg-white text-black hover:bg-neutral-200 h-12 px-8 rounded-full font-medium text-base transition-all hover:scale-105">
                    Start Reconciling
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
               </Link>
               <DemoModal>
                  <Button variant="outline" size="lg" className="border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-900 h-12 px-8 rounded-full font-medium text-base">
                    <PlayCircle className="mr-2 w-4 h-4" />
                    Watch Demo
                  </Button>
               </DemoModal>
            </div>
          </div>
        }
      >
        <DashboardPreview />
      </ContainerScroll>
    </section>
  );
}
