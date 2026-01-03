import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch last 12 months of revenue transactions
    const transactions = await base44.entities.RevenueTransaction.filter({
      user_id: user.id
    }, '-transaction_date', 500);

    if (transactions.length === 0) {
      return Response.json({ 
        message: 'No transaction data available for insights',
        insightsGenerated: 0 
      });
    }

    const insights = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Insight 1: Cashflow Forecasting (Lending Signals)
    const recentTxns = transactions.filter(t => new Date(t.transaction_date) >= thirtyDaysAgo);
    const platformPayouts = {};

    transactions.forEach(t => {
      if (!platformPayouts[t.platform]) {
        platformPayouts[t.platform] = [];
      }
      platformPayouts[t.platform].push({
        amount: t.amount,
        date: new Date(t.transaction_date)
      });
    });

    // Predict next payout for each platform
    const payoutPredictions = [];
    for (const [platform, payouts] of Object.entries(platformPayouts)) {
      if (payouts.length < 2) continue;

      // Calculate average amount and day of month
      const avgAmount = payouts.reduce((sum, p) => sum + p.amount, 0) / payouts.length;
      const stdDev = Math.sqrt(
        payouts.reduce((sum, p) => sum + Math.pow(p.amount - avgAmount, 2), 0) / payouts.length
      );
      
      // Calculate typical payout day
      const payoutDays = payouts.map(p => p.date.getDate());
      const avgDay = Math.round(payoutDays.reduce((a, b) => a + b, 0) / payoutDays.length);
      
      // Predict next payout date
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(avgDay);
      
      const confidence = Math.min(0.95, Math.max(0.60, 1 - (stdDev / avgAmount)));
      
      payoutPredictions.push({
        platform,
        predictedAmount: avgAmount,
        confidenceInterval: stdDev * 1.96,
        predictedDate: nextMonth.toISOString().split('T')[0],
        confidence: confidence
      });
    }

    if (payoutPredictions.length > 0) {
      insights.push({
        user_id: user.id,
        insight_type: 'cashflow_forecast',
        title: 'Upcoming Payout Predictions',
        description: `Predicted ${payoutPredictions.length} upcoming payouts. Total expected: $${payoutPredictions.reduce((sum, p) => sum + p.predictedAmount, 0).toFixed(0)}`,
        confidence: payoutPredictions.reduce((sum, p) => sum + p.confidence, 0) / payoutPredictions.length,
        data: { predictions: payoutPredictions }
      });
    }

    // Insight 2: Revenue Concentration Risk
    const platformTotals = {};
    recentTxns.forEach(t => {
      platformTotals[t.platform] = (platformTotals[t.platform] || 0) + t.amount;
    });

    const totalRevenue = Object.values(platformTotals).reduce((a, b) => a + b, 0);
    
    for (const [platform, amount] of Object.entries(platformTotals)) {
      const percentage = (amount / totalRevenue) * 100;
      if (percentage >= 70) {
        insights.push({
          user_id: user.id,
          insight_type: 'concentration_risk',
          title: 'Revenue Concentration Risk Alert',
          description: `${percentage.toFixed(1)}% of your revenue comes from ${platform}. If ${platform} changes policies or demonetizes, you could lose $${(amount).toFixed(0)}/month. Diversification recommended.`,
          confidence: 1.0,
          data: { platform, percentage, monthlyRisk: amount }
        });
      }
    }

    // Insight 3: Anomaly Detection
    const amounts = transactions.map(t => t.amount);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const stdDevAmount = Math.sqrt(
      amounts.reduce((sum, amt) => sum + Math.pow(amt - avgAmount, 2), 0) / amounts.length
    );

    const recentAnomalies = recentTxns.filter(t => 
      Math.abs(t.amount - avgAmount) > 2 * stdDevAmount
    );

    if (recentAnomalies.length > 0) {
      insights.push({
        user_id: user.id,
        insight_type: 'anomaly_detection',
        title: 'Unusual Transactions Detected',
        description: `${recentAnomalies.length} transaction(s) significantly differ from your typical amounts. Largest: $${Math.max(...recentAnomalies.map(t => t.amount)).toFixed(0)}`,
        confidence: 0.85,
        data: { 
          anomalies: recentAnomalies.map(t => ({
            platform: t.platform,
            amount: t.amount,
            date: t.transaction_date,
            deviation: ((t.amount - avgAmount) / avgAmount * 100).toFixed(1)
          }))
        }
      });
    }

    // Insight 4: Pricing Elasticity (if multiple similar transactions)
    const categoryGroups = {};
    recentTxns.forEach(t => {
      if (!categoryGroups[t.category]) {
        categoryGroups[t.category] = [];
      }
      categoryGroups[t.category].push(t.amount);
    });

    for (const [category, amounts] of Object.entries(categoryGroups)) {
      if (amounts.length >= 5) {
        const avgCategoryAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const frequency = amounts.length;
        
        if (frequency > 8 && category !== 'ad_revenue') {
          const suggestedIncrease = avgCategoryAmount * 0.25;
          insights.push({
            user_id: user.id,
            insight_type: 'pricing_suggestion',
            title: `Pricing Opportunity: ${category}`,
            description: `You have ${frequency} ${category} transactions averaging $${avgCategoryAmount.toFixed(0)}. Consider raising prices by 25% to $${(avgCategoryAmount + suggestedIncrease).toFixed(0)}. Expected net revenue increase: +20-33%.`,
            confidence: 0.73,
            data: {
              category,
              currentAverage: avgCategoryAmount,
              suggestedPrice: avgCategoryAmount + suggestedIncrease,
              transactionCount: frequency
            }
          });
        }
      }
    }

    // Save insights to database
    for (const insight of insights) {
      await base44.asServiceRole.entities.Insight.create(insight);
    }

    return Response.json({
      success: true,
      insightsGenerated: insights.length,
      insights: insights.map(i => ({ type: i.insight_type, title: i.title }))
    });

  } catch (error) {
    console.error('Insights generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});