import React, { useState, useCallback, useMemo } from "react";
import { base44 } from "@/api/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  AlertTriangle, 
  Target,
  CheckCircle2,
  Loader2,
  FileText,
  Activity,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// This would typically be imported or part of the component logic
const AutopsyRow = ({ event, onDecision }) => (
    <TableRow className="border-b border-border hover:bg-muted/50">
        <TableCell className="font-mono text-xs">{event.id.substring(0,8)}</TableCell>
        <TableCell>
            <div className="flex flex-col">
                <span className="font-semibold text-sm">{event.type || "Revenue Anomaly"}</span>
                <span className="text-xs text-muted-foreground">{event.description}</span>
            </div>
        </TableCell>
        <TableCell className="text-right font-mono text-destructive">
            ${event.impact_amount?.toFixed(2) || "0.00"}
        </TableCell>
        <TableCell>
            <Badge variant="warning" className="rounded-none">{event.exposure_score?.level || "MEDIUM"}</Badge>
        </TableCell>
        <TableCell>
            <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onDecision(event, 'investigate')}>
                    Investigate
                </Button>
                <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => onDecision(event, 'dismiss')}>
                    Dismiss
                </Button>
            </div>
        </TableCell>
    </TableRow>
);

export default function RevenueAutopsy() {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [decisionNotes, setDecisionNotes] = useState("");
  const [scanning, setScanning] = useState(false);
  const [decisionDialogOpen, setDecisionDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: autopsyEvents = [] } = useQuery({
    queryKey: ["autopsyEvents"],
    queryFn: async () => {
       return await base44.entities.AutopsyEvent.list();
    },
  });

  const handleScan = async () => {
    setScanning(true);
    // Simulation
    setTimeout(() => {
        setScanning(false);
        toast({ title: "Scan Complete", description: "No new anomalies detected in this session." });
    }, 2000);
  };

  const handleDecisionClick = (event, type) => {
      setSelectedEvent({ ...event, decisionType: type });
      setDecisionDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-serif text-foreground mb-1">Forensic Autopsy</h1>
          <p className="text-sm text-muted-foreground font-mono">
             ANOMALY DETECTION & RESOLUTION
          </p>
        </div>
        <Button
          onClick={handleScan}
          disabled={scanning}
          className="h-9 px-4 bg-destructive text-destructive-foreground hover:bg-destructive/90 font-mono text-xs uppercase tracking-wider rounded-none"
        >
          {scanning ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Activity className="w-3 h-3 mr-2" />}
          Run Diagnostic Scan
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-border border border-border">
          {[
              { label: "Active Anomalies", value: "0", icon: AlertTriangle, color: "text-destructive" },
              { label: "Resolved Cases", value: "124", icon: CheckCircle2, color: "text-emerald-500" },
              { label: "Risk Exposure", value: "Low", icon: Target, color: "text-amber-500" },
              { label: "Revenue Saved", value: "$4,250", icon: FileText, color: "text-foreground" }
          ].map((stat, i) => (
              <div key={i} className="bg-background p-6">
                  <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">{stat.label}</span>
                      <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <div className="text-2xl font-serif font-medium">{stat.value}</div>
              </div>
          ))}
      </div>

      {/* Main Content Area */}
      <div className="grid lg:grid-cols-3 gap-6">
          {/* Active Cases List */}
          <div className="lg:col-span-2 border border-border bg-background">
              <div className="p-4 border-b border-border bg-muted/20">
                  <h3 className="font-serif text-lg">Open Cases</h3>
              </div>
              <Table>
                  <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                          <TableHead className="w-[100px]">Case ID</TableHead>
                          <TableHead>Anomaly Type</TableHead>
                          <TableHead className="text-right">Impact</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {autopsyEvents.length > 0 ? (
                        autopsyEvents.map((event) => (
                           <TableRow key={event.id} className="border-b border-border hover:bg-muted/50">
                                <TableCell className="font-mono text-xs">{event.id.substring(0,8)}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-sm">{event.type || "Revenue Anomaly"}</span>
                                        <span className="text-xs text-muted-foreground">{event.description}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-mono text-destructive">
                                    ${event.impact_amount?.toFixed(2) || "0.00"}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="warning" className="rounded-none">{event.exposure_score?.level || "MEDIUM"}</Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-2 justify-end">
                                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleDecisionClick(event, 'investigate')}>
                                            Investigate
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                      ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="h-32 text-center text-muted-foreground font-mono text-xs uppercase">
                                System Healthy. No open anomalies.
                            </TableCell>
                        </TableRow>
                      )}
                  </TableBody>
              </Table>
          </div>

          {/* Recent Activity / Log */}
          <div className="border border-border bg-background">
               <div className="p-4 border-b border-border bg-muted/20">
                  <h3 className="font-serif text-lg">Audit Log</h3>
              </div>
              <div className="p-4 space-y-4">
                  {[1,2,3].map(i => (
                      <div key={i} className="flex gap-3 text-xs border-b border-border pb-3 last:border-0 last:pb-0">
                          <div className="font-mono text-muted-foreground w-20 flex-shrink-0">
                              {new Date().toLocaleTimeString()}
                          </div>
                          <div>
                              <div className="font-medium">System Scan Completed</div>
                              <div className="text-muted-foreground">Routine diagnostic passed with 0 errors.</div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>

      <Dialog open={decisionDialogOpen} onOpenChange={setDecisionDialogOpen}>
        <DialogContent className="rounded-none border border-border bg-card">
            <DialogHeader>
                <DialogTitle className="font-serif">Confirm Resolution</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
                <Textarea
                    placeholder="Enter resolution notes for the audit trail..."
                    className="rounded-none bg-background border-border min-h-[100px]"
                />
                <div className="flex justify-end gap-2">
                    <Button variant="outline" className="rounded-none" onClick={() => setDecisionDialogOpen(false)}>Cancel</Button>
                    <Button className="rounded-none">Confirm Log</Button>
                </div>
            </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
