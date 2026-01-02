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
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { name: "Connected Platforms", icon: Link2, page: "ConnectedPlatforms" },
  { name: "Reconciliation", icon: Scale, page: "Reconciliation" },
  { name: "Export & Tax Reports", icon: FileText, page: "TaxReports" },
  { name: "Settings", icon: Settings, page: "Settings" },
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <style>{`
        :root {
          --clay-shadow: 
            8px 8px 16px rgba(0, 0, 0, 0.08),
            -8px -8px 16px rgba(255, 255, 255, 0.9),
            inset 1px 1px 2px rgba(255, 255, 255, 0.5);
          --clay-shadow-sm: 
            4px 4px 8px rgba(0, 0, 0, 0.06),
            -4px -4px 8px rgba(255, 255, 255, 0.8),
            inset 1px 1px 2px rgba(255, 255, 255, 0.4);
          --clay-shadow-pressed:
            inset 4px 4px 8px rgba(0, 0, 0, 0.08),
            inset -4px -4px 8px rgba(255, 255, 255, 0.6);
        }
        .clay {
          background: linear-gradient(145deg, rgba(255,255,255,0.7), rgba(241,245,249,0.9));
          box-shadow: var(--clay-shadow);
          border: 1px solid rgba(255,255,255,0.6);
          backdrop-filter: blur(10px);
        }
        .clay-sm {
          background: linear-gradient(145deg, rgba(255,255,255,0.6), rgba(241,245,249,0.8));
          box-shadow: var(--clay-shadow-sm);
          border: 1px solid rgba(255,255,255,0.5);
        }
        .clay-pressed {
          box-shadow: var(--clay-shadow-pressed);
        }
        .clay-hover:hover {
          box-shadow: 
            10px 10px 20px rgba(0, 0, 0, 0.1),
            -10px -10px 20px rgba(255, 255, 255, 0.95);
          transform: translateY(-1px);
        }
      `}</style>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 clay px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">Z</span>
          </div>
          <span className="font-semibold text-slate-800">Zerithum</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="clay-sm rounded-xl"
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
        "fixed left-0 top-0 h-full w-72 clay z-50 transition-transform duration-300 ease-out",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 h-full flex flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">Z</span>
            </div>
            <div>
              <h1 className="font-bold text-xl text-slate-800">Zerithum</h1>
              <p className="text-xs text-slate-500">Revenue Reconciliation</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    isActive 
                      ? "clay-pressed bg-gradient-to-r from-violet-50 to-indigo-50 text-violet-700" 
                      : "hover:clay-sm text-slate-600 hover:text-slate-800"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive && "text-violet-600")} />
                  <span className="font-medium">{item.name}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto text-violet-500" />}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          {user && (
            <div className="pt-6 border-t border-slate-200/50">
              <div className="clay-sm rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                    <span className="font-semibold text-slate-600">
                      {user.full_name?.[0] || user.email?.[0] || "U"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{user.full_name || "Creator"}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50/50"
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
      <main className="lg:ml-72 min-h-screen pt-16 lg:pt-0">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}