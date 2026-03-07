export interface ReconcileContext {
  fetchUnreconciledRevenue: (userId: string) => Promise<any[]>;
  fetchUnreconciledBankTransactions: (userId: string, startDate: string) => Promise<any[]>;
  createReconciliations: (reconciliations: any[]) => Promise<void>;
  logAudit: (entry: any) => Promise<void>;
}

type MatchType = 'exact_match' | 'fee_deduction' | 'hold_period' | 'refund' | 'grouped_payout';

interface MatchCandidate {
  revenue: any;
  bank: any;
  score: number;
  matchType: MatchType;
  confidence: number;
}

// Auto-reconcile threshold: >= 0.95 confidence gets auto-approved
const AUTO_APPROVE_THRESHOLD = 0.95;

export async function autoReconcile(ctx: ReconcileContext, user: { id: string }) {
  const startTime = Date.now();

  try {
    // 1. Fetch Data
    const revenueTxns = await ctx.fetchUnreconciledRevenue(user.id);

    if (revenueTxns.length === 0) {
        return { success: true, matchedCount: 0, sentToReview: 0, message: 'No unreconciled revenue found' };
    }

    // Find earliest revenue date to limit bank query
    const minDate = revenueTxns.reduce((min, t) => t.transaction_date < min ? t.transaction_date : min, revenueTxns[0].transaction_date);
    const bankTxns = await ctx.fetchUnreconciledBankTransactions(user.id, minDate);

    // 2. Individual matching
    const candidates: MatchCandidate[] = [];

    for (const rev of revenueTxns) {
      const revDate = new Date(rev.transaction_date);
      const revAmount = Math.abs(rev.amount);

      for (const bank of bankTxns) {
        const bankDate = new Date(bank.transaction_date);
        const diffTime = bankDate.getTime() - revDate.getTime();
        const diffDays = diffTime / (1000 * 3600 * 24);

        // Date constraint: Bank txn must be after revenue (or same day) and within 14 days
        if (diffDays < 0 || diffDays > 14) continue;

        const bankAmount = Math.abs(bank.amount);
        let matchType: MatchType | null = null;
        let confidence = 0;
        let baseScore = 0;

        const amountRatio = bankAmount / revAmount;
        const amountDiffPct = Math.abs(1 - amountRatio);

        // Exact amount match (within $0.01)
        if (Math.abs(bankAmount - revAmount) < 0.01) {
          if (diffDays <= 1) {
            matchType = 'exact_match';
            confidence = 1.0;
            baseScore = 1000;
          } else if (diffDays <= 3) {
            matchType = 'hold_period';
            confidence = 0.95;
            baseScore = 800;
          } else {
            matchType = 'hold_period';
            confidence = 0.85;
            baseScore = 600;
          }
        }
        // Within 2% + within 1 day
        else if (amountDiffPct <= 0.02 && diffDays <= 1) {
          matchType = 'fee_deduction';
          confidence = 0.95;
          baseScore = 850;
        }
        // Within 2% + within 3 days
        else if (amountDiffPct <= 0.02 && diffDays <= 3) {
          matchType = 'fee_deduction';
          confidence = 0.85;
          baseScore = 700;
        }
        // Within 5% + within 3 days (fee deduction with larger platform cut)
        else if (bankAmount < revAmount && amountDiffPct <= 0.05 && diffDays <= 3) {
          matchType = 'fee_deduction';
          confidence = 0.70;
          baseScore = 500;
        }

        if (matchType) {
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

    // 4. Assign Matches (greedy, no double-matching)
    const matchedRevenueIds = new Set<string>();
    const matchedBankIds = new Set<string>();
    const reconciliations: any[] = [];

    for (const cand of candidates) {
        if (matchedRevenueIds.has(cand.revenue.id) || matchedBankIds.has(cand.bank.id)) {
            continue;
        }

        matchedRevenueIds.add(cand.revenue.id);
        matchedBankIds.add(cand.bank.id);

        const reviewStatus = cand.confidence >= AUTO_APPROVE_THRESHOLD ? 'auto' : 'pending_review';

        reconciliations.push({
            user_id: user.id,
            revenue_transaction_id: cand.revenue.id,
            bank_transaction_id: cand.bank.id,
            match_category: cand.matchType,
            match_confidence: cand.confidence,
            review_status: reviewStatus,
            reconciled_by: 'auto',
            reconciled_at: new Date().toISOString()
        });
    }

    // 5. Grouped payout detection
    // Look for unmatched bank deposits that could be the sum of multiple revenue transactions
    const unmatchedBankTxns = bankTxns.filter(b => !matchedBankIds.has(b.id));
    const unmatchedRevTxns = revenueTxns.filter(r => !matchedRevenueIds.has(r.id));

    for (const bank of unmatchedBankTxns) {
        const bankAmount = Math.abs(bank.amount);
        const bankDate = new Date(bank.transaction_date);

        // Find revenue txns within date range that could sum to this bank deposit
        const eligibleRev = unmatchedRevTxns.filter(r => {
            const revDate = new Date(r.transaction_date);
            const diffDays = (bankDate.getTime() - revDate.getTime()) / (1000 * 3600 * 24);
            return diffDays >= 0 && diffDays <= 3 && !matchedRevenueIds.has(r.id);
        });

        if (eligibleRev.length < 2 || eligibleRev.length > 10) continue;

        // Try combinations of 2-5 (limit to keep complexity manageable)
        const maxGroupSize = Math.min(5, eligibleRev.length);
        let bestGroup: any[] | null = null;
        let bestDiffPct = Infinity;

        // Simple greedy: sort by amount desc, accumulate until close
        const sorted = [...eligibleRev].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

        for (let size = 2; size <= maxGroupSize; size++) {
            // Try the top `size` transactions
            const group = sorted.slice(0, size);
            const groupSum = group.reduce((sum, r) => sum + Math.abs(r.amount), 0);
            const diffPct = Math.abs(1 - groupSum / bankAmount);

            if (diffPct <= 0.01 && diffPct < bestDiffPct) {
                bestDiffPct = diffPct;
                bestGroup = group;
            }
        }

        if (bestGroup) {
            // Mark all revenue txns in the group as matched
            for (const rev of bestGroup) {
                matchedRevenueIds.add(rev.id);
            }
            matchedBankIds.add(bank.id);

            // Create a reconciliation for the first revenue txn (primary match)
            // with grouped_payout category — review required
            reconciliations.push({
                user_id: user.id,
                revenue_transaction_id: bestGroup[0].id,
                bank_transaction_id: bank.id,
                match_category: 'grouped_payout',
                match_confidence: 0.80,
                review_status: 'pending_review',
                reconciled_by: 'auto',
                reconciled_at: new Date().toISOString(),
                reviewer_notes: `Grouped payout: ${bestGroup.length} transactions summing to bank deposit`
            });
        }
    }

    // 6. Save Matches
    if (reconciliations.length > 0) {
        await ctx.createReconciliations(reconciliations);
    }

    const duration = Date.now() - startTime;
    const autoApproved = reconciliations.filter(r => r.review_status === 'auto').length;
    const sentToReview = reconciliations.filter(r => r.review_status === 'pending_review').length;

    await ctx.logAudit({
        action: 'auto_reconcile',
        actor_id: user.id,
        status: 'success',
        details: {
            revenue_scanned: revenueTxns.length,
            bank_scanned: bankTxns.length,
            matches_found: reconciliations.length,
            auto_approved: autoApproved,
            sent_to_review: sentToReview,
            duration_ms: duration
        }
    });

    return {
        success: true,
        matchedCount: reconciliations.length,
        sentToReview,
        message: `Matched ${reconciliations.length} transactions (${autoApproved} auto-approved, ${sentToReview} for review)`
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
