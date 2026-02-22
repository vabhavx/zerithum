import React from "react";
import { motion } from "framer-motion";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "active", label: "Healthy" },
  { value: "syncing", label: "Syncing" },
  { value: "error", label: "Errors" },
  { value: "stale", label: "Stale" },
];

export default function StatusFilter({ currentFilter, onFilterChange }) {
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {STATUS_FILTERS.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onFilterChange(item.value)}
          className={`relative overflow-hidden rounded-md px-4 py-1.5 text-xs font-medium uppercase tracking-wide transition-all ${
            currentFilter === item.value
              ? "text-[#0A0A0A]"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          {currentFilter === item.value && (
            <motion.div
              layoutId="status-filter-highlight"
              className="absolute inset-0 bg-[#56C5D0]"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
