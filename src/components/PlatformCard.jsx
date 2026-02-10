import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, Loader2, Clock } from 'lucide-react';
import moment from 'moment';

const platformConfig = {
  youtube: {
    name: 'YouTube',
    icon: '🎥',
    color: '#FF0000',
    description: 'AdSense earnings & analytics'
  },
  patreon: {
    name: 'Patreon',
    icon: '💖',
    color: '#FF424D',
    description: 'Pledges & membership revenue'
  },
  gumroad: {
    name: 'Gumroad',
    icon: '📦',
    color: '#FF90E8',
    description: 'Product sales & downloads'
  },
  stripe: {
    name: 'Stripe',
    icon: '⚡',
    color: '#635BFF',
    description: 'Payment processing'
  },
  instagram: {
    name: 'Instagram',
    icon: '📷',
    color: '#E4405F',
    description: 'Brand partnerships & insights'
  },
  tiktok: {
    name: 'TikTok',
    icon: '🎵',
    color: '#000000',
    description: 'Creator Fund earnings'
  }
};

export default function PlatformCard({ platform, connection, onConnect, onSync, onDisconnect }) {
  const config = platformConfig[platform];
  const isConnected = connection?.sync_status && connection?.sync_status !== 'error';
  const isSyncing = connection?.sync_status === 'syncing';
  const hasError = connection?.sync_status === 'error';

  return (
    <div className="clay-card p-4 h-full flex flex-col bg-[#2a2a2a] rounded-sm border border-white/5">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${config.color}15` }}
          >
            {config.icon}
          </div>
          <div>
            <h3 className="font-semibold text-base text-white">{config.name}</h3>
            <p className="text-xs text-white/60">{config.description}</p>
          </div>
        </div>
        
        {isConnected && !hasError && (
          <CheckCircle2
            className="w-5 h-5 text-[#208D9E]"
            aria-label={`${config.name} connected`}
          />
        )}
        {hasError && (
          <AlertCircle
            className="w-5 h-5 text-[#C0152F]"
            aria-label={`${config.name} connection error`}
          />
        )}
      </div>

      {/* Status */}
      <div className="flex-grow">
        {isConnected && connection?.last_synced && (
          <div className="text-xs text-white/60 mb-3">
            <Clock className="w-3 h-3 inline mr-1" />
            Last synced {moment(connection.last_synced).fromNow()}
          </div>
        )}
        
        {hasError && connection?.error_message && (
          <div className="text-xs text-[#C0152F] bg-[#C0152F]/5 p-2 rounded-lg mb-3">
            {connection.error_message}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-3">
        {!isConnected ? (
          <Button
            onClick={() => onConnect(platform)}
            className="btn-primary w-full text-sm"
            aria-label={`Connect to ${config.name}`}
          >
            Connect
          </Button>
        ) : (
          <>
            <Button
              onClick={() => onSync(platform)}
              disabled={isSyncing}
              className="btn-secondary flex-1 text-sm"
              aria-label={isSyncing ? `Syncing ${config.name} data` : `Sync ${config.name} data`}
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Syncing...
                </>
              ) : (
                'Sync Now'
              )}
            </Button>
            <Button
              onClick={() => onDisconnect(platform)}
              className="btn-secondary text-[#C0152F] border-[#C0152F] hover:bg-[#C0152F]/5 text-sm"
              aria-label={`Disconnect from ${config.name}`}
            >
              Disconnect
            </Button>
          </>
        )}
      </div>
    </div>
  );
}