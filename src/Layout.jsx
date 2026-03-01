import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { name: "Revenue Autopsy", icon: AlertTriangle, page: "RevenueAutopsy" },
  { name: "Transactions", icon: FileText, page: "TransactionAnalysis" },
  { name: "Expenses", icon: Scale, page: "Expenses" },
  { name: "Tax Estimator", icon: FileText, page: "TaxEstimator" },
  { name: "Platforms", icon: Link2, page: "ConnectedPlatforms" },
  { name: "Profile", icon: User, page: "Profile" },
  { name: "Pricing", icon: DollarSign, page: "Pricing" },
];

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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
    <div className="min-h-screen bg-white">

      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">

            {/* Logo */}
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69589d721ccc18cb36d43903/c4bbf87fd_image.png"
                  alt="Zerithum"
                  className="h-6 w-auto object-contain"
                />
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center gap-1">
                {navItems.map((item) => {
                  const isActive = currentPageName === item.page;
                  return (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors",
                        isActive
                          ? "bg-gray-100 text-gray-900"
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                      )}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              {/* User Menu (Desktop) */}
              {user && (
                <div className="hidden lg:block relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                      <span className="text-xs font-medium text-gray-600">
                        {user.full_name?.[0] || user.email?.[0] || "U"}
                      </span>
                    </div>
                    <span className="text-[13px] font-medium text-gray-700 max-w-[120px] truncate">
                      {user.full_name || "Account"}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-gray-200 bg-white shadow-lg z-50 py-1">
                        <div className="px-3 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900 truncate">{user.full_name || "User"}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-red-600 transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <>
            <div
              className="lg:hidden fixed inset-0 top-14 bg-black/10 z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="lg:hidden absolute left-0 right-0 top-14 bg-white border-b border-gray-200 shadow-lg z-50">
              <nav className="px-4 py-3 space-y-1">
                {navItems.map((item) => {
                  const isActive = currentPageName === item.page;
                  return (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                        isActive
                          ? "bg-gray-100 text-gray-900"
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
              {user && (
                <div className="px-4 py-3 border-t border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                      <span className="text-xs font-medium text-gray-600">
                        {user.full_name?.[0] || user.email?.[0] || "U"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.full_name || "User"}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="w-full justify-start text-gray-500 hover:text-red-600 hover:bg-red-50 text-xs h-8"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-2" />
                    Sign out
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </header>

      {/* Main Content */}
      <main className="min-h-screen pt-14 bg-gray-50/50">
        <div className="p-6 lg:p-10 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
