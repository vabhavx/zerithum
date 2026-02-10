import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, Loader2, Clock, Link2, XCircle, RefreshCw } from 'lucide-react';
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';

const platformConfig = {
  youtube: {
    name: 'YouTube',
    icon: '🎥',
    color: 'bg-red-500',
    description: 'AdSense earnings & analytics'
  },
  patreon: {
    name: 'Patreon',
    icon: '💖',
    color: 'bg-orange-500',
    description: 'Pledges & membership revenue'
  },
  gumroad: {
    name: 'Gumroad',
    icon: '📦',
    color: 'bg-pink-500',
    description: 'Product sales & downloads'
  },
  stripe: {
    name: 'Stripe',
    icon: '⚡',
    color: 'bg-indigo-500',
    description: 'Payment processing'
  },
  instagram: {
    name: 'Instagram',
    icon: '📷',
    color: 'bg-pink-600',
    description: 'Brand partnerships & insights'
  },
  tiktok: {
    name: 'TikTok',
    icon: '🎵',
    color: 'bg-black',
    description: 'Creator Fund earnings'
  }
};

export default function PlatformCard({ platform, connection, onConnect, onSync, onDisconnect }) {
  const config = platformConfig[platform] || { name: platform, icon: '?', color: 'bg-gray-500', description: 'Unknown platform' };
  const isConnected = connection?.sync_status && connection?.sync_status !== 'error';
  const isSyncing = connection?.sync_status === 'syncing';
  const hasError = connection?.sync_status === 'error';

  return (
    <div className="group border border-border bg-background hover:bg-muted/10 transition-colors p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={cn("w-10 h-10 flex items-center justify-center text-xl rounded-none bg-muted font-mono", config.color, "bg-opacity-10 text-foreground")}>
            {config.icon}
          </div>
          <div>
            <h3 className="font-serif text-lg font-medium leading-tight">{config.name}</h3>
            <p className="text-xs text-muted-foreground mt-1 font-mono">{config.description}</p>
          </div>
        </div>
        
        {isConnected && !hasError && (
          <div className="flex items-center text-emerald-500 text-[10px] font-mono uppercase tracking-wider border border-emerald-500/20 px-2 py-1 bg-emerald-500/10">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Active
          </div>
        )}
        {hasError && (
          <div className="flex items-center text-destructive text-[10px] font-mono uppercase tracking-wider border border-destructive/20 px-2 py-1 bg-destructive/10">
            <AlertCircle className="w-3 h-3 mr-1" />
            Error
          </div>
        )}
      </div>

      {/* Status */}
      <div className="flex-grow border-t border-border pt-4 mt-auto mb-6">
        {isConnected && connection?.last_synced ? (
          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
             <span>LAST SYNC</span>
             <span className="text-foreground">{formatDistanceToNow(new Date(connection.last_synced), { addSuffix: true })}</span>
          </div>
        ) : (
             <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
             <span>STATUS</span>
             <span className="text-foreground">NOT CONNECTED</span>
          </div>
        )}
        
        {hasError && connection?.error_message && (
          <div className="mt-2 text-[10px] font-mono text-destructive bg-destructive/5 p-2 border border-destructive/20">
            {connection.error_message}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {!isConnected ? (
          <Button
            onClick={() => onConnect(platform)}
            className="w-full rounded-none font-mono text-xs uppercase tracking-wider h-9"
            variant="outline"
          >
            <Link2 className="w-3 h-3 mr-2" />
            Connect Source
          </Button>
        ) : (
          <>
            <Button
              onClick={() => onSync(platform)}
              disabled={isSyncing}
              className="flex-1 rounded-none font-mono text-xs uppercase tracking-wider h-9"
              variant="outline"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Syncing
                </>
              ) : (
                <>
                    <RefreshCw className="w-3 h-3 mr-2" />
                    Sync
                </>
              )}
            </Button>
            <Button
              onClick={() => onDisconnect(platform)}
              className="rounded-none font-mono text-xs uppercase tracking-wider h-9 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
              variant="outline"
            >
              Disconnect
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
