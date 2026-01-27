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

    // Find earliest revenue date to limit bank query
    const minDate = revenueTxns.reduce((min, t) => t.transaction_date < min ? t.transaction_date : min, revenueTxns[0].transaction_date);
    let bankTxns = await ctx.fetchUnreconciledBankTransactions(user.id, minDate);

    // Sort both lists by date to enable sliding window (O(N) instead of O(N*M))
    revenueTxns.sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime());
    bankTxns.sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime());

    // 2. Identify Potential Matches
    const candidates: MatchCandidate[] = [];
    let bankStartIndex = 0;

    for (const rev of revenueTxns) {
      const revDate = new Date(rev.transaction_date);
      const revAmount = rev.amount;

      // Advance window start: bank txn must be >= revenue date
      while (bankStartIndex < bankTxns.length) {
        const bankDate = new Date(bankTxns[bankStartIndex].transaction_date);
        if (bankDate.getTime() >= revDate.getTime()) {
          break;
        }
        bankStartIndex++;
      }

      for (let i = bankStartIndex; i < bankTxns.length; i++) {
        const bank = bankTxns[i];
        const bankDate = new Date(bank.transaction_date);
        const diffTime = bankDate.getTime() - revDate.getTime();
        const diffDays = diffTime / (1000 * 3600 * 24);

        // Optimization: if bank txn is beyond 14 days, no further matches possible for this revenue txn
        if (diffDays > 14) break;

        // Date constraint: Bank txn must be after revenue (or same day) and within 14 days
        // (diffDays < 0 is handled by bankStartIndex logic, but kept for safety/robustness if logic changes)
        if (diffDays < 0) continue;

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
