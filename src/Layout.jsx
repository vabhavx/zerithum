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
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { name: "Transactions", icon: FileText, page: "TransactionAnalysis" },
  { name: "Tax Estimator", icon: FileText, page: "TaxEstimator" },
  { name: "Connected Platforms", icon: Link2, page: "ConnectedPlatforms" },
  { name: "Profile", icon: User, page: "Profile" },
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
    <div className="min-h-screen bg-[#0A0A0A]">
      <style>{`
        :root {
          --bg-primary: #0A0A0A;
          --bg-secondary: #111111;
          --bg-tertiary: #1A1A1A;
          --border-primary: rgba(255, 255, 255, 0.06);
          --border-secondary: rgba(255, 255, 255, 0.12);
          --text-primary: #FFFFFF;
          --text-secondary: #A1A1A1;
          --accent: #6366F1;
          --accent-hover: #7C7FF2;
        }

        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }

        .card-modern {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(20px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .card-modern:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.12);
          transform: translateY(-2px);
        }

        .glass-effect {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(40px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .glow-accent {
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
        }

        .nav-item-active {
          background: linear-gradient(90deg, rgba(99, 102, 241, 0.1) 0%, transparent 100%);
          border-left: 2px solid #6366F1;
        }

        .shimmer {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.03) 50%,
            transparent 100%
          );
          background-size: 2000px 100%;
          animation: shimmer 3s infinite;
        }

        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
      `}</style>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-effect px-4 py-3 flex items-center justify-between border-b border-white/5">
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69589d721ccc18cb36d43903/2c9557f00_Zerithumlogo.jpg" 
          alt="Zerithum"
          className="h-7 w-auto object-contain"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-white/70 hover:text-white hover:bg-white/5"
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
        "fixed left-0 top-0 h-full w-64 bg-[#0A0A0A] border-r border-white/5 z-50 transition-all duration-300 ease-out",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 h-full flex flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69589d721ccc18cb36d43903/2c9557f00_Zerithumlogo.jpg" 
                alt="Zerithum"
                className="h-8 w-auto object-contain"
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
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                    isActive 
                      ? "nav-item-active text-white" 
                      : "text-white/50 hover:text-white/80 hover:bg-white/5"
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-indigo-500 rounded-r" />
                  )}
                  <item.icon className={cn("w-4 h-4", isActive && "text-indigo-400")} />
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          {user && (
            <div className="pt-4 border-t border-white/5">
              <div className="rounded-lg bg-white/5 p-3 border border-white/5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/10">
                    <span className="font-semibold text-white/70 text-sm">
                      {user.full_name?.[0] || user.email?.[0] || "U"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm truncate">{user.full_name || "Creator"}</p>
                    <p className="text-[10px] text-white/40 truncate">{user.email}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full justify-start text-white/50 hover:text-red-400 hover:bg-red-500/10 text-xs h-8"
                >
                  <LogOut className="w-3.5 h-3.5 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0 bg-[#0A0A0A]">
        <div className="p-6 lg:p-10 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}