import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import { 
  LayoutDashboard, 
  Link2, 
  Scale, 
  FileText, 
  Settings, 
  Menu, 
  X,
  LogOut,
  ChevronRight,
  User,
  AlertTriangle,
  DollarSign
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
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-[var(--surface-base)]">

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-effect px-6 py-4 flex items-center justify-between border-b border-[var(--border-subtle)]">
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69589d721ccc18cb36d43903/2c9557f00_Zerithumlogo.jpg" 
          alt="Zerithum"
          className="h-8 w-auto object-contain"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full w-64 bg-[var(--surface-base)] border-r border-[var(--border-subtle)] z-50 transition-all duration-300 ease-out",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 h-full flex flex-col">
          {/* Logo */}
          <div className="flex items-center mb-10">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69589d721ccc18cb36d43903/2c9557f00_Zerithumlogo.jpg" 
              alt="Zerithum"
              className="h-9 w-auto object-contain"
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-lg)] transition-all duration-150 group relative",
                    isActive 
                      ? "bg-[var(--brand-teal-500)]/10 text-[var(--brand-teal-400)] border-l-2 border-[var(--brand-teal-500)]" 
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]"
                  )}
                >
                  <item.icon className="w-4.5 h-4.5" />
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          {user && (
            <div className="pt-4 border-t border-[var(--border-subtle)]">
              <div className="rounded-[var(--radius-lg)] bg-[var(--surface-elevated)] p-4 border border-[var(--border-subtle)]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--brand-teal-500)]/20 to-[var(--brand-teal-600)]/20 flex items-center justify-center border border-[var(--border-default)]">
                    <span className="font-semibold text-[var(--brand-teal-400)] text-sm">
                      {user.full_name?.[0] || user.email?.[0] || "U"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--text-primary)] text-sm truncate">{user.full_name || "Creator"}</p>
                    <p className="text-xs text-[var(--text-tertiary)] truncate">{user.email}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full justify-start text-[var(--text-secondary)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 text-xs h-9"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0 bg-[var(--surface-base)]">
        <div className="p-6 lg:p-12 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}