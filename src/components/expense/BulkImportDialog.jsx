import React, { useState } from "react";
import { base44 } from "@/api/supabaseClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function BulkImportDialog({ open, onOpenChange, onSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProcessing(false);
    setResult(null);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      setProcessing(true);
      setUploading(false);

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
                  expense_date: { type: "string" },
                  merchant: { type: "string" },
                  description: { type: "string" },
                  category: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (extractResult.status === "success" && extractResult.output?.expenses) {
        const expenses = extractResult.output.expenses;
        
        await base44.entities.Expense.bulkCreate(expenses.map(exp => ({
          ...exp,
          is_tax_deductible: true,
          deduction_percentage: 100,
          payment_method: "other"
        })));

        setResult({ success: true, count: expenses.length });
        toast.success(`${expenses.length} expenses imported successfully!`);
        setTimeout(() => {
          onSuccess?.();
          onOpenChange(false);
        }, 2000);
      } else {
        throw new Error(extractResult.details || "Failed to extract data");
      }
    } catch (error) {
      setResult({ success: false, error: error.message });
      toast.error("Import failed: " + error.message);
    } finally {
      setProcessing(false);
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="card-modern rounded-2xl border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white">Bulk Import Expenses</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="rounded-lg p-4 bg-blue-500/10 border border-blue-500/20">
            <p className="text-sm text-blue-300 mb-2">📄 Supported formats: CSV, Excel (XLSX)</p>
            <p className="text-xs text-blue-200/60">Required columns: amount, date, merchant/description</p>
          </div>

          {!result && (
            <div className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center hover:border-zteal-400/50 transition-colors">
              <FileSpreadsheet className="w-12 h-12 text-white/30 mx-auto mb-3" />
              <Input
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileUpload}
                disabled={uploading || processing}
                className="hidden"
                id="bulk-upload"
              />
              <label htmlFor="bulk-upload" className="cursor-pointer">
                <Button
                  type="button"
                  disabled={uploading || processing}
                  className="bg-zteal-400"
                  onClick={() => document.getElementById('bulk-upload').click()}
                >
                  {uploading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                  ) : processing ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                  ) : (
                    <><Upload className="w-4 h-4 mr-2" /> Choose File</>
                  )}
                </Button>
              </label>
            </div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-lg p-4 ${result.success ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}
            >
              <div className="flex items-center gap-3">
                {result.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                )}
                <div>
                  <p className={`font-semibold ${result.success ? 'text-emerald-400' : 'text-red-400'}`}>
                    {result.success ? `${result.count} expenses imported!` : 'Import failed'}
                  </p>
                  {result.error && <p className="text-xs text-red-300 mt-1">{result.error}</p>}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}