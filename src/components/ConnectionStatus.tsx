
import React from 'react';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { ConnectionStatus as Status } from '@/types/types';

type ConnectionStatusProps = {
  status: Status;
};

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status }) => {
  return (
    <div 
      className={cn(
        'connection-indicator animate-fade-in',
        {
          'bg-green-500/20 text-green-500': status === 'connected',
          'bg-yellow-500/20 text-yellow-500': status === 'connecting',
          'bg-red-500/20 text-red-500': status === 'disconnected',
        }
      )}
    >
      <div className="flex items-center gap-2">
        {status === 'connected' && <Wifi className="h-3 w-3" />}
        {status === 'connecting' && <AlertTriangle className="h-3 w-3 animate-pulse-subtle" />}
        {status === 'disconnected' && <WifiOff className="h-3 w-3" />}
        <span>
          {status === 'connected' && 'Connected'}
          {status === 'connecting' && 'Connecting...'}
          {status === 'disconnected' && 'Disconnected'}
        </span>
      </div>
    </div>
  );
};

export default ConnectionStatus;
