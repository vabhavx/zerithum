import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PlatformCard from "../components/platform/PlatformCard";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ConnectedPlatforms() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [connectingPlatform, setConnectingPlatform] = useState(null);
  const [apiKey, setApiKey] = useState("");
  const [disconnectPlatform, setDisconnectPlatform] = useState(null);

  const platforms = ["youtube", "patreon", "gumroad", "stripe", "instagram", "tiktok"];

  const { data: connections = [] } = useQuery({
    queryKey: ["platform_connections"],
    queryFn: () => base44.entities.PlatformConnection.list(),
  });

  const connectMutation = useMutation({
    mutationFn: (data) => base44.entities.PlatformConnection.create(data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["platform_connections"]);
      toast({
        title: "Platform Connected",
        description: `${variables.platform} connected successfully! Syncing data...`,
      });
      setConnectingPlatform(null);
      setApiKey("");
      // Trigger first sync
      handleSync(variables.platform);
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (id) => base44.entities.PlatformConnection.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["platform_connections"]);
      toast({
        title: "Platform Disconnected",
        description: "Your earnings history stays. You can reconnect anytime.",
      });
      setDisconnectPlatform(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PlatformConnection.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["platform_connections"]);
    },
  });

  const handleConnect = (platform) => {
    // For Gumroad (API key), show dialog
    if (platform === "gumroad") {
      setConnectingPlatform(platform);
    } else {
      // For OAuth platforms, simulate OAuth flow
      // In production, this would redirect to OAuth provider
      toast({
        title: "Opening OAuth Flow",
        description: `Redirecting to ${platform} authorization...`,
      });

      // Mock OAuth success after 2 seconds
      setTimeout(() => {
        const user_id = "current_user"; // In production, get from base44.auth.me()
        connectMutation.mutate({
          user_id,
          platform,
          oauth_token: `mock_token_${platform}_${Date.now()}`,
          refresh_token: `mock_refresh_${platform}`,
          expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
          sync_status: "active",
          connected_at: new Date().toISOString(),
          last_synced: new Date().toISOString(),
        });
      }, 2000);
    }
  };

  const handleApiKeyConnect = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid API key",
        variant: "destructive",
      });
      return;
    }

    const user_id = "current_user"; // In production, get from base44.auth.me()
    connectMutation.mutate({
      user_id,
      platform: "gumroad",
      api_key: apiKey,
      sync_status: "active",
      connected_at: new Date().toISOString(),
      last_synced: new Date().toISOString(),
    });
  };

  const handleDisconnect = (platform) => {
    const connection = connections.find((c) => c.platform === platform);
    if (connection) {
      setDisconnectPlatform({ platform, id: connection.id });
    }
  };

  const confirmDisconnect = () => {
    if (disconnectPlatform) {
      disconnectMutation.mutate(disconnectPlatform.id);
    }
  };

  const handleSync = async (platform) => {
    const connection = connections.find((c) => c.platform === platform);
    if (!connection) return;

    // Update status to syncing
    await updateMutation.mutateAsync({
      id: connection.id,
      data: { sync_status: "syncing" },
    });

    // Mock sync process (in production, call backend API)
    setTimeout(async () => {
      // Generate mock transactions
      const mockTransactions = Array.from({ length: Math.floor(Math.random() * 10) + 5 }, (_, i) => ({
        user_id: connection.user_id,
        platform: connection.platform,
        platform_transaction_id: `${platform}_txn_${Date.now()}_${i}`,
        amount: Math.random() * 500 + 10,
        gross_amount: Math.random() * 500 + 10,
        fees_amount: Math.random() * 20,
        net_amount: Math.random() * 480 + 10,
        currency: "USD",
        transaction_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        synced_date: new Date().toISOString(),
        category: ["ad_revenue", "sponsorship", "product_sale", "membership"][Math.floor(Math.random() * 4)],
        description: `${platform} transaction`,
        status: "completed",
      }));

      // Create transactions
      for (const txn of mockTransactions) {
        try {
          await base44.entities.Transaction.create(txn);
        } catch (error) {
          // Skip duplicates
        }
      }

      // Update connection status
      await updateMutation.mutateAsync({
        id: connection.id,
        data: {
          sync_status: "active",
          last_synced: new Date().toISOString(),
        },
      });

      toast({
        title: "Sync Complete",
        description: `${platform} synced ${mockTransactions.length} transactions`,
      });

      queryClient.invalidateQueries(["transactions"]);
    }, 3000);
  };

  const getConnectionForPlatform = (platform) => {
    return connections.find((c) => c.platform === platform);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-[#5E5240] mb-2">Connected Platforms</h1>
        <p className="text-[#5E5240]/60">
          Authorize Zerithum to access your earnings. Each platform stores your data securely.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {platforms.map((platform) => (
          <PlatformCard
            key={platform}
            platform={platform}
            connection={getConnectionForPlatform(platform)}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onSync={handleSync}
          />
        ))}
      </div>

      {/* Gumroad API Key Dialog */}
      <Dialog open={connectingPlatform === "gumroad"} onOpenChange={() => setConnectingPlatform(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Gumroad</DialogTitle>
            <DialogDescription>
              Enter your Gumroad API key. You can find it in your Gumroad settings under "Advanced" → "Create application".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                placeholder="Paste your Gumroad API key here"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectingPlatform(null)}>
              Cancel
            </Button>
            <Button onClick={handleApiKeyConnect} className="btn-primary">
              Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disconnect Confirmation Dialog */}
      <Dialog open={!!disconnectPlatform} onOpenChange={() => setDisconnectPlatform(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect {disconnectPlatform?.platform}?</DialogTitle>
            <DialogDescription>
              Your earnings history stays. You can reconnect anytime.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisconnectPlatform(null)}>
              Cancel
            </Button>
            <Button onClick={confirmDisconnect} className="btn-danger">
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}