import React, { useState, useCallback } from "react";
import { base44 } from "@/api/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  CircleDollarSign,
  ShoppingBag,
  Music,
  Plus,
  Check,
  ExternalLink,
  Loader2,
  Key,
  History,
  RefreshCw,
  Tv,
  FileText,
  Store,
  ShieldCheck,
  AlertTriangle,
  Youtube
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const PLATFORMS = [
  { id: "youtube", name: "YouTube", icon: Youtube },
  { id: "patreon", name: "Patreon", icon: Users },
  { id: "gumroad", name: "Gumroad", icon: ShoppingBag },
  { id: "stripe", name: "Stripe", icon: CircleDollarSign },
  { id: "tiktok", name: "TikTok", icon: Music },
  { id: "shopify", name: "Shopify", icon: Store },
  { id: "twitch", name: "Twitch", icon: Tv },
  { id: "substack", name: "Substack", icon: FileText }
];

export default function ConnectedPlatforms() {
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [apiKey, setApiKey] = useState("");
  const queryClient = useQueryClient();

  const { data: connectedPlatforms = [], isLoading } = useQuery({
    queryKey: ["connectedPlatforms"],
    queryFn: async () => {
      return await base44.entities.ConnectedPlatform.list();
    },
  });

  const connectMutation = useMutation({
    mutationFn: async (platformId) => {
        // In a real implementation, this would trigger an OAuth flow or save API keys
        // For now, we simulate a creation entry to the DB if possible, or just toast
        // return await base44.entities.ConnectedPlatform.create({ platform: platformId, status: 'active' });
        throw new Error("OAuth flow not implemented in overhaul");
    },
    onSuccess: () => {
        queryClient.invalidateQueries(["connectedPlatforms"]);
        toast({ title: "Connection Initiated", description: "Redirecting to provider..." });
        setShowConnectDialog(false);
    },
    onError: () => {
        toast({ title: "Connection Failed", description: "Backend integration pending." });
    }
  });

  const handleConnect = () => {
      if (selectedPlatform) {
          connectMutation.mutate(selectedPlatform.id);
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-serif text-foreground mb-1">Integration Hub</h1>
          <p className="text-sm text-muted-foreground font-mono">
             DATA INGESTION SOURCES · {connectedPlatforms.length} ACTIVE
          </p>
        </div>
        <Button
          onClick={() => setShowConnectDialog(true)}
          className="h-9 px-4 bg-foreground text-background hover:bg-foreground/90 font-mono text-xs uppercase tracking-wider rounded-none"
        >
          <Plus className="w-3 h-3 mr-2" />
          Add Source
        </Button>
      </div>

      {/* Connection Grid */}
      <div className="grid md:grid-cols-3 gap-6">
          {/* Active Connections List */}
          <div className="md:col-span-2 border border-border bg-background">
               <div className="p-4 border-b border-border bg-muted/20">
                  <h3 className="font-serif text-lg">Configured Sources</h3>
              </div>
              <Table>
                  <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
                          <TableHead>Platform</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Last Sync</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {connectedPlatforms.map(conn => {
                          const platform = PLATFORMS.find(p => p.id === conn.platform);
                          return (
                              <TableRow key={conn.id} className="border-b border-border">
                                  <TableCell className="font-medium">
                                      <div className="flex items-center gap-2">
                                          {platform && <platform.icon className="w-4 h-4" />}
                                          {platform?.name || conn.platform}
                                      </div>
                                  </TableCell>
                                  <TableCell>
                                      <Badge variant={conn.sync_status === 'active' ? 'success' : 'destructive'} className="rounded-none text-[10px]">
                                          {conn.sync_status.toUpperCase()}
                                      </Badge>
                                  </TableCell>
                                  <TableCell className="font-mono text-xs text-muted-foreground">
                                      {format(new Date(conn.last_synced_at), "yyyy-MM-dd HH:mm")}
                                  </TableCell>
                                  <TableCell className="text-right">
                                      <Button variant="ghost" size="sm" className="h-6 text-xs uppercase font-mono">Config</Button>
                                  </TableCell>
                              </TableRow>
                          );
                      })}
                  </TableBody>
              </Table>
          </div>

          {/* Integration Catalog Mini */}
          <div className="border border-border bg-background p-6">
              <h3 className="font-serif text-lg mb-4">Available Integrations</h3>
              <div className="grid grid-cols-2 gap-2">
                  {PLATFORMS.filter(p => !connectedPlatforms.find(c => c.platform === p.id)).map(platform => (
                      <button
                        key={platform.id}
                        onClick={() => { setSelectedPlatform(platform); setShowConnectDialog(true); }}
                        className="flex flex-col items-center justify-center p-4 border border-border hover:bg-muted/50 transition-colors gap-2"
                      >
                          <platform.icon className="w-5 h-5 text-muted-foreground" />
                          <span className="text-xs font-mono uppercase">{platform.name}</span>
                      </button>
                  ))}
              </div>
          </div>
      </div>

      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent className="rounded-none border border-border bg-card max-w-lg">
            <DialogHeader>
                <DialogTitle className="font-serif">
                    {selectedPlatform ? `Configure ${selectedPlatform.name}` : "Select Integration"}
                </DialogTitle>
                <DialogDescription>
                    Establish a secure OAUTH or API connection.
                </DialogDescription>
            </DialogHeader>

            {!selectedPlatform ? (
                <div className="grid grid-cols-3 gap-2 mt-4">
                     {PLATFORMS.map(platform => (
                        <button
                            key={platform.id}
                            onClick={() => setSelectedPlatform(platform)}
                            className="flex flex-col items-center justify-center p-4 border border-border hover:bg-muted/50 transition-colors gap-2"
                        >
                            <platform.icon className="w-5 h-5" />
                            <span className="text-xs">{platform.name}</span>
                        </button>
                     ))}
                </div>
            ) : (
                <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label>API Credentials</Label>
                        <Input placeholder="Enter API Key / Client Secret" className="rounded-none bg-background border-border" />
                    </div>
                    <div className="flex justify-end gap-2">
                         <Button variant="outline" className="rounded-none" onClick={() => setSelectedPlatform(null)}>Back</Button>
                         <Button className="rounded-none" onClick={handleConnect}>Authenticate</Button>
                    </div>
                </div>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
