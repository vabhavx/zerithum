import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, AlertOctagon, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function ActionItemsPanel({ actionItems = [] }) {
  const hasItems = actionItems.length > 0;

  return (
    <Card className="col-span-1 lg:col-span-1 h-full">
      <CardHeader>
        <CardTitle>Action Items</CardTitle>
        <CardDescription>
          Tasks requiring your attention
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasItems ? (
          <div className="space-y-4">
            {actionItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 p-1 rounded-full ${
                    item.type === 'critical' ? 'bg-destructive/10 text-destructive' :
                    item.type === 'warning' ? 'bg-warning/10 text-warning' :
                    'bg-primary/10 text-primary'
                  }`}>
                    <AlertOctagon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium leading-none mb-1">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                {item.link && (
                  <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                    <Link to={item.link}>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[200px] text-center p-4">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
            <h3 className="font-medium text-foreground">All caught up!</h3>
            <p className="text-sm text-muted-foreground mt-1">
              No pending actions. Great job.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
