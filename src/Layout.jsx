import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import { 
  LayoutDashboard, 
  Link2, 
  FileText, 
  Settings, 
  HelpCircle, 
  LogOut,
  Menu,
  X,
  CreditCard,
  Shield,
  Bell
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: createPageUrl('Dashboard'), icon: LayoutDashboard },
    { name: 'Connected Platforms', href: createPageUrl('Platforms'), icon: Link2 },
    { name: 'Transactions', href: createPageUrl('Transactions'), icon: FileText },
  ];

  const settingsNav = [
    { name: 'Subscription', href: createPageUrl('Subscription'), icon: CreditCard },
    { name: 'Connected Apps', href: createPageUrl('ConnectedApps'), icon: Link2 },
    { name: 'Notifications', href: createPageUrl('Notifications'), icon: Bell },
    { name: 'Privacy & Data', href: createPageUrl('Privacy'), icon: Shield },
  ];

  const isActive = (href) => {
    return location.pathname === new URL(href, window.location.origin).pathname;
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-[#FCF8F9]">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#5E524012] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#208D9E] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">Z</span>
          </div>
          <span className="font-bold text-lg text-[#5E5240]">Zerithum</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-[#5E524012] z-40
        transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-[#208D9E] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">Z</span>
            </div>
            <span className="font-bold text-xl text-[#5E5240]">Zerithum</span>
          </div>

          <nav className="space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                  transition-all duration-150
                  ${isActive(item.href)
                    ? 'bg-[#208D9E]/10 text-[#208D9E] border-l-4 border-[#208D9E] pl-2'
                    : 'text-[#5E5240] hover:bg-[#5E5240]/5'
                  }
                `}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            ))}

            <div className="pt-6 mt-6 border-t border-[#5E524012]">
              <div className="text-xs font-semibold text-[#5E5240]/60 mb-2 px-3">
                SETTINGS
              </div>
              {settingsNav.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                    transition-all duration-150
                    ${isActive(item.href)
                      ? 'bg-[#208D9E]/10 text-[#208D9E] border-l-4 border-[#208D9E] pl-2'
                      : 'text-[#5E5240] hover:bg-[#5E5240]/5'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              ))}
            </div>

            <div className="pt-6 mt-6 border-t border-[#5E524012] space-y-1">
              <Link
                to={createPageUrl('Help')}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[#5E5240] hover:bg-[#5E5240]/5"
              >
                <HelpCircle className="w-5 h-5" />
                Help & Support
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[#C0152F] hover:bg-[#C0152F]/5"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </nav>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:pl-64 pt-16 lg:pt-0">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}