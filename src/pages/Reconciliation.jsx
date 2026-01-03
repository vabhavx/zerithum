import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle } from "lucide-react";

export default function Reconciliation() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#5E5240] mb-2">Bank Reconciliation</h1>
        <p className="text-[#5E5240]/60">
          Match platform earnings with bank deposits to ensure accuracy
        </p>
      </div>

      <div className="clay-card text-center py-16">
        <CheckCircle2 className="w-16 h-16 text-[#208D9E] mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-[#5E5240] mb-2">Coming Soon</h2>
        <p className="text-[#5E5240]/60 mb-6 max-w-md mx-auto">
          Bank reconciliation will help you match platform payouts with actual bank deposits,
          ensuring 100% accuracy in your revenue tracking.
        </p>
        <p className="text-sm text-[#5E5240]/40">
          This feature will be available in Creator Pro and Creator Max plans.
        </p>
      </div>
    </div>
  );
}