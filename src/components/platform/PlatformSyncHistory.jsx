import React from "react";
import { useQuery } from "@tanstack/react-query";
import { auth, entities } from "@/api/supabaseClient";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Clock, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function PlatformSyncHistory({ platform, open, onOpenChange }) {
  const { data: syncHistory = [] } = useQuery({
    queryKey: ["platformSyncHistory", platform?.id],
    queryFn: async () => { if (!platform) return []; const user = await auth.me(); return entities.SyncHistory.filter({ user_id: user.id, platform: platform.platform }, "-sync_started_at", 100); },
    enabled: open && !!platform,
  });

  const stats = syncHistory.reduce((acc, sync) => { acc.total += sync.transactions_synced || 0; acc.successful += sync.status === 'success' ? 1 : 0; acc.failed += sync.status === 'error' ? 1 : 0; acc.totalDuration += sync.duration_ms || 0; return acc; }, { total: 0, successful: 0, failed: 0, totalDuration: 0 });
  const avgDuration = syncHistory.length > 0 ? stats.totalDuration / syncHistory.length / 1000 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border border-gray-200 bg-white max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader><DialogTitle className="text-sm font-semibold text-gray-900">{platform?.name} - Sync History</DialogTitle></DialogHeader>
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100"><p className="text-xs text-gray-400 mb-1">Total Syncs</p><p className="text-xl font-bold text-gray-900">{syncHistory.length}</p></div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100"><p className="text-xs text-gray-400 mb-1">Success Rate</p><p className="text-xl font-bold text-emerald-600">{syncHistory.length > 0 ? ((stats.successful / syncHistory.length) * 100).toFixed(0) : 0}%</p></div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100"><p className="text-xs text-gray-400 mb-1">Transactions</p><p className="text-xl font-bold text-gray-900">{stats.total}</p></div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100"><p className="text-xs text-gray-400 mb-1">Avg Duration</p><p className="text-xl font-bold text-blue-600">{avgDuration.toFixed(1)}s</p></div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {syncHistory.map((sync, idx) => (
            <motion.div key={sync.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }} className={cn("rounded-lg p-4 border", sync.status === 'success' && "bg-emerald-50 border-emerald-100", sync.status === 'error' && "bg-red-50 border-red-100", sync.status === 'partial' && "bg-amber-50 border-amber-100")}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {sync.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  {sync.status === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                  {sync.status === 'partial' && <Clock className="w-4 h-4 text-amber-500" />}
                  <span className={cn("text-sm font-semibold", sync.status === 'success' && "text-emerald-700", sync.status === 'error' && "text-red-700", sync.status === 'partial' && "text-amber-700")}>{sync.status.toUpperCase()}</span>
                </div>
                <span className="text-xs text-gray-400">{format(new Date(sync.sync_started_at), "MMM d, yyyy 'at' h:mm a")}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500"><div className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /><span>{sync.transactions_synced || 0} transactions</span></div><div className="flex items-center gap-1"><Clock className="w-3 h-3" /><span>{sync.duration_ms ? (sync.duration_ms / 1000).toFixed(1) : 'N/A'}s</span></div></div>
              {sync.error_message && (<div className="mt-2 p-2 rounded bg-red-50 border border-red-100"><p className="text-xs text-red-600">{sync.error_message}</p></div>)}
            </motion.div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}