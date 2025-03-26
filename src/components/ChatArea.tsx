
import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Message as MessageType, User } from '@/types/types';
import Message from './Message';
import MessageInput from './MessageInput';

type ChatAreaProps = {
  messages: MessageType[];
  users: User[];
  currentUserId: string;
  onSendMessage: (content: string) => void;
  isConnected: boolean;
};

const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  users,
  currentUserId,
  onSendMessage,
  isConnected
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sortedMessages, setSortedMessages] = useState<MessageType[]>([]);

  // Sort messages by timestamp
  useEffect(() => {
    const sorted = [...messages].sort((a, b) => a.timestamp - b.timestamp);
    setSortedMessages(sorted);
  }, [messages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [sortedMessages]);

  // Group messages by sender and time
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

  return (
    <div className="chat-area">
      <div className="message-list">
        {groupedMessages.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p>No messages yet.</p>
            <p className="text-sm">Start a conversation!</p>
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
        <div ref={messagesEndRef} />
      </div>
      
      <MessageInput
        onSendMessage={onSendMessage}
        disabled={!isConnected}
        placeholder={isConnected ? "Type a message..." : "Connect to send messages..."}
      />
    </div>
  );
};

export default ChatArea;
