import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { User, Message, Channel } from '@/types/types';
import ChannelList from '@/components/ChannelList';
import ChatArea from '@/components/ChatArea';
import ConnectionStatus from '@/components/ConnectionStatus';
import VideoOverlay from '@/components/VideoOverlay';
import InviteDialog from '@/components/InviteDialog';
import SettingsDialog from '@/components/SettingsDialog'; // Import the new component
import usePeerConnection from '@/hooks/usePeerConnection';

const Index = () => {
  const [isSetupDialogOpen, setIsSetupDialogOpen] = useState(true);
  const [isCreateChannelDialogOpen, setIsCreateChannelDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false); // State for settings dialog
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');
  const [channelName, setChannelName] = useState('');
  const [channelType, setChannelType] = useState<'text' | 'voice' | 'announcement'>('text');
  const [storedData, setStoredData] = useState<{ users: User[]; messages: Message[]; channels: Channel[] }>({
    users: [],
    messages: [],
    channels: []
  });

  const {
    status,
    users,
    messages,
    channels,
    currentChannelId,
    isAudioEnabled,
    isVideoEnabled,
    localStream,
    userStreams,
    connectToPeer,
    sendMessage,
    toggleAudio,
    toggleVideo,
    shareScreen,
    uploadImage,
    createChannel,
    selectChannel,
    updateChannelPrivacy
  } = usePeerConnection({
    userId,
    username: username || 'Anonymous'
  });

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedUsername = localStorage.getItem('username');
    const storedDataString = localStorage.getItem('chatData');

    if (storedUserId && storedUsername) {
      setUserId(storedUserId);
      setUsername(storedUsername);
      setIsSetupDialogOpen(false);
    } else if (!userId) {
      setUserId(`user-${nanoid(8)}`);
    }

    if (storedDataString) {
      try {
        setStoredData(JSON.parse(storedDataString));
      } catch (error) {
        console.error('Error parsing chat data from localStorage:', error);
      }
    }
  }, [userId, users, messages, channels]);

  useEffect(() => {
    setStoredData({ users, messages, channels });
    localStorage.setItem('chatData', JSON.stringify({ users, messages, channels }));
  }, [users, messages, channels]);

  setTimeout(() => {
    console.log('store data: ', storedData);
  }, 2000);

  const handleSubmitUsername = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast.error('Please enter a username');
      return;
    }
    
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

  const handleOpenCreateChannel = (type: 'text' | 'voice' | 'announcement') => {
    setChannelType(type);
    setIsCreateChannelDialogOpen(true);
  };

  const handleOpenSettings = () => {
    setIsSettingsDialogOpen(true);
  };

  const currentChannel = channels.find(c => c.id === currentChannelId);
  
  const currentChannelMessages = currentChannel?.messages || [];

  return (
    <div className="chat-layout bg-[#313338]">
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
      
      <Dialog open={isCreateChannelDialogOpen} onOpenChange={setIsCreateChannelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateChannel}>
            <DialogHeader>
              <DialogTitle>Create {channelType.charAt(0).toUpperCase() + channelType.slice(1)} Channel</DialogTitle>
              <DialogDescription>
                Add a new {channelType} channel to your server.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="channel-name">Channel Name</Label>
                <Input
                  id="channel-name"
                  placeholder={channelType === 'text' ? 'e.g. general' : channelType === 'voice' ? 'e.g. Voice Chat' : 'e.g. Important Updates'}
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  autoFocus
                />
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
      
      <InviteDialog
        isOpen={isInviteDialogOpen}
        onClose={() => setIsInviteDialogOpen(false)}
        onInvite={(peerId) => {
          updateChannelPrivacy(false);
          connectToPeer(peerId, currentChannelId);
        }}
        currentUserId={userId}
      />
      
      {!isSetupDialogOpen && (
        <div className="flex h-screen w-full overflow-hidden bg-[#313338]">
          <ChannelList 
            channels={channels}
            currentChannelId={currentChannelId || undefined}
            onSelectChannel={selectChannel}
            onCreateChannel={handleOpenCreateChannel}
            onOpenSettings={handleOpenSettings} // Pass the handler
            isAdmin={true}
          />

          <SettingsDialog
            isOpen={isSettingsDialogOpen}
            onClose={() => setIsSettingsDialogOpen(false)}
            // No other props needed for now as it handles its own state via localStorage
          />

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
            onOpenInviteDialog={() => setIsInviteDialogOpen(true)}
            isConnected={status === 'connected'}
            isAudioEnabled={isAudioEnabled}
            isVideoEnabled={isVideoEnabled}
            statusConnection={status}
            localStream={localStream}
            userStreams={userStreams}
          />
        </div>
      )}
    </div>
  );
};

export default Index;
