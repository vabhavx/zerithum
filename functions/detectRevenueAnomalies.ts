import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch revenue transactions for the last 90 days
    const transactions = await base44.asServiceRole.entities.RevenueTransaction.filter(
      { user_id: user.id },
      '-transaction_date',
      1000
    );

    if (transactions.length < 10) {
      return Response.json({ 
        message: 'Insufficient data for anomaly detection',
        anomalies: []
      });
    }

    // Group by platform and week
    const weeklyRevenue = {};
    const platformRevenue = {};

    transactions.forEach(tx => {
      const date = new Date(tx.transaction_date);
      const weekKey = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;
      
      weeklyRevenue[weekKey] = (weeklyRevenue[weekKey] || 0) + tx.amount;
      platformRevenue[tx.platform] = (platformRevenue[tx.platform] || 0) + tx.amount;
    });

    const weeks = Object.entries(weeklyRevenue).sort();
    const anomalies = [];

    // Detect revenue drops/spikes
    for (let i = 1; i < weeks.length; i++) {
      const [prevWeek, prevAmount] = weeks[i - 1];
      const [currWeek, currAmount] = weeks[i];
      
      const change = ((currAmount - prevAmount) / prevAmount) * 100;

      if (Math.abs(change) > 15) {
        const existingAutopsy = await base44.asServiceRole.entities.AutopsyEvent.filter({
          user_id: user.id,
          detected_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() }
        });

        if (existingAutopsy.length === 0) {
          // Perform causal reconstruction using LLM
          const causalAnalysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `Analyze this revenue anomaly for a creator:
            
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
            response_json_schema: {
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
          });

          anomalies.push({
            user_id: user.id,
            event_type: change > 0 ? 'revenue_spike' : 'revenue_drop',
            severity: Math.abs(change) > 30 ? 'critical' : Math.abs(change) > 20 ? 'high' : 'medium',
            detected_at: new Date().toISOString(),
            impact_percentage: change,
            impact_amount: currAmount - prevAmount,
            affected_platforms: Object.keys(platformRevenue),
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
              platforms_at_risk: Object.keys(platformRevenue)
            },
            status: 'pending_review'
          });
        }
      }
    }

    // Detect concentration risk
    const totalRevenue = Object.values(platformRevenue).reduce((a, b) => a + b, 0);
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

    // Save anomalies
    if (anomalies.length > 0) {
      await base44.asServiceRole.entities.AutopsyEvent.bulkCreate(anomalies);
    }

    return Response.json({ 
      success: true,
      anomalies_detected: anomalies.length,
      anomalies
    });

  } catch (error) {
    console.error('Anomaly detection error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});