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

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function toNonNegativeNumber(value) {
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed) || parsed < 0) return 0;
  return parsed;
}

export function formatCurrency(value) {
  return currencyFormatter.format(value || 0);
}

export function formatPercent(decimalValue) {
  return `${percentFormatter.format((decimalValue || 0) * 100)}%`;
}

export function calculateProgressiveTax(income, brackets) {
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

export function getQuarterSchedule(year) {
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

export function getConfidenceLabel(confidenceScore) {
  if (confidenceScore >= 80) return "High";
  if (confidenceScore >= 55) return "Medium";
  return "Low";
}

export function getConfidenceTone(confidenceScore) {
  if (confidenceScore >= 80) return "text-[#56C5D0]";
  if (confidenceScore >= 55) return "text-[#F0A562]";
  return "text-[#F06C6C]";
}

export function getUncertaintyBand({
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
