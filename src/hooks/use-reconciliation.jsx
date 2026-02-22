import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { base44 } from "@/api/supabaseClient";

export const useReconciliationStats = () => {
  return useQuery({
    queryKey: ["reconciliationStats"],
    queryFn: async () => {
      const [total, matched, autoMatched] = await Promise.all([
        base44.entities.RevenueTransaction.count(),
        base44.entities.Reconciliation.count({ match_category: { $neq: 'unmatched' } }),
        base44.entities.Reconciliation.count({ reconciled_by: 'auto' })
      ]);

      const unmatched = total - matched;
      const matchRate = total > 0 ? ((matched / total) * 100).toFixed(1) : 0;

      return {
        total,
        matched,
        unmatched,
        autoMatched,
        matchRate
      };
    }
  });
};

export const useUnreconciledTransactions = () => {
  return useQuery({
    queryKey: ["unreconciledTransactions"],
    queryFn: async () => {
      // Fetch all reconciled revenue transaction IDs
      // This is an optimization over fetching full objects, but still scales linearly with dataset size.
      // Ideal solution would be a backend view or 'not in' query support.
      // fetchAllIds(filters, orderBy, selectColumn)
      const reconciledIds = await base44.entities.Reconciliation.fetchAllIds({}, 'id', 'revenue_transaction_id');
      const reconciledSet = new Set(reconciledIds);

      // Fetch all revenue IDs (sorted by date desc) to find recent unmatched ones
      const allRevenueIds = await base44.entities.RevenueTransaction.fetchAllIds({}, '-transaction_date');

      // Find top 5 unmatched IDs
      const topUnreconciledIds = [];
      for (const id of allRevenueIds) {
        if (!reconciledSet.has(id)) {
          topUnreconciledIds.push(id);
          if (topUnreconciledIds.length >= 5) break;
        }
      }

      if (topUnreconciledIds.length === 0) return [];

      // Fetch details for these 5
      const transactions = await base44.entities.RevenueTransaction.filter({ id: { $in: topUnreconciledIds } });

      // Sort locally to ensure order
      return transactions.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
    }
  });
};

export const useReconciliations = (page = 1, pageSize = 10, filterStatus = 'all') => {
  return useQuery({
    queryKey: ["reconciliations", page, pageSize, filterStatus],
    queryFn: async () => {
      const filters = {};
      if (filterStatus !== 'all') {
        filters.match_category = filterStatus;
      }

      const { data, count } = await base44.entities.Reconciliation.paginate(page, pageSize, filters, '-reconciled_at');

      if (data.length === 0) return { data: [], count: 0 };

      const revenueIds = data.map(r => r.revenue_transaction_id).filter(Boolean);
      const bankIds = data.map(r => r.bank_transaction_id).filter(Boolean);

      // Fetch details in batch
      const [revenueTransactions, bankTransactions] = await Promise.all([
        revenueIds.length > 0 ? base44.entities.RevenueTransaction.filter({ id: { $in: revenueIds } }) : [],
        bankIds.length > 0 ? base44.entities.BankTransaction.filter({ id: { $in: bankIds } }) : []
      ]);

      // Map details to reconciliation records
      const joinedData = data.map(rec => ({
        ...rec,
        revenue_transaction: revenueTransactions.find(t => t.id === rec.revenue_transaction_id),
        bank_transaction: bankTransactions.find(t => t.id === rec.bank_transaction_id)
      }));

      return { data: joinedData, count };
    },
    placeholderData: keepPreviousData,
  });
};
