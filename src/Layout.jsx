import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/supabaseClient";
import {
  LayoutDashboard, Link2, Scale, FileText, Menu, X, LogOut,
  AlertTriangle, DollarSign, ChevronDown, Settings, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { LogoFull, LogoIcon } from "@/components/ui/logo";

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { name: "Revenue", icon: BarChart3, page: "RevenueAutopsy" },
  { name: "Transactions", icon: FileText, page: "TransactionAnalysis" },
  { name: "Expenses", icon: Scale, page: "Expenses" },
  { name: "Tax", icon: AlertTriangle, page: "TaxEstimator" },
  { name: "Platforms", icon: Link2, page: "ConnectedPlatforms" },
];

const secondaryNav = [
  { name: "Reports", icon: FileText, page: "Reports" },
  { name: "Settings", icon: Settings, page: "Settings" },
];

export default function Layout({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => setUser(null)); }, []);
  useEffect(() => { setMobileOpen(false); }, [currentPageName]);
  useEffect(() => {
    const handler = (e) => { if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => base44.auth.logout();

  const NavLink = ({ item, mobile }) => {
    const isActive = currentPageName === item.page;
    const Icon = item.icon;
    return (
      <Link
        to={createPageUrl(item.page)}
        className={cn(
          "relative flex items-center gap-2 transition-colors font-medium",
          mobile
            ? cn("px-4 py-3.5 rounded-lg text-[15px]", isActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900")
            : cn("px-3 py-2 text-[13px]", isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-900")
        )}
      >
        {mobile && <Icon className={cn("w-[18px] h-[18px]", isActive ? "text-blue-600" : "text-gray-400")} />}
        {item.name}
        {!mobile && isActive && (
          <motion.div layoutId="nav-indicator" className="absolute bottom-0 left-3 right-3 h-[2px] bg-blue-600 rounded-full" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Top navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200/80">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between">
            {/* Left: logo + nav */}
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center">
                <LogoFull className="hidden md:block h-6 w-auto text-slate-900 dark:text-white" />
                <LogoIcon className="md:hidden h-6 w-auto text-slate-900 dark:text-white" />
              </Link>
              <nav className="hidden lg:flex items-center gap-0.5 relative">
                {navItems.map((item) => <NavLink key={item.page} item={item} />)}
                <div className="w-px h-5 bg-gray-200 mx-2" />
                {secondaryNav.map((item) => <NavLink key={item.page} item={item} />)}
              </nav>
            </div>
            {/* Right: user + mobile toggle */}
            <div className="flex items-center gap-2">
              {user && (
                <div className="hidden lg:block relative" ref={userMenuRef}>
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center">
                      <span className="text-xs font-semibold text-blue-600">{user.full_name?.[0] || user.email?.[0] || "U"}</span>
                    </div>
                    <span className="text-[13px] font-medium text-gray-700 max-w-[100px] truncate">{user.full_name || "Account"}</span>
                    <ChevronDown className={cn("w-3.5 h-3.5 text-gray-400 transition-transform", userMenuOpen && "rotate-180")} />
                  </button>
                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.15 }} className="absolute right-0 top-full mt-1 w-56 rounded-xl border border-gray-200 bg-white shadow-lg z-50 py-1.5 overflow-hidden">
                        <div className="px-3 py-2.5 border-b border-gray-100">
                          <p className="text-sm font-semibold text-gray-900 truncate">{user.full_name || "User"}</p>
                          <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
                        </div>
                        <Link to={createPageUrl("Settings")} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                          <Settings className="w-3.5 h-3.5" />Settings
                        </Link>
                        <Link to={createPageUrl("Billing")} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                          <DollarSign className="w-3.5 h-3.5" />Billing
                        </Link>
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors">
                            <LogOut className="w-3.5 h-3.5" />Sign out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="lg:hidden fixed inset-0 top-14 bg-black/20 backdrop-blur-sm z-40" onClick={() => setMobileOpen(false)} />
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ type: "spring", stiffness: 500, damping: 35 }} className="lg:hidden fixed left-0 right-0 top-14 bg-white border-b border-gray-200 shadow-xl z-50 max-h-[80vh] overflow-y-auto">
              <nav className="p-3 space-y-0.5">
                <p className="px-4 pt-2 pb-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Navigation</p>
                {navItems.map((item) => <NavLink key={item.page} item={item} mobile />)}
                <div className="h-px bg-gray-100 my-2" />
                <p className="px-4 pt-2 pb-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">More</p>
                {secondaryNav.map((item) => <NavLink key={item.page} item={item} mobile />)}
                <NavLink item={{ name: "Billing", icon: DollarSign, page: "Billing" }} mobile />
              </nav>
              {user && (
                <div className="p-3 border-t border-gray-100">
                  <div className="flex items-center gap-3 px-4 py-2 mb-2">
                    <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600">{user.full_name?.[0] || "U"}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.full_name || "User"}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                  </div>
                  <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <LogOut className="w-4 h-4" />Sign out
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="min-h-screen pt-14">
        <div className="px-4 sm:px-6 py-6 lg:py-8 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
