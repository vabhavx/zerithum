import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, RefreshCw, Settings as SettingsIcon, Trash2 } from 'lucide-react';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

const platformConfig = {
  youtube: { name: 'YouTube', icon: '🎥', usesOAuth: true },
  patreon: { name: 'Patreon', icon: '💖', usesOAuth: true },
  gumroad: { name: 'Gumroad', icon: '📦', usesOAuth: false },
  stripe: { name: 'Stripe', icon: '⚡', usesOAuth: true },
  instagram: { name: 'Instagram', icon: '📷', usesOAuth: true },
  tiktok: { name: 'TikTok', icon: '🎵', usesOAuth: true }
};

export default function ConnectedApps() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

  const { data: connections = [] } = useQuery({
    queryKey: ['connections'],
    queryFn: () => base44.entities.PlatformConnection.list(),
    initialData: []
  });

  const userConnections = connections.filter(c => c.created_by === user?.email);
  const allPlatforms = Object.keys(platformConfig);
  
  // Get platforms that are not connected
  const connectedPlatforms = userConnections.map(c => c.platform);
  const notConnectedPlatforms = allPlatforms.filter(p => !connectedPlatforms.includes(p));

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#5E5240] mb-2">
          Connected Apps
        </h1>
        <p className="text-[#5E5240]/60">
          Manage OAuth connections and API keys securely.
        </p>
      </div>

      {/* Connected Platforms Table */}
      <div className="clay-card overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#5E5240]/5">
              <tr>
                <th className="text-left py-4 px-4 text-xs font-semibold text-[#5E5240]">Platform</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-[#5E5240]">Status</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-[#5E5240]">Last Synced</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-[#5E5240]">Token Expires</th>
                <th className="text-right py-4 px-4 text-xs font-semibold text-[#5E5240]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {userConnections.length > 0 ? (
                userConnections.map((connection) => {
                  const config = platformConfig[connection.platform];
                  const isActive = connection.sync_status === 'active';
                  
                  return (
                    <tr key={connection.id} className="border-t border-[#5E524012] hover:bg-[#5E5240]/5">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{config.icon}</span>
                          <div>
                            <div className="font-medium text-[#5E5240]">{config.name}</div>
                            <div className="text-xs text-[#5E5240]/60">
                              {config.usesOAuth ? 'OAuth' : 'API Key'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {isActive ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-[#208D9E]" />
                              <span className="text-sm text-[#208D9E]">Active</span>
                            </>
                          ) : (
                            <>
                              <Circle className="w-4 h-4 text-[#5E5240]/40" />
                              <span className="text-sm text-[#5E5240]/60">Disconnected</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm">
                        {connection.last_synced ? (
                          moment(connection.last_synced).fromNow()
                        ) : (
                          <span className="text-[#5E5240]/40">Never</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-sm">
                        {connection.expires_at ? (
                          moment(connection.expires_at).format('MMM D, YYYY')
                        ) : (
                          <span className="text-[#5E5240]/40">
                            {config.usesOAuth ? 'N/A' : 'N/A (API key)'}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button className="btn-secondary text-xs">
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Refresh
                          </Button>
                          <Button className="btn-secondary text-xs text-[#C0152F] border-[#C0152F] hover:bg-[#C0152F]/5">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-[#5E5240]/40">
                    No connected apps yet.{' '}
                    <Link to={createPageUrl('Platforms')} className="text-[#208D9E] hover:underline">
                      Connect your first platform
                    </Link>
                  </td>
                </tr>
              )}
              
              {/* Not Connected Platforms */}
              {notConnectedPlatforms.map((platform) => {
                const config = platformConfig[platform];
                return (
                  <tr key={platform} className="border-t border-[#5E524012] hover:bg-[#5E5240]/5">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl opacity-40">{config.icon}</span>
                        <div>
                          <div className="font-medium text-[#5E5240]/60">{config.name}</div>
                          <div className="text-xs text-[#5E5240]/40">Not connected</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Circle className="w-4 h-4 text-[#5E5240]/40" />
                        <span className="text-sm text-[#5E5240]/40">Not Connected</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-[#5E5240]/40">-</td>
                    <td className="py-4 px-4 text-sm text-[#5E5240]/40">-</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end">
                        <Link to={createPageUrl('Platforms')}>
                          <Button className="btn-primary text-xs">Connect</Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Additional Controls */}
      <div className="clay-card p-6">
        <h2 className="text-lg font-semibold text-[#5E5240] mb-4">Connection Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-[#5E5240]">Auto-sync frequency</div>
              <div className="text-sm text-[#5E5240]/60">How often to sync your platforms</div>
            </div>
            <select className="input-clay">
              <option>Daily (recommended)</option>
              <option>Every 6 hours</option>
              <option>Never (manual only)</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-[#5E5240]">Notify when token expires</div>
              <div className="text-sm text-[#5E5240]/60">Get email reminders 7 days before expiry</div>
            </div>
            <input type="checkbox" className="w-5 h-5" defaultChecked />
          </div>

          <div className="pt-4 border-t border-[#5E524012]">
            <Button className="btn-secondary">
              Test All Connections
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}