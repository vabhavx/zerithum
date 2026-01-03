import React, { useMemo } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4'];

export default function ExpenseAnalytics({ expenses }) {
  const analytics = useMemo(() => {
    const byCategory = {};
    const byMonth = {};
    let totalDeductible = 0;

    expenses.forEach(exp => {
      byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount;
      
      const month = new Date(exp.expense_date).toLocaleDateString('en-US', { month: 'short' });
      byMonth[month] = (byMonth[month] || 0) + exp.amount;
      
      if (exp.is_tax_deductible) {
        totalDeductible += exp.amount * (exp.deduction_percentage / 100);
      }
    });

    const categoryData = Object.entries(byCategory)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);

    const monthlyData = Object.entries(byMonth).map(([name, value]) => ({ name, value: Math.round(value) }));

    const avgExpense = expenses.length > 0 ? expenses.reduce((s, e) => s + e.amount, 0) / expenses.length : 0;
    const highestExpense = Math.max(...expenses.map(e => e.amount), 0);

    return {
      categoryData,
      monthlyData,
      totalDeductible,
      avgExpense,
      highestExpense
    };
  }, [expenses]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-modern rounded-xl p-4"
        >
          <DollarSign className="w-5 h-5 text-emerald-400 mb-2" />
          <p className="text-xs text-white/50">Avg Expense</p>
          <p className="text-xl font-bold text-white">${analytics.avgExpense.toFixed(0)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-modern rounded-xl p-4"
        >
          <TrendingUp className="w-5 h-5 text-red-400 mb-2" />
          <p className="text-xs text-white/50">Highest</p>
          <p className="text-xl font-bold text-white">${analytics.highestExpense.toFixed(0)}</p>
        </motion.div>
      </div>

      <div className="card-modern rounded-xl p-5">
        <h4 className="text-sm font-semibold text-white mb-4">Spending by Category</h4>
        {analytics.categoryData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={analytics.categoryData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {analytics.categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-white/40 text-center py-8 text-sm">No data yet</p>
        )}
      </div>

      <div className="card-modern rounded-xl p-5">
        <h4 className="text-sm font-semibold text-white mb-4">Monthly Trend</h4>
        {analytics.monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={analytics.monthlyData}>
              <Tooltip />
              <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-white/40 text-center py-8 text-sm">No data yet</p>
        )}
      </div>
    </div>
  );
}