import React from "react";
import { base44 } from "@/api/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, RotateCw, Unplug } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function SettingsConnectedApps() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: connections = [] } = useQuery({
    queryKey: ["platform_connections"],
    queryFn: () => base44.entities.PlatformConnection.list(),
  });

  const disconnectMutation = useMutation({
    mutationFn: (id) => base44.entities.PlatformConnection.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform_connections"] });
      toast({
        title: "Disconnected",
        description: "Platform has been disconnected",
      });
    },
  });

  const refreshMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PlatformConnection.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform_connections"] });
      toast({
        title: "Token Refreshed",
        description: "Connection has been renewed",
      });
    },
  });

  const platformNames = {
    youtube: "YouTube",
    patreon: "Patreon",
    gumroad: "Gumroad",
    stripe: "Stripe",
    instagram: "Instagram",
    tiktok: "TikTok",
  };

  const allPlatforms = ["youtube", "patreon", "gumroad", "stripe", "instagram", "tiktok"];

  const handleRefresh = (connection) => {
    // Mock token refresh
    refreshMutation.mutate({
      id: connection.id,
      data: {
        expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        last_synced: new Date().toISOString(),
      },
    });
  };

  const handleDisconnect = (connection) => {
    if (window.confirm(`Disconnect ${platformNames[connection.platform]}? Your earnings history stays. You can reconnect anytime.`)) {
      disconnectMutation.mutate(connection.id);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#5E5240] mb-2">Connected Apps</h1>
        <p className="text-[#5E5240]/60">
          Manage OAuth connections and API keys securely. This is the source of truth for all platform integrations.
        </p>
      </div>

      <div className="clay-card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#5E5240]/10">
              <th className="text-left py-4 px-4 text-sm font-semibold text-[#5E5240]">Platform</th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-[#5E5240]">Status</th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-[#5E5240]">Last Synced</th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-[#5E5240]">Token Expires</th>
              <th className="text-right py-4 px-4 text-sm font-semibold text-[#5E5240]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {allPlatforms.map((platform) => {
              const connection = connections.find((c) => c.platform === platform);
              const isConnected = connection && connection.sync_status === "active";

              return (
                <tr key={platform} className="border-b border-[#5E5240]/5 hover:bg-[#5E5240]/5">
                  <td className="py-4 px-4">
                    <span className="font-medium text-[#5E5240]">{platformNames[platform]}</span>
                  </td>
                  <td className="py-4 px-4">
                    {isConnected ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#208D9E]" />
                        <span className="text-sm text-[#208D9E] font-medium">Active</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Circle className="w-4 h-4 text-[#5E5240]/40" />
                        <span className="text-sm text-[#5E5240]/60">Not Connected</span>
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4 text-sm text-[#5E5240]">
                    {connection?.last_synced ? format(new Date(connection.last_synced), "MMM d, h:mm a") : "-"}
                  </td>
                  <td className="py-4 px-4 text-sm text-[#5E5240]">
                    {connection?.expires_at
                      ? format(new Date(connection.expires_at), "MMM d, yyyy")
                      : platform === "gumroad"
                      ? "N/A (API key)"
                      : "-"}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-2">
                      {isConnected ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRefresh(connection)}
                            className="text-xs"
                            aria-label={`Refresh ${platformNames[platform]} connection`}
                          >
                            <RotateCw className="w-3 h-3 mr-1" />
                            Refresh
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDisconnect(connection)}
                            className="text-xs text-[#C0152F] hover:bg-[#C0152F]/10"
                            aria-label={`Disconnect ${platformNames[platform]}`}
                          >
                            <Unplug className="w-3 h-3 mr-1" />
                            Disconnect
                          </Button>
                        </>
                      ) : (
                        <Link to={createPageUrl("ConnectedPlatforms")}>
                          <Button size="sm" className="btn-primary text-xs" aria-label={`Connect ${platformNames[platform]}`}>
                            Connect
                          </Button>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Additional Controls */}
      <div className="clay-card mt-6">
        <h3 className="text-lg font-bold text-[#5E5240] mb-4">Connection Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-[#5E5240]">Auto-sync Frequency</p>
              <p className="text-sm text-[#5E5240]/60">How often to sync data automatically</p>
            </div>
            <select className="px-4 py-2 border border-[#5E5240]/20 rounded-lg text-sm" aria-label="Auto-sync Frequency">
              <option value="daily">Daily (6 AM UTC)</option>
              <option value="6-hourly">Every 6 Hours</option>
              <option value="never">Never (Manual Only)</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-[#5E5240]">Expiry Notifications</p>
              <p className="text-sm text-[#5E5240]/60">Email reminder when tokens expire soon</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked aria-label="Expiry Notifications" />
              <div className="w-11 h-6 bg-[#5E5240]/20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#208D9E]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#208D9E]"></div>
            </label>
          </div>

          <div className="pt-4 border-t border-[#5E5240]/10">
            <Button className="btn-secondary">
              Test All Connections
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}