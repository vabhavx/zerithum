export interface ReconcileContext {
  fetchUnreconciledRevenue: (userId: string) => Promise<any[]>;
  fetchUnreconciledBankTransactions: (userId: string, startDate: string) => Promise<any[]>;
  createReconciliations: (reconciliations: any[]) => Promise<void>;
  logAudit: (entry: any) => Promise<void>;
}

interface MatchCandidate {
  revenue: any;
  bank: any;
  score: number;
  matchType: 'exact_match' | 'fee_deduction' | 'hold_period';
  confidence: number;
}

export async function autoReconcile(ctx: ReconcileContext, user: { id: string }) {
  const startTime = Date.now();

  try {
    // 1. Fetch Data
    const revenueTxns = await ctx.fetchUnreconciledRevenue(user.id);

    if (revenueTxns.length === 0) {
        return { success: true, matchedCount: 0, message: 'No unreconciled revenue found' };
    }

    // Pre-process revenue transactions: parse date and sort
    // Using a map to include timestamp for faster access and sorting
    const sortedRevenue = revenueTxns.map(r => ({
        ...r,
        timestamp: new Date(r.transaction_date).getTime()
    })).sort((a, b) => a.timestamp - b.timestamp);

    // Find earliest revenue date to limit bank query
    // Use the timestamp of the first (earliest) sorted revenue txn
    const minDate = new Date(sortedRevenue[0].timestamp).toISOString();
    const bankTxns = await ctx.fetchUnreconciledBankTransactions(user.id, minDate);

    // Pre-process bank transactions: parse date and sort
    const sortedBanks = bankTxns.map(b => ({
        ...b,
        timestamp: new Date(b.transaction_date).getTime()
    })).sort((a, b) => a.timestamp - b.timestamp);

    // 2. Identify Potential Matches
    const candidates: MatchCandidate[] = [];

    // Constants for date calculations
    const DAY_MS = 1000 * 3600 * 24;
    const MAX_DIFF_MS = 14 * DAY_MS;

    let bankStartIndex = 0;

    for (const rev of sortedRevenue) {
      const revTime = rev.timestamp;
      const revAmount = rev.amount;

      // Sliding Window: Advance bankStartIndex to the first bank txn >= revTime
      // Since sortedBanks is sorted, we don't need to reset bankStartIndex for the next revenue txn
      while (bankStartIndex < sortedBanks.length && sortedBanks[bankStartIndex].timestamp < revTime) {
        bankStartIndex++;
      }

      // Iterate from bankStartIndex
      for (let i = bankStartIndex; i < sortedBanks.length; i++) {
        const bank = sortedBanks[i];
        const diffTime = bank.timestamp - revTime;

        // Optimization: Since banks are sorted, if diffTime > 14 days, all subsequent banks are also too late.
        if (diffTime > MAX_DIFF_MS) {
            break;
        }

        const diffDays = diffTime / DAY_MS;
        // diffDays < 0 is handled by bankStartIndex (bank.timestamp >= revTime)
        // diffDays > 14 is handled by the break above

        const bankAmount = bank.amount;
        let matchType: MatchCandidate['matchType'] | null = null;
        let confidence = 0;
        let baseScore = 0;

        // Exact Amount Match
        if (Math.abs(bankAmount - revAmount) < 0.01) {
          if (diffDays < 2) {
            matchType = 'exact_match';
            confidence = 1.0;
            baseScore = 1000;
          } else {
            matchType = 'hold_period';
            confidence = 1.0;
            baseScore = 600;
          }
        }
        // Fee Deduction (95% - 99.9% of revenue)
        else if (bankAmount < revAmount && bankAmount >= revAmount * 0.95) {
          matchType = 'fee_deduction';
          confidence = 0.9;
          baseScore = 800;
        }

        if (matchType) {
            // Tie-breaker: closer date is better
            // Subtract days from score so closer matches rank higher
            const score = baseScore - diffDays;

            candidates.push({
                revenue: rev,
                bank: bank,
                score,
                matchType,
                confidence
            });
        }
      }
    }

    // 3. Sort candidates by score (best first)
    candidates.sort((a, b) => b.score - a.score);

    // 4. Assign Matches
    const matchedRevenueIds = new Set<string>();
    const matchedBankIds = new Set<string>();
    const reconciliations: any[] = [];

    for (const cand of candidates) {
        if (matchedRevenueIds.has(cand.revenue.id) || matchedBankIds.has(cand.bank.id)) {
            continue;
        }

        matchedRevenueIds.add(cand.revenue.id);
        matchedBankIds.add(cand.bank.id);

        reconciliations.push({
            user_id: user.id,
            revenue_transaction_id: cand.revenue.id,
            bank_transaction_id: cand.bank.id,
            match_category: cand.matchType,
            match_confidence: cand.confidence,
            reconciled_by: 'auto',
            reconciled_at: new Date().toISOString()
        });
    }

    // 5. Save Matches
    if (reconciliations.length > 0) {
        await ctx.createReconciliations(reconciliations);
    }

    const duration = Date.now() - startTime;

    await ctx.logAudit({
        action: 'auto_reconcile',
        actor_id: user.id,
        status: 'success',
        details: {
            revenue_scanned: revenueTxns.length,
            bank_scanned: bankTxns.length,
            matches_found: reconciliations.length,
            duration_ms: duration
        }
    });

    return {
        success: true,
        matchedCount: reconciliations.length,
        message: `Successfully matched ${reconciliations.length} transactions`
    };

  } catch (error: any) {
      const duration = Date.now() - startTime;
      await ctx.logAudit({
          action: 'auto_reconcile_failed',
          actor_id: user?.id,
          status: 'failure',
          details: {
              error: error.message,
              duration_ms: duration
          }
      });
      throw error;
  }
}
