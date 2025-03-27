import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Message as MessageType, User, Channel } from '@/types/types';
import Message from './Message';
import MessageInput from './MessageInput';
import { Hash, Users, Video, Share, Mic, MicOff, VideoOff, PlusCircle } from 'lucide-react';
import VideoOverlay from './VideoOverlay';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ConnectionStatusComponent from './ConnectionStatus';
import { ConnectionStatus } from '../types/types';
import OpenAI from 'openai'; // Import OpenAI
import Anthropic from '@anthropic-ai/sdk'; // Import Anthropic SDK
import { toast } from 'sonner'; // Import toast for notifications
// Import shared types and constants from SettingsDialog
import { BotProvider, BotSettings, BOT_PROVIDERS } from './SettingsDialog';

// Updated helper function to parse settings from localStorage
const getBotSettings = (): BotSettings => {
  const storedSettingsString = localStorage.getItem('botSettings');
  // Default to the first provider in the list if nothing stored
  const defaultProvider = BOT_PROVIDERS[0]?.value || null;
  const defaultSettings: BotSettings = { keys: {}, selectedProvider: defaultProvider };
  try {
    const parsed = storedSettingsString ? JSON.parse(storedSettingsString) : defaultSettings;
    // Basic validation
    if (typeof parsed === 'object' && parsed !== null && 'keys' in parsed && 'selectedProvider' in parsed) {
      // Ensure selectedProvider is valid, default if not
      const validProviders = BOT_PROVIDERS.map(p => p.value);
      if (parsed.selectedProvider === null || !validProviders.includes(parsed.selectedProvider)) {
         // Use the first provider as default if saved one is invalid/null
         parsed.selectedProvider = defaultProvider;
      }
      return parsed as BotSettings;
    }
    console.warn("Invalid bot settings found in localStorage, using defaults.");
    return defaultSettings;
  } catch (e) {
    console.error("Failed to parse bot settings:", e);
    return defaultSettings;
  }
};

// Generic Bot Sender ID Prefix
const BOT_SENDER_ID_PREFIX = 'bot-';

// Helper to get display name using imported BOT_PROVIDERS
const getBotDisplayName = (provider: BotProvider | null): string => {
  if (!provider) return 'Bot';
  const providerInfo = BOT_PROVIDERS.find(p => p.value === provider);
  // Fallback to capitalized provider name if label not found
  return providerInfo ? providerInfo.label : `${provider.charAt(0).toUpperCase() + provider.slice(1)} Bot`;
};


type ChatAreaProps = {
  messages: MessageType[];
  users: User[];
  currentUserId: string;
  currentChannel?: Channel;
  onSendMessage: (content: string, type: 'text' | 'image' | 'audio' | 'video', peerId?: string) => void;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onShareScreen: () => void;
  onUploadImage: (file: File) => void;
  onOpenInviteDialog: () => void;
  isConnected: boolean;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  statusConnection: ConnectionStatus;
  localStream: MediaStream | null;
  userStreams: {[userId: string]: MediaStream};
};

// Type guard for OpenAI message params (needed for Claude conversion)
const isOpenAIMessageParam = (msg: unknown): msg is OpenAI.Chat.Completions.ChatCompletionMessageParam => {
  // Check if msg is an object and has the required properties
  return typeof msg === 'object' && msg !== null && 'role' in msg && 'content' in msg;
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
  isVideoEnabled,
  statusConnection,
  localStream,
  userStreams
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sortedMessages, setSortedMessages] = useState<MessageType[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Store streaming message content temporarily, mapping ID to { content, provider }
  const [streamingBotMessages, setStreamingBotMessages] = useState<Record<string, { content: string; provider: BotProvider }>>({});

  useEffect(() => {
    // Filter out potential bot typing indicators if needed, or handle them separately
    const userMessages = messages; //.filter(msg => msg.senderId !== BOT_SENDER_ID || msg.type !== 'typing');
    console.log('userMessages: ', userMessages);
    
    const sorted = [...userMessages].sort((a, b) => a.timestamp - b.timestamp);
    setSortedMessages(sorted);
  }, [messages]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [sortedMessages, streamingBotMessages]); // Add streamingBotMessages dependency

  const groupedMessages = (messageList: MessageType[]) => {
    return messageList.reduce<{
      messages: MessageType[];
      showAvatar: boolean[];
    }>(
      (acc, message, index) => {
        acc.messages.push(message);

        const prevMessage = messageList[index - 1];
        const showAvatar = !prevMessage ||
          prevMessage.senderId !== message.senderId ||
          message.timestamp - prevMessage.timestamp > 300000; // 5 minutes

        acc.showAvatar.push(showAvatar);

        return acc;
      },
      { messages: [], showAvatar: [] }
    );
  };

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

  // Generic function to stream bot response
  const streamBotResponse = async (provider: BotProvider, apiKey: string, history: OpenAI.Chat.Completions.ChatCompletionMessageParam[]) => {
    const botMessageId = `${BOT_SENDER_ID_PREFIX}${provider}-${Date.now()}`; // Unique ID including provider
    const botSenderId = `${BOT_SENDER_ID_PREFIX}${provider}`; // Sender ID for the final message
    let accumulatedContent = '';
    // Store initial placeholder with provider info
    setStreamingBotMessages(prev => ({ ...prev, [botMessageId]: { content: '...', provider: provider } }));

    // Retrieve bot settings, including the selected model
    const settings = getBotSettings();
    const selectedModel = settings.keys[provider]?.model || 'gpt-3.5-turbo';

    try {
      // --- OpenAI Implementation ---
      if (provider === 'openai') {
        const openai = new OpenAI({
          apiKey: apiKey,
          dangerouslyAllowBrowser: true,
        });
        const stream = await openai.chat.completions.create({
          model: selectedModel,
          messages: history,
          stream: true,
        });

        for await (const chunk of stream) {
          const contentDelta = chunk.choices[0]?.delta?.content || '';
          if (contentDelta) {
            accumulatedContent += contentDelta;
            setStreamingBotMessages(prev => ({ ...prev, [botMessageId]: { content: accumulatedContent, provider: provider } }));
          }
        }
      }
      // --- Groq Implementation (using fetch, OpenAI compatible) ---
      else if (provider === 'groq') {
        const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
        const response = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: history,
            model: selectedModel, // Use selected model
            stream: true,
          }),
        });
        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(`Groq API Error (${response.status}): ${errorBody?.error?.message || response.statusText}`);
        }
        if (!response.body) throw new Error('Groq response body is null');
        // Process stream (SSE format)
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.substring(6).trim();
              if (data === '[DONE]') break;
              try {
                const chunk = JSON.parse(data);
                const contentDelta = chunk.choices?.[0]?.delta?.content || '';
                if (contentDelta) {
                  accumulatedContent += contentDelta;
                  setStreamingBotMessages(prev => ({ ...prev, [botMessageId]: { content: accumulatedContent, provider: provider } }));
                }
              } catch (e) { console.error('Error parsing Groq stream chunk:', data, e); }
            }
          }
        }
      }
      // --- Claude Implementation (using SDK) ---
      else if (provider === 'claude') {
        const anthropic = new Anthropic({ apiKey });
        let systemPrompt = "You are a helpful assistant.";
        const messagesForClaude: Anthropic.Messages.MessageParam[] = [];
        let lastRole: 'user' | 'assistant' | null = null;

        // Convert history, ensuring alternating roles and string content
        history.forEach(msg => {
          if (!isOpenAIMessageParam(msg) || typeof msg.content !== 'string') return; // Skip non-text/invalid format

          if (msg.role === 'system') {
            systemPrompt = msg.content;
            return;
          }

          const currentRole = msg.role === 'assistant' ? 'assistant' : 'user'; // Map roles

          if (currentRole !== lastRole) {
            messagesForClaude.push({ role: currentRole, content: msg.content });
            lastRole = currentRole;
          } else {
            // Append to last message if same role (Claude doesn't like consecutive)
            const lastMsg = messagesForClaude[messagesForClaude.length - 1];
            if (lastMsg) {
              lastMsg.content += `\n${msg.content}`;
            }
          }
        });

        // Ensure the conversation ends with a user message if the last formatted message was assistant
        if (lastRole === 'assistant' && messagesForClaude.length > 0) {
           messagesForClaude.push({ role: 'user', content: '(Implicit turn)' }); // Add placeholder user turn
        }
        // Handle empty history after filtering
        if (messagesForClaude.length === 0 && history.length > 0) {
            const lastOriginalMsg = history[history.length - 1];
            if (isOpenAIMessageParam(lastOriginalMsg) && typeof lastOriginalMsg.content === 'string' && lastOriginalMsg.role === 'user') {
                 messagesForClaude.push({ role: 'user', content: lastOriginalMsg.content });
            } else {
                 messagesForClaude.push({ role: 'user', content: '(Starting prompt)' });
            }
        }


        if (messagesForClaude.length === 0) {
            throw new Error("Cannot start Claude conversation without a user message.");
        }

        const stream = await anthropic.messages.create({
          model: selectedModel,
          max_tokens: 1024,
          messages: messagesForClaude,
          system: systemPrompt,
          stream: true,
        });

        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            accumulatedContent += event.delta.text;
            setStreamingBotMessages(prev => ({ ...prev, [botMessageId]: { content: accumulatedContent, provider: provider } }));
          }
        }
      }
       // --- Grok (xAI) Implementation (using fetch) ---
       else if (provider === 'grok') {
        const GROK_XAI_API_URL = 'https://api.x.ai/v1/chat/completions';
        const response = await fetch(GROK_XAI_API_URL, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: history,
            model: selectedModel,
            stream: true,
          }),
        });
        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(`Grok (xAI) API Error (${response.status}): ${errorBody?.error?.message || response.statusText}`);
        }
        if (!response.body) throw new Error('Grok (xAI) response body is null');
        // Process stream (SSE format assumed)
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.substring(6).trim();
              if (data === '[DONE]') break;
              try {
                const chunk = JSON.parse(data);
                // Adjust path based on actual Grok (xAI) response structure if needed
                const contentDelta = chunk.choices?.[0]?.delta?.content || '';
                if (contentDelta) {
                  accumulatedContent += contentDelta;
                  setStreamingBotMessages(prev => ({ ...prev, [botMessageId]: { content: accumulatedContent, provider: provider } }));
                }
              } catch (e) { console.error('Error parsing Grok (xAI) stream chunk:', data, e); }
            }
          }
        }
       }
       // --- Handle Unknown Provider ---
      else {
        throw new Error(`Unsupported bot provider: ${provider}`);
      }

      // --- Final Message Handling ---
      if (accumulatedContent && !accumulatedContent.startsWith("[")) { // Don't send placeholder messages
        console.log('isse here: ', botSenderId);
        
         onSendMessage(accumulatedContent, 'text', botSenderId); // Use provider-specific sender ID
      } else if (!accumulatedContent) {
         toast.info("Bot stream finished with no content.");
      }

    } catch (error: unknown) {
      console.error(`${provider} API Stream Error:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Streaming failed';
      toast.error(`Bot Error: ${errorMessage}`);
    } finally {
       // Remove the temporary message from state after sending the final one
       setStreamingBotMessages(prev => {
         const newState = { ...prev };
         delete newState[botMessageId];
         return newState;
       });
    }
  };

   // Handles regular messages
  const handleSendMessage = (content: string, type: 'text' | 'image' | 'audio' | 'video' = 'text') => {
    onSendMessage(content, type);
    // Bot logic is now handled by handleBotCommand
  };

   // Handles the @bot <prompt> command
   const handleBotCommand = (prompt: string) => {
      // Send the user's prompt message first for context
      onSendMessage(`@bot ${prompt}`, 'text');

      const settings = getBotSettings();
      const selectedProvider = settings.selectedProvider;

      if (!selectedProvider) {
        toast.error("No bot provider selected. Please check Settings.");
        return;
      }

      const apiKey = settings.keys[selectedProvider]?.apiKey;

      if (!apiKey) {
        const providerLabel = getBotDisplayName(selectedProvider); // Use helper for name
        toast.error(`API key for ${providerLabel} not configured. Please set it in Settings.`);
        return;
      }

      // Format chat history (last N messages, excluding the current prompt message)
      const historyLength = 10;
      const recentMessages = sortedMessages.slice(-historyLength);

      // Map history, identifying bot responses by prefix and filtering for text messages
      const formattedHistory: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = recentMessages
        .filter(msg => msg.type === 'text' && typeof msg.content === 'string') // Ensure it's a text message with string content
        .map(msg => ({
          role: msg.senderId === currentUserId ? 'user' : (msg.senderId.startsWith(BOT_SENDER_ID_PREFIX) ? 'assistant' : 'user'),
          // We know content is string here due to the filter
          content: msg.content as string,
        }));

      // Add the user's current prompt
      formattedHistory.push({ role: 'user', content: prompt });

      // Call the generic streaming function
      streamBotResponse(selectedProvider, apiKey, formattedHistory);
   };


   const typingUsers = users.filter(user =>
    user.id !== currentUserId &&
    user.isTyping
  );

  const isRoomFull = users.length === 2 // TODO: find a way to have multiple users on the same chatroom

  return (
    <div className="chat-area flex-1 flex flex-col h-full">
      <div className="channel-header h-12 border-b border-[#1e1f22] bg-[#313338] flex items-center px-4 shadow-sm">
        {currentChannel && (
          <>
            <Hash className="h-5 w-5 mr-2 text-gray-400" />
            <h2 className="font-semibold text-white">{currentChannel.name}</h2>

            <div className="ml-auto flex items-center gap-4">
              <ConnectionStatusComponent status={statusConnection} />
              {/* Video/Audio/ScreenShare Buttons... */}
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
                     <Button variant="ghost" disabled={isRoomFull} size="icon" onClick={onOpenInviteDialog}>
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

      <div className="flex flex-1 overflow-hidden">
        <div className="message-list flex-1 overflow-y-auto p-4 space-y-4 bg-[#313338]">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Hash className="h-16 w-16 mb-4 text-gray-600" />
            <h3 className="text-2xl font-bold text-white mb-2">Welcome to #{currentChannel?.name || 'the channel'}!</h3>
            <p className="text-sm">This is the start of the #{currentChannel?.name || 'channel'} channel.</p>
          </div>
        ) : (
          groupedMessages(messages).messages.map((message, index) => {
            let sender = users.find(u => u.id === message.senderId) || {
              id: message.senderId,
              name: 'Unknown User',
              status: 'offline' as const
            };
            
            console.log('message: ', message.content);            
            
            // Dynamic handling for bot sender based on ID prefix
            if (message.senderId.startsWith(BOT_SENDER_ID_PREFIX)) {
               const providerValue = message.senderId.substring(BOT_SENDER_ID_PREFIX.length) as BotProvider;
               sender = { id: message.senderId, name: getBotDisplayName(providerValue), status: 'online' }; // Use helper
            }         

            return (
              <Message
                key={message.id}
                message={message}
                sender={sender}
                isCurrentUser={message.senderId === currentUserId}
                showAvatar={groupedMessages(sortedMessages).showAvatar[index]}
              />
            );
          })
        )}

        {/* Render temporary streaming messages with dynamic names */}
        {Object.entries(streamingBotMessages).map(([id, { content, provider }]) => { // Destructure provider
           const senderId = `${BOT_SENDER_ID_PREFIX}${provider}`;
           const displayName = getBotDisplayName(provider); // Use helper

           return (
             <Message
               key={id}
               // Ensure the temporary message object matches the MessageType structure
               message={{
                 id: id,
                 content: content,
                 senderId: senderId,
                 timestamp: Date.now(),
                 type: 'text',
                 read: true // Added missing 'read' property
               }}
               sender={{ id: senderId, name: displayName, status: 'online' }}
               isCurrentUser={false}
               showAvatar={true}
             />
           );
        })}


        {/* Typing indicators for users (Bot typing is handled by streaming message) */}
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

        {/* Video Sidebar */}
        <div className={cn(
          "video-sidebar border-l border-[#1e1f22] bg-[#2b2d31] p-2 overflow-y-auto relative transition-all duration-300 ease-in-out",
          isVideoEnabled ? "translate-x-0" : "translate-x-full"
        )}>
          <button
            className="absolute top-2 right-2 z-50 p-2 rounded-full bg-[#2b2d31] hover:bg-[#404348] shadow-lg"
            onClick={onToggleVideo}
            aria-label="Close video"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          {isVideoEnabled && (
            <VideoOverlay
              localStream={localStream}
              remoteStreams={userStreams}
              users={users}
              currentUserId={currentUserId}
              isAudioEnabled={isAudioEnabled}
              isVideoEnabled={isVideoEnabled}
              onToggleAudio={onToggleAudio}
              onToggleVideo={onToggleVideo}
            />
          )}
        </div>
      </div>

      {/* Message Input Area */}
      <div className="message-input-container p-4 pr-6 bg-[#313338]">
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
            onSendMessage={(content) => handleSendMessage(content, 'text')}
            onBotCommand={handleBotCommand} // Pass the correct handler
            disabled={!isConnected}
            placeholder={
              isConnected
                ? `Message #${currentChannel?.name || 'channel'} or use @bot <prompt>...`
                : "Connect to send messages..."
            }
          />
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
