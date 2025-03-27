
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Channel, Server } from '@/types/types';
import { Button } from '@/components/ui/button';
import { Hash, Volume2, ChevronDown, ChevronRight, Plus, Settings as SettingsIcon } from 'lucide-react'; // Renamed Settings to SettingsIcon
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

type ChannelListProps = {
  server?: Server;
  channels: Channel[];
  currentChannelId?: string;
  onSelectChannel: (channelId: string) => void;
  onCreateChannel: (type: 'text' | 'voice' | 'announcement') => void;
  onOpenSettings: () => void; // Added prop to open settings
  isAdmin: boolean;
};

const ChannelList: React.FC<ChannelListProps> = ({
  server,
  channels,
  currentChannelId,
  onSelectChannel,
  onCreateChannel,
  onOpenSettings, // Destructure new prop
  isAdmin
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    text: true,
    voice: true,
    announcement: true
  });

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const textChannels = channels.filter(channel => channel.type === 'text');
  const voiceChannels = channels.filter(channel => channel.type === 'voice');
  const announcementChannels = channels.filter(channel => channel.type === 'announcement');

  const renderChannelIcon = (type: Channel['type']) => {
    switch (type) {
      case 'text':
        return <Hash className="h-4 w-4 mr-2 opacity-70" />;
      case 'voice':
        return <Volume2 className="h-4 w-4 mr-2 opacity-70" />;
      case 'announcement':
        return <Hash className="h-4 w-4 mr-2 opacity-70" />;
    }
  };

  const renderChannelList = (categoryName: string, categoryChannels: Channel[], type: Channel['type']) => {
    if (categoryChannels.length === 0 && type !== 'text') return null;
    
    return (
      <Collapsible
        open={expandedCategories[type]}
        onOpenChange={() => toggleCategory(type)}
        className="w-full mb-2"
      >
        <CollapsibleTrigger asChild>
          <div className="flex items-center px-2 py-1 text-xs uppercase tracking-wide font-semibold text-gray-400 cursor-pointer hover:text-gray-200">
            {expandedCategories[type] ? (
              <ChevronDown className="h-3 w-3 mr-1" />
            ) : (
              <ChevronRight className="h-3 w-3 mr-1" />
            )}
            {categoryName}
            
            {isAdmin && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-4 w-4 ml-auto p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateChannel(type);
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Create new {type} channel
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-1 space-y-0.5">
          {categoryChannels.map(channel => (
            <Button
              key={channel.id}
              variant="ghost"
              className={cn(
                "w-full justify-start h-8 px-2 rounded text-gray-400 hover:text-gray-200 hover:bg-[#35363c]",
                currentChannelId === channel.id && "bg-[#35363c] text-gray-200"
              )}
              onClick={() => onSelectChannel(channel.id)}
            >
              {renderChannelIcon(channel.type)}
              <span className="truncate">{channel.name}</span>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 ml-auto p-0 opacity-0 group-hover:opacity-100" // Consider adding group class to parent Button
                >
                  <SettingsIcon className="h-3 w-3" />
                </Button>
              )}
            </Button>
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <div className="channel-list h-full w-60 bg-[#2b2d31] flex flex-col">
      <div className="server-header p-3 h-12 shadow-sm flex items-center justify-between">
        <h2 className="font-semibold text-white truncate">{server?.name || "Direct Messages"}</h2>
        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-auto h-6 w-6">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              {/* Add other server-related options here if needed */}
              <DropdownMenuItem onClick={onOpenSettings}>
                <SettingsIcon className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              {/* Example:
              <DropdownMenuItem>
                Invite People
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-500">
                Leave Server
              </DropdownMenuItem>
              */}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="channels-container flex-1 p-2 overflow-y-auto">
        {renderChannelList("Text Channels", textChannels, 'text')}
        {renderChannelList("Voice Channels", voiceChannels, 'voice')}
        {renderChannelList("Announcements", announcementChannels, 'announcement')}
      </div>
      
      <div className="user-controls p-3 h-13 bg-[#232428] mt-auto">
        {/* User controls area */}
      </div>
    </div>
  );
};

export default ChannelList;
