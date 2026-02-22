export function statusTone(status) {
  if (status === "active") return "border-[#56C5D0]/40 bg-[#56C5D0]/10 text-[#56C5D0]";
  if (status === "syncing") return "border-white/30 bg-white/10 text-white animate-pulse";
  if (status === "error") return "border-[#F06C6C]/40 bg-[#F06C6C]/10 text-[#F06C6C]";
  return "border-[#F0A562]/40 bg-[#F0A562]/10 text-[#F0A562]";
}

export function statusLabel(status) {
  if (status === "active") return "Synced";
  if (status === "syncing") return "Syncing";
  if (status === "error") return "Needs attention";
  if (status === "stale") return "Stale";
  return status || "Unknown";
}
