import React, { useState, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  AlertTriangle, 
  TrendingDown, 
  Target,
  CheckCircle2,
  Loader2,
  FileText,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";
import AutopsyEventCard from "@/components/autopsy/AutopsyEventCard";
import ResolvedEventRow from "@/components/autopsy/ResolvedEventRow";

export default function RevenueAutopsy() {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDecisionDialog, setShowDecisionDialog] = useState(false);
  const [decisionNotes, setDecisionNotes] = useState("");
  const [scanning, setScanning] = useState(false);

  const queryClient = useQueryClient();

  const { data: autopsyEvents = [], isLoading } = useQuery({
    queryKey: ["autopsyEvents"],
    queryFn: async () => {
      /** @type {any} */
      const user = await base44.auth.me();
      return base44.entities.AutopsyEvent.filter({ user_id: user.id }, "-detected_at", 100);
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AutopsyEvent.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["autopsyEvents"] });
      setShowDecisionDialog(false);
      setSelectedEvent(null);
      setDecisionNotes("");
      toast.success("Decision recorded");
    },
  });

  const handleScanForAnomalies = async () => {
    setScanning(true);
    try {
      await base44.functions.invoke('detectRevenueAnomalies');
      queryClient.invalidateQueries({ queryKey: ["autopsyEvents"] });
      toast.success("Anomaly scan complete");
    } catch (error) {
      toast.error("Scan failed");
    } finally {
      setScanning(false);
    }
  };

  const handleDecision = useCallback((event, decision) => {
    setSelectedEvent({ ...event, decision });
    setShowDecisionDialog(true);
  }, []);

  const submitDecision = () => {
    if (!selectedEvent) return;

    updateEventMutation.mutate({
      id: selectedEvent.id,
      data: {
        status: selectedEvent.decision,
        decision_made_at: new Date().toISOString(),
        decision_notes: decisionNotes
      }
    });
  };

  const pendingEvents = useMemo(() => autopsyEvents.filter(e => e.status === 'pending_review'), [autopsyEvents]);
  const resolvedEvents = useMemo(() => autopsyEvents.filter(e => e.status !== 'pending_review'), [autopsyEvents]);

  const avgExposure = useMemo(() => {
    return autopsyEvents.length > 0
      ? (autopsyEvents.reduce((sum, e) => sum + (e.exposure_score?.recurrence_probability || 0), 0) / autopsyEvents.length * 100).toFixed(0)
      : 0;
  }, [autopsyEvents]);

  const totalImpact = useMemo(() => {
    return Math.abs(autopsyEvents.reduce((sum, e) => sum + (e.impact_amount || 0), 0)).toFixed(0);
  }, [autopsyEvents]);

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Revenue Autopsy Engine</h1>
          <p className="text-white/40 mt-1 text-sm">Forensic analysis of every revenue anomaly</p>
        </div>
        <Button
          onClick={handleScanForAnomalies}
          disabled={scanning}
          className="bg-gradient-to-r from-red-500 to-orange-600"
        >
          {scanning ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Activity className="w-4 h-4 mr-2" />
          )}
          Scan for Anomalies
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-modern rounded-xl p-4"
        >
          <AlertTriangle className="w-5 h-5 text-red-400 mb-2" />
          <p className="text-xs text-white/50">Pending Review</p>
          <p className="text-2xl font-bold text-white">{pendingEvents.length}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-modern rounded-xl p-4"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-2" />
          <p className="text-xs text-white/50">Resolved</p>
          <p className="text-2xl font-bold text-white">{resolvedEvents.length}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-modern rounded-xl p-4"
        >
          <Target className="w-5 h-5 text-amber-400 mb-2" />
          <p className="text-xs text-white/50">Avg Exposure</p>
          <p className="text-2xl font-bold text-white">
            {avgExposure}%
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-modern rounded-xl p-4"
        >
          <TrendingDown className="w-5 h-5 text-zteal-400 mb-2" />
          <p className="text-xs text-white/50">Total Impact</p>
          <p className="text-2xl font-bold text-white">
            ${totalImpact}
          </p>
        </motion.div>
      </div>

      {/* Pending Events */}
      {pendingEvents.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4">⚠️ Requires Your Decision</h2>
          <div className="space-y-4">
            {pendingEvents.map((event) => (
              <AutopsyEventCard
                key={event.id}
                event={event}
                onDecision={handleDecision}
              />
            ))}
          </div>
        </div>
      )}

      {/* Resolved Events */}
      {resolvedEvents.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-white mb-4">📋 Decision History</h2>
          <div className="space-y-2">
            {resolvedEvents.map((event) => (
              <ResolvedEventRow key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {/* Decision Dialog */}
      <Dialog open={showDecisionDialog} onOpenChange={setShowDecisionDialog}>
        <DialogContent className="card-modern rounded-2xl border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">Record Your Decision</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-white/70">
              Document why you're making this choice. This creates accountability and learning.
            </p>
            <Textarea
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              placeholder="What actions will you take? Why is this the right decision?"
              className="bg-white/5 border-white/10 text-white min-h-[120px]"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDecisionDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={submitDecision}
                disabled={!decisionNotes.trim()}
                className="flex-1 bg-zteal-400"
              >
                <FileText className="w-4 h-4 mr-2" />
                Log Decision
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}