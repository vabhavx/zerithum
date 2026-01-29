import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const TransactionAnalysisRow = React.memo(({ transaction, index, platformNames, categoryNames }) => {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.02 }}
      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
    >
      <td className="p-4 text-sm text-white">
        {format(new Date(transaction.transaction_date), "MMM d, yyyy")}
      </td>
      <td className="p-4">
        <span className="text-sm text-white capitalize">
          {platformNames[transaction.platform] || transaction.platform}
        </span>
      </td>
      <td className="p-4">
        <span className="text-xs px-2 py-1 rounded-md bg-white/5 text-white/70">
          {categoryNames[transaction.category] || transaction.category}
        </span>
      </td>
      <td className="p-4 text-sm text-white/70 max-w-xs truncate">
        {transaction.description || '-'}
      </td>
      <td className="p-4 text-sm text-white text-right font-semibold">
        ${transaction.amount.toFixed(2)}
      </td>
      <td className="p-4 text-sm text-red-400 text-right">
        ${(transaction.platform_fee || 0).toFixed(2)}
      </td>
      <td className="p-4 text-sm text-emerald-400 text-right font-semibold">
        ${(transaction.amount - (transaction.platform_fee || 0)).toFixed(2)}
      </td>
    </motion.tr>
  );
});

TransactionAnalysisRow.displayName = 'TransactionAnalysisRow';

export default TransactionAnalysisRow;
