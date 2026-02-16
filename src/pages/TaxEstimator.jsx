import { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { startOfYear, endOfYear, startOfQuarter, endOfQuarter } from "date-fns";
import { 
  Calculator, 
  DollarSign, 
  AlertCircle,
  CheckCircle2,
  Calendar,
  Settings as SettingsIcon,
  Info,
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
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function TaxEstimator() {
  const [showSettings, setShowSettings] = useState(false);
  const [taxSettings, setTaxSettings] = useState({
    filing_status: "single",
    effective_income_tax_rate: 22,
    estimated_deductions: 0,
  });
  const queryClient = useQueryClient();

  const currentYear = new Date().getFullYear();

  const { data: transactions = [] } = useQuery({
    queryKey: ["revenueTransactions"],
    queryFn: () => base44.entities.RevenueTransaction.list("-transaction_date", 1000),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => base44.entities.Expense.list("-expense_date", 1000),
  });

  const { data: taxProfile } = useQuery({
    queryKey: ["taxProfile", currentYear],
    queryFn: async () => {
      const profiles = await base44.entities.TaxProfile.filter({ tax_year: currentYear });
      return profiles[0] || null;
    },
  });

  const updateTaxProfileMutation = useMutation({
    mutationFn: async (data) => {
      if (taxProfile?.id) {
        return base44.entities.TaxProfile.update(taxProfile.id, data);
      } else {
        return base44.entities.TaxProfile.create({ ...data, tax_year: currentYear });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxProfile"] });
      toast.success("Tax settings updated");
      setShowSettings(false);
    },
  });

  useEffect(() => {
    if (taxProfile) {
      setTaxSettings({
        filing_status: taxProfile.filing_status,
        effective_income_tax_rate: taxProfile.effective_income_tax_rate * 100,
        estimated_deductions: taxProfile.estimated_deductions,
      });
    }
  }, [taxProfile]);

  const taxCalculations = useMemo(() => {
    const yearStart = startOfYear(new Date());
    const yearEnd = endOfYear(new Date());

    const yearTransactions = transactions.filter(t => {
      const date = new Date(t.transaction_date);
      return date >= yearStart && date <= yearEnd;
    });

    const yearExpenses = expenses.filter(e => {
      const date = new Date(e.expense_date);
      return date >= yearStart && date <= yearEnd;
    });

    const totalRevenue = yearTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalFees = yearTransactions.reduce((sum, t) => sum + (t.platform_fee || 0), 0);
    const netIncome = totalRevenue - totalFees;

    // Calculate deductible expenses
    const deductibleExpenses = yearExpenses.reduce((sum, e) => {
      if (!e.is_tax_deductible) return sum;
      return sum + (e.amount * (e.deduction_percentage / 100));
    }, 0);

    const deductions = (taxSettings.estimated_deductions || 0) + deductibleExpenses;
    const taxableIncome = Math.max(0, netIncome - deductions);

    const selfEmploymentTax = taxableIncome * 0.153;
    const incomeTax = taxableIncome * (taxSettings.effective_income_tax_rate / 100);
    const totalTaxLiability = selfEmploymentTax + incomeTax;

    const quarterlyPayment = totalTaxLiability / 4;

    const quarters = [
      { name: "Q1", start: startOfQuarter(new Date(currentYear, 0, 1)), end: endOfQuarter(new Date(currentYear, 0, 1)), due: "Apr 15" },
      { name: "Q2", start: startOfQuarter(new Date(currentYear, 3, 1)), end: endOfQuarter(new Date(currentYear, 3, 1)), due: "Jun 15" },
      { name: "Q3", start: startOfQuarter(new Date(currentYear, 6, 1)), end: endOfQuarter(new Date(currentYear, 6, 1)), due: "Sep 15" },
      { name: "Q4", start: startOfQuarter(new Date(currentYear, 9, 1)), end: endOfQuarter(new Date(currentYear, 9, 1)), due: "Jan 15" },
    ];

    const quarterData = quarters.map(q => {
      const qTransactions = transactions.filter(t => {
        const date = new Date(t.transaction_date);
        return date >= q.start && date <= q.end;
      });
      const qRevenue = qTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      const paid = taxProfile?.[`q${quarters.indexOf(q) + 1}_paid`] || 0;
      return { ...q, revenue: qRevenue, paid };
    });

    const totalPaid = (taxProfile?.q1_paid || 0) + (taxProfile?.q2_paid || 0) + (taxProfile?.q3_paid || 0) + (taxProfile?.q4_paid || 0);
    const remaining = totalTaxLiability - totalPaid;

    // Calculate upcoming deadlines
    const now = new Date();
    const upcomingDeadlines = quarterData
      .filter(q => {
        const deadlineDate = new Date(`${currentYear}-${q.due.split(' ')[0]}-${q.due.split(' ')[1]}`);
        const daysUntil = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
        return daysUntil > 0 && daysUntil <= 30 && q.paid < quarterlyPayment * 0.95;
      })
      .map(q => {
        const deadlineDate = new Date(`${currentYear}-${q.due.split(' ')[0]}-${q.due.split(' ')[1]}`);
        const daysUntil = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
        return { ...q, daysUntil };
      });

    return {
      totalRevenue,
      totalFees,
      netIncome,
      deductions,
      taxableIncome,
      selfEmploymentTax,
      incomeTax,
      totalTaxLiability,
      quarterlyPayment,
      quarterData,
      totalPaid,
      remaining,
      upcomingDeadlines,
      deductibleExpenses
    };
  }, [transactions, expenses, taxSettings, taxProfile, currentYear]);

  const handleSaveSettings = () => {
    updateTaxProfileMutation.mutate({
      filing_status: taxSettings.filing_status,
      effective_income_tax_rate: taxSettings.effective_income_tax_rate / 100,
      estimated_deductions: taxSettings.estimated_deductions,
    });
  };

  const handleMarkPaid = (quarter) => {
    const qNum = taxCalculations.quarterData.indexOf(quarter) + 1;
    const fieldName = `q${qNum}_paid`;
    updateTaxProfileMutation.mutate({
      [fieldName]: taxCalculations.quarterlyPayment
    });
  };

  const handleExportReport = async () => {
    try {
      const response = await base44.functions.invoke('exportTaxReport', {
        taxYear: currentYear
      });
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tax_report_${currentYear}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success('Tax report downloaded');
    } catch (error) {
      toast.error('Failed to export tax report');
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Tax Estimator</h1>
          <p className="text-white/40 mt-1 text-sm">Estimate and track your quarterly tax obligations</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleExportReport}
            className="rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white h-9"
          >
            <Download className="w-3.5 h-3.5 mr-2" />
            Export Report
          </Button>
          <Button
            onClick={() => setShowSettings(true)}
            className="rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white h-9"
          >
            <SettingsIcon className="w-3.5 h-3.5 mr-2" />
            Settings
          </Button>
        </div>
      </motion.div>

      {taxCalculations.upcomingDeadlines.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3"
        >
          <Bell className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-amber-400 mb-1">Upcoming Tax Deadline</p>
            {taxCalculations.upcomingDeadlines.map(deadline => (
              <p key={deadline.name} className="text-sm text-amber-300">
                {deadline.name} payment due in {deadline.daysUntil} days ({deadline.due}) - ${taxCalculations.quarterlyPayment.toFixed(0)}
              </p>
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-modern rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-white/50 text-xs">Total Tax Liability</p>
              <p className="text-2xl font-bold text-white">${taxCalculations.totalTaxLiability.toFixed(0)}</p>
            </div>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-white/40">
              <span>Income Tax ({taxSettings.effective_income_tax_rate}%)</span>
              <span className="text-white/70">${taxCalculations.incomeTax.toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-white/40">
              <span>Self-Employment (15.3%)</span>
              <span className="text-white/70">${taxCalculations.selfEmploymentTax.toFixed(0)}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-modern rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-white/50 text-xs">Quarterly Payment</p>
              <p className="text-2xl font-bold text-white">${taxCalculations.quarterlyPayment.toFixed(0)}</p>
            </div>
          </div>
          <p className="text-xs text-white/40">Due every quarter to avoid penalties</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-modern rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={cn(
              "w-10 h-10 rounded-lg border flex items-center justify-center",
              taxCalculations.remaining > 0 ? "bg-amber-500/10 border-amber-500/20" : "bg-emerald-500/10 border-emerald-500/20"
            )}>
              {taxCalculations.remaining > 0 ? (
                <AlertCircle className="w-5 h-5 text-amber-400" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <div>
              <p className="text-white/50 text-xs">Remaining</p>
              <p className="text-2xl font-bold text-white">${Math.max(0, taxCalculations.remaining).toFixed(0)}</p>
            </div>
          </div>
          <p className="text-xs text-white/40">Total paid: ${taxCalculations.totalPaid.toFixed(0)}</p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card-modern rounded-xl p-6 mb-8"
      >
        <h3 className="text-lg font-bold text-white mb-4">Income Breakdown ({currentYear})</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
            <p className="text-xs text-white/40 mb-1">Gross Revenue</p>
            <p className="text-xl font-bold text-white">${taxCalculations.totalRevenue.toFixed(0)}</p>
          </div>
          <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
            <p className="text-xs text-white/40 mb-1">Platform Fees</p>
            <p className="text-xl font-bold text-red-400">-${taxCalculations.totalFees.toFixed(0)}</p>
          </div>
          <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
            <p className="text-xs text-white/40 mb-1">Deductions</p>
            <p className="text-xl font-bold text-red-400">-${taxCalculations.deductions.toFixed(0)}</p>
            {taxCalculations.deductibleExpenses > 0 && (
              <p className="text-[10px] text-emerald-400 mt-1">
                ${taxCalculations.deductibleExpenses.toFixed(0)} from tracked expenses
              </p>
            )}
          </div>
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-xs text-emerald-400 mb-1">Taxable Income</p>
            <p className="text-xl font-bold text-white">${taxCalculations.taxableIncome.toFixed(0)}</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card-modern rounded-xl p-6"
      >
        <h3 className="text-lg font-bold text-white mb-6">Quarterly Payments</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {taxCalculations.quarterData.map((quarter, idx) => {
            const isPaid = quarter.paid >= taxCalculations.quarterlyPayment * 0.95;
            const now = new Date();
            const isPast = now > quarter.end;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + idx * 0.1 }}
                className={cn(
                  "p-5 rounded-xl border",
                  isPaid ? "bg-emerald-500/5 border-emerald-500/20" : isPast ? "bg-red-500/5 border-red-500/20" : "bg-white/[0.02] border-white/10"
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-white">{quarter.name}</span>
                  {isPaid && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                  {!isPaid && isPast && <AlertCircle className="w-5 h-5 text-red-400" />}
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <Calendar className="w-3 h-3" />
                    Due: {quarter.due}
                  </div>
                  <div className="text-xs text-white/40">
                    Revenue: ${quarter.revenue.toFixed(0)}
                  </div>
                  <div className="text-2xl font-bold text-white mt-2">
                    ${taxCalculations.quarterlyPayment.toFixed(0)}
                  </div>
                </div>
                {!isPaid && (
                  <Button
                    onClick={() => handleMarkPaid(quarter)}
                    disabled={updateTaxProfileMutation.isPending}
                    className="w-full rounded-lg bg-zteal-400 text-white text-xs h-8"
                  >
                    Mark as Paid
                  </Button>
                )}
                {isPaid && (
                  <div className="text-xs text-emerald-400 text-center">
                    Paid: ${quarter.paid.toFixed(0)}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3"
      >
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-300">
          <p className="font-semibold mb-1">Tax Estimate Disclaimer</p>
          <p className="text-xs text-blue-300/80">
            This is an estimate only. Consult with a tax professional for accurate tax planning. Rates and calculations are based on your settings and may not reflect your actual tax situation.
          </p>
        </div>
      </motion.div>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="card-modern rounded-2xl border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">Tax Settings</DialogTitle>
            <DialogDescription className="text-white/40 text-sm">
              Configure your tax profile for accurate estimates
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-white/60 mb-2 block text-sm">Filing Status</Label>
              <Select
                value={taxSettings.filing_status}
                onValueChange={(value) => setTaxSettings({ ...taxSettings, filing_status: value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married_joint">Married Filing Jointly</SelectItem>
                  <SelectItem value="married_separate">Married Filing Separately</SelectItem>
                  <SelectItem value="head_of_household">Head of Household</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white/60 mb-2 block text-sm">Effective Income Tax Rate (%)</Label>
              <Input
                type="number"
                value={taxSettings.effective_income_tax_rate}
                onChange={(e) => setTaxSettings({ ...taxSettings, effective_income_tax_rate: parseFloat(e.target.value) || 0 })}
                className="bg-white/5 border-white/10 text-white"
              />
              <p className="text-xs text-white/30 mt-1">Typical range: 12-32% based on income</p>
            </div>

            <div>
              <Label className="text-white/60 mb-2 block text-sm">Estimated Annual Deductions ($)</Label>
              <Input
                type="number"
                value={taxSettings.estimated_deductions}
                onChange={(e) => setTaxSettings({ ...taxSettings, estimated_deductions: parseFloat(e.target.value) || 0 })}
                className="bg-white/5 border-white/10 text-white"
              />
              <p className="text-xs text-white/30 mt-1">Business expenses, home office, equipment, etc.</p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowSettings(false)}
                className="flex-1 rounded-lg border-white/10 text-white/70 hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveSettings}
                disabled={updateTaxProfileMutation.isPending}
                className="flex-1 rounded-lg bg-zteal-400 text-white"
              >
                Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}