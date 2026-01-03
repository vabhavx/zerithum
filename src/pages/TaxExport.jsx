import React from "react";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";

export default function TaxExport() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#5E5240] mb-2">Tax Export</h1>
        <p className="text-[#5E5240]/60">
          Generate 1099-K ready reports for tax filing
        </p>
      </div>

      <div className="clay-card text-center py-16">
        <FileText className="w-16 h-16 text-[#208D9E] mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-[#5E5240] mb-2">Coming Soon</h2>
        <p className="text-[#5E5240]/60 mb-6 max-w-md mx-auto">
          Export your revenue data in formats ready for tax filing, including 1099-K compliant reports
          for your accountant.
        </p>
        <p className="text-sm text-[#5E5240]/40 mb-6">
          This feature will be available in Creator Pro and Creator Max plans.
        </p>
        <Button className="btn-primary" disabled>
          <Download className="w-4 h-4 mr-2" />
          Generate Tax Report
        </Button>
      </div>
    </div>
  );
}