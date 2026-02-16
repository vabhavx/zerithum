export interface AnomalyContext {
  fetchRecentTransactions: (userId: string, limit: number) => Promise<any[]>;
  fetchRecentAutopsies: (userId: string, since: Date) => Promise<any[]>;
  invokeLLM: (prompt: string, schema: any) => Promise<any>;
  saveAnomalies: (anomalies: any[]) => Promise<void>;
  logAudit: (entry: any) => void;
}

export async function detectAnomalies(
  ctx: AnomalyContext,
  user: { id: string }
) {
  const startTime = Date.now();
  let anomalies: any[] = [];
  let transactionCount = 0;

  try {
    // Fetch revenue transactions for the last 90 days (approx via limit)
    const transactions = await ctx.fetchRecentTransactions(user.id, 1000);
    transactionCount = transactions.length;

    if (transactions.length < 10) {
      return {
        success: true,
        message: 'Insufficient data for anomaly detection',
        anomalies: []
      };
    }

    // Group by platform and week
    const weeklyRevenue: Record<string, number> = {};
    const platformRevenue: Record<string, number> = {};

    transactions.forEach((tx: any) => {
      const date = new Date(tx.transaction_date);
      const weekKey = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;

      weeklyRevenue[weekKey] = (weeklyRevenue[weekKey] || 0) + tx.amount;
      platformRevenue[tx.platform] = (platformRevenue[tx.platform] || 0) + tx.amount;
    });

    const weeks = Object.entries(weeklyRevenue).sort();

    // Detect revenue drops/spikes
    const recentAutopsies = await ctx.fetchRecentAutopsies(user.id, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

    // Only proceed with expensive analysis if no recent autopsy exists
    if (recentAutopsies.length === 0) {
      const llmPrompts: Promise<any>[] = [];
      const pendingAnomaliesContext: any[] = [];

      for (let i = 1; i < weeks.length; i++) {
        const [prevWeek, prevAmount] = weeks[i - 1];
        const [currWeek, currAmount] = weeks[i];

        // Avoid division by zero
        if (prevAmount === 0) continue;

        const change = ((currAmount - prevAmount) / prevAmount) * 100;

        if (Math.abs(change) > 15) {
          pendingAnomaliesContext.push({
            prevAmount,
            currAmount,
            change,
            platformsAtRisk: Object.keys(platformRevenue)
          });

          // Perform causal reconstruction using LLM
          llmPrompts.push(ctx.invokeLLM(
            `Analyze this revenue anomaly for a creator:

Previous week revenue: $${prevAmount.toFixed(2)}
Current week revenue: $${currAmount.toFixed(2)}
Change: ${change.toFixed(1)}%

Recent transactions: ${JSON.stringify(transactions.slice(0, 20), null, 2)}

Provide a forensic analysis across these four layers:
1. Platform behaviour (fees, payout timing, policy changes)
2. Creator behaviour (posting frequency, pricing changes, content type)
3. External timing (seasonality, holidays, market events)
4. Historical patterns (similar events from this creator's data)

Be specific and data-driven. No speculation.`,
            {
              type: "object",
              properties: {
                platform_behaviour: { type: "string" },
                creator_behaviour: { type: "string" },
                external_timing: { type: "string" },
                historical_analogues: { type: "string" },
                primary_cause: { type: "string" },
                recurrence_probability: { type: "number" },
                expected_damage: { type: "number" }
              }
            }
          ));
        }
      }

      if (llmPrompts.length > 0) {
        const results = await Promise.all(llmPrompts);

        results.forEach((causalAnalysis, index) => {
          const { prevAmount, currAmount, change, platformsAtRisk } = pendingAnomaliesContext[index];

          anomalies.push({
            user_id: user.id,
            event_type: change > 0 ? 'revenue_spike' : 'revenue_drop',
            severity: Math.abs(change) > 30 ? 'critical' : Math.abs(change) > 20 ? 'high' : 'medium',
            detected_at: new Date().toISOString(),
            impact_percentage: change,
            impact_amount: currAmount - prevAmount,
            affected_platforms: platformsAtRisk,
            causal_reconstruction: {
              platform_behaviour: causalAnalysis.platform_behaviour,
              creator_behaviour: causalAnalysis.creator_behaviour,
              external_timing: causalAnalysis.external_timing,
              historical_analogues: causalAnalysis.historical_analogues
            },
            exposure_score: {
              recurrence_probability: causalAnalysis.recurrence_probability || 0.5,
              expected_damage: causalAnalysis.expected_damage || Math.abs(currAmount - prevAmount),
              time_to_impact: Math.abs(change) > 25 ? 'immediate' : 'within_30_days',
              platforms_at_risk: platformsAtRisk
            },
            status: 'pending_review'
          });
        });
      }
    }

    // Detect concentration risk
    const totalRevenue = Object.values(platformRevenue).reduce((a, b) => a + b, 0);
    if (totalRevenue > 0) {
      const concentrationEvents = Object.entries(platformRevenue)
        .filter(([platform, amount]) => (amount / totalRevenue) > 0.7)
        .map(([platform, amount]) => ({
          user_id: user.id,
          event_type: 'concentration_shift',
          severity: 'high',
          detected_at: new Date().toISOString(),
          impact_percentage: (amount / totalRevenue) * 100,
          impact_amount: amount,
          affected_platforms: [platform],
          causal_reconstruction: {
            platform_behaviour: `${platform} represents ${((amount / totalRevenue) * 100).toFixed(0)}% of total revenue`,
            creator_behaviour: 'Heavy reliance on single platform increases risk',
            external_timing: 'Ongoing',
            historical_analogues: 'Concentration risk detected'
          },
          exposure_score: {
            recurrence_probability: 0.9,
            expected_damage: amount * 0.5,
            time_to_impact: 'ongoing',
            platforms_at_risk: [platform]
          },
          status: 'pending_review'
        }));

      anomalies.push(...concentrationEvents);
    }

    // Save anomalies
    if (anomalies.length > 0) {
      await ctx.saveAnomalies(anomalies);
    }

    // Log Audit Success
    ctx.logAudit({
      action: 'detect_revenue_anomalies',
      actor_id: user.id,
      status: 'success',
      details: {
        transactions_analyzed: transactionCount,
        anomalies_detected: anomalies.length,
        duration_ms: Date.now() - startTime
      }
    });

    return {
      success: true,
      anomalies_detected: anomalies.length,
      anomalies
    };

  } catch (error: any) {
    const duration = Date.now() - startTime;

    // Log Audit Failure
    ctx.logAudit({
      action: 'detect_revenue_anomalies_failed',
      actor_id: user?.id,
      status: 'failure',
      details: {
        error_message: error.message,
        duration_ms: duration
      }
    });

    throw error;
  }
}
