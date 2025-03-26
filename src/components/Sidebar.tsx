import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { User } from '@/types/types';
import UserAvatar from './UserAvatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Plus, Hash, User as UserIcon } from 'lucide-react';

type SidebarProps = {
  users: User[];
  currentUserId: string;
  onConnectToPeer: (peerId: string) => void;
};

const Sidebar: React.FC<SidebarProps> = ({
  users,
  currentUserId,
  onConnectToPeer
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [peerIdInput, setPeerIdInput] = useState('');
  
  const currentUser = users.find(u => u.id === currentUserId);
  const otherUsers = users.filter(u => u.id !== currentUserId);
  
  const handleConnectToPeer = () => {
    if (peerIdInput.trim()) {
      onConnectToPeer(peerIdInput.trim());
      setPeerIdInput('');
    }
  };

  return (
    <div 
      className={cn(
        'sidebar transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-20' : 'w-72'
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        {!isCollapsed && (
          <div className="font-semibold text-sidebar-foreground truncate">
            Peer Chat
          </div>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-sidebar-foreground hover:text-sidebar-foreground/80 hover:bg-sidebar-primary ml-auto"
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
      </div>
      
      {/* Connect to peer */}
      {!isCollapsed && (
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <Input
              value={peerIdInput}
              onChange={(e) => setPeerIdInput(e.target.value)}
              placeholder="Enter peer ID to connect"
              className="bg-sidebar-primary text-sidebar-foreground placeholder:text-sidebar-foreground/50 focus-visible:ring-sidebar-ring"
            />
            <Button 
              size="icon" 
              onClick={handleConnectToPeer}
              disabled={!peerIdInput.trim()}
              className="bg-sidebar-primary text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Channels */}
      <div className={cn("p-4 border-b border-sidebar-border", isCollapsed && "flex justify-center")}>
        {!isCollapsed && (
          <div className="text-xs uppercase tracking-wider text-sidebar-foreground/70 mb-2">
            Channels
          </div>
        )}
        
        <div className={cn("space-y-1", isCollapsed && "flex flex-col items-center")}>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-sidebar-foreground hover:bg-sidebar-primary",
              isCollapsed && "justify-center px-2"
            )}
          >
            <Hash className="h-4 w-4 mr-2 shrink-0" />
            {!isCollapsed && <span>general</span>}
          </Button>
        </div>
      </div>
      
      {/* Users */}
      <div className={cn("p-4 flex-1 overflow-auto", isCollapsed && "flex flex-col items-center")}>
        {!isCollapsed && (
          <div className="text-xs uppercase tracking-wider text-sidebar-foreground/70 mb-2">
            Users ({users.length})
          </div>
        )}
        
        <div className="space-y-3">
          {/* Current user */}
          {currentUser && (
            <div className={cn(
              "flex items-center gap-3 p-2 rounded hover:bg-sidebar-primary/50 transition-colors",
              isCollapsed && "flex-col gap-1 justify-center"
            )}>
              <UserAvatar user={currentUser} size="md" />
              {!isCollapsed && (
                <div className="flex-1 truncate">
                  <div className="font-medium text-sidebar-foreground truncate">
                    {currentUser.name} <span className="text-sidebar-foreground/50">(you)</span>
                  </div>
                  <div className="text-xs text-sidebar-foreground/70">
                    ID: {currentUser.id.substring(0, 8)}...
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Other users */}
          {otherUsers.length > 0 && (
            <div className="pt-2">
              {otherUsers.map(user => (
                <div 
                  key={user.id}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded hover:bg-sidebar-primary/50 transition-colors",
                    isCollapsed && "flex-col gap-1 justify-center"
                  )}
                >
                  <UserAvatar user={user} size="md" />
                  {!isCollapsed && (
                    <div className="flex-1 truncate">
                      <div className="font-medium text-sidebar-foreground truncate">
                        {user.name}
                      </div>
                      <div className="text-xs text-sidebar-foreground/70">
                        ID: {user.id.substring(0, 8)}...
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {otherUsers.length === 0 && (
            <div className={cn(
              "text-sidebar-foreground/50 text-sm py-2",
              isCollapsed && "text-center"
            )}>
              {isCollapsed ? (
                <UserIcon className="h-5 w-5 opacity-50" />
              ) : (
                "No other users connected"
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* User info */}
      {currentUser && !isCollapsed && (
        <div className="p-4 border-t border-sidebar-border mt-auto bg-sidebar-primary/50">
          <div className="flex items-center gap-3">
            <UserAvatar user={currentUser} size="sm" />
            <div className="flex-1 truncate">
              <div className="font-medium text-sidebar-foreground truncate">
                {currentUser.name}
              </div>
              <div className="text-xs text-sidebar-foreground/70">
                {currentUser.status === 'online' ? 'Online' : 'Offline'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
