import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock, CalendarDays } from "lucide-react";
import { formatDistanceToNow, isFuture } from "date-fns";
import { cn } from "@/lib/utils";

export default function NextPayoutCard({
  platformName,
  payoutDate,
  estimatedAmount,
  confidence = 85
}) {
  const hasPayout = platformName && payoutDate && isFuture(payoutDate);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Next Payout</CardTitle>
        <CalendarClock className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        {hasPayout ? (
          <>
            <div className="flex items-baseline space-x-2">
               <div className="text-2xl font-bold text-foreground">
                {platformName}
              </div>
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(payoutDate, { addSuffix: true })}
              </span>
            </div>

            <div className="mt-1 text-xs font-mono-numbers text-muted-foreground">
               Est. ${estimatedAmount.toLocaleString()}
            </div>

            <div className="mt-4 flex items-center space-x-2">
              <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${confidence}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {confidence}% conf.
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-24 text-center">
            <CalendarDays className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No upcoming payouts</p>
            <p className="text-xs text-muted-foreground/60">Connect more platforms</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
