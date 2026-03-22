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

// Maximum date gap (days) between revenue and bank deposit
const MAX_DATE_GAP_DAYS = 14;

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

    // 2. Individual matching — now NET-amount-aware
    const candidates: MatchCandidate[] = [];

    for (const rev of revenueTxns) {
      const revDate = new Date(rev.transaction_date);

      // Determine the amount the bank should show:
      // If net_amount is populated, use it (platform already deducted fees).
      // Otherwise fall back to gross amount for backwards compatibility.
      const revReconcileAmount = rev.net_amount != null && rev.net_amount > 0
        ? rev.net_amount
        : rev.amount;

      // Convert to cents for integer arithmetic (CLAUDE.md: no floating point for money)
      const revAmountCents = Math.round(Math.abs(revReconcileAmount) * 100);
      const revGrossCents = Math.round(Math.abs(rev.amount) * 100);

      for (const bank of bankTxns) {
        const bankDate = new Date(bank.transaction_date);
        const diffTime = bankDate.getTime() - revDate.getTime();
        const diffDays = diffTime / (1000 * 3600 * 24);

        // Date constraint: Bank txn must be after revenue (or same day) and within MAX_DATE_GAP_DAYS
        if (diffDays < 0 || diffDays > MAX_DATE_GAP_DAYS) continue;

        const bankAmountCents = Math.round(Math.abs(bank.amount) * 100);
        let matchType: MatchType | null = null;
        let confidence = 0;
        let baseScore = 0;

        // === Strategy 1: Match against NET amount (preferred — this is what hits the bank) ===
        const netDiffCents = Math.abs(bankAmountCents - revAmountCents);
        const netDiffPct = revAmountCents > 0 ? netDiffCents / revAmountCents : 0;

        // Exact net match (within $0.01 = 1 cent)
        if (netDiffCents <= 1) {
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
        // Close net match — within 2% (covers rounding, minor fee variance)
        else if (netDiffPct <= 0.02 && diffDays <= 1) {
          matchType = 'fee_deduction';
          confidence = 0.95;
          baseScore = 850;
        }
        else if (netDiffPct <= 0.02 && diffDays <= 3) {
          matchType = 'fee_deduction';
          confidence = 0.85;
          baseScore = 700;
        }

        // === Strategy 2: Match against GROSS amount (for platforms with no fee or external payout) ===
        if (!matchType) {
          const grossDiffCents = Math.abs(bankAmountCents - revGrossCents);
          const grossDiffPct = revGrossCents > 0 ? grossDiffCents / revGrossCents : 0;

          if (grossDiffCents <= 1 && diffDays <= 1) {
            matchType = 'exact_match';
            confidence = 0.95;
            baseScore = 900;
          } else if (grossDiffCents <= 1 && diffDays <= 3) {
            matchType = 'hold_period';
            confidence = 0.90;
            baseScore = 750;
          }
          // Bank amount less than gross but more than net — likely fee deduction we didn't model perfectly
          else if (bankAmountCents < revGrossCents && grossDiffPct <= 0.15 && diffDays <= 3) {
            matchType = 'fee_deduction';
            confidence = 0.70;
            baseScore = 500;
          }
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
    // Platforms like Patreon/Twitch batch multiple transactions into a single bank deposit.
    // Match unmatched bank deposits against sums of unmatched NET revenue amounts.
    const unmatchedBankTxns = bankTxns.filter(b => !matchedBankIds.has(b.id));
    const unmatchedRevTxns = revenueTxns.filter(r => !matchedRevenueIds.has(r.id));

    for (const bank of unmatchedBankTxns) {
        const bankAmountCents = Math.round(Math.abs(bank.amount) * 100);
        const bankDate = new Date(bank.transaction_date);

        // Find revenue txns within date range that could sum to this bank deposit
        const eligibleRev = unmatchedRevTxns.filter(r => {
            const revDate = new Date(r.transaction_date);
            const diffDays = (bankDate.getTime() - revDate.getTime()) / (1000 * 3600 * 24);
            return diffDays >= 0 && diffDays <= 5 && !matchedRevenueIds.has(r.id);
        });

        if (eligibleRev.length < 2 || eligibleRev.length > 20) continue;

        // Try combinations of 2-8 (limit to keep complexity manageable)
        const maxGroupSize = Math.min(8, eligibleRev.length);
        let bestGroup: any[] | null = null;
        let bestDiffPct = Infinity;

        // Sort by net_amount descending for greedy grouping
        const sorted = [...eligibleRev].sort((a, b) => {
          const aNet = Math.abs(a.net_amount != null && a.net_amount > 0 ? a.net_amount : a.amount);
          const bNet = Math.abs(b.net_amount != null && b.net_amount > 0 ? b.net_amount : b.amount);
          return bNet - aNet;
        });

        for (let size = 2; size <= maxGroupSize; size++) {
            // Try the top `size` transactions by net amount
            const group = sorted.slice(0, size);
            const groupSumCents = group.reduce((sum, r) => {
              const netAmt = r.net_amount != null && r.net_amount > 0 ? r.net_amount : r.amount;
              return sum + Math.round(Math.abs(netAmt) * 100);
            }, 0);
            const diffPct = bankAmountCents > 0 ? Math.abs(1 - groupSumCents / bankAmountCents) : 0;

            if (diffPct <= 0.02 && diffPct < bestDiffPct) {
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

            const groupSumCents = bestGroup.reduce((sum, r) => {
              const netAmt = r.net_amount != null && r.net_amount > 0 ? r.net_amount : r.amount;
              return sum + Math.round(Math.abs(netAmt) * 100);
            }, 0);

            // Create a reconciliation for the first revenue txn (primary match)
            // with grouped_payout category — review required
            reconciliations.push({
                user_id: user.id,
                revenue_transaction_id: bestGroup[0].id,
                bank_transaction_id: bank.id,
                match_category: 'grouped_payout',
                match_confidence: bestDiffPct <= 0.005 ? 0.90 : 0.80,
                review_status: 'pending_review',
                reconciled_by: 'auto',
                reconciled_at: new Date().toISOString(),
                reviewer_notes: `Grouped payout: ${bestGroup.length} transactions (net sum: $${(groupSumCents / 100).toFixed(2)}) matched to bank deposit of $${(bankAmountCents / 100).toFixed(2)}`
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
