
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Sidebar from '@/components/Sidebar';
import ServerList from '@/components/ServerList';
import ChannelList from '@/components/ChannelList';
import ChatArea from '@/components/ChatArea';
import ConnectionStatus from '@/components/ConnectionStatus';
import usePeerConnection from '@/hooks/usePeerConnection';
import { Server } from '@/types/types';

const Index = () => {
  const [isSetupDialogOpen, setIsSetupDialogOpen] = useState(true);
  const [isCreateChannelDialogOpen, setIsCreateChannelDialogOpen] = useState(false);
  const [isCreateServerDialogOpen, setIsCreateServerDialogOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');
  const [channelName, setChannelName] = useState('');
  const [channelType, setChannelType] = useState<'text' | 'voice' | 'announcement'>('text');
  const [serverName, setServerName] = useState('');

  // Initialize connection with generated or stored user ID and name
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedUsername = localStorage.getItem('username');
    
    if (storedUserId && storedUsername) {
      setUserId(storedUserId);
      setUsername(storedUsername);
      setIsSetupDialogOpen(false);
    } else {
      // Generate a new user ID
      setUserId(`user-${nanoid(8)}`);
    }
  }, []);

  const {
    status,
    users,
    messages,
    channels,
    servers,
    currentChannelId,
    currentServerId,
    isAudioEnabled,
    isVideoEnabled,
    connectToPeer,
    sendMessage,
    toggleAudio,
    toggleVideo,
    shareScreen,
    uploadImage,
    createChannel,
    createServer,
    selectChannel,
    selectServer
  } = usePeerConnection({
    userId,
    username: username || 'Anonymous'
  });

  const handleSubmitUsername = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast.error('Please enter a username');
      return;
    }
    
    // Save to local storage
    localStorage.setItem('userId', userId);
    localStorage.setItem('username', username);
    
    setIsSetupDialogOpen(false);
  };

  const handleCreateChannel = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!channelName.trim()) {
      toast.error('Please enter a channel name');
      return;
    }
    
    createChannel(channelName, channelType);
    setChannelName('');
    setIsCreateChannelDialogOpen(false);
  };

  const handleCreateServer = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!serverName.trim()) {
      toast.error('Please enter a server name');
      return;
    }
    
    createServer(serverName);
    setServerName('');
    setIsCreateServerDialogOpen(false);
  };

  const currentChannel = channels.find(c => c.id === currentChannelId);
  const currentServer = servers.find(s => s.id === currentServerId);
  
  // Filter messages to current channel
  const currentChannelMessages = currentChannel?.messages || [];

  return (
    <div className="chat-layout">
      {/* User setup dialog */}
      <Dialog open={isSetupDialogOpen} onOpenChange={setIsSetupDialogOpen}>
        <DialogContent className="sm:max-w-md glass-panel">
          <form onSubmit={handleSubmitUsername}>
            <DialogHeader>
              <DialogTitle>Welcome to Discord Clone</DialogTitle>
              <DialogDescription>
                Enter your username to get started with peer-to-peer messaging.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter your name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="user-id">Your Peer ID</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="user-id"
                    value={userId}
                    readOnly
                    className="bg-muted"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(userId);
                      toast.success('ID copied to clipboard');
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this ID with others to let them connect to you.
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="submit">Start chatting</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Create Channel Dialog */}
      <Dialog open={isCreateChannelDialogOpen} onOpenChange={setIsCreateChannelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateChannel}>
            <DialogHeader>
              <DialogTitle>Create Channel</DialogTitle>
              <DialogDescription>
                Add a new channel to your server.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="channel-name">Channel Name</Label>
                <Input
                  id="channel-name"
                  placeholder="e.g. general"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  autoFocus
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="channel-type">Channel Type</Label>
                <select 
                  id="channel-type" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={channelType}
                  onChange={(e) => setChannelType(e.target.value as any)}
                >
                  <option value="text">Text Channel</option>
                  <option value="voice">Voice Channel</option>
                  <option value="announcement">Announcement Channel</option>
                </select>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="secondary" type="button" onClick={() => setIsCreateChannelDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Channel</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Create Server Dialog */}
      <Dialog open={isCreateServerDialogOpen} onOpenChange={setIsCreateServerDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateServer}>
            <DialogHeader>
              <DialogTitle>Create Server</DialogTitle>
              <DialogDescription>
                Create a new server to chat with your friends.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="server-name">Server Name</Label>
                <Input
                  id="server-name"
                  placeholder="e.g. Gaming Server"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="secondary" type="button" onClick={() => setIsCreateServerDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Server</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Main chat interface */}
      {!isSetupDialogOpen && (
        <div className="flex h-screen overflow-hidden bg-[#313338]">
          {/* Server list */}
          <ServerList 
            servers={servers}
            currentServerId={currentServerId || undefined}
            currentUserId={userId}
            onSelectServer={selectServer}
            onCreateServer={() => setIsCreateServerDialogOpen(true)}
          />
          
          {/* Channel list */}
          <ChannelList 
            server={currentServer}
            channels={channels}
            currentChannelId={currentChannelId || undefined}
            onSelectChannel={selectChannel}
            onCreateChannel={() => setIsCreateChannelDialogOpen(true)}
            isAdmin={true}
          />
          
          {/* Chat area */}
          <ChatArea
            messages={currentChannelMessages}
            users={users}
            currentUserId={userId}
            currentChannel={currentChannel}
            onSendMessage={sendMessage}
            onToggleAudio={toggleAudio}
            onToggleVideo={toggleVideo}
            onShareScreen={shareScreen}
            onUploadImage={uploadImage}
            isConnected={status === 'connected'}
            isAudioEnabled={isAudioEnabled}
            isVideoEnabled={isVideoEnabled}
          />
          
          {/* Connection status */}
          <ConnectionStatus status={status} />
        </div>
      )}
    </div>
  );
};

export default Index;
