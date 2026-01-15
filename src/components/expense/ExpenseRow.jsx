import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ExpenseRow = memo(({ expense, category, onDelete }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
    >
      <div className="flex items-center gap-3 flex-1">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-lg", category?.color)}>
          {category?.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-white font-medium text-sm">{expense.merchant || expense.description}</p>
            {expense.is_tax_deductible && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400">
                {expense.deduction_percentage}% deductible
              </span>
            )}
          </div>
          <p className="text-white/40 text-xs">{format(new Date(expense.expense_date), "MMM d, yyyy")} · {category?.label}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <p className="text-white font-semibold">${expense.amount.toFixed(2)}</p>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(expense.id)}
          className="text-white/40 hover:text-red-400 hover:bg-red-500/10 h-8 w-8"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </motion.div>
  );
});

ExpenseRow.displayName = 'ExpenseRow';

export default ExpenseRow;
