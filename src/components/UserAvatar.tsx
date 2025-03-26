
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { User } from '@/types/types';

type UserAvatarProps = {
  user: User;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  className?: string;
};

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  user, 
  size = 'md', 
  showStatus = true,
  className 
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-9 w-9',
    lg: 'h-12 w-12'
  };

  const statusSizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5'
  };

  const fallbackText = user.name
    .split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative">
      <Avatar className={cn(sizeClasses[size], 'rounded-full', className)}>
        {user.avatar ? (
          <AvatarImage src={user.avatar} alt={user.name} />
        ) : null}
        <AvatarFallback className="bg-accent text-accent-foreground">
          {fallbackText}
        </AvatarFallback>
      </Avatar>
      
      {showStatus && (
        <span
          className={cn(
            'avatar-status',
            statusSizeClasses[size],
            {
              'status-online': user.status === 'online',
              'status-offline': user.status === 'offline',
              'status-away': user.status === 'away',
              'status-dnd': user.status === 'dnd'
            }
          )}
        />
      )}
    </div>
  );
};

export default UserAvatar;
