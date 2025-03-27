import React, { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { SendHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

type MessageInputProps = {
  onSendMessage: (content: string) => void;
  onBotCommand?: (prompt: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onBotCommand,
  disabled = false,
  placeholder = "Type a message..."
}) => {
  const [message, setMessage] = useState('');
  const [isBotCommand, setIsBotCommand] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Detect if message includes "@bot"
    setIsBotCommand(message.includes('@bot'));
  }, [message]);

  useEffect(() => {
    console.log('ius bot: ', isBotCommand);
    
    // Detect if message includes "@bot"
    if (isBotCommand){
      setMessage(message + ' ');
    }
  }, [isBotCommand]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const sendMessage = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) {
      return;
    }

    const botCommandMatch = trimmedMessage.match(/@bot\s+(.+)/);
    if (botCommandMatch && botCommandMatch[1]) {
      const prompt = botCommandMatch[1].trim();
      if (onBotCommand) {
        onBotCommand(prompt);
      }
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
      return;
    }

    onSendMessage(trimmedMessage);
    setMessage('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="relative w-full">
      {isBotCommand && (
        <div 
          className="absolute -top-6 left-4 bg-gray-700 text-white text-xs font-medium px-2 py-1 rounded"
        >
          Asking to @bot
        </div>
      )}
      <div className="message-input-container flex items-center gap-2 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex-1 flex items-center">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "w-full resize-none bg-transparent",
              "pt-4 px-4 outline-none text-sm min-h-[3rem] max-h-[12rem]",
              "border-none focus:ring-0"
            )}
            rows={1}
          />
        </div>
        
        <Button
          onClick={sendMessage}
          disabled={!message.trim() || disabled}
          className="bg-indigo-500 text-white hover:bg-indigo-600 rounded-full p-2 aspect-square ml-auto"
        >
          <SendHorizontal className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;