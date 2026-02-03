import React, { useState, useCallback } from "react";
import { base44 } from "@/api/supabaseClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle, X, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function BulkImportDialog({ open, onOpenChange, onSuccess }) {
  const [step, setStep] = useState("upload"); // upload, preview, processing, success
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsedExpenses, setParsedExpenses] = useState([]);
  const [importResult, setImportResult] = useState(null);

  const resetState = useCallback(() => {
    setStep("upload");
    setUploading(false);
    setParsing(false);
    setParsedExpenses([]);
    setImportResult(null);
  }, []);

  const handleOpenChange = (newOpen) => {
    if (!newOpen) {
      // delay reset so animation finishes
      setTimeout(resetState, 300);
    }
    onOpenChange(newOpen);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await processFile(file);
  };

  const processFile = async (file) => {
    setUploading(true);
    setParsing(true);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            expenses: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  amount: { type: "number" },
                  expense_date: { type: "string", description: "Format: YYYY-MM-DD" },
                  merchant: { type: "string" },
                  description: { type: "string" },
                  category: { type: "string", enum: ["software_subscriptions", "office_supplies", "travel", "meals", "marketing", "consulting", "education", "utilities", "other"] }
                },
                required: ["amount", "expense_date", "merchant"]
              }
            }
          }
        }
      });

      if (extractResult.status === "success" && extractResult.output?.expenses) {
        // Add IDs for local management and validate
        const mapped = extractResult.output.expenses.map((exp, idx) => ({
          ...exp,
          id: `preview-${idx}`,
          isValid: !!(exp.amount && exp.expense_date && exp.merchant),
          category: exp.category || 'other'
        }));

        setParsedExpenses(mapped);
        setStep("preview");
      } else {
        throw new Error(extractResult.details || "Failed to extract data");
      }
    } catch (error) {
      toast.error("Import failed: " + error.message);
      resetState();
    } finally {
      setUploading(false);
      setParsing(false);
    }
  };

  const handleUpdateExpense = (id, field, value) => {
    setParsedExpenses(prev => prev.map(exp => {
      if (exp.id !== id) return exp;
      const updated = { ...exp, [field]: value };
      // Re-validate
      updated.isValid = !!(updated.amount && updated.expense_date && updated.merchant);
      return updated;
    }));
  };

  const handleRemoveExpense = (id) => {
    setParsedExpenses(prev => prev.filter(exp => exp.id !== id));
  };

  const handleConfirmImport = async () => {
    const validExpenses = parsedExpenses.filter(e => e.isValid);
    if (validExpenses.length === 0) {
      toast.error("No valid expenses to import");
      return;
    }

    setStep("processing");

    try {
      // Clean up local IDs before sending
      const toCreate = validExpenses.map(({ id, isValid, ...rest }) => ({
        ...rest,
        is_tax_deductible: true, // Default to true, customizable in future
        deduction_percentage: 100,
        payment_method: "other"
      }));

      await base44.entities.Expense.bulkCreate(toCreate);

      setImportResult({ count: toCreate.length });
      setStep("success");
      toast.success(`${toCreate.length} expenses imported successfully!`);

      setTimeout(() => {
        onSuccess?.();
        handleOpenChange(false);
      }, 2000);
    } catch (error) {
      toast.error("Failed to save expenses: " + error.message);
      setStep("preview");
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx'))) {
      processFile(file);
    } else {
      toast.error("Please drop a CSV or Excel file");
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="card-modern rounded-2xl border max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-zteal-400" />
            Bulk Import Expenses
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-2">
          <AnimatePresence mode="wait">
            {step === "upload" && (
              <motion.div
                key="upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4 mt-4"
              >
                <div className="rounded-lg p-4 bg-blue-500/10 border border-blue-500/20">
                  <p className="text-sm text-blue-300 mb-2">📄 Supported formats: CSV, Excel (XLSX)</p>
                  <p className="text-xs text-blue-200/60">Required columns: amount, date, merchant</p>
                </div>

                <div
                  className="border-2 border-dashed border-white/10 rounded-xl p-12 text-center hover:border-zteal-400/50 hover:bg-white/[0.02] transition-colors cursor-pointer"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => document.getElementById('bulk-upload').click()}
                >
                  <Input
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={handleFileUpload}
                    disabled={uploading || parsing}
                    className="hidden"
                    id="bulk-upload"
                  />

                  {uploading || parsing ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-10 h-10 animate-spin text-zteal-400" />
                      <p className="text-white/60">Processing your file...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2">
                        <Upload className="w-8 h-8 text-white/40" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">Click to upload or drag and drop</h3>
                      <p className="text-sm text-white/40">CSV or Excel (max 10MB)</p>
                      <Button variant="outline" className="mt-4 border-white/10 text-white hover:bg-white/5">
                        Select File
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {step === "preview" && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white/60 text-sm">
                    Review and edit your data before importing.
                    <span className="text-zteal-400 ml-2 font-medium">{parsedExpenses.filter(e => e.isValid).length} valid</span>
                    {parsedExpenses.some(e => !e.isValid) && (
                      <span className="text-red-400 ml-2 font-medium">{parsedExpenses.filter(e => !e.isValid).length} invalid</span>
                    )}
                  </p>
                  <Button variant="ghost" size="sm" onClick={resetState} className="text-white/40 hover:text-white">
                    Start Over
                  </Button>
                </div>

                <div className="border border-white/10 rounded-lg overflow-hidden bg-white/[0.02]">
                  <Table>
                    <TableHeader className="bg-white/5">
                      <TableRow className="hover:bg-transparent border-white/5">
                        <TableHead className="text-white/60">Date</TableHead>
                        <TableHead className="text-white/60">Merchant</TableHead>
                        <TableHead className="text-white/60">Description</TableHead>
                        <TableHead className="text-white/60">Amount</TableHead>
                        <TableHead className="text-white/60">Category</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedExpenses.map((expense) => (
                        <TableRow key={expense.id} className="border-white/5 hover:bg-white/[0.03]">
                          <TableCell>
                            <input
                              type="date"
                              value={expense.expense_date || ''}
                              onChange={(e) => handleUpdateExpense(expense.id, 'expense_date', e.target.value)}
                              className={`bg-transparent border-none text-white text-sm focus:ring-0 w-full p-0 ${!expense.expense_date ? 'text-red-400' : ''}`}
                            />
                          </TableCell>
                          <TableCell>
                            <input
                              value={expense.merchant || ''}
                              onChange={(e) => handleUpdateExpense(expense.id, 'merchant', e.target.value)}
                              className={`bg-transparent border-none text-white text-sm focus:ring-0 w-full p-0 ${!expense.merchant ? 'placeholder:text-red-400/50' : ''}`}
                              placeholder="Required"
                            />
                          </TableCell>
                          <TableCell>
                            <input
                              value={expense.description || ''}
                              onChange={(e) => handleUpdateExpense(expense.id, 'description', e.target.value)}
                              className="bg-transparent border-none text-white/80 text-sm focus:ring-0 w-full p-0"
                              placeholder="Optional"
                            />
                          </TableCell>
                          <TableCell>
                            <input
                              type="number"
                              value={expense.amount || ''}
                              onChange={(e) => handleUpdateExpense(expense.id, 'amount', parseFloat(e.target.value))}
                              className={`bg-transparent border-none text-white text-sm focus:ring-0 w-24 p-0 ${!expense.amount ? 'placeholder:text-red-400/50' : ''}`}
                              placeholder="0.00"
                            />
                          </TableCell>
                          <TableCell>
                            <select
                              value={expense.category}
                              onChange={(e) => handleUpdateExpense(expense.id, 'category', e.target.value)}
                              className="bg-transparent border-none text-white/80 text-sm focus:ring-0 w-32 p-0 [&>option]:bg-zinc-900"
                            >
                              <option value="software_subscriptions">Software</option>
                              <option value="office_supplies">Supplies</option>
                              <option value="travel">Travel</option>
                              <option value="meals">Meals</option>
                              <option value="marketing">Marketing</option>
                              <option value="consulting">Consulting</option>
                              <option value="utilities">Utilities</option>
                              <option value="education">Education</option>
                              <option value="other">Other</option>
                            </select>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-white/20 hover:text-red-400 hover:bg-transparent"
                              onClick={() => handleRemoveExpense(expense.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleConfirmImport}
                    className="bg-zteal-400 hover:bg-zteal-600 text-white min-w-[150px]"
                    disabled={parsedExpenses.filter(e => e.isValid).length === 0}
                  >
                    Confirm Import
                  </Button>
                </div>
              </motion.div>
            )}

            {(step === "processing" || step === "success") && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12"
              >
                {step === "processing" ? (
                  <>
                    <Loader2 className="w-16 h-16 text-zteal-400 animate-spin mb-4" />
                    <h3 className="text-xl font-bold text-white">Importing Expenses...</h3>
                    <p className="text-white/60 text-sm mt-2">Adding records to your database</p>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 border border-emerald-500/20">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Import Complete!</h3>
                    <p className="text-white/60 mb-6">{importResult?.count} expenses have been added.</p>
                    <Button onClick={() => handleOpenChange(false)} variant="outline" className="border-white/10 text-white">
                      Close
                    </Button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}