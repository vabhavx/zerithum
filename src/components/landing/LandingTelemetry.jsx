import React, { useState, useEffect } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { motion } from 'motion/react';

// Fictional "live" data
const initialData = [
  { time: '09:00', revenue: 2400, cashflow: 2400 },
  { time: '10:00', revenue: 1398, cashflow: 2210 },
  { time: '11:00', revenue: 9800, cashflow: 2290 },
  { time: '12:00', revenue: 3908, cashflow: 2000 },
  { time: '13:00', revenue: 4800, cashflow: 2181 },
  { time: '14:00', revenue: 3800, cashflow: 2500 },
  { time: '15:00', revenue: 4300, cashflow: 2100 },
  { time: '16:00', revenue: 5300, cashflow: 2600 },
  { time: '17:00', revenue: 6200, cashflow: 2900 },
  { time: '18:00', revenue: 7500, cashflow: 3200 },
  { time: '19:00', revenue: 8100, cashflow: 3500 },
  { time: '20:00', revenue: 8600, cashflow: 3800 },
];

export default function LandingTelemetry() {
    const [data, setData] = useState(initialData);

    // Simulate subtle live data updates
    useEffect(() => {
        const interval = setInterval(() => {
            setData(prev => {
                const last = prev[prev.length - 1];
                const newTime = parseInt(last.time.split(':')[0]) + 1;
                const formattedTime = `${newTime > 23 ? newTime - 24 : newTime}:00`.padStart(5, '0');

                // Random fluctuation
                const newRevenue = Math.max(2000, last.revenue + (Math.random() - 0.4) * 1000);
                const newCashflow = Math.max(2000, last.cashflow + (Math.random() - 0.4) * 800);

                const newData = [...prev.slice(1), {
                    time: formattedTime,
                    revenue: Math.round(newRevenue),
                    cashflow: Math.round(newCashflow)
                }];
                return newData;
            });
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-neutral-900 border border-white/10 p-2 rounded shadow-xl backdrop-blur-md">
                    <p className="text-[10px] text-neutral-400 font-mono mb-1">{label}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs font-mono">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                            <span className="text-neutral-300">{entry.name}:</span>
                            <span className="text-white font-bold">${entry.value.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full max-w-5xl px-4 flex flex-col items-center">
            <motion.div
                className="w-full bg-neutral-950/80 border border-white/10 rounded-lg backdrop-blur-md overflow-hidden shadow-2xl p-6 relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
            >
                {/* Header UI */}
                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-mono text-emerald-500 tracking-widest uppercase">Live Telemetry</span>
                    </div>
                    <div className="flex gap-4 text-[10px] font-mono text-neutral-500">
                        <span>CPU: 12%</span>
                        <span>MEM: 4.2GB</span>
                        <span>NET: 1.2GB/s</span>
                    </div>
                </div>

                {/* Main Metric */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                     <div className="p-3 bg-white/5 rounded border border-white/5">
                        <div className="text-[10px] text-neutral-500 font-mono uppercase mb-1">Total Revenue</div>
                        <div className="text-2xl font-bold text-white tracking-tight">$124,500.20</div>
                        <div className="text-[10px] text-emerald-500 font-mono mt-1 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            +12.4% (24h)
                        </div>
                     </div>
                     <div className="p-3 bg-white/5 rounded border border-white/5">
                        <div className="text-[10px] text-neutral-500 font-mono uppercase mb-1">Projected Cashflow</div>
                        <div className="text-2xl font-bold text-white tracking-tight">$98,240.00</div>
                         <div className="text-[10px] text-neutral-500 font-mono mt-1">
                            Target: $100k
                        </div>
                     </div>
                     <div className="p-3 bg-transparent rounded border border-white/5 hidden md:block opacity-50">
                        <div className="text-[10px] text-neutral-500 font-mono uppercase mb-1">Active Sources</div>
                        <div className="text-lg font-medium text-neutral-300">12 Connected</div>
                     </div>
                     <div className="p-3 bg-transparent rounded border border-white/5 hidden md:block opacity-50">
                        <div className="text-[10px] text-neutral-500 font-mono uppercase mb-1">Tax Liability</div>
                        <div className="text-lg font-medium text-neutral-300">Est. $22k</div>
                     </div>
                </div>

                {/* Chart Area */}
                <div className="h-[300px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={data}
                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorCashflow" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="time"
                                stroke="#525252"
                                tick={{ fill: '#525252', fontSize: 10, fontFamily: 'monospace' }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#525252"
                                tick={{ fill: '#525252', fontSize: 10, fontFamily: 'monospace' }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `$${value/1000}k`}
                            />
                            <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#10b981"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                                animationDuration={1000}
                                isAnimationActive={true}
                            />
                            <Area
                                type="monotone"
                                dataKey="cashflow"
                                stroke="#6366f1"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorCashflow)"
                                animationDuration={1000}
                                isAnimationActive={true}
                            />
                        </AreaChart>
                    </ResponsiveContainer>

                    {/* Grid Overlay for extra "tech" feel */}
                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                </div>

            </motion.div>

            <div className="mt-8 text-center">
                <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Real-Time Operations</h2>
                <p className="text-neutral-400 max-w-md mx-auto text-lg font-light">
                    Monitor cashflow, tax liability, and platform performance from a single command center.
                </p>
            </div>
        </div>
    );
}
