import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GlassCard } from "@/components/ui/glass-card";
import { PLATFORMS } from "@/lib/platforms";
import { statusTone, statusLabel } from "@/lib/platform-utils";

export default function SyncHistoryTable({
  syncHistory,
  showHistory,
  onToggleHistory,
}) {
  return (
    <GlassCard>
      <div className="flex flex-col gap-2 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#F5F5F5]">
            Recent sync evidence
          </h2>
          <p className="mt-1 text-sm text-white/70">
            Expand when you need run-level details.
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleHistory}
          className="h-8 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white/75 hover:bg-white/10 transition-colors"
        >
          {showHistory ? "Hide history" : "Show history"}
        </button>
      </div>

      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-[#D8D8D8]">Date</TableHead>
                  <TableHead className="text-[#D8D8D8]">Platform</TableHead>
                  <TableHead className="text-right text-[#D8D8D8]">
                    Transactions
                  </TableHead>
                  <TableHead className="text-right text-[#D8D8D8]">
                    Duration
                  </TableHead>
                  <TableHead className="text-right text-[#D8D8D8]">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {syncHistory.length === 0 && (
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-sm text-white/60"
                    >
                      No sync history recorded yet.
                    </TableCell>
                  </TableRow>
                )}

                {syncHistory.slice(0, 15).map((sync) => (
                  <TableRow
                    key={sync.id}
                    className="border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    <TableCell className="text-sm text-white/75">
                      {sync.sync_started_at
                        ? format(new Date(sync.sync_started_at), "MMM d, yyyy h:mm a")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-[#F5F5F5]">
                      {PLATFORMS.find((item) => item.id === sync.platform)?.name ||
                        sync.platform ||
                        "Unknown"}
                    </TableCell>
                    <TableCell className="text-right font-mono-financial text-white/80">
                      {sync.transactions_synced || 0}
                    </TableCell>
                    <TableCell className="text-right font-mono-financial text-white/80">
                      {typeof sync.duration_ms === "number"
                        ? `${(sync.duration_ms / 1000).toFixed(1)}s`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`rounded-md border px-2 py-1 text-xs ${statusTone(
                          sync.status
                        )}`}
                      >
                        {statusLabel(sync.status)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
