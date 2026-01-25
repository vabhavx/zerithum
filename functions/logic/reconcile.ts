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

    // Sort revenue by date (asc)
    revenueTxns.sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime());

    // Find earliest revenue date to limit bank query
    const minDate = revenueTxns[0].transaction_date;
    const bankTxns = await ctx.fetchUnreconciledBankTransactions(user.id, minDate);

    // Sort bank txns by date (asc)
    bankTxns.sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime());

    // 2. Identify Potential Matches using Sliding Window
    const candidates: MatchCandidate[] = [];
    let bankWindowStart = 0;

    for (const rev of revenueTxns) {
      const revDate = new Date(rev.transaction_date);
      const revTime = revDate.getTime();
      const revAmount = rev.amount;

      // Advance window start: bank txn must be >= revDate
      while (bankWindowStart < bankTxns.length) {
          const bankDate = new Date(bankTxns[bankWindowStart].transaction_date);
          if (bankDate.getTime() >= revTime) {
              break;
          }
          bankWindowStart++;
      }

      // Scan within window
      for (let i = bankWindowStart; i < bankTxns.length; i++) {
        const bank = bankTxns[i];
        const bankDate = new Date(bank.transaction_date);
        const bankTime = bankDate.getTime();
        const diffTime = bankTime - revTime;
        const diffDays = diffTime / (1000 * 3600 * 24);

        if (diffDays > 14) {
            // Window end reached (bank date is too far in future)
            break;
        }

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
