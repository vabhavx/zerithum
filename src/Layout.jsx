import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/supabaseClient";
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
  ChevronRight,
  Command,
  Search,
  Settings,
  PieChart,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Organized Navigation Structure
const navigation = [
  {
    group: "Overview",
    items: [
      { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
      { name: "Reconciliation", icon: Scale, page: "Reconciliation" }, // Added explicit link
      { name: "Reports", icon: PieChart, page: "Reports" },
    ]
  },
  {
    group: "Analysis",
    items: [
      { name: "Transactions", icon: FileText, page: "TransactionAnalysis" },
      { name: "Revenue Autopsy", icon: Activity, page: "RevenueAutopsy" },
      { name: "Expenses", icon: DollarSign, page: "Expenses" },
      { name: "Tax Estimator", icon: FileText, page: "TaxEstimator" },
    ]
  },
  {
    group: "Configuration",
    items: [
      { name: "Integrations", icon: Link2, page: "ConnectedPlatforms" },
      { name: "Pricing", icon: DollarSign, page: "Pricing" },
      { name: "Settings", icon: Settings, page: "Settings" },
    ]
  }
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();

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
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col lg:flex-row overflow-hidden">

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <div className="w-6 h-6 bg-primary text-primary-foreground flex items-center justify-center font-serif font-bold text-xs rounded-none">
             Z
           </div>
           <span className="font-serif font-bold text-lg tracking-tight">Zerithum</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Dense, Technical */}
      <aside className={cn(
        "fixed lg:static left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border z-50 transition-transform duration-200 ease-out flex flex-col",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Brand Header */}
        <div className="p-4 border-b border-sidebar-border flex items-center gap-3">
          <div className="w-8 h-8 bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center font-serif font-bold text-lg rounded-none">
             Z
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-bold text-lg leading-none tracking-tight text-sidebar-foreground">Zerithum</span>
            <span className="text-[10px] font-mono text-sidebar-foreground/60 uppercase tracking-wider">Operating System</span>
          </div>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-8">
          {navigation.map((group, idx) => (
            <div key={idx}>
              <h3 className="px-3 text-[10px] font-mono uppercase tracking-wider text-sidebar-foreground/40 mb-2 font-semibold">
                {group.group}
              </h3>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = currentPageName === item.page || location.pathname.includes(item.page);
                  return (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors group relative border border-transparent",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-primary font-semibold border-sidebar-border"
                          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                      )}
                    >
                      <item.icon className={cn("w-4 h-4", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/50")} />
                      <span>{item.name}</span>
                      {isActive && <div className="ml-auto w-1 h-1 bg-sidebar-primary rounded-full" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User / Footer */}
        <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/10">
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-sidebar-accent border border-sidebar-border flex items-center justify-center text-xs font-bold text-sidebar-foreground">
                  {user.full_name?.[0] || user.email?.[0] || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-sidebar-foreground truncate">{user.full_name || "Account"}</p>
                  <p className="text-[10px] text-sidebar-foreground/50 truncate font-mono">{user.email}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-start text-xs h-7 border-sidebar-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
              >
                <LogOut className="w-3 h-3 mr-2" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
                 <Link to="/SignIn">
                    <Button variant="default" size="sm" className="w-full text-xs">Sign In</Button>
                 </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <main className="flex-1 min-h-0 flex flex-col bg-background lg:h-screen lg:overflow-hidden relative">
        {/* Top Bar - Breadcrumbs & Context */}
        <header className="h-14 border-b border-border bg-background flex items-center justify-between px-6 lg:px-8 shrink-0">
             <div className="flex items-center text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Zerithum</span>
                <ChevronRight className="w-4 h-4 mx-2 opacity-50" />
                <span className="font-medium text-foreground">{currentPageName || "Dashboard"}</span>
             </div>

             <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center px-3 py-1.5 bg-secondary/50 border border-input rounded-none text-xs text-muted-foreground w-64">
                    <Search className="w-3 h-3 mr-2 opacity-50" />
                    <span className="font-mono">Search transactions...</span>
                    <span className="ml-auto text-[10px] border border-border px-1.5 py-0.5 rounded-sm bg-background">⌘K</span>
                </div>
                <div className="h-4 w-[1px] bg-border mx-2"></div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">System Operational</span>
                </div>
             </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
            <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500">
                 {children}
            </div>
        </div>
      </main>
    </div>
  );
}
