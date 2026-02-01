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
      <div className="card-modern rounded-xl p-6">
        <h3 className="text-base font-semibold text-white mb-6">Top Transactions</h3>
        <div className="text-center py-12 text-white/30">
          <CircleDollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No transactions this month</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-modern rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-white">Top Transactions</h3>
          <p className="text-xs text-white/40">This month's highlights</p>
        </div>
      </div>
      
      <div className="space-y-2">
        {transactions.slice(0, 5).map((transaction, index) => {
          const Icon = PLATFORM_ICONS[transaction.platform] || CircleDollarSign;
          return (
            <div 
              key={transaction.id || index}
              className="rounded-lg p-3 flex items-center gap-3 bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-200"
            >
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center border",
                transaction.platform === "youtube" && "bg-red-500/10 border-red-500/20 text-red-400",
                transaction.platform === "patreon" && "bg-rose-500/10 border-rose-500/20 text-rose-400",
                transaction.platform === "stripe" && "bg-zteal-400/10 border-zteal-400/20 text-zteal-400",
                transaction.platform === "gumroad" && "bg-pink-500/10 border-pink-500/20 text-pink-400",
                !transaction.platform && "bg-white/5 border-white/10 text-white/50"
              )}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm truncate">
                  {transaction.description || CATEGORY_LABELS[transaction.category] || "Transaction"}
                </p>
                <p className="text-xs text-white/40">
                  {transaction.platform?.charAt(0).toUpperCase() + transaction.platform?.slice(1)} · {format(new Date(transaction.transaction_date), "MMM d")}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-white text-sm">
                  ${transaction.amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                {transaction.platform_fee > 0 && (
                  <p className="text-[10px] text-red-400/60">
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