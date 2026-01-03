import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PlatformCard from '../components/PlatformCard';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const PLATFORMS = ['youtube', 'patreon', 'gumroad', 'stripe', 'instagram', 'tiktok'];

export default function Platforms() {
  const [user, setUser] = useState(null);
  const [disconnectPlatform, setDisconnectPlatform] = useState(null);
  const queryClient = useQueryClient();

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

  const connectMutation = useMutation({
    mutationFn: async (platform) => {
      const existingConnection = connections.find(c => c.platform === platform && c.created_by === user.email);
      
      if (existingConnection) {
        // Update existing connection
        return await base44.entities.PlatformConnection.update(existingConnection.id, {
          sync_status: 'active',
          connected_at: new Date().toISOString(),
          disconnected_at: null,
          error_message: null
        });
      } else {
        // Create new connection
        return await base44.entities.PlatformConnection.create({
          platform,
          connected_at: new Date().toISOString(),
          sync_status: 'active'
        });
      }
    },
    onSuccess: (data, platform) => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      toast.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} connected successfully!`);
    },
    onError: (error) => {
      toast.error('Failed to connect platform. Please try again.');
    }
  });

  const syncMutation = useMutation({
    mutationFn: async (platform) => {
      const connection = connections.find(c => c.platform === platform && c.created_by === user.email);
      if (!connection) throw new Error('Connection not found');
      
      // Update to syncing status
      await base44.entities.PlatformConnection.update(connection.id, {
        sync_status: 'syncing'
      });

      // Simulate sync delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update to active with new last_synced
      return await base44.entities.PlatformConnection.update(connection.id, {
        sync_status: 'active',
        last_synced: new Date().toISOString()
      });
    },
    onSuccess: (data, platform) => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      toast.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} synced successfully!`);
    },
    onError: (error, platform) => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      toast.error(`Failed to sync ${platform}. Please try again.`);
    }
  });

  const disconnectMutation = useMutation({
    mutationFn: async (platform) => {
      const connection = connections.find(c => c.platform === platform && c.created_by === user.email);
      if (!connection) throw new Error('Connection not found');
      
      return await base44.entities.PlatformConnection.update(connection.id, {
        sync_status: 'error',
        disconnected_at: new Date().toISOString(),
        error_message: 'Disconnected by user'
      });
    },
    onSuccess: (data, platform) => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      toast.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} disconnected. Your data stays safe.`);
      setDisconnectPlatform(null);
    },
    onError: (error) => {
      toast.error('Failed to disconnect platform. Please try again.');
    }
  });

  const handleConnect = (platform) => {
    // Check plan limits
    if (user?.plan_tier === 'free') {
      const activeConnections = connections.filter(c => 
        c.sync_status === 'active' && c.created_by === user.email
      );
      if (activeConnections.length >= 2) {
        toast.error('Free plan allows only 2 platforms. Upgrade to connect more.');
        return;
      }
    }

    connectMutation.mutate(platform);
  };

  const handleSync = (platform) => {
    syncMutation.mutate(platform);
  };

  const handleDisconnect = (platform) => {
    setDisconnectPlatform(platform);
  };

  const confirmDisconnect = () => {
    if (disconnectPlatform) {
      disconnectMutation.mutate(disconnectPlatform);
    }
  };

  const getConnectionForPlatform = (platform) => {
    return connections.find(c => c.platform === platform && c.created_by === user?.email);
  };

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#5E5240] mb-2">
          Connected Platforms
        </h1>
        <p className="text-[#5E5240]/60">
          Authorize Zerithum to access your earnings. Each platform stores your data securely.
        </p>
      </div>

      {/* Platform Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PLATFORMS.map((platform) => (
          <PlatformCard
            key={platform}
            platform={platform}
            connection={getConnectionForPlatform(platform)}
            onConnect={handleConnect}
            onSync={handleSync}
            onDisconnect={handleDisconnect}
          />
        ))}
      </div>

      {/* Disconnect Confirmation Dialog */}
      <Dialog open={!!disconnectPlatform} onOpenChange={(open) => !open && setDisconnectPlatform(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect {disconnectPlatform?.charAt(0).toUpperCase() + disconnectPlatform?.slice(1)}?</DialogTitle>
            <DialogDescription>
              Your earnings history stays. You can reconnect anytime.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setDisconnectPlatform(null)}
              className="btn-secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDisconnect}
              className="btn-danger"
            >
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}