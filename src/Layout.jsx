import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard,
  Plug2,
  Receipt,
  GitCompare,
  FileText,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  X,
  ChevronDown,
  User as UserIcon,
} from "lucide-react";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  const navItems = [
    { name: "Dashboard", page: "Dashboard", icon: LayoutDashboard },
    { name: "Connected Platforms", page: "ConnectedPlatforms", icon: Plug2 },
    { name: "Transactions", page: "Transactions", icon: Receipt },
    { name: "Reconciliation", page: "Reconciliation", icon: GitCompare },
    { name: "Tax Export", page: "TaxExport", icon: FileText },
  ];

  const settingsItems = [
    { name: "Account", page: "SettingsAccount" },
    { name: "Subscription", page: "SettingsSubscription" },
    { name: "Connected Apps", page: "SettingsConnectedApps" },
    { name: "Privacy & Data", page: "SettingsPrivacy" },
    { name: "Notifications", page: "SettingsNotifications" },
  ];

  const NavLink = ({ item }) => {
    const isActive = currentPageName === item.page;
    const Icon = item.icon;

    return (
      <Link
        to={createPageUrl(item.page)}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
          isActive
            ? "bg-[#208D9E]/10 border-l-4 border-[#208D9E] text-[#208D9E] font-semibold"
            : "text-[#5E5240] hover:bg-[#5E5240]/5"
        }`}
        onClick={() => setSidebarOpen(false)}
      >
        <Icon className="w-5 h-5" />
        <span>{item.name}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#FCF8F9]">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-[#FFFFFE] border-b border-[#5E5240]/10 z-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-[#5E5240]/5 rounded-lg"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <h1 className="text-xl font-bold text-[#208D9E]">Zerithum</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-[#FFFFFE] border-r border-[#5E5240]/10 z-40 transition-transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 w-64`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-[#5E5240]/10">
            <h1 className="text-2xl font-bold text-[#208D9E]">Zerithum</h1>
            <p className="text-xs text-[#5E5240]/60 mt-1">Creator Revenue Hub</p>
          </div>

          {/* User Info */}
          {user && (
            <div className="px-4 py-4 border-b border-[#5E5240]/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#208D9E]/10 flex items-center justify-center">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.full_name} className="w-10 h-10 rounded-full" />
                  ) : (
                    <UserIcon className="w-5 h-5 text-[#208D9E]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#5E5240] truncate">{user.full_name}</p>
                  <p className="text-xs text-[#5E5240]/60 truncate">
                    {user.plan_tier === "free" ? "Free Plan" : user.plan_tier === "pro" ? "Creator Pro" : "Creator Max"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <div className="space-y-1">
              {navItems.map((item) => (
                <NavLink key={item.page} item={item} />
              ))}
            </div>

            {/* Settings Dropdown */}
            <div className="mt-6">
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="w-full flex items-center justify-between px-4 py-3 text-[#5E5240] hover:bg-[#5E5240]/5 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${settingsOpen ? "rotate-180" : ""}`} />
              </button>
              {settingsOpen && (
                <div className="ml-4 mt-1 space-y-1">
                  {settingsItems.map((item) => (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      className={`block px-4 py-2 text-sm rounded-lg transition-all ${
                        currentPageName === item.page
                          ? "bg-[#208D9E]/10 text-[#208D9E] font-semibold"
                          : "text-[#5E5240]/80 hover:bg-[#5E5240]/5"
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Bottom Actions */}
          <div className="p-3 border-t border-[#5E5240]/10 space-y-1">
            <Link
              to={createPageUrl("Help")}
              className="flex items-center gap-3 px-4 py-3 text-[#5E5240] hover:bg-[#5E5240]/5 rounded-lg"
            >
              <HelpCircle className="w-5 h-5" />
              <span>Help & Support</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-[#C0152F] hover:bg-[#C0152F]/5 rounded-lg"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}