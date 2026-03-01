import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, ChevronDown, ChevronUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GlassCard } from "@/components/ui/glass-card";

export function CalculationBreakdown({ rows }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <GlassCard className="mt-6">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-gray-500" />
          <span className="font-semibold text-gray-900 text-sm">Detailed Calculation Breakdown</span>
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-100 hover:bg-transparent">
                  <TableHead className="text-gray-500 text-xs font-medium">Step</TableHead>
                  <TableHead className="text-gray-500 text-xs font-medium">Formula</TableHead>
                  <TableHead className="text-right text-gray-500 text-xs font-medium">Result</TableHead>
                  <TableHead className="text-right text-gray-500 text-xs font-medium">Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.step} className="border-gray-100 hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-900 text-sm">{row.step}</TableCell>
                    <TableCell className="text-sm text-gray-500">{row.formula}</TableCell>
                    <TableCell className="text-right font-mono-financial text-gray-900">{row.result}</TableCell>
                    <TableCell className="text-right text-sm text-gray-400">{row.source}</TableCell>
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
