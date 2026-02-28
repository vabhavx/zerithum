import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, Download, Building2, GitMerge, BrainCircuit, FileText } from 'lucide-react';

const steps = [
  {
    id: 1,
    title: "Data Ingestion",
    description: "Connect to 20+ creator platforms via secure APIs",
    icon: Database,
  },
  {
    id: 2,
    title: "Platform Revenue Collection",
    description: "Gather reported earnings from each platform",
    icon: Download,
  },
  {
    id: 3,
    title: "Bank Feed Integration",
    description: "Access actual deposits from your bank (source of truth)",
    icon: Building2,
  },
  {
    id: 4,
    title: "Reconciliation Engine",
    description: "Match platform-reported earnings to actual bank deposits",
    icon: GitMerge,
  },
  {
    id: 5,
    title: "AI Analysis",
    description: "Identify patterns, risks, and revenue concentration",
    icon: BrainCircuit,
  },
  {
    id: 6,
    title: "Tax-Ready Reports",
    description: "Generate compliant summaries for accountants and authorities",
    icon: FileText,
  }
];

export function AuthFeatureAnimation() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % steps.length);
    }, 1200); // Fast loop
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto relative z-0 flex flex-col justify-center h-full pb-20 px-8">
       {/* Background glow for the active card */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[#00e5ff]/5 rounded-full blur-[100px] -z-10 animate-pulse pointer-events-none" />

       <div className="text-center mb-10">
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
            <Building2 className="w-6 h-6" /> Zerithum
          </h2>
          <p className="text-muted-foreground mt-2">Bank Reconciliation for Creator Revenue</p>
       </div>

       <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {steps.map((step, index) => {
             const isActive = activeIndex === index;
             const Icon = step.icon;
             return (
               <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative p-5 rounded-xl border transition-all duration-500 overflow-hidden backdrop-blur-sm
                    ${isActive
                        ? 'bg-[#030712]/80 border-[#00e5ff]/50 shadow-[0_0_15px_rgba(0,229,255,0.15)] scale-[1.02] z-10'
                        : 'bg-background/40 border-border/50 opacity-50 scale-100 z-0'
                    }
                  `}
               >
                 {isActive && (
                    <motion.div
                       layoutId="activeGlowAuth"
                       className="absolute inset-0 bg-gradient-to-r from-[#00e5ff]/10 to-transparent pointer-events-none"
                       transition={{ duration: 0.5 }}
                    />
                 )}
                 <div className="relative z-10 flex flex-col h-full">
                   <div className="flex items-center gap-3 mb-3">
                      <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all duration-500
                          ${isActive ? 'bg-[#00e5ff] text-black shadow-[0_0_10px_rgba(0,229,255,0.5)]' : 'bg-muted text-muted-foreground'}`
                      }>
                         {step.id}
                      </div>
                      <h3 className={`font-semibold text-sm transition-colors duration-500 ${isActive ? 'text-[#00e5ff]' : 'text-foreground'}`}>
                        {step.title}
                      </h3>
                      {isActive && <Icon className="w-4 h-4 ml-auto text-[#00e5ff] animate-pulse" />}
                   </div>
                   <p className="text-xs text-muted-foreground pl-10 mt-auto leading-relaxed">
                      {step.description}
                   </p>
                 </div>
               </motion.div>
             );
          })}
       </div>
    </div>
  );
}
