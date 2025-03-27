
import React from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Message as MessageType, User } from '@/types/types';
import UserAvatar from './UserAvatar';
import { Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge'; // Import Badge component

import { BOT_SENDER_ID_PREFIX } from './SettingsDialog';

type MessageProps = {
  message: MessageType;
  sender: User;
  isCurrentUser: boolean;
  showAvatar?: boolean;
};

const Message: React.FC<MessageProps> = ({ 
  message, 
  sender, 
  isCurrentUser,
  showAvatar = true
}) => {
  const formattedTime = format(message.timestamp, 'h:mm a');
  const formattedDate = format(message.timestamp, 'PP');
  
  const renderMessageContent = () => {
    switch (message.type) {
      case 'text': {
        // Prepend bot identifier if the message is from a bot
        const content = isBotMessage ? `@bot-answer ${message.content}` : message.content;
        return <p className="whitespace-pre-wrap break-words">{content}</p>;
      }
      case 'image':
        return (
          <div className="mt-2 max-w-md">
            <img 
              src={message.content} 
              alt="Shared image" 
              className="rounded-lg max-h-60 object-contain" 
            />
          </div>
        );
      
      case 'audio':
        return (
          <div className="mt-2 flex items-center bg-[#232428] rounded-lg p-2">
            <button className="h-8 w-8 rounded-full bg-white flex items-center justify-center mr-3">
              <Play className="h-4 w-4 text-[#313338] ml-1" />
            </button>
            <div className="flex-1">
              <div className="h-2 bg-[#4b4c52] rounded-full">
                <div className="h-full w-0 bg-white rounded-full"></div>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {message.content || "Audio message"}
              </div>
            </div>
          </div>
        );
      
      case 'video':
        return (
          <div className="mt-2 max-w-md">
            <video 
              src={message.content} 
              controls 
              className="rounded-lg max-h-60 w-full max-w-full"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );
    }
  };
  
  const renderReactions = () => {
    if (!message.reactions || Object.keys(message.reactions).length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {Object.entries(message.reactions).map(([emoji, userIds]) => (
          <div 
            key={emoji} 
            className="flex items-center bg-[#2b2d31] hover:bg-[#35363c] rounded-full px-2 py-0.5 cursor-pointer"
          >
            <span className="mr-1">{emoji}</span>
            <span className="text-xs text-gray-400">{userIds.length}</span>
          </div>
        ))}
      </div>
    );
  };

  // Determine if the message is from any bot *inside* the component body
  const isBotMessage = sender.id.startsWith(BOT_SENDER_ID_PREFIX);

  return (
     <div
      className={cn(
        'flex gap-3 animate-fade-in rounded-md py-1 px-2 -mx-2',
        // Apply persistent background difference for bot messages
        isBotMessage ? 'bg-[#2a2c30]' : '', // Slightly darker/different background for bots
        isCurrentUser ? 'hover:bg-[#35373c]' : 'hover:bg-[#2e3035]' // Keep hover effect
      )}
    >
      {/* Conditionally render avatar based on showAvatar */}
      {showAvatar ? (
        <UserAvatar user={sender} size="md" showStatus={true} />
      ) : (
        <div className="w-10" />
      )}
      
      <div className="flex flex-col min-w-0">
        {showAvatar && (
          <div className="flex items-baseline gap-2"> {/* Use baseline alignment */}
            <span className="font-medium text-white">{sender.name}</span>
            {/* Add Bot badge if it's a bot message */}
            {isBotMessage && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                Bot
              </Badge>
            )}
            <span className="text-xs text-gray-400">{formattedDate}</span>
          </div>
        )}
        
        <div className="text-gray-200 text-sm">
          {renderMessageContent()}
        </div>
        
        {renderReactions()}
      </div>
    </div>
  );
};

export default Message;
