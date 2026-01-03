import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, Plug2, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import KPICard from "../components/dashboard/KPICard";
import RevenueChart from "../components/dashboard/RevenueChart";
import { format } from "date-fns";

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error("User not authenticated");
    }
  };

  const { data: connections = [] } = useQuery({
    queryKey: ["platform_connections"],
    queryFn: () => base44.entities.PlatformConnection.list(),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => base44.entities.Transaction.list("-transaction_date", 100),
  });

  // Calculate KPIs
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyRevenue = transactions
    .filter((t) => {
      const date = new Date(t.transaction_date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear && t.status === "completed";
    })
    .reduce((sum, t) => sum + (t.net_amount || t.amount), 0);

  const yearlyRevenue = transactions
    .filter((t) => {
      const date = new Date(t.transaction_date);
      return date.getFullYear() === currentYear && t.status === "completed";
    })
    .reduce((sum, t) => sum + (t.net_amount || t.amount), 0);

  const activeConnections = connections.filter((c) => c.sync_status === "active").length;

  // Revenue by platform for chart
  const revenueByPlatform = transactions
    .filter((t) => t.status === "completed")
    .reduce((acc, t) => {
      const existing = acc.find((item) => item.platform === t.platform);
      if (existing) {
        existing.amount += t.net_amount || t.amount;
      } else {
        acc.push({ platform: t.platform, amount: t.net_amount || t.amount });
      }
      return acc;
    }, []);

  // Reconciliation status (mock for now)
  const reconciliationRate = 100; // Mock 100% matched

  // Recent transactions
  const recentTransactions = transactions.slice(0, 10);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-[#5E5240] mb-2">
          Your Creator Revenue, Unified
        </h1>
        <p className="text-[#5E5240]/60 mb-4">
          Real-time earnings from all platforms. Reconciled. Taxed. Done.
        </p>
        {user && user.plan_tier === "free" && activeConnections >= 2 && (
          <Link to={createPageUrl("SettingsSubscription")}>
            <Button className="btn-primary">
              Unlock all platforms for $49/mo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard
          title="Monthly Revenue (MRR)"
          value={`$${monthlyRevenue.toLocaleString()}`}
          trend="up"
          trendValue="+12%"
          subtitle={`Across ${activeConnections} platforms`}
          icon={DollarSign}
          color="#208D9E"
        />
        <KPICard
          title="Total Revenue (YTD)"
          value={`$${yearlyRevenue.toLocaleString()}`}
          subtitle={`Jan 1 - ${format(new Date(), "MMM d")}`}
          icon={TrendingUp}
          color="#208D9E"
        />
        <KPICard
          title="Platforms Connected"
          value={activeConnections}
          subtitle={
            activeConnections === 6
              ? "All platforms connected"
              : `${6 - activeConnections} more available`
          }
          icon={Plug2}
          color="#5E5240"
        />
        <KPICard
          title="Reconciliation"
          value={reconciliationRate === 100 ? "✓ All matched" : `${reconciliationRate}%`}
          subtitle={reconciliationRate === 100 ? "Up to date" : "15 unmatched"}
          icon={reconciliationRate === 100 ? CheckCircle : AlertCircle}
          color={reconciliationRate === 100 ? "#208D9E" : "#C0152F"}
        />
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-1">
          {revenueByPlatform.length > 0 ? (
            <RevenueChart data={revenueByPlatform} />
          ) : (
            <div className="clay-card text-center py-12">
              <p className="text-[#5E5240]/60 mb-4">No revenue data yet</p>
              <Link to={createPageUrl("ConnectedPlatforms")}>
                <Button className="btn-primary">Connect Your First Platform</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-2 clay-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#5E5240]">Recent Transactions</h3>
            <Link to={createPageUrl("Transactions")}>
              <Button className="btn-secondary text-sm">View All</Button>
            </Link>
          </div>

          {recentTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#5E5240]/10">
                    <th className="text-left py-3 px-2 text-xs font-semibold text-[#5E5240]/60">Date</th>
                    <th className="text-left py-3 px-2 text-xs font-semibold text-[#5E5240]/60">Platform</th>
                    <th className="text-right py-3 px-2 text-xs font-semibold text-[#5E5240]/60">Amount</th>
                    <th className="text-left py-3 px-2 text-xs font-semibold text-[#5E5240]/60">Category</th>
                    <th className="text-center py-3 px-2 text-xs font-semibold text-[#5E5240]/60">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((txn) => (
                    <tr key={txn.id} className="border-b border-[#5E5240]/5 hover:bg-[#5E5240]/5">
                      <td className="py-3 px-2 text-sm text-[#5E5240]">
                        {format(new Date(txn.transaction_date), "MMM d")}
                      </td>
                      <td className="py-3 px-2 text-sm">
                        <span className="capitalize font-medium text-[#5E5240]">{txn.platform}</span>
                      </td>
                      <td className="py-3 px-2 text-sm text-right font-semibold text-[#208D9E]">
                        ${(txn.net_amount || txn.amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-2 text-xs text-[#5E5240]/60">
                        {txn.category.replace("_", " ")}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            txn.status === "completed"
                              ? "bg-[#208D9E]/10 text-[#208D9E]"
                              : txn.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-[#C0152F]/10 text-[#C0152F]"
                          }`}
                        >
                          {txn.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-[#5E5240]/60 mb-4">No transactions yet</p>
              <Link to={createPageUrl("ConnectedPlatforms")}>
                <Button className="btn-primary">Connect platforms to see transactions</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <Link to={createPageUrl("ConnectedPlatforms")}>
          <Button className="btn-primary">
            <Plug2 className="w-4 h-4 mr-2" />
            Connect New Platform
          </Button>
        </Link>
        <Link to={createPageUrl("TaxExport")}>
          <Button className="btn-secondary">
            Export for Taxes
          </Button>
        </Link>
      </div>
    </div>
  );
}