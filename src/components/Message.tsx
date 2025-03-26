
import React from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Message as MessageType, User } from '@/types/types';
import UserAvatar from './UserAvatar';

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
  
  return (
    <div 
      className={cn(
        'flex gap-3 max-w-[80%] animate-fade-in',
        isCurrentUser ? 'ml-auto flex-row-reverse' : ''
      )}
    >
      {showAvatar ? (
        <UserAvatar user={sender} size="sm" showStatus={false} />
      ) : (
        <div className="w-6" />
      )}
      
      <div className="flex flex-col">
        {!isCurrentUser && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">{sender.name}</span>
          </div>
        )}
        
        <div className="flex items-end gap-2">
          <div 
            className={cn(
              'rounded-lg px-3 py-2 text-sm',
              isCurrentUser 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary text-secondary-foreground'
            )}
          >
            {message.content}
          </div>
          
          <span className="text-xs text-muted-foreground">
            {formattedTime}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Message;
