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

    // Sort revenue by date ascending for sliding window
    revenueTxns.sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime());

    // Find earliest revenue date to limit bank query
    const minDate = revenueTxns[0].transaction_date;
    const bankTxns = await ctx.fetchUnreconciledBankTransactions(user.id, minDate);

    // Sort bank txns by date ascending
    bankTxns.sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime());

    // 2. Identify Potential Matches (Sliding Window)
    const candidates: MatchCandidate[] = [];

    let bankWindowStart = 0;
    const maxDiffDays = 14;

    for (const rev of revenueTxns) {
      const revDate = new Date(rev.transaction_date);
      const revTime = revDate.getTime();
      const revAmount = rev.amount;

      // Advance window start: bank txn must be >= revDate (approx, considering same day)
      // Actually, standard says "Bank txn must be after revenue".
      // Let's allow strictly >= revTime.
      // If we used diffDays calculation: bankDate - revDate.
      // We want diffDays >= 0. So bankDate >= revDate.

      while (
        bankWindowStart < bankTxns.length &&
        new Date(bankTxns[bankWindowStart].transaction_date).getTime() < revTime
      ) {
         // Check if it's REALLY before.
         // If dates are YYYY-MM-DD strings, strict string comparison works.
         // If they are ISO with times, we need to be careful.
         // Existing logic used: diffDays < 0 continue.
         // So yes, strictly forward.
         // Wait, if transaction_date is just YYYY-MM-DD, then < compares correctly.
         // But if it has time, we might miss same-day if we are not careful.
         // The test uses ISO strings.
         // logic: diffDays = (bank - rev) / days.
         // if diffDays < 0, it means bank < rev.

         // However, floating point issues with time.
         // Let's stick to the previous logic's check:
         // diffTime = bank - rev.
         // if diffTime < 0, continue.
         bankWindowStart++;
      }

      // Scan forward
      for (let i = bankWindowStart; i < bankTxns.length; i++) {
        const bank = bankTxns[i];
        const bankDate = new Date(bank.transaction_date);
        const diffTime = bankDate.getTime() - revTime;
        const diffDays = diffTime / (1000 * 3600 * 24);

        // Stop if we exceed max window
        if (diffDays > maxDiffDays) {
           break;
        }

        // Additional check for negative diff (in case sort order/time issues)
        // (Should rely on sorted order, but safety first)
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

// Helper for manual reconciliation
export async function manualReconcileLogic(
    ctx: ReconcileContext,
    user: { id: string },
    revenueId: string,
    bankId: string,
    notes?: string
) {
    // 1. Fetch specific transactions
    // Since fetchUnreconciled... returns arrays, we might need a direct fetch or reuse them.
    // Ideally, we fetch them directly. But context currently only has list fetchers.
    // We can assume the caller has validated existence or we extend the context.
    // For simplicity, let's assume the calling function (endpoint) does the fetching/validation
    // OR we add fetchById to context.

    // To make this pure logic, we should probably just take the txn objects.
    // But `autoReconcile` takes context.
    // Let's stick to the pattern: this function is called by the endpoint.

    // But wait, the plan said "Update functions/logic/reconcile.ts to export a manualReconcile helper".
    // I will add `fetchTransaction` to the context or just use `base44` in the endpoint?
    // "Logic" files usually abstract away the DB.
    // I'll update the interface to support fetching by ID if I want to be strict.
    // Or I can let the endpoint handle the DB and just use this for the "matching" logic (calculating score/type)?
    // Manual match overrides score/type. It's manual.
    // So really, `manualReconcileLogic` is just:
    // 1. Log audit.
    // 2. Create record.

    // So maybe I don't need much logic here.
    // I will add it anyway for consistency.

    return {
        user_id: user.id,
        revenue_transaction_id: revenueId,
        bank_transaction_id: bankId,
        match_category: 'manual', // or calculate it if they want? No, it's manual.
        match_confidence: 1.0,
        reconciled_by: 'manual',
        creator_notes: notes,
        reconciled_at: new Date().toISOString()
    };
}
