import React, { useState, useMemo } from "react";
import { base44 } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { startOfYear, endOfYear, startOfQuarter, endOfQuarter } from "date-fns";
import { 
  Calculator, 
  DollarSign, 
  AlertCircle,
  CheckCircle2,
  Calendar,
  Settings as SettingsIcon,
  Download,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export default function TaxEstimator() {
  const [showSettings, setShowSettings] = useState(false);
  const currentYear = new Date().getFullYear();

  const { data: transactions = [] } = useQuery({
    queryKey: ["revenueTransactions"],
    queryFn: () => base44.entities.RevenueTransaction.list("-transaction_date", 1000),
  });

  const taxCalculations = useMemo(() => {
    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
    const estimatedTax = totalRevenue * 0.3; // Rough 30% estimate
    return { totalRevenue, estimatedTax, quarterly: estimatedTax / 4 };
  }, [transactions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-serif text-foreground mb-1">Tax Liability</h1>
          <p className="text-sm text-muted-foreground font-mono">
             ESTIMATED OBLIGATIONS · FISCAL YEAR {currentYear}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            className="h-9 px-4 font-mono text-xs uppercase tracking-wider rounded-none border border-border bg-background hover:bg-muted text-foreground"
            onClick={() => setShowSettings(true)}
          >
            <SettingsIcon className="w-3 h-3 mr-2" />
            Config
          </Button>
          <Button className="h-9 px-4 bg-foreground text-background hover:bg-foreground/90 font-mono text-xs uppercase tracking-wider rounded-none">
            <Download className="w-3 h-3 mr-2" />
            Export 1099 Data
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border border border-border">
          <div className="bg-background p-6">
              <div className="flex justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">Gross Revenue</span>
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-serif font-medium">${taxCalculations.totalRevenue.toFixed(0)}</div>
          </div>
          <div className="bg-background p-6">
              <div className="flex justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">Est. Liability</span>
                  <Calculator className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-serif font-medium text-destructive">${taxCalculations.estimatedTax.toFixed(0)}</div>
              <div className="text-xs text-muted-foreground mt-1">Based on ~30% effective rate</div>
          </div>
          <div className="bg-background p-6">
              <div className="flex justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">Quarterly Payment</span>
                  <Calendar className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-serif font-medium text-amber-500">${taxCalculations.quarterly.toFixed(0)}</div>
              <div className="text-xs text-muted-foreground mt-1">Due Apr 15, Jun 15, Sep 15, Jan 15</div>
          </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mt-8">
          {['Q1 (Apr 15)', 'Q2 (Jun 15)', 'Q3 (Sep 15)', 'Q4 (Jan 15)'].map((q, i) => (
              <div key={i} className="border border-border p-4 bg-background">
                  <div className="flex justify-between items-start mb-4">
                      <span className="font-serif font-bold">{q}</span>
                      {i === 0 ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <div className="w-4 h-4 border border-border rounded-full" />}
                  </div>
                  <div className="text-lg font-mono mb-2">${taxCalculations.quarterly.toFixed(0)}</div>
                  <Button variant="outline" size="sm" className="w-full rounded-none text-xs" disabled={i===0}>
                      {i === 0 ? "Paid" : "Mark Paid"}
                  </Button>
              </div>
          ))}
      </div>

      <div className="border border-blue-900/30 bg-blue-900/10 p-4 flex gap-3 items-start mt-6">
          <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
              <h4 className="text-sm font-bold text-blue-400 mb-1">Disclaimer</h4>
              <p className="text-xs text-blue-300/80 leading-relaxed">
                  Zerithum provides estimates based on gross revenue and standard self-employment tax brackets.
                  Actual liability depends on filing status, deductions, and local jurisdictions. Consult a CPA.
              </p>
          </div>
      </div>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="rounded-none border border-border bg-card max-w-md">
            <DialogHeader>
                <DialogTitle className="font-serif">Tax Configuration</DialogTitle>
                <DialogDescription>Adjust rates for estimation accuracy.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label>Filing Status</Label>
                    <Select defaultValue="single">
                        <SelectTrigger className="rounded-none">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                            <SelectItem value="single">Single</SelectItem>
                            <SelectItem value="joint">Married Filing Jointly</SelectItem>
                            <SelectItem value="llc">LLC / S-Corp</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Effective Rate Override (%)</Label>
                    <Input type="number" defaultValue="30" className="rounded-none" />
                </div>
            </div>
            <DialogFooter>
                <Button className="rounded-none" onClick={() => setShowSettings(false)}>Save Configuration</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
