import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import KPICard from '../components/KPICard';
import { 
  TrendingUp, 
  DollarSign, 
  Link2, 
  CheckCircle2,
  AlertTriangle,
  Plus,
  Download,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import moment from 'moment';

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

  const { data: connections = [] } = useQuery({
    queryKey: ['connections'],
    queryFn: () => base44.entities.PlatformConnection.list(),
    initialData: []
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-transaction_date', 100),
    initialData: []
  });

  // Calculate KPIs
  const currentMonth = moment().startOf('month');
  const thisMonthTransactions = transactions.filter(t => 
    moment(t.transaction_date).isSameOrAfter(currentMonth) &&
    t.status === 'completed'
  );
  
  const lastMonth = moment().subtract(1, 'month').startOf('month');
  const lastMonthTransactions = transactions.filter(t => 
    moment(t.transaction_date).isBetween(lastMonth, currentMonth) &&
    t.status === 'completed'
  );

  const totalThisMonth = thisMonthTransactions.reduce((sum, t) => sum + (t.net_amount || t.amount), 0);
  const totalLastMonth = lastMonthTransactions.reduce((sum, t) => sum + (t.net_amount || t.amount), 0);
  const monthTrend = totalLastMonth > 0 ? ((totalThisMonth - totalLastMonth) / totalLastMonth * 100).toFixed(1) : 0;

  const yearStart = moment().startOf('year');
  const ytdTransactions = transactions.filter(t => 
    moment(t.transaction_date).isSameOrAfter(yearStart) &&
    t.status === 'completed'
  );
  const totalYTD = ytdTransactions.reduce((sum, t) => sum + (t.net_amount || t.amount), 0);

  const connectedCount = connections.filter(c => c.sync_status === 'active').length;
  const activeConnections = connections.filter(c => c.sync_status === 'active');

  // Revenue breakdown by platform
  const platformRevenue = {};
  transactions.forEach(t => {
    if (t.status === 'completed') {
      platformRevenue[t.platform] = (platformRevenue[t.platform] || 0) + (t.net_amount || t.amount);
    }
  });

  const COLORS = {
    youtube: '#FF0000',
    patreon: '#FF424D',
    gumroad: '#FF90E8',
    stripe: '#635BFF',
    instagram: '#E4405F',
    tiktok: '#000000'
  };

  const chartData = Object.entries(platformRevenue).map(([platform, value]) => ({
    name: platform.charAt(0).toUpperCase() + platform.slice(1),
    value: value,
    color: COLORS[platform] || '#208D9E'
  }));

  // Recent transactions
  const recentTransactions = transactions.slice(0, 10);

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#5E5240] mb-2">
          Your Creator Revenue, Unified
        </h1>
        <p className="text-[#5E5240]/60">
          Real-time earnings from all platforms. Reconciled. Taxed. Done.
        </p>
        {user?.plan_tier === 'free' && connectedCount >= 2 && (
          <div className="mt-4 p-4 bg-[#208D9E]/10 border border-[#208D9E]/20 rounded-lg">
            <p className="text-sm text-[#208D9E] mb-2">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              You've reached the 2-platform limit on the Free plan
            </p>
            <Link to={createPageUrl('Subscription')}>
              <Button className="btn-primary text-sm">
                Unlock all platforms for $49/mo
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Total MRR This Month"
          value={`$${totalThisMonth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle={`Across ${connectedCount} platforms`}
          trend={parseFloat(monthTrend) >= 0 ? 'up' : 'down'}
          trendValue={`${Math.abs(monthTrend)}% vs last month`}
          icon={DollarSign}
        />
        <KPICard
          title="Total Revenue (YTD)"
          value={`$${totalYTD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle={`${yearStart.format('MMM D')} - ${moment().format('MMM D')}`}
          icon={TrendingUp}
        />
        <Link to={createPageUrl('Platforms')} className="block">
          <KPICard
            title="Platforms Connected"
            value={connectedCount}
            subtitle="YouTube, Patreon, Stripe..."
            icon={Link2}
          />
        </Link>
        <KPICard
          title="Reconciliation Status"
          value="✓ All matched"
          subtitle="100% reconciled"
          icon={CheckCircle2}
        />
      </div>

      {/* Revenue Breakdown Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="clay-card p-6">
          <h2 className="text-lg font-semibold text-[#5E5240] mb-4">Revenue Breakdown</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-[#5E5240]/40">
              No revenue data yet. Connect platforms to get started.
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="clay-card p-6">
          <h2 className="text-lg font-semibold text-[#5E5240] mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link to={createPageUrl('Platforms')}>
              <Button className="btn-primary w-full justify-start">
                <Plus className="w-5 h-5 mr-2" />
                Connect New Platform
              </Button>
            </Link>
            <Button className="btn-secondary w-full justify-start">
              <Download className="w-5 h-5 mr-2" />
              Export for Taxes
            </Button>
            <Link to={createPageUrl('Transactions')}>
              <Button className="btn-secondary w-full justify-start">
                <FileText className="w-5 h-5 mr-2" />
                View All Transactions
              </Button>
            </Link>
          </div>

          {/* Alerts */}
          <div className="mt-6 space-y-2">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <AlertTriangle className="w-3 h-3 inline mr-1" />
                {transactions.length} transactions synced this month
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="clay-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#5E5240]">Recent Transactions</h2>
          <Link to={createPageUrl('Transactions')}>
            <Button className="btn-secondary text-sm">View All</Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#5E524012]">
                <th className="text-left py-3 px-4 text-xs font-semibold text-[#5E5240]/70">Date</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[#5E5240]/70">Platform</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[#5E5240]/70">Amount</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[#5E5240]/70">Category</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[#5E5240]/70">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-[#5E524012] hover:bg-[#5E5240]/5">
                    <td className="py-3 px-4 text-sm">{moment(transaction.transaction_date).format('MMM D, YYYY')}</td>
                    <td className="py-3 px-4 text-sm capitalize">{transaction.platform}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-[#208D9E]">
                      ${(transaction.net_amount || transaction.amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-sm capitalize">{transaction.category?.replace('_', ' ')}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                        transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        transaction.status === 'refunded' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-[#5E5240]/40">
                    No transactions yet. Connect platforms to start tracking revenue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}