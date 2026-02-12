import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PlatformBreakdownTable({ platforms = [], revenueData = {} }) {
  const hasPlatforms = platforms.length > 0;

  return (
    <Card className="col-span-1 lg:col-span-2 h-full">
      <CardHeader>
        <CardTitle>Platform Performance</CardTitle>
        <CardDescription>
          Revenue breakdown by source
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasPlatforms ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Platform</TableHead>
                <TableHead className="text-right">This Month</TableHead>
                <TableHead className="text-right">Last Month</TableHead>
                <TableHead className="text-right">Change</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {platforms.map((platform) => {
                const current = revenueData[platform.id]?.current || 0;
                const previous = revenueData[platform.id]?.previous || 0;
                const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;
                const isPositive = change >= 0;

                return (
                  <TableRow key={platform.id}>
                    <TableCell className="font-medium capitalize">
                      {platform.platform}
                    </TableCell>
                    <TableCell className="text-right font-mono-numbers">
                      ${current.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-mono-numbers text-muted-foreground">
                      ${previous.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className={cn("text-right font-mono-numbers", isPositive ? "text-emerald-600" : "text-destructive")}>
                      {isPositive ? "+" : ""}{change.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-center">
                       <div className="flex items-center justify-center gap-2">
                         {platform.sync_status === 'error' ? (
                           <Badge variant="destructive" className="h-6 gap-1">
                             <AlertCircle className="w-3 h-3" /> Stale
                           </Badge>
                         ) : (
                           <span className="text-xs text-muted-foreground flex items-center gap-1">
                             <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                             {platform.last_synced_at ? formatDistanceToNow(new Date(platform.last_synced_at), { addSuffix: true }) : 'Synced just now'}
                           </span>
                         )}
                       </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <RefreshCw className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-muted-foreground font-medium">No platforms connected</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Connect your first revenue source to see breakdown</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
