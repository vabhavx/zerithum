import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { differenceInCalendarDays, format, startOfYear, endOfYear } from "date-fns";
import { jsPDF } from "jspdf";
import {
  CheckCircle2,
  FileText,
  ShieldCheck,
  Calculator,
  Info,
  ChevronDown,
  ChevronUp,
  Download
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/supabaseClient";
import { toast } from "sonner";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { PageTransition, AnimatedItem } from "@/components/ui/PageTransition";
import { GlassCard } from "@/components/ui/glass-card";

const INPUT_STORAGE_KEY = "zerithum-tax-estimator-inputs-v1";
const PAYMENT_STORAGE_KEY = "zerithum-tax-estimator-payment-status-v1";

const DEFAULT_INPUTS = {
  filingStatus: "single",
  state: "CA",
  expectedAnnualRevenue: 0,
  expenseRate: 25,
  includeOtherIncome: false,
  otherIncome: 0,
};

const DEFAULT_PAYMENT_STATUS = {
  q1: { paid: false, paidAt: null },
  q2: { paid: false, paidAt: null },
  q3: { paid: false, paidAt: null },
  q4: { paid: false, paidAt: null },
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const FILING_STATUS_OPTIONS = [
  { value: "single", label: "Single" },
  { value: "married_joint", label: "Married Filing Jointly" },
  { value: "married_separate", label: "Married Filing Separately" },
  { value: "head_of_household", label: "Head of Household" },
];

const STATE_OPTIONS = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
  { value: "DC", label: "District of Columbia" },
];

const STATE_EFFECTIVE_RATE = {
  AL: 0.04,
  AK: 0,
  AZ: 0.025,
  AR: 0.043,
  CA: 0.067,
  CO: 0.044,
  CT: 0.05,
  DE: 0.05,
  FL: 0,
  GA: 0.046,
  HI: 0.063,
  ID: 0.058,
  IL: 0.0495,
  IN: 0.0315,
  IA: 0.045,
  KS: 0.048,
  KY: 0.045,
  LA: 0.04,
  ME: 0.058,
  MD: 0.055,
  MA: 0.05,
  MI: 0.0425,
  MN: 0.06,
  MS: 0.04,
  MO: 0.047,
  MT: 0.053,
  NE: 0.052,
  NV: 0,
  NH: 0,
  NJ: 0.057,
  NM: 0.047,
  NY: 0.062,
  NC: 0.045,
  ND: 0.026,
  OH: 0.035,
  OK: 0.04,
  OR: 0.075,
  PA: 0.0307,
  RI: 0.05,
  SC: 0.045,
  SD: 0,
  TN: 0,
  TX: 0,
  UT: 0.0485,
  VT: 0.053,
  VA: 0.048,
  WA: 0,
  WV: 0.045,
  WI: 0.053,
  WY: 0,
  DC: 0.06,
};

const FEDERAL_BRACKETS = {
  single: [
    { upTo: 11600, rate: 0.1 },
    { upTo: 47150, rate: 0.12 },
    { upTo: 100525, rate: 0.22 },
    { upTo: 191950, rate: 0.24 },
    { upTo: 243725, rate: 0.32 },
    { upTo: 609350, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ],
  married_joint: [
    { upTo: 23200, rate: 0.1 },
    { upTo: 94300, rate: 0.12 },
    { upTo: 201050, rate: 0.22 },
    { upTo: 383900, rate: 0.24 },
    { upTo: 487450, rate: 0.32 },
    { upTo: 731200, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ],
  married_separate: [
    { upTo: 11600, rate: 0.1 },
    { upTo: 47150, rate: 0.12 },
    { upTo: 100525, rate: 0.22 },
    { upTo: 191950, rate: 0.24 },
    { upTo: 243725, rate: 0.32 },
    { upTo: 365600, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ],
  head_of_household: [
    { upTo: 16550, rate: 0.1 },
    { upTo: 63100, rate: 0.12 },
    { upTo: 100500, rate: 0.22 },
    { upTo: 191950, rate: 0.24 },
    { upTo: 243700, rate: 0.32 },
    { upTo: 609350, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ],
};

const BANK_PLATFORM_HINTS = new Set([
  "stripe",
  "wise",
  "bank",
  "plaid",
  "quickbooks",
  "xero",
  "bank_account",
  "banking",
  "paypal",
]);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toNonNegativeNumber(value) {
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed) || parsed < 0) return 0;
  return parsed;
}

function formatCurrency(value) {
  return currencyFormatter.format(value || 0);
}

function formatPercent(decimalValue) {
  return `${percentFormatter.format((decimalValue || 0) * 100)}%`;
}

function calculateProgressiveTax(income, brackets) {
  if (!income || income <= 0) return 0;

  let remaining = income;
  let priorCap = 0;
  let tax = 0;

  for (const bracket of brackets) {
    if (remaining <= 0) break;
    const currentCap = bracket.upTo;
    const taxableAtThisRate = Math.min(remaining, currentCap - priorCap);
    tax += taxableAtThisRate * bracket.rate;
    remaining -= taxableAtThisRate;
    priorCap = currentCap;
  }

  return tax;
}

function getQuarterSchedule(year) {
  return [
    {
      id: "q1",
      label: "Q1",
      period: `Jan 1 - Mar 31, ${year}`,
      dueDate: new Date(year, 3, 15),
    },
    {
      id: "q2",
      label: "Q2",
      period: `Apr 1 - May 31, ${year}`,
      dueDate: new Date(year, 5, 15),
    },
    {
      id: "q3",
      label: "Q3",
      period: `Jun 1 - Aug 31, ${year}`,
      dueDate: new Date(year, 8, 15),
    },
    {
      id: "q4",
      label: "Q4",
      period: `Sep 1 - Dec 31, ${year}`,
      dueDate: new Date(year + 1, 0, 15),
    },
  ];
}

function getConfidenceLabel(confidenceScore) {
  if (confidenceScore >= 80) return "High";
  if (confidenceScore >= 55) return "Medium";
  return "Low";
}

function getConfidenceTone(confidenceScore) {
  if (confidenceScore >= 80) return "text-[#56C5D0]";
  if (confidenceScore >= 55) return "text-[#F0A562]";
  return "text-[#F06C6C]";
}

function getUncertaintyBand({
  confidenceScore,
  daysHistory,
  platformsConnected,
  includeOtherIncome,
}) {
  const confidenceAdjustment = (100 - confidenceScore) * 0.0006;
  const historyPenalty = daysHistory < 90 ? 0.015 : 0;
  const platformPenalty = platformsConnected === 0 ? 0.01 : 0;
  const otherIncomePenalty = includeOtherIncome ? 0.006 : 0;
  return clamp(0.02 + confidenceAdjustment + historyPenalty + platformPenalty + otherIncomePenalty, 0.02, 0.12);
}

export function AssumptionsDrawer({ open, onOpenChange, assumptions }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full max-w-[560px] border-l border-white/10 bg-[#0F0F12]/95 p-0 text-[#F5F5F5] backdrop-blur-xl"
        style={{
          left: "auto",
          top: "0",
          right: "0",
          transform: "none",
          height: "100vh",
          maxWidth: "560px",
        }}
      >
        <div className="h-full overflow-y-auto p-6">
          <DialogHeader className="mb-6 space-y-2 text-left">
            <DialogTitle className="text-xl font-semibold text-[#F5F5F5]">
              Tax Estimator Assumptions
            </DialogTitle>
            <DialogDescription className="text-sm text-white/70">
              This model is conservative and transparent. It is not a tax filing engine.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm text-white/85">
            <div className="rounded-lg border border-white/10 bg-[#141418] p-4">
              <p className="mb-2 font-medium text-[#F5F5F5]">Federal tax method</p>
              <p>
                Progressive federal tax brackets are applied to estimated taxable income by filing status.
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#141418] p-4">
              <p className="mb-2 font-medium text-[#F5F5F5]">Self-employment tax</p>
              <p>
                Self-employment tax is estimated at {formatPercent(0.153)}, then half of that amount is deducted before federal/state estimation.
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#141418] p-4">
              <p className="mb-2 font-medium text-[#F5F5F5]">State estimate</p>
              <p>
                State taxes use effective-rate assumptions by selected state. For {assumptions.stateLabel}, the rate applied is{" "}
                {formatPercent(assumptions.stateRate)}.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CalculationBreakdown({ rows }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <GlassCard className="mt-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-2">
           <Calculator className="h-4 w-4 text-[#56C5D0]" />
           <span className="font-semibold text-[#F5F5F5]">Detailed Calculation Breakdown</span>
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4 text-white/50" /> : <ChevronDown className="h-4 w-4 text-white/50" />}
      </button>

      <AnimatePresence>
        {isOpen && (
           <motion.div
             initial={{ height: 0, opacity: 0 }}
             animate={{ height: "auto", opacity: 1 }}
             exit={{ height: 0, opacity: 0 }}
             className="overflow-hidden"
           >
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-[#D8D8D8]">Step</TableHead>
                    <TableHead className="text-[#D8D8D8]">Formula</TableHead>
                    <TableHead className="text-right text-[#D8D8D8]">Result</TableHead>
                    <TableHead className="text-right text-[#D8D8D8]">Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.step} className="border-white/10 hover:bg-white/[0.02]">
                      <TableCell className="font-medium text-[#F5F5F5]">{row.step}</TableCell>
                      <TableCell className="text-sm text-white/70">{row.formula}</TableCell>
                      <TableCell className="text-right font-mono-financial text-[#F5F5F5]">
                        {row.result}
                      </TableCell>
                      <TableCell className="text-right text-sm text-white/60">{row.source}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
           </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}

export default function TaxEstimatorPage() {
  const currentYear = new Date().getFullYear();
  const [assumptionsOpen, setAssumptionsOpen] = useState(false);
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [paymentStatus, setPaymentStatus] = useState(DEFAULT_PAYMENT_STATUS);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(new Date());
  const [didLoadStoredInputs, setDidLoadStoredInputs] = useState(false);
  const [didLoadStoredPayments, setDidLoadStoredPayments] = useState(false);
  const [didAutoFillFromData, setDidAutoFillFromData] = useState(false);

  const { data: transactions = [] } = useQuery({
    queryKey: ["taxEstimator", "revenueTransactions"],
    queryFn: () => base44.entities.RevenueTransaction.list("-transaction_date", 2000),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["taxEstimator", "expenses"],
    queryFn: () => base44.entities.Expense.list("-expense_date", 2000),
  });

  const { data: connectedPlatforms = [] } = useQuery({
    queryKey: ["taxEstimator", "connectedPlatforms"],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.ConnectedPlatform.filter({ user_id: user.id });
    },
  });

  const observedRevenueAndExpenseRate = useMemo(() => {
    const yearStart = startOfYear(new Date(currentYear, 0, 1));
    const yearEnd = endOfYear(new Date(currentYear, 0, 1));
    const thisYearTransactions = transactions.filter((transaction) => {
      const date = new Date(transaction.transaction_date);
      return date >= yearStart && date <= yearEnd;
    });

    const thisYearExpenses = expenses.filter((expense) => {
      const date = new Date(expense.expense_date);
      return date >= yearStart && date <= yearEnd;
    });

    const annualRevenue = thisYearTransactions.reduce((sum, transaction) => sum + (transaction.amount || 0), 0);
    const annualExpense = thisYearExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const expenseRate = annualRevenue > 0 ? clamp((annualExpense / annualRevenue) * 100, 0, 100) : DEFAULT_INPUTS.expenseRate;

    return {
      annualRevenue,
      expenseRate,
    };
  }, [transactions, expenses, currentYear]);

  // Load/Save Effects (Keep existing logic)
  useEffect(() => {
    try {
      const storedInputs = window.localStorage.getItem(INPUT_STORAGE_KEY);
      if (storedInputs) {
        const parsed = JSON.parse(storedInputs);
        setInputs((previousInputs) => ({
          ...previousInputs,
          ...parsed,
          expenseRate: clamp(toNonNegativeNumber(parsed.expenseRate), 0, 100),
          expectedAnnualRevenue: toNonNegativeNumber(parsed.expectedAnnualRevenue),
          otherIncome: toNonNegativeNumber(parsed.otherIncome),
        }));
      }
    } catch { } finally { setDidLoadStoredInputs(true); }
  }, []);

  useEffect(() => {
    try {
      const storedPayments = window.localStorage.getItem(PAYMENT_STORAGE_KEY);
      if (storedPayments) {
        const parsed = JSON.parse(storedPayments);
        setPaymentStatus((previousStatus) => ({ ...previousStatus, ...parsed }));
      }
    } catch { } finally { setDidLoadStoredPayments(true); }
  }, []);

  useEffect(() => {
    if (!didLoadStoredInputs || didAutoFillFromData) return;
    const hasUserValue = inputs.expectedAnnualRevenue !== DEFAULT_INPUTS.expectedAnnualRevenue;
    if (hasUserValue) {
      setDidAutoFillFromData(true);
      return;
    }
    if (observedRevenueAndExpenseRate.annualRevenue <= 0) return;

    setInputs((prev) => ({
      ...prev,
      expectedAnnualRevenue: observedRevenueAndExpenseRate.annualRevenue,
      expenseRate: observedRevenueAndExpenseRate.expenseRate,
    }));
    setDidAutoFillFromData(true);
  }, [didLoadStoredInputs, didAutoFillFromData, inputs.expectedAnnualRevenue, observedRevenueAndExpenseRate]);

  useEffect(() => {
    if (!didLoadStoredInputs) return;
    window.localStorage.setItem(INPUT_STORAGE_KEY, JSON.stringify(inputs));
  }, [inputs, didLoadStoredInputs]);

  useEffect(() => {
    if (!didLoadStoredPayments) return;
    window.localStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(paymentStatus));
  }, [paymentStatus, didLoadStoredPayments]);

  useEffect(() => {
    setLastUpdatedAt(new Date());
  }, [inputs, transactions.length, expenses.length, connectedPlatforms.length]);


  const dataCompleteness = useMemo(() => {
    const dateCandidates = [
      ...transactions.map((transaction) => new Date(transaction.transaction_date)),
      ...expenses.map((expense) => new Date(expense.expense_date)),
    ].filter((date) => !Number.isNaN(date.getTime()));

    const earliestDate = dateCandidates.length
      ? new Date(Math.min(...dateCandidates.map((date) => date.getTime())))
      : null;

    const daysHistory = earliestDate ? Math.max(0, differenceInCalendarDays(new Date(), earliestDate) + 1) : 0;
    const platformsConnected = connectedPlatforms.length;
    const bankConnected = connectedPlatforms.some((p) =>
      [...BANK_PLATFORM_HINTS].some((hint) => (p.platform || "").toLowerCase().includes(hint))
    );

    const historyScore = Math.min(daysHistory / 365, 1) * 40;
    const platformScore = Math.min(platformsConnected / 4, 1) * 35;
    const bankScore = bankConnected ? 25 : 0;
    const confidenceScore = Math.round(historyScore + platformScore + bankScore);

    const lastSyncedAt = connectedPlatforms
      .map((p) => p.last_synced_at)
      .filter(Boolean)
      .map((d) => new Date(d))
      .sort((a, b) => b.getTime() - a.getTime())[0] || null;

    return {
      daysHistory,
      platformsConnected,
      bankConnected,
      confidenceScore,
      confidenceLabel: getConfidenceLabel(confidenceScore),
      lastSyncedAt,
      dataSourcesUsed: [
        `Revenue (${transactions.length})`,
        `Expenses (${expenses.length})`,
        `Platforms (${platformsConnected})`,
      ],
    };
  }, [transactions, expenses, connectedPlatforms]);

  const calculations = useMemo(() => {
    const otherIncome = inputs.includeOtherIncome ? inputs.otherIncome : 0;
    const grossIncome = inputs.expectedAnnualRevenue + otherIncome;
    const estimatedExpenses = inputs.expectedAnnualRevenue * (inputs.expenseRate / 100);
    const businessIncomeAfterExpenses = Math.max(0, grossIncome - estimatedExpenses);

    const selfEmploymentTax = businessIncomeAfterExpenses * 0.153;
    const halfSelfEmploymentDeduction = selfEmploymentTax * 0.5;
    const taxableIncomeForFederalAndState = Math.max(0, businessIncomeAfterExpenses - halfSelfEmploymentDeduction);

    const federalBrackets = FEDERAL_BRACKETS[inputs.filingStatus] || FEDERAL_BRACKETS.single;
    const federalIncomeTax = calculateProgressiveTax(taxableIncomeForFederalAndState, federalBrackets);
    const federalEffectiveRate = taxableIncomeForFederalAndState > 0 ? federalIncomeTax / taxableIncomeForFederalAndState : 0;

    const stateRate = STATE_EFFECTIVE_RATE[inputs.state] ?? 0.04;
    const stateIncomeTax = taxableIncomeForFederalAndState * stateRate;
    const totalEstimatedAnnualTax = selfEmploymentTax + federalIncomeTax + stateIncomeTax;

    const effectiveRatePointEstimate =
      businessIncomeAfterExpenses > 0 ? totalEstimatedAnnualTax / businessIncomeAfterExpenses : 0;

    const uncertaintyBand = getUncertaintyBand({
      confidenceScore: dataCompleteness.confidenceScore,
      daysHistory: dataCompleteness.daysHistory,
      platformsConnected: dataCompleteness.platformsConnected,
      includeOtherIncome: inputs.includeOtherIncome,
    });

    const effectiveRateLower = Math.max(0, effectiveRatePointEstimate - uncertaintyBand);
    const effectiveRateUpper = effectiveRatePointEstimate + uncertaintyBand;
    const quarterlySetAsidePoint = totalEstimatedAnnualTax / 4;
    const quarterlySetAsideLower = (businessIncomeAfterExpenses * effectiveRateLower) / 4;
    const quarterlySetAsideUpper = (businessIncomeAfterExpenses * effectiveRateUpper) / 4;

    return {
      otherIncome,
      grossIncome,
      estimatedExpenses,
      businessIncomeAfterExpenses,
      selfEmploymentTax,
      halfSelfEmploymentDeduction,
      taxableIncomeForFederalAndState,
      federalIncomeTax,
      federalEffectiveRate,
      stateRate,
      stateIncomeTax,
      totalEstimatedAnnualTax,
      effectiveRatePointEstimate,
      effectiveRateLower,
      effectiveRateUpper,
      quarterlySetAsidePoint,
      quarterlySetAsideLower,
      quarterlySetAsideUpper,
      uncertaintyBand,
    };
  }, [inputs, dataCompleteness]);

  const calculationRows = useMemo(() => {
    return [
      {
        step: "1. Gross income",
        formula: `${formatCurrency(inputs.expectedAnnualRevenue)} + ${formatCurrency(calculations.otherIncome)}`,
        result: formatCurrency(calculations.grossIncome),
        source: "Input values",
      },
      {
        step: "2. Estimated expenses",
        formula: `${formatCurrency(inputs.expectedAnnualRevenue)} × ${percentFormatter.format(inputs.expenseRate)}%`,
        result: formatCurrency(calculations.estimatedExpenses),
        source: "Expense rate input",
      },
      {
        step: "3. Business income",
        formula: `max(0, gross - expenses)`,
        result: formatCurrency(calculations.businessIncomeAfterExpenses),
        source: "Estimator rule",
      },
      {
        step: "4. SE tax",
        formula: `${formatCurrency(calculations.businessIncomeAfterExpenses)} × 15.30%`,
        result: formatCurrency(calculations.selfEmploymentTax),
        source: "IRS SE baseline",
      },
      {
        step: "5. Taxable income",
        formula: `max(0, business income - SE deduction)`,
        result: formatCurrency(calculations.taxableIncomeForFederalAndState),
        source: "Estimator rule",
      },
      {
        step: "6. Total Annual Estimate",
        formula: `SE + Federal + State`,
        result: formatCurrency(calculations.totalEstimatedAnnualTax),
        source: "Computed",
      },
    ];
  }, [inputs, calculations]);

  const paymentSchedule = useMemo(() => getQuarterSchedule(currentYear), [currentYear]);

  const handlePaymentToggle = (quarterId) => {
    setPaymentStatus((previousStatus) => {
      const existing = previousStatus[quarterId] || DEFAULT_PAYMENT_STATUS[quarterId];
      const nextPaidState = !existing.paid;
      return {
        ...previousStatus,
        [quarterId]: {
          paid: nextPaidState,
          paidAt: nextPaidState ? new Date().toISOString() : null,
        },
      };
    });
  };

  const handleDownloadPdf = () => {
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const left = 40;
      let y = 48;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Zerithum Tax Estimator Calculation Report", left, y);

      y += 22;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Generated: ${format(new Date(), "MMM d, yyyy h:mm a")}`, left, y);
      y += 14;
      doc.text(`Tax Year: ${currentYear}`, left, y);
      y += 14;
      doc.text("Disclaimer: Estimates only, not tax advice.", left, y);

      y += 24;
      doc.setFont("helvetica", "bold");
      doc.text("Inputs", left, y);
      y += 14;
      doc.setFont("helvetica", "normal");
      const inputLines = [
        `Filing status: ${FILING_STATUS_OPTIONS.find((status) => status.value === inputs.filingStatus)?.label || "Single"}`,
        `State: ${STATE_OPTIONS.find((state) => state.value === inputs.state)?.label || inputs.state}`,
        `Expected annual revenue: ${formatCurrency(inputs.expectedAnnualRevenue)}`,
        `Expense rate: ${percentFormatter.format(inputs.expenseRate)}%`,
        `Other income included: ${inputs.includeOtherIncome ? "Yes" : "No"}`,
        `Other income amount: ${formatCurrency(calculations.otherIncome)}`,
      ];
      inputLines.forEach((line) => {
        doc.text(line, left, y);
        y += 13;
      });

      y += 12;
      doc.setFont("helvetica", "bold");
      doc.text("Outputs", left, y);
      y += 14;
      doc.setFont("helvetica", "normal");
      const outputLines = [
        `Quarterly set-aside range: ${formatCurrency(calculations.quarterlySetAsideLower)} to ${formatCurrency(calculations.quarterlySetAsideUpper)}`,
        `Quarterly point estimate: ${formatCurrency(calculations.quarterlySetAsidePoint)}`,
        `Effective tax rate range: ${formatPercent(calculations.effectiveRateLower)} to ${formatPercent(calculations.effectiveRateUpper)}`,
        `Confidence score: ${dataCompleteness.confidenceScore}/100 (${dataCompleteness.confidenceLabel})`,
        `Last synced: ${dataCompleteness.lastSyncedAt ? format(dataCompleteness.lastSyncedAt, "MMM d, yyyy h:mm a") : "No sync timestamp available"}`,
      ];
      outputLines.forEach((line) => {
        doc.text(line, left, y);
        y += 13;
      });

      y += 12;
      doc.setFont("helvetica", "bold");
      doc.text("Calculation Breakdown", left, y);
      y += 14;
      doc.setFont("helvetica", "normal");

      calculationRows.forEach((row) => {
        const line = `${row.step} | ${row.result} | ${row.formula} | ${row.source}`;
        const wrapped = doc.splitTextToSize(line, 520);
        wrapped.forEach((entry) => {
          if (y > 760) {
            doc.addPage();
            y = 48;
          }
          doc.text(entry, left, y);
          y += 12;
        });
      });

      doc.save(`zerithum-tax-calculation-report-${currentYear}.pdf`);
      toast.success("Calculation report downloaded");
    } catch {
      toast.error("Could not generate PDF report");
    }
  };

  const handleExportInputsJson = () => {
    const exportPayload = {
      generated_at: new Date().toISOString(),
      year: currentYear,
      inputs,
      outputs: {
        quarterly_set_aside_range: {
          lower: calculations.quarterlySetAsideLower,
          upper: calculations.quarterlySetAsideUpper,
          point_estimate: calculations.quarterlySetAsidePoint,
        },
        effective_rate_range: {
          lower: calculations.effectiveRateLower,
          upper: calculations.effectiveRateUpper,
          point_estimate: calculations.effectiveRatePointEstimate,
        },
        confidence_score: dataCompleteness.confidenceScore,
      },
      data_completeness: {
        days_history: dataCompleteness.daysHistory,
        platforms_connected: dataCompleteness.platformsConnected,
        bank_connected: dataCompleteness.bankConnected,
        last_sync: dataCompleteness.lastSyncedAt ? dataCompleteness.lastSyncedAt.toISOString() : null,
      },
      payment_schedule: paymentSchedule.map((quarter) => ({
        quarter: quarter.label,
        due_date: format(quarter.dueDate, "yyyy-MM-dd"),
        paid: paymentStatus[quarter.id]?.paid || false,
        paid_at: paymentStatus[quarter.id]?.paidAt || null,
      })),
      calculation_breakdown: calculationRows.map((row) => ({
        step: row.step,
        formula: row.formula,
        result: row.result,
        source: row.source,
      })),
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `zerithum-tax-inputs-${currentYear}.json`;
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(url);
    link.remove();
    toast.success("Input export downloaded");
  };

  const rateData = [
    { name: "Effective Tax", value: calculations.effectiveRatePointEstimate * 100 },
    { name: "Remaining", value: 100 - (calculations.effectiveRatePointEstimate * 100) },
  ];

  return (
    <PageTransition className="mx-auto w-full max-w-[1400px] p-6 lg:p-8">
      <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#F5F5F5]">Tax Command Center</h1>
          <p className="mt-2 text-base text-white/70">
            Real-time tax liability estimation and payment tracking.
          </p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="border-white/20 bg-transparent text-[#F5F5F5] hover:bg-white/10" onClick={handleDownloadPdf}>
             <FileText className="mr-2 h-4 w-4" /> PDF Report
           </Button>
           <Button variant="outline" className="border-white/20 bg-transparent text-[#F5F5F5] hover:bg-white/10" onClick={handleExportInputsJson}>
             <Download className="mr-2 h-4 w-4" /> Export JSON
           </Button>
           <Button variant="outline" className="border-white/20 bg-transparent text-[#F5F5F5] hover:bg-white/10" onClick={() => setAssumptionsOpen(true)}>
             <Info className="mr-2 h-4 w-4" /> Assumptions
           </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* LEFT COLUMN: CONTROL PANEL */}
        <div className="lg:col-span-4 space-y-6">
          <AnimatedItem delay={0.1}>
            <GlassCard variant="panel" className="p-6">
              <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-[#56C5D0]">
                Input Parameters
              </h2>

              <div className="space-y-5">
                <div>
                  <Label className="text-white/80 text-xs mb-1.5 block">Expected Annual Revenue</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">$</span>
                    <Input
                      type="number"
                      value={inputs.expectedAnnualRevenue}
                      onChange={(e) => setInputs(prev => ({...prev, expectedAnnualRevenue: toNonNegativeNumber(e.target.value)}))}
                      className="pl-7 bg-[#0A0A0A] border-white/10 focus-visible:ring-[#56C5D0]"
                    />
                  </div>
                </div>

                <div>
                   <Label className="text-white/80 text-xs mb-1.5 block">Expense Rate (%)</Label>
                   <Input
                      type="number"
                      value={inputs.expenseRate}
                      onChange={(e) => setInputs(prev => ({...prev, expenseRate: clamp(toNonNegativeNumber(e.target.value), 0, 100)}))}
                      className="bg-[#0A0A0A] border-white/10 focus-visible:ring-[#56C5D0]"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <div>
                     <Label className="text-white/80 text-xs mb-1.5 block">Filing Status</Label>
                     <Select value={inputs.filingStatus} onValueChange={(v) => setInputs(prev => ({...prev, filingStatus: v}))}>
                       <SelectTrigger className="bg-[#0A0A0A] border-white/10"><SelectValue /></SelectTrigger>
                       <SelectContent className="bg-[#18181B] border-white/10">
                         {FILING_STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                       </SelectContent>
                     </Select>
                   </div>
                   <div>
                     <Label className="text-white/80 text-xs mb-1.5 block">State</Label>
                     <Select value={inputs.state} onValueChange={(v) => setInputs(prev => ({...prev, state: v}))}>
                       <SelectTrigger className="bg-[#0A0A0A] border-white/10"><SelectValue /></SelectTrigger>
                       <SelectContent className="bg-[#18181B] border-white/10 h-60">
                         {STATE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.value}</SelectItem>)}
                       </SelectContent>
                     </Select>
                   </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-white/80 text-xs">Include Other Income</Label>
                    <Switch
                      checked={inputs.includeOtherIncome}
                      onCheckedChange={(c) => setInputs(prev => ({...prev, includeOtherIncome: c}))}
                      className="data-[state=checked]:bg-[#56C5D0]"
                    />
                  </div>
                  {inputs.includeOtherIncome && (
                     <Input
                       type="number"
                       placeholder="Amount"
                       value={inputs.otherIncome}
                       onChange={(e) => setInputs(prev => ({...prev, otherIncome: toNonNegativeNumber(e.target.value)}))}
                       className="bg-[#0A0A0A] border-white/10 focus-visible:ring-[#56C5D0]"
                     />
                  )}
                </div>
              </div>
            </GlassCard>
          </AnimatedItem>

          <AnimatedItem delay={0.2}>
            <GlassCard variant="panel" className="p-6 bg-gradient-to-br from-[#121214]/60 to-[#56C5D0]/5">
               <div className="flex items-center justify-between mb-2">
                 <span className="text-sm font-medium text-white/80">Data Confidence</span>
                 <span className={cn("text-xs font-bold uppercase", getConfidenceTone(dataCompleteness.confidenceScore))}>
                   {dataCompleteness.confidenceLabel}
                 </span>
               </div>
               <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden mb-4">
                  <div
                    className={cn("h-full transition-all duration-1000",
                      dataCompleteness.confidenceScore > 80 ? "bg-[#56C5D0]" : "bg-[#F0A562]"
                    )}
                    style={{ width: `${dataCompleteness.confidenceScore}%` }}
                  />
               </div>
               <div className="text-xs text-white/50 space-y-1">
                 <div className="flex justify-between">
                   <span>History</span>
                   <span>{dataCompleteness.daysHistory} days</span>
                 </div>
                 <div className="flex justify-between">
                   <span>Platforms</span>
                   <span>{dataCompleteness.platformsConnected} connected</span>
                 </div>
               </div>
            </GlassCard>
          </AnimatedItem>
        </div>

        {/* RIGHT COLUMN: HUD OUTPUT */}
        <div className="lg:col-span-8 space-y-6">

           {/* Top HUD Row */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatedItem delay={0.3}>
                 <GlassCard variant="hud" className="p-6 h-full flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                       <ShieldCheck className="h-24 w-24 text-[#56C5D0]" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-[#56C5D0] mb-2">Estimated Quarterly Set Aside</p>
                      <div className="text-4xl lg:text-5xl font-mono-financial font-bold text-white tracking-tighter shadow-glow">
                        {formatCurrency(calculations.quarterlySetAsidePoint)}
                      </div>
                      <p className="text-sm text-white/50 mt-2">
                         Range: {formatCurrency(calculations.quarterlySetAsideLower)} - {formatCurrency(calculations.quarterlySetAsideUpper)}
                      </p>
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-xs text-white/40">
                       <div className="h-1.5 w-1.5 rounded-full bg-[#56C5D0] animate-pulse" />
                       Live Calculation
                    </div>
                 </GlassCard>
              </AnimatedItem>

              <AnimatedItem delay={0.4}>
                 <GlassCard variant="hud" className="p-6 h-full flex items-center justify-between">
                    <div>
                       <p className="text-xs uppercase tracking-widest text-white/60 mb-2">Effective Tax Rate</p>
                       <div className="text-3xl font-mono-financial font-bold text-[#F5F5F5]">
                          {formatPercent(calculations.effectiveRatePointEstimate)}
                       </div>
                       <p className="text-xs text-white/40 mt-1 max-w-[140px]">
                         Combined Federal, State, and Self-Employment
                       </p>
                    </div>
                    <div className="h-[100px] w-[100px]">
                       <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                             <Pie
                               data={rateData}
                               innerRadius={35}
                               outerRadius={45}
                               startAngle={90}
                               endAngle={-270}
                               dataKey="value"
                               stroke="none"
                             >
                                <Cell fill="#56C5D0" />
                                <Cell fill="rgba(255,255,255,0.1)" />
                             </Pie>
                          </PieChart>
                       </ResponsiveContainer>
                    </div>
                 </GlassCard>
              </AnimatedItem>
           </div>

           {/* Payment Schedule */}
           <AnimatedItem delay={0.5}>
              <GlassCard className="p-0 overflow-hidden">
                 <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                    <h3 className="font-semibold text-[#F5F5F5]">Payment Schedule</h3>
                 </div>
                 <div className="overflow-x-auto">
                 <Table>
                   <TableHeader>
                     <TableRow className="border-white/5 hover:bg-transparent">
                       <TableHead className="text-xs font-medium uppercase text-white/50">Quarter</TableHead>
                       <TableHead className="text-xs font-medium uppercase text-white/50">Due Date</TableHead>
                       <TableHead className="text-right text-xs font-medium uppercase text-white/50">Status</TableHead>
                       <TableHead className="text-right w-[100px]"></TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                      {paymentSchedule.map((q) => {
                         const status = paymentStatus[q.id] || DEFAULT_PAYMENT_STATUS[q.id];
                         return (
                           <TableRow key={q.id} className="border-white/5 hover:bg-white/[0.02]">
                             <TableCell className="font-medium text-[#F5F5F5]">{q.label}</TableCell>
                             <TableCell className="text-white/70 text-sm">{format(q.dueDate, "MMM d, yyyy")}</TableCell>
                             <TableCell className="text-right">
                                {status.paid ? (
                                   <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-[#56C5D0]/10 text-[#56C5D0] border border-[#56C5D0]/20">
                                      <CheckCircle2 className="h-3 w-3" /> Paid
                                   </span>
                                ) : (
                                   <span className="text-xs text-white/40">Unpaid</span>
                                )}
                             </TableCell>
                             <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handlePaymentToggle(q.id)}
                                  className="h-7 text-xs hover:bg-white/10 text-white/70"
                                >
                                  {status.paid ? "Undo" : "Mark Paid"}
                                </Button>
                             </TableCell>
                           </TableRow>
                         );
                      })}
                   </TableBody>
                 </Table>
                 </div>
              </GlassCard>
           </AnimatedItem>

           <AnimatedItem delay={0.6}>
              <CalculationBreakdown rows={calculationRows} />
           </AnimatedItem>

        </div>
      </div>

      <AssumptionsDrawer
        open={assumptionsOpen}
        onOpenChange={setAssumptionsOpen}
        assumptions={{
          stateLabel: STATE_OPTIONS.find((option) => option.value === inputs.state)?.label || inputs.state,
          stateRate: STATE_EFFECTIVE_RATE[inputs.state] ?? 0.04,
        }}
      />
    </PageTransition>
  );
}
