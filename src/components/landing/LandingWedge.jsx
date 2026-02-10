import React from 'react';
import { MOCK_RECONCILIATION_DATA } from '@/data/mock_landing';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ArrowRight, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

export default function LandingWedge() {
  return (
    <div className="w-full max-w-4xl mx-auto border border-border bg-card shadow-2xl relative overflow-hidden">
      {/* Decorative Header - simulating a window/app */}
      <div className="h-8 bg-muted/30 border-b border-border flex items-center px-4 justify-between">
         <div className="flex gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-border"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-border"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-border"></div>
         </div>
         <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            Reconciliation Engine v2.4
         </div>
      </div>

      <div className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[120px]">ID</TableHead>
              <TableHead>Platform Report</TableHead>
              <TableHead>Bank Deposit</TableHead>
              <TableHead className="text-right">Variance</TableHead>
              <TableHead className="w-[140px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_RECONCILIATION_DATA.map((rec) => {
              const variance = rec.platform_amount - rec.bank_amount;
              const variancePercent = (variance / rec.platform_amount) * 100;

              return (
                <TableRow key={rec.id} className="group hover:bg-muted/10 transition-colors duration-200">
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {rec.id}
                    <div className="text-[10px] opacity-50 mt-1">{rec.date}</div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{rec.platform}</span>
                      <span className="text-xs text-muted-foreground font-mono">USD {rec.platform_amount.toFixed(2)}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col">
                         {rec.bank_amount > 0 ? (
                             <>
                                <span className="font-medium text-foreground">Chase Wire</span>
                                <span className="text-xs text-muted-foreground font-mono">USD {rec.bank_amount.toFixed(2)}</span>
                             </>
                         ) : (
                             <span className="text-xs text-destructive font-mono uppercase">Missing Deposit</span>
                         )}
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className={cn("font-mono font-bold text-xs", variance > 0 ? "text-destructive" : "text-muted-foreground")}>
                        {variance > 0 ? `-$${variance.toFixed(2)}` : "0.00"}
                    </div>
                    {variance > 0 && (
                        <div className="text-[10px] text-destructive/70 mt-0.5">
                            {variancePercent.toFixed(1)}% Fee
                        </div>
                    )}
                  </TableCell>

                  <TableCell>
                    <Badge
                        variant={rec.status === 'matched' ? 'success' : rec.status === 'discrepancy' ? 'warning' : 'destructive'}
                        className="rounded-none px-2 py-1"
                    >
                        {rec.status === 'matched' && <CheckCircle2 className="w-3 h-3 mr-1.5" />}
                        {rec.status === 'discrepancy' && <AlertTriangle className="w-3 h-3 mr-1.5" />}
                        {rec.status === 'missing_bank' && <Clock className="w-3 h-3 mr-1.5" />}
                        {rec.status === 'missing_bank' ? 'Pending' : rec.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Audit Log Overlay - Conceptual */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-background border-l border-border transform translate-x-full group-hover:translate-x-0 transition-transform duration-300 hidden md:block">
          {/* This would be populated on hover in a real app, keeping static for landing visual */}
      </div>
    </div>
  );
}
