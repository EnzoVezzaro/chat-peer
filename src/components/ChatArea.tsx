
import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Message as MessageType, User, Channel } from '@/types/types';
import Message from './Message';
import MessageInput from './MessageInput';
import { Hash, Users, Video, Share, Mic, MicOff, VideoOff, Image, PlusCircle, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type ChatAreaProps = {
  messages: MessageType[];
  users: User[];
  currentUserId: string;
  currentChannel?: Channel;
  onSendMessage: (content: string, type: 'text' | 'image' | 'audio' | 'video') => void;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onShareScreen: () => void;
  onUploadImage: (file: File) => void;
  onOpenInviteDialog: () => void;
  isConnected: boolean;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
};

const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  users,
  currentUserId,
  currentChannel,
  onSendMessage,
  onToggleAudio,
  onToggleVideo,
  onShareScreen,
  onUploadImage,
  onOpenInviteDialog,
  isConnected,
  isAudioEnabled,
  isVideoEnabled
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sortedMessages, setSortedMessages] = useState<MessageType[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const sorted = [...messages].sort((a, b) => a.timestamp - b.timestamp);
    setSortedMessages(sorted);
  }, [messages]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [sortedMessages]);

  const groupedMessages = sortedMessages.reduce<{
    messages: MessageType[];
    showAvatar: boolean[];
  }>(
    (acc, message, index) => {
      acc.messages.push(message);
      
      const prevMessage = sortedMessages[index - 1];
      const showAvatar = !prevMessage || 
                        prevMessage.senderId !== message.senderId || 
                        message.timestamp - prevMessage.timestamp > 300000; // 5 minutes
      
      acc.showAvatar.push(showAvatar);
      
      return acc;
    },
    { messages: [], showAvatar: [] }
  );

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onUploadImage(files[0]);
    }
    if (event.target) {
      event.target.value = '';
    }
  };

  const typingUsers = users.filter(user => 
    user.id !== currentUserId && 
    user.isTyping
  );

  return (
    <div className="chat-area flex-1 flex flex-col h-full">
      <div className="channel-header h-12 border-b border-[#1e1f22] bg-[#313338] flex items-center px-4 shadow-sm">
        {currentChannel && (
          <>
            <Hash className="h-5 w-5 mr-2 text-gray-400" />
            <h2 className="font-semibold text-white">{currentChannel.name}</h2>
            
            <div className="ml-auto flex items-center gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={onToggleVideo}>
                      {isVideoEnabled ? (
                        <Video className="h-5 w-5 text-gray-400 hover:text-white" />
                      ) : (
                        <VideoOff className="h-5 w-5 text-gray-400 hover:text-white" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={onToggleAudio}>
                      {isAudioEnabled ? (
                        <Mic className="h-5 w-5 text-gray-400 hover:text-white" />
                      ) : (
                        <MicOff className="h-5 w-5 text-gray-400 hover:text-white" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={onShareScreen}>
                      <Share className="h-5 w-5 text-gray-400 hover:text-white" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Share your screen
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <Separator orientation="vertical" className="h-6 bg-gray-700" />
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={onOpenInviteDialog}>
                      <Users className="h-5 w-5 text-gray-400 hover:text-white" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Invite users
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </>
        )}
      </div>
      
      <div className="message-list flex-1 overflow-y-auto p-4 space-y-4 bg-[#313338]">
        {groupedMessages.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Hash className="h-16 w-16 mb-4 text-gray-600" />
            <h3 className="text-2xl font-bold text-white mb-2">Welcome to #{currentChannel?.name || 'the channel'}!</h3>
            <p className="text-sm">This is the start of the #{currentChannel?.name || 'channel'} channel.</p>
          </div>
        ) : (
          groupedMessages.messages.map((message, index) => {
            const sender = users.find(u => u.id === message.senderId) || {
              id: message.senderId,
              name: 'Unknown User',
              status: 'offline' as const
            };
            
            return (
              <Message
                key={message.id}
                message={message}
                sender={sender}
                isCurrentUser={message.senderId === currentUserId}
                showAvatar={groupedMessages.showAvatar[index]}
              />
            );
          })
        )}
        
        {typingUsers.length > 0 && (
          <div className="flex items-center text-xs text-gray-400 animate-pulse">
            <span className="font-medium mr-1">
              {typingUsers.map(u => u.name).join(', ')}
            </span>
            <span>is typing...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="message-input-container p-4 bg-[#313338]">
        <div className="flex items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-10 w-10 rounded-full"
                  onClick={handleImageUpload}
                >
                  <PlusCircle className="h-5 w-5 text-gray-400 hover:text-white" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Upload an image
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
          
          <MessageInput
            onSendMessage={(content) => onSendMessage(content, 'text')}
            disabled={!isConnected}
            placeholder={isConnected ? `Message #${currentChannel?.name || 'channel'}` : "Connect to send messages..."}
          />
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                  <Smile className="h-5 w-5 text-gray-400 hover:text-white" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Add emoji
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
