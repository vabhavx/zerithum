import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { formatCurrency, formatPercent } from "./taxUtils";
import { FILING_STATUS_OPTIONS, STATE_OPTIONS } from "./taxConstants";

export function generateTaxReportPdf({
  currentYear,
  inputs,
  calculations,
  dataCompleteness,
  calculationRows,
}) {
  return new Promise((resolve, reject) => {
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
        `Expense rate: ${formatPercent(inputs.expenseRate / 100)}`,
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
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}
