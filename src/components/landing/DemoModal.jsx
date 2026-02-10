import React from 'react';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { WedgeReconciliation } from './WedgeReconciliation';

export function DemoModal({ children }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] w-full h-[80vh] bg-neutral-950 border-neutral-800 p-0 overflow-y-auto sm:max-w-4xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Reconciliation Demo</DialogTitle>
          <DialogDescription>Interactive demonstration of platform-to-bank reconciliation.</DialogDescription>
        </DialogHeader>
        <div className="w-full h-full flex items-center justify-center scale-90 md:scale-100 origin-center">
             <WedgeReconciliation />
        </div>
      </DialogContent>
    </Dialog>
  );
}
