import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import { 
  LayoutDashboard, 
  Link2, 
  Scale, 
  FileText, 
  Menu, 
  X,
  LogOut,
  User,
  AlertTriangle,
  DollarSign,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { name: "Revenue Autopsy", icon: AlertTriangle, page: "RevenueAutopsy" },
  { name: "Transactions", icon: FileText, page: "TransactionAnalysis" },
  { name: "Expenses", icon: Scale, page: "Expenses" },
  { name: "Tax Estimator", icon: FileText, page: "TaxEstimator" },
  { name: "Connected Platforms", icon: Link2, page: "ConnectedPlatforms" },
  { name: "Profile", icon: User, page: "Profile" },
  { name: "Pricing", icon: DollarSign, page: "Pricing" },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.log("Not authenticated");
      }
    };
    loadUser();
  }, []);

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-dark)' }}>
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-16 z-40 flex items-center justify-between px-6" 
           style={{ 
             backgroundColor: 'var(--bg-dark)', 
             borderBottom: '1px solid var(--border-subtle)' 
           }}>
        {/* Left: Logo + Menu Toggle */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 hover:bg-white/5 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            ) : (
              <Menu className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            )}
          </button>
          
          <Link to={createPageUrl("Dashboard")} className="flex items-center gap-3">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69589d721ccc18cb36d43903/2c9557f00_Zerithumlogo.jpg" 
              alt="Zerithum"
              className="h-8 w-auto object-contain"
            />
            <span className="text-base font-semibold hidden sm:block" style={{ color: 'var(--text-primary)' }}>
              Zerithum
            </span>
          </Link>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {user && (
            <>
              <button className="btn-primary btn-small hidden sm:flex">
                <Sparkles className="w-4 h-4" />
                Generate Insights
              </button>
              <button className="btn-secondary btn-small">
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30 mt-16"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-16 h-[calc(100vh-4rem)] w-60 z-40 transition-transform duration-300 ease-out",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ 
          backgroundColor: 'var(--bg-dark)', 
          borderRight: '1px solid var(--border-subtle)' 
        }}
      >
        <div className="h-full flex flex-col">
          {/* Navigation Items */}
          <nav className="flex-1 py-4 px-3 space-y-1">
            {navItems.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 h-11 rounded-lg transition-all duration-150",
                    "text-sm font-medium",
                    isActive 
                      ? "text-white"
                      : "hover:bg-white/5"
                  )}
                  style={{
                    backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)'
                  }}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          {user && (
            <div className="p-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center gap-3 mb-3 px-2">
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm"
                     style={{ 
                       backgroundColor: 'var(--border-subtle)', 
                       color: 'var(--text-primary)' 
                     }}>
                  {user.full_name?.[0] || user.email?.[0] || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {user.full_name || "Creator"}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                    {user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-white/5 transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-60 pt-16 min-h-screen" style={{ backgroundColor: 'var(--bg-dark)' }}>
        {children}
      </main>

      {/* Footer */}
      <footer className="lg:ml-60 border-t py-8 px-6" 
              style={{ 
                backgroundColor: 'var(--bg-dark)', 
                borderColor: 'var(--border-subtle)' 
              }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              © {new Date().getFullYear()} Zerithum. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-xs">
              <a href="/pricing" className="hover:text-white transition-colors" style={{ color: 'var(--text-secondary)' }}>
                Pricing
              </a>
              <a href="#" className="hover:text-white transition-colors" style={{ color: 'var(--text-secondary)' }}>
                Privacy
              </a>
              <a href="#" className="hover:text-white transition-colors" style={{ color: 'var(--text-secondary)' }}>
                Terms
              </a>
              <a href="#" className="hover:text-white transition-colors" style={{ color: 'var(--text-secondary)' }}>
                Refund Policy
              </a>
              <a href="mailto:support@zerithum.com" className="hover:text-white transition-colors" style={{ color: 'var(--text-secondary)' }}>
                support@zerithum.com
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}