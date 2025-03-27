import React, { useState, useRef, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { SendHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

type MessageInputProps = {
  onSendMessage: (content: string) => void;
  onBotCommand?: (prompt: string) => void; // Renamed prop for sending prompt
  disabled?: boolean;
  placeholder?: string;
};

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onBotCommand, // Use the new prop
  disabled = false,
  placeholder = "Type a message or use @bot <prompt>..." // Updated placeholder
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const sendMessage = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) {
      return; // Do nothing if message is empty or input is disabled
    }

    // Check for bot command: @bot <prompt>
    const botCommandMatch = trimmedMessage.match(/^@bot\s+(.+)/);
    if (botCommandMatch && botCommandMatch[1]) {
      const prompt = botCommandMatch[1].trim();
      if (onBotCommand) {
        onBotCommand(prompt);
      } else {
        console.warn('@bot command detected but no onBotCommand handler provided.');
      }
      setMessage(''); // Clear input after command
      // Refocus textarea
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
      return; // Don't send the command itself as a regular message
    }

    // If it's not a bot command, send the message normally
    onSendMessage(trimmedMessage);
    setMessage('');

    // Refocus textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }; // <-- Moved this closing brace up

  return (
    <div className="message-input-container flex gap-2 items-end">
      <div className="flex-1 bg-secondary rounded-lg overflow-hidden flex">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full resize-none bg-transparent py-3 px-4 outline-none",
            "focus:ring-0 border-none text-sm min-h-[3rem] max-h-[12rem]",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          rows={1}
        />
      </div>

      <Button
        onClick={sendMessage}
        disabled={!message.trim() || disabled}
        className={cn(
          "aspect-square p-2 rounded-full",
          !message.trim() && "opacity-50 cursor-not-allowed",
        )}
      >
        <SendHorizontal className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default MessageInput;
