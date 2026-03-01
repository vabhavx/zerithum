import React, { useMemo } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingUp, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

const COLORS = ['#111827', '#6B7280', '#9CA3AF', '#D1D5DB', '#374151', '#4B5563'];

export default function ExpenseAnalytics({ expenses }) {
  const analytics = useMemo(() => {
    const byCategory = {}, byMonth = {};
    let totalDeductible = 0;
    expenses.forEach(exp => {
      byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount;
      const month = new Date(exp.expense_date).toLocaleDateString('en-US', { month: 'short' });
      byMonth[month] = (byMonth[month] || 0) + exp.amount;
      if (exp.is_tax_deductible) totalDeductible += exp.amount * (exp.deduction_percentage / 100);
    });
    return {
      categoryData: Object.entries(byCategory).map(([name, value]) => ({ name, value: Math.round(value) })).sort((a, b) => b.value - a.value),
      monthlyData: Object.entries(byMonth).map(([name, value]) => ({ name, value: Math.round(value) })),
      totalDeductible,
      avgExpense: expenses.length > 0 ? expenses.reduce((s, e) => s + e.amount, 0) / expenses.length : 0,
      highestExpense: Math.max(...expenses.map(e => e.amount), 0)
    };
  }, [expenses]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-gray-100 bg-white p-4">
          <DollarSign className="w-5 h-5 text-gray-400 mb-2" />
          <p className="text-xs text-gray-400">Avg Expense</p>
          <p className="text-xl font-bold text-gray-900">${analytics.avgExpense.toFixed(0)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-gray-100 bg-white p-4">
          <TrendingUp className="w-5 h-5 text-red-500 mb-2" />
          <p className="text-xs text-gray-400">Highest</p>
          <p className="text-xl font-bold text-gray-900">${analytics.highestExpense.toFixed(0)}</p>
        </motion.div>
      </div>
      <div className="rounded-xl border border-gray-100 bg-white p-5">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">Spending by Category</h4>
        {analytics.categoryData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}><PieChart><Pie data={analytics.categoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{analytics.categoryData.map((_, i) => (<Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />))}</Pie><Tooltip /></PieChart></ResponsiveContainer>
        ) : (<p className="text-gray-400 text-center py-8 text-sm">No data yet</p>)}
      </div>
      <div className="rounded-xl border border-gray-100 bg-white p-5">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">Monthly Trend</h4>
        {analytics.monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}><BarChart data={analytics.monthlyData}><Tooltip /><Bar dataKey="value" fill="#111827" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer>
        ) : (<p className="text-gray-400 text-center py-8 text-sm">No data yet</p>)}
      </div>
    </div>
  );
}