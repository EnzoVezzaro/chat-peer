
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export type UserStatus = 'online' | 'offline' | 'away' | 'dnd';

export type User = {
  id: string;
  name: string;
  avatar?: string;
  status: UserStatus;
  isTyping?: boolean;
};

export type MessageType = 'text' | 'image' | 'audio' | 'video';

export type Message = {
  id: string;
  content: string;
  senderId: string;
  timestamp: number;
  read: boolean;
  type: MessageType;
  reactions?: { [emoji: string]: string[] }; // userId[]
};

export type Channel = {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  type: 'text' | 'voice' | 'announcement';
  members: string[];
  messages: Message[];
  icon?: string;
};

export type Server = {
  id: string;
  name: string;
  icon?: string;
  ownerId: string;
  channels: Channel[];
  members: string[];
};

export type MediaStream = {
  stream: MediaStream;
  userId: string;
  audio: boolean;
  video: boolean;
};
