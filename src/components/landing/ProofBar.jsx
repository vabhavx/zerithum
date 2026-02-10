import React from 'react';
import { Youtube, Twitch, CreditCard, DollarSign } from 'lucide-react';

export function ProofBar() {
  return (
    <div className="w-full py-12 border-y border-neutral-800 bg-neutral-950/50">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
        <span className="text-sm font-mono text-neutral-500 uppercase tracking-widest">Integrations</span>
        <div className="flex flex-wrap justify-center gap-8 md:gap-12 text-neutral-400">
           <div className="flex items-center gap-2">
              <Youtube className="w-5 h-5" />
              <span className="font-semibold">YouTube</span>
           </div>
           <div className="flex items-center gap-2">
              <Twitch className="w-5 h-5" />
              <span className="font-semibold">Twitch</span>
           </div>
           <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              <span className="font-semibold">Stripe</span>
           </div>
           <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              <span className="font-semibold">Patreon</span>
           </div>
           <div className="flex items-center gap-2">
              <span className="font-bold">Plaid</span>
           </div>
        </div>
      </div>
    </div>
  );
}
