import React from 'react';
import { Activity, CheckCircle2, Wifi, Music2, CreditCard, ShoppingBag, Youtube } from 'lucide-react';

export function DashboardPreview() {
  return (
    <div className="w-full h-full bg-[#0A0A0B] flex flex-col font-mono text-sm relative overflow-hidden">
      {/* Background Grid */}
      <div
        className="absolute inset-0 z-0 opacity-10 pointer-events-none"
        style={{
            backgroundImage: `linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
        }}
      />

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0A0A0B]/80 backdrop-blur-sm">
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-emerald-500">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold tracking-widest">SYSTEM ONLINE</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <span className="text-neutral-500 text-xs">ZERITHUM // OPS</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-neutral-400">
            <span className="flex items-center gap-2">
                <Wifi className="w-3 h-3" />
                LIVE CONNECTION
            </span>
            <div className="px-3 py-1 bg-white/5 border border-white/10 rounded text-neutral-300">
                [ ACCESS TERMINAL ]
            </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex">
          {/* Sidebar */}
          <div className="w-64 border-r border-white/10 p-4 hidden md:flex flex-col gap-6 bg-[#0A0A0B]/50">
             <div className="space-y-2">
                <div className="text-xs text-neutral-500 font-bold mb-4 tracking-wider">INPUT SOURCES</div>
                <SidebarItem icon={<Youtube className="w-4 h-4" />} label="YouTube" active />
                <SidebarItem icon={<CreditCard className="w-4 h-4" />} label="Stripe" />
                <SidebarItem icon={<Activity className="w-4 h-4" />} label="Patreon" />
                <SidebarItem icon={<ShoppingBag className="w-4 h-4" />} label="Gumroad" />
                <SidebarItem icon={<Music2 className="w-4 h-4" />} label="TikTok" />
             </div>
             <div className="mt-auto">
                <div className="p-3 border border-emerald-500/20 bg-emerald-500/5 rounded text-emerald-400 text-xs flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    <span>Normalization: Active</span>
                </div>
             </div>
          </div>

          {/* Dashboard View */}
          <div className="flex-1 p-6 md:p-10 overflow-hidden flex flex-col gap-8">
              {/* Header */}
              <div className="flex items-end justify-between">
                  <div>
                      <h2 className="text-neutral-500 text-xs mb-1">TOTAL BALANCE (UNIFIED)</h2>
                      <div className="text-4xl md:text-5xl font-bold text-white tracking-tight">$45,200.00</div>
                  </div>
                  <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded border border-emerald-500/20">
                      +12% VS LAST MONTH
                  </div>
              </div>

              {/* Transaction List */}
              <div className="flex-1 border border-white/10 rounded-lg bg-white/5 overflow-hidden flex flex-col">
                  <div className="px-6 py-3 border-b border-white/10 flex justify-between text-xs text-neutral-500 bg-black/20">
                      <span>RECENT TRANSACTIONS</span>
                      <span>FILTER: ALL SOURCES</span>
                  </div>

                  <div className="divide-y divide-white/5">
                      <TransactionRow
                        icon={<Music2 className="w-4 h-4 text-blue-400" />}
                        title="Live Gift Revenue"
                        source="TikTok"
                        date="Oct 14"
                        amount="$350.00"
                        status="reconciled"
                      />
                      <TransactionRow
                         icon={<Youtube className="w-4 h-4 text-red-400" />}
                         title="AdSense Payout"
                         source="YouTube"
                         date="Oct 12"
                         amount="$1,800.00"
                         status="reconciled"
                         highlight
                      />
                      <TransactionRow
                         icon={<CreditCard className="w-4 h-4 text-purple-400" />}
                         title="Subscription Revenue"
                         source="Stripe"
                         date="Oct 10"
                         amount="$4,500.00"
                         status="processing"
                      />
                      <TransactionRow
                         icon={<ShoppingBag className="w-4 h-4 text-orange-400" />}
                         title="Digital Product Sale"
                         source="Gumroad"
                         date="Oct 09"
                         amount="$45.00"
                         status="reconciled"
                      />
                  </div>
              </div>

              {/* Status Footer */}
              <div className="flex items-center justify-between text-xs text-neutral-600 border-t border-white/5 pt-4">
                  <div>SYNCING: TIKTOK, YOUTUBE</div>
                  <div className="flex items-center gap-2 text-emerald-500">
                      <CheckCircle2 className="w-4 h-4" />
                      RECONCILED
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, active = false }) {
    return (
        <div className={`flex items-center gap-3 px-3 py-2 rounded cursor-pointer transition-colors ${active ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}>
            {icon}
            <span>{label}</span>
        </div>
    )
}

function TransactionRow({ icon, title, source, date, amount, status, highlight = false }) {
    return (
        <div className={`px-6 py-4 flex items-center justify-between transition-colors ${highlight ? 'bg-white/[0.02]' : 'hover:bg-white/[0.01]'}`}>
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${highlight ? 'bg-white/10' : 'bg-black/40'}`}>
                    {icon}
                </div>
                <div>
                    <div className="text-white font-medium">{title}</div>
                    <div className="text-neutral-500 text-xs">{date} • {source}</div>
                </div>
            </div>

            <div className="text-right">
                <div className="text-white font-bold">{amount}</div>
                <div className="flex items-center justify-end gap-1 mt-1">
                    {status === 'reconciled' && (
                        <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span className="text-[10px] text-emerald-500 uppercase tracking-wider">Matched</span>
                        </>
                    )}
                    {status === 'processing' && (
                        <>
                            <Activity className="w-3 h-3 text-yellow-500" />
                            <span className="text-[10px] text-yellow-500 uppercase tracking-wider">Syncing</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
