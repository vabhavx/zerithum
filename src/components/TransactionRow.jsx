import React from 'react';
import moment from 'moment';
import { Button } from '@/components/ui/button';

/**
 * @typedef {Object} TransactionRowProps
 * @property {any} transaction
 * @property {boolean} isExpanded
 * @property {(id: any) => void} onToggleExpand
 */

/**
 * @type {React.NamedExoticComponent<TransactionRowProps>}
 */
const TransactionRow = React.memo(({ transaction, isExpanded, onToggleExpand }) => {
  return (
    <React.Fragment>
      <tr
        className="border-t border-[#5E524012] hover:bg-[#5E5240]/5 cursor-pointer"
        onClick={() => onToggleExpand(transaction.id)}
      >
        <td className="py-4 px-4 text-sm">
          {moment(transaction.transaction_date).format('MMM D, YYYY')}
        </td>
        <td className="py-4 px-4 text-sm capitalize">{transaction.platform}</td>
        <td className="py-4 px-4">
          <div className="text-sm font-semibold text-[#208D9E]">
            ${(transaction.net_amount || transaction.amount).toFixed(2)}
          </div>
          {transaction.fees_amount > 0 && (
            <div className="text-xs text-[#5E5240]/60">
              Fee: ${transaction.fees_amount.toFixed(2)}
            </div>
          )}
        </td>
        <td className="py-4 px-4 text-sm capitalize">
          {transaction.category?.replace('_', ' ')}
        </td>
        <td className="py-4 px-4">
          <span className={`text-xs px-2 py-1 rounded-full ${
            transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
            transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            transaction.status === 'refunded' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {transaction.status}
          </span>
        </td>
        <td className="py-4 px-4">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(transaction.id);
            }}
            className="btn-secondary text-xs"
          >
            {isExpanded ? 'Hide' : 'Details'}
          </Button>
        </td>
      </tr>
      {isExpanded && (
        <tr className="border-t border-[#5E524012] bg-[#5E5240]/5">
          <td colSpan="6" className="py-4 px-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[#5E5240]/60">Transaction ID:</span>
                <div className="font-mono text-xs mt-1">{transaction.platform_transaction_id}</div>
              </div>
              <div>
                <span className="text-[#5E5240]/60">Synced:</span>
                <div className="mt-1">{moment(transaction.synced_date || transaction.created_date).format('MMM D, YYYY h:mm A')}</div>
              </div>
              {transaction.description && (
                <div className="col-span-2">
                  <span className="text-[#5E5240]/60">Description:</span>
                  <div className="mt-1">{transaction.description}</div>
                </div>
              )}
              <div>
                <span className="text-[#5E5240]/60">Gross Amount:</span>
                <div className="mt-1">${(transaction.gross_amount || transaction.amount).toFixed(2)}</div>
              </div>
              <div>
                <span className="text-[#5E5240]/60">Currency:</span>
                <div className="mt-1">{transaction.currency || 'USD'}</div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
});

TransactionRow.displayName = 'TransactionRow';

export default TransactionRow;
