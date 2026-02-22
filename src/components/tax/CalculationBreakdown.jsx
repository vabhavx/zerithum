import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GlassCard } from "@/components/ui/glass-card";

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
