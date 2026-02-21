import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { differenceInCalendarDays, format, startOfYear, endOfYear } from "date-fns";
import { jsPDF } from "jspdf";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  FileText,
  ShieldCheck,
} from "lucide-react";
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
  if (confidenceScore >= 80) return "High confidence";
  if (confidenceScore >= 55) return "Medium confidence";
  return "Low confidence";
}

function getConfidenceTone(confidenceScore) {
  if (confidenceScore >= 80) return "text-[#56C5D0] border-[#56C5D0]/40 bg-[#56C5D0]/10";
  if (confidenceScore >= 55) return "text-[#F0A562] border-[#F0A562]/40 bg-[#F0A562]/10";
  return "text-[#F06C6C] border-[#F06C6C]/40 bg-[#F06C6C]/10";
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
        className="w-full max-w-[560px] rounded-none border-l border-white/10 bg-[#0F0F12] p-0 text-[#F5F5F5]"
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

            <div className="rounded-lg border border-white/10 bg-[#141418] p-4">
              <p className="mb-2 font-medium text-[#F5F5F5]">Confidence and ranges</p>
              <p>
                Range width increases when data completeness is lower. Confidence uses history length, number of connected platforms,
                and whether a bank source is connected.
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#141418] p-4">
              <p className="mb-2 font-medium text-[#F5F5F5]">What improves estimate quality</p>
              <p>
                Connect more platforms, keep sync current, include full expense history, and add other taxable income when applicable.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CalculationBreakdownTable({ rows }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#111114]">
      <div className="border-b border-white/10 p-4">
        <h2 className="text-lg font-semibold text-[#F5F5F5]">How calculated</h2>
        <p className="mt-1 text-sm text-white/70">
          Every value is traceable to an input or a published calculation rule.
        </p>
      </div>

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
    </div>
  );
}

export function PaymentSchedule({
  schedule,
  paymentStatus,
  onTogglePaid,
  setAsideLower,
  setAsideUpper,
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#111114]">
      <div className="border-b border-white/10 p-4">
        <h2 className="text-lg font-semibold text-[#F5F5F5]">Payment schedule</h2>
        <p className="mt-1 text-sm text-white/70">
          Estimated quarterly set-aside range: {formatCurrency(setAsideLower)} to {formatCurrency(setAsideUpper)}
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-transparent">
            <TableHead className="text-[#D8D8D8]">Quarter</TableHead>
            <TableHead className="text-[#D8D8D8]">Coverage period</TableHead>
            <TableHead className="text-[#D8D8D8]">Due date</TableHead>
            <TableHead className="text-right text-[#D8D8D8]">Status</TableHead>
            <TableHead className="text-right text-[#D8D8D8]">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schedule.map((quarter) => {
            const status = paymentStatus[quarter.id] || DEFAULT_PAYMENT_STATUS[quarter.id];
            const paidAtDate = status.paidAt ? new Date(status.paidAt) : null;
            const hasValidPaidAtDate = Boolean(paidAtDate) && !Number.isNaN(paidAtDate.getTime());
            return (
              <TableRow key={quarter.id} className="border-white/10 hover:bg-white/[0.02]">
                <TableCell className="font-medium text-[#F5F5F5]">{quarter.label}</TableCell>
                <TableCell className="text-sm text-white/70">{quarter.period}</TableCell>
                <TableCell className="text-sm text-white/80">{format(quarter.dueDate, "MMM d, yyyy")}</TableCell>
                <TableCell className="text-right">
                  {status.paid ? (
                    <span className="inline-flex items-center gap-1 rounded-md border border-[#56C5D0]/40 bg-[#56C5D0]/10 px-2 py-1 text-xs text-[#56C5D0]">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {hasValidPaidAtDate ? `Paid ${format(paidAtDate, "MMM d")}` : "Paid"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-md border border-white/20 bg-white/5 px-2 py-1 text-xs text-white/70">
                      Not marked paid
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className={cn(
                      "h-8 border-white/20 bg-transparent px-3 text-xs text-[#F5F5F5] hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#56C5D0]",
                      status.paid && "border-[#56C5D0]/40 text-[#56C5D0]"
                    )}
                    onClick={() => onTogglePaid(quarter.id)}
                  >
                    {status.paid ? "Mark unpaid" : "Mark as paid"}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export function DataCompletenessCard({
  daysHistory,
  platformsConnected,
  bankConnected,
  confidenceScore,
  confidenceLabel,
  lastSyncedAt,
  lastUpdatedAt,
  dataSourcesUsed,
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#111114] p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#F5F5F5]">Data completeness</h2>
          <p className="mt-1 text-sm text-white/70">Confidence is based on connected and historical evidence.</p>
        </div>
        <span className={cn("rounded-md border px-2.5 py-1 text-xs font-medium", getConfidenceTone(confidenceScore))}>
          {confidenceLabel}
        </span>
      </div>

      <div className="mb-4 rounded-lg border border-white/10 bg-[#15151A] p-3">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-white/75">Confidence score</span>
          <span className="font-mono-financial text-[#F5F5F5]">{confidenceScore}/100</span>
        </div>
        <div className="h-2 rounded-full bg-white/10">
          <div
            className={cn(
              "h-full rounded-full",
              confidenceScore >= 80 ? "bg-[#56C5D0]" : confidenceScore >= 55 ? "bg-[#F0A562]" : "bg-[#F06C6C]"
            )}
            style={{ width: `${confidenceScore}%` }}
          />
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <span className="text-white/70">Days of history</span>
          <span className="font-mono-financial text-[#F5F5F5]">{daysHistory}</span>
        </div>
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <span className="text-white/70">Platforms connected</span>
          <span className="font-mono-financial text-[#F5F5F5]">{platformsConnected}</span>
        </div>
        <div className="flex items-center justify-between pb-1">
          <span className="text-white/70">Bank connected</span>
          <span className={cn("font-mono-financial", bankConnected ? "text-[#56C5D0]" : "text-white/70")}>
            {bankConnected ? "Yes" : "No"}
          </span>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-white/10 bg-[#15151A] p-3">
        <p className="mb-2 text-xs uppercase tracking-wide text-white/60">Trust metadata</p>
        <p className="text-sm text-white/80">Last updated: {format(lastUpdatedAt, "MMM d, yyyy h:mm a")}</p>
        <p className="text-sm text-white/80">
          Last sync: {lastSyncedAt ? format(lastSyncedAt, "MMM d, yyyy h:mm a") : "No sync timestamp available"}
        </p>
        <p className="mt-2 text-sm text-white/80">Data sources used: {dataSourcesUsed.length ? dataSourcesUsed.join(", ") : "None connected"}</p>
      </div>
    </div>
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
    } catch {
      // Ignore unreadable local state and keep safe defaults.
    } finally {
      setDidLoadStoredInputs(true);
    }
  }, []);

  useEffect(() => {
    try {
      const storedPayments = window.localStorage.getItem(PAYMENT_STORAGE_KEY);
      if (storedPayments) {
        const parsed = JSON.parse(storedPayments);
        setPaymentStatus((previousStatus) => ({
          ...previousStatus,
          ...parsed,
        }));
      }
    } catch {
      // Ignore unreadable local state and keep safe defaults.
    } finally {
      setDidLoadStoredPayments(true);
    }
  }, []);

  useEffect(() => {
    if (!didLoadStoredInputs || didAutoFillFromData) return;
    const hasUserValue =
      inputs.expectedAnnualRevenue !== DEFAULT_INPUTS.expectedAnnualRevenue ||
      inputs.expenseRate !== DEFAULT_INPUTS.expenseRate;
    if (hasUserValue) {
      setDidAutoFillFromData(true);
      return;
    }

    if (observedRevenueAndExpenseRate.annualRevenue <= 0) return;

    setInputs((previousInputs) => ({
      ...previousInputs,
      expectedAnnualRevenue: observedRevenueAndExpenseRate.annualRevenue,
      expenseRate: observedRevenueAndExpenseRate.expenseRate,
    }));
    setDidAutoFillFromData(true);
  }, [didLoadStoredInputs, didAutoFillFromData, inputs.expectedAnnualRevenue, inputs.expenseRate, observedRevenueAndExpenseRate]);

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
  }, [
    inputs.filingStatus,
    inputs.state,
    inputs.expectedAnnualRevenue,
    inputs.expenseRate,
    inputs.includeOtherIncome,
    inputs.otherIncome,
    transactions.length,
    expenses.length,
    connectedPlatforms.length,
  ]);

  const dataCompleteness = useMemo(() => {
    const dateCandidates = [
      ...transactions.map((transaction) => new Date(transaction.transaction_date)),
      ...expenses.map((expense) => new Date(expense.expense_date)),
    ].filter((date) => !Number.isNaN(date.getTime()));

    const earliestDate = dateCandidates.length
      ? new Date(Math.min(...dateCandidates.map((date) => date.getTime())))
      : null;

    const daysHistory = earliestDate ? Math.max(0, differenceInCalendarDays(new Date(), earliestDate) + 1) : 0;

    const normalizedPlatforms = connectedPlatforms.map((platform) => (platform.platform || "").toLowerCase());
    const platformsConnected = connectedPlatforms.length;
    const bankConnected = normalizedPlatforms.some((platformName) =>
      [...BANK_PLATFORM_HINTS].some((hint) => platformName.includes(hint))
    );

    const historyScore = Math.min(daysHistory / 365, 1) * 40;
    const platformScore = Math.min(platformsConnected / 4, 1) * 35;
    const bankScore = bankConnected ? 25 : 0;
    const confidenceScore = Math.round(historyScore + platformScore + bankScore);

    const lastSyncedAt = connectedPlatforms
      .map((platform) => platform.last_synced_at)
      .filter(Boolean)
      .map((value) => new Date(value))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((left, right) => right.getTime() - left.getTime())[0] || null;

    const dataSourcesUsed = [
      `Revenue transactions (${transactions.length})`,
      `Expenses (${expenses.length})`,
      `Connected platforms (${platformsConnected})`,
    ];

    return {
      daysHistory,
      platformsConnected,
      bankConnected,
      confidenceScore,
      confidenceLabel: getConfidenceLabel(confidenceScore),
      lastSyncedAt,
      dataSourcesUsed,
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
        step: "3. Business income after expenses",
        formula: `max(0, gross income - estimated expenses)`,
        result: formatCurrency(calculations.businessIncomeAfterExpenses),
        source: "Estimator rule",
      },
      {
        step: "4. Self-employment tax",
        formula: `${formatCurrency(calculations.businessIncomeAfterExpenses)} × 15.30%`,
        result: formatCurrency(calculations.selfEmploymentTax),
        source: "IRS SE baseline",
      },
      {
        step: "5. SE deduction",
        formula: `${formatCurrency(calculations.selfEmploymentTax)} × 50%`,
        result: formatCurrency(calculations.halfSelfEmploymentDeduction),
        source: "Estimator assumption",
      },
      {
        step: "6. Taxable income",
        formula: `max(0, business income - SE deduction)`,
        result: formatCurrency(calculations.taxableIncomeForFederalAndState),
        source: "Estimator rule",
      },
      {
        step: "7. Federal tax",
        formula: `Progressive brackets (${FILING_STATUS_OPTIONS.find((item) => item.value === inputs.filingStatus)?.label || "Single"})`,
        result: formatCurrency(calculations.federalIncomeTax),
        source: `Effective ${formatPercent(calculations.federalEffectiveRate)}`,
      },
      {
        step: "8. State tax",
        formula: `${formatCurrency(calculations.taxableIncomeForFederalAndState)} × ${formatPercent(calculations.stateRate)}`,
        result: formatCurrency(calculations.stateIncomeTax),
        source: `${inputs.state} estimate`,
      },
      {
        step: "9. Total annual estimate",
        formula: `SE tax + federal tax + state tax`,
        result: formatCurrency(calculations.totalEstimatedAnnualTax),
        source: "Computed",
      },
      {
        step: "10. Effective rate range",
        formula: `Point estimate ± uncertainty (${formatPercent(calculations.uncertaintyBand)})`,
        result: `${formatPercent(calculations.effectiveRateLower)} to ${formatPercent(calculations.effectiveRateUpper)}`,
        source: `${dataCompleteness.confidenceLabel}`,
      },
      {
        step: "11. Quarterly set-aside",
        formula: `(business income × effective rate range) ÷ 4`,
        result: `${formatCurrency(calculations.quarterlySetAsideLower)} to ${formatCurrency(calculations.quarterlySetAsideUpper)}`,
        source: "Computed range",
      },
    ];
  }, [inputs, calculations, dataCompleteness.confidenceLabel]);

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

  return (
    <div className="mx-auto w-full max-w-[1400px] rounded-2xl border border-white/10 bg-[#0A0A0A] p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#F5F5F5]">Tax Estimator</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/70">
            Conservative estimated tax planning for creator income with transparent formulas and exportable evidence.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-9 border-white/20 bg-transparent text-[#F5F5F5] hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#56C5D0]"
            onClick={handleDownloadPdf}
          >
            <FileText className="mr-2 h-4 w-4" />
            Download calculation report PDF
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-9 border-white/20 bg-transparent text-[#F5F5F5] hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#56C5D0]"
            onClick={handleExportInputsJson}
          >
            <Download className="mr-2 h-4 w-4" />
            Export inputs JSON
          </Button>
        </div>
      </header>

      <section className="mb-6 rounded-lg border border-[#F0A562]/35 bg-[#F0A562]/10 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#F0A562]" />
            <p className="text-sm font-medium text-[#F5F5F5]">Estimates only, not tax advice</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center text-sm font-medium text-[#56C5D0] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#56C5D0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
            onClick={() => setAssumptionsOpen(true)}
          >
            View assumptions
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="rounded-xl border border-white/10 bg-[#111114] p-5 lg:col-span-4">
          <h2 className="text-lg font-semibold text-[#F5F5F5]">Inputs</h2>
          <p className="mt-1 text-sm text-white/70">Edit assumptions directly. Values are stored locally in your browser.</p>

          <div className="mt-5 space-y-4">
            <div>
              <Label htmlFor="filing-status" className="mb-2 block text-sm text-white/80">
                Filing status
              </Label>
              <Select
                value={inputs.filingStatus}
                onValueChange={(value) =>
                  setInputs((previousInputs) => ({
                    ...previousInputs,
                    filingStatus: value,
                  }))
                }
              >
                <SelectTrigger
                  id="filing-status"
                  className="border-white/15 bg-[#15151A] text-[#F5F5F5] focus:ring-2 focus:ring-[#56C5D0]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#0F0F12] text-[#F5F5F5]">
                  {FILING_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="focus:bg-white/10 focus:text-[#F5F5F5]">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="state" className="mb-2 block text-sm text-white/80">
                State
              </Label>
              <Select
                value={inputs.state}
                onValueChange={(value) =>
                  setInputs((previousInputs) => ({
                    ...previousInputs,
                    state: value,
                  }))
                }
              >
                <SelectTrigger
                  id="state"
                  className="border-white/15 bg-[#15151A] text-[#F5F5F5] focus:ring-2 focus:ring-[#56C5D0]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-80 border-white/10 bg-[#0F0F12] text-[#F5F5F5]">
                  {STATE_OPTIONS.map((state) => (
                    <SelectItem key={state.value} value={state.value} className="focus:bg-white/10 focus:text-[#F5F5F5]">
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="expected-annual-revenue" className="mb-2 block text-sm text-white/80">
                Expected annual revenue (USD)
              </Label>
              <Input
                id="expected-annual-revenue"
                type="number"
                min="0"
                step="0.01"
                value={inputs.expectedAnnualRevenue}
                onChange={(event) =>
                  setInputs((previousInputs) => ({
                    ...previousInputs,
                    expectedAnnualRevenue: toNonNegativeNumber(event.target.value),
                  }))
                }
                className="border-white/15 bg-[#15151A] text-[#F5F5F5] focus-visible:ring-2 focus-visible:ring-[#56C5D0]"
              />
            </div>

            <div>
              <Label htmlFor="expense-rate" className="mb-2 block text-sm text-white/80">
                Expense rate (% of creator revenue)
              </Label>
              <Input
                id="expense-rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={inputs.expenseRate}
                onChange={(event) =>
                  setInputs((previousInputs) => ({
                    ...previousInputs,
                    expenseRate: clamp(toNonNegativeNumber(event.target.value), 0, 100),
                  }))
                }
                className="border-white/15 bg-[#15151A] text-[#F5F5F5] focus-visible:ring-2 focus-visible:ring-[#56C5D0]"
              />
            </div>

            <div className="rounded-lg border border-white/10 bg-[#15151A] p-3">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="other-income-toggle" className="text-sm text-white/85">
                  Include other taxable income
                </Label>
                <Switch
                  id="other-income-toggle"
                  checked={inputs.includeOtherIncome}
                  onCheckedChange={(checked) =>
                    setInputs((previousInputs) => ({
                      ...previousInputs,
                      includeOtherIncome: checked,
                    }))
                  }
                  className="data-[state=checked]:bg-[#56C5D0] data-[state=unchecked]:bg-white/25"
                />
              </div>

              {inputs.includeOtherIncome && (
                <div className="mt-3">
                  <Label htmlFor="other-income" className="mb-2 block text-sm text-white/80">
                    Other income amount (USD)
                  </Label>
                  <Input
                    id="other-income"
                    type="number"
                    min="0"
                    step="0.01"
                    value={inputs.otherIncome}
                    onChange={(event) =>
                      setInputs((previousInputs) => ({
                        ...previousInputs,
                        otherIncome: toNonNegativeNumber(event.target.value),
                      }))
                    }
                    className="border-white/15 bg-[#101014] text-[#F5F5F5] focus-visible:ring-2 focus-visible:ring-[#56C5D0]"
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-6 lg:col-span-8">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-[#111114] p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[#F5F5F5]">Estimated output</h2>
                  <p className="mt-1 text-sm text-white/70">Conservative range shown to reduce under-saving risk.</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-md border border-[#56C5D0]/35 bg-[#56C5D0]/10 px-2 py-1 text-xs text-[#56C5D0]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Traceable
                </span>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border border-white/10 bg-[#15151A] p-4">
                  <p className="text-sm text-white/70">Estimated quarterly set aside</p>
                  <p className="mt-1 font-mono-financial text-2xl font-semibold text-[#F5F5F5]">
                    {formatCurrency(calculations.quarterlySetAsideLower)} - {formatCurrency(calculations.quarterlySetAsideUpper)}
                  </p>
                  <p className="mt-1 text-xs text-white/60">
                    Point estimate: {formatCurrency(calculations.quarterlySetAsidePoint)}
                  </p>
                </div>

                <div className="rounded-lg border border-white/10 bg-[#15151A] p-4">
                  <p className="text-sm text-white/70">Effective rate range</p>
                  <p className="mt-1 font-mono-financial text-2xl font-semibold text-[#F5F5F5]">
                    {formatPercent(calculations.effectiveRateLower)} - {formatPercent(calculations.effectiveRateUpper)}
                  </p>
                  <p className="mt-1 text-xs text-white/60">
                    Uncertainty band: {formatPercent(calculations.uncertaintyBand)}
                  </p>
                </div>

                <div className="rounded-lg border border-white/10 bg-[#15151A] p-4">
                  <p className="text-sm text-white/70">Source of numbers</p>
                  <div className="mt-2 space-y-1.5 text-sm text-white/85">
                    <div className="flex items-center justify-between">
                      <span>Expected revenue input</span>
                      <span className="font-mono-financial">{formatCurrency(inputs.expectedAnnualRevenue)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Expense rate input</span>
                      <span className="font-mono-financial">{percentFormatter.format(inputs.expenseRate)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Other income input</span>
                      <span className="font-mono-financial">{formatCurrency(calculations.otherIncome)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DataCompletenessCard
              daysHistory={dataCompleteness.daysHistory}
              platformsConnected={dataCompleteness.platformsConnected}
              bankConnected={dataCompleteness.bankConnected}
              confidenceScore={dataCompleteness.confidenceScore}
              confidenceLabel={dataCompleteness.confidenceLabel}
              lastSyncedAt={dataCompleteness.lastSyncedAt}
              lastUpdatedAt={lastUpdatedAt}
              dataSourcesUsed={dataCompleteness.dataSourcesUsed}
            />
          </div>

          <CalculationBreakdownTable rows={calculationRows} />

          <PaymentSchedule
            schedule={paymentSchedule}
            paymentStatus={paymentStatus}
            onTogglePaid={handlePaymentToggle}
            setAsideLower={calculations.quarterlySetAsideLower}
            setAsideUpper={calculations.quarterlySetAsideUpper}
          />

          <div className="rounded-xl border border-white/10 bg-[#111114] p-4">
            <div className="flex items-start gap-2">
              <Database className="mt-0.5 h-4 w-4 text-white/65" />
              <div className="text-sm text-white/75">
                <p>
                  Data sources used:{" "}
                  <span className="text-white/90">{dataCompleteness.dataSourcesUsed.join(", ")}</span>
                </p>
                <p className="mt-1">
                  Last updated: <span className="text-white/90">{format(lastUpdatedAt, "MMM d, yyyy h:mm a")}</span>
                </p>
                <p className="mt-1">
                  Last sync timestamp:{" "}
                  <span className="text-white/90">
                    {dataCompleteness.lastSyncedAt ? format(dataCompleteness.lastSyncedAt, "MMM d, yyyy h:mm a") : "No sync timestamp available"}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <AssumptionsDrawer
        open={assumptionsOpen}
        onOpenChange={setAssumptionsOpen}
        assumptions={{
          stateLabel: STATE_OPTIONS.find((option) => option.value === inputs.state)?.label || inputs.state,
          stateRate: STATE_EFFECTIVE_RATE[inputs.state] ?? 0.04,
        }}
      />
    </div>
  );
}
