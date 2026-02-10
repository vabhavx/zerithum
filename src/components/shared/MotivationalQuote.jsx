import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, TrendingUp, Target, Zap } from "lucide-react";

const CREATOR_QUOTES = [
  { text: "Every dollar tracked is a dollar optimized.", icon: TrendingUp, color: "text-emerald-400" },
  { text: "Your creativity deserves financial clarity.", icon: Sparkles, color: "text-zteal-400" },
  { text: "Smart creators track. Great creators optimize.", icon: Target, color: "text-purple-400" },
  { text: "Revenue visibility fuels sustainable growth.", icon: Zap, color: "text-amber-400" },
  { text: "Master your finances, multiply your impact.", icon: TrendingUp, color: "text-cyan-400" },
  { text: "Data-driven decisions build creator empires.", icon: Target, color: "text-pink-400" },
  { text: "Financial freedom starts with clear insights.", icon: Sparkles, color: "text-blue-400" },
  { text: "Track today, scale tomorrow.", icon: Zap, color: "text-green-400" }
];

export default function MotivationalQuote({ className = "" }) {
  const [currentQuote, setCurrentQuote] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % CREATOR_QUOTES.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const quote = CREATOR_QUOTES[currentQuote];
  const Icon = quote.icon;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuote}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 p-4 rounded-sm bg-gradient-to-r from-zteal-400/10 via-purple-500/10 to-pink-500/10 border border-white/10"
        >
          <div className={`w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center ${quote.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <p className="text-sm text-white/80 italic font-medium flex-1">"{quote.text}"</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}