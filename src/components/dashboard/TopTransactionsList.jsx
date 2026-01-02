import React from "react";
import { format } from "date-fns";
import { Youtube, CircleDollarSign, ShoppingBag, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const PLATFORM_ICONS = {
  youtube: Youtube,
  patreon: Users,
  stripe: CircleDollarSign,
  gumroad: ShoppingBag
};

const PLATFORM_COLORS = {
  youtube: "bg-red-50 text-red-600 border-red-100",
  patreon: "bg-rose-50 text-rose-600 border-rose-100",
  stripe: "bg-violet-50 text-violet-600 border-violet-100",
  gumroad: "bg-pink-50 text-pink-600 border-pink-100"
};

const CATEGORY_LABELS = {
  ad_revenue: "Ad Revenue",
  sponsorship: "Sponsorship",
  affiliate: "Affiliate",
  product_sale: "Product Sale",
  membership: "Membership"
};

export default function TopTransactionsList({ transactions }) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="clay rounded-3xl p-6 lg:p-8">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Top Transactions</h3>
        <div className="text-center py-12 text-slate-400">
          <CircleDollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No transactions this month</p>
        </div>
      </div>
    );
  }

  return (
    <div className="clay rounded-3xl p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Top Transactions</h3>
          <p className="text-sm text-slate-500">This month's highlights</p>
        </div>
      </div>
      
      <div className="space-y-3">
        {transactions.slice(0, 5).map((transaction, index) => {
          const Icon = PLATFORM_ICONS[transaction.platform] || CircleDollarSign;
          return (
            <div 
              key={transaction.id || index}
              className="clay-sm rounded-2xl p-4 flex items-center gap-4 clay-hover transition-all duration-200"
            >
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center border",
                PLATFORM_COLORS[transaction.platform] || "bg-slate-50 text-slate-600 border-slate-100"
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 truncate">
                  {transaction.description || CATEGORY_LABELS[transaction.category] || "Transaction"}
                </p>
                <p className="text-sm text-slate-500">
                  {transaction.platform?.charAt(0).toUpperCase() + transaction.platform?.slice(1)} · {format(new Date(transaction.transaction_date), "MMM d")}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-800">
                  ${transaction.amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                {transaction.platform_fee > 0 && (
                  <p className="text-xs text-slate-400">
                    -${transaction.platform_fee?.toFixed(2)} fee
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}