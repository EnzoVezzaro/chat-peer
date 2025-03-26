
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export type User = {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away' | 'dnd';
};

export type Message = {
  id: string;
  content: string;
  senderId: string;
  timestamp: number;
  read: boolean;
};

export type Channel = {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  members: string[];
  messages: Message[];
};
