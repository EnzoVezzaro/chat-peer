
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Sidebar from '@/components/Sidebar';
import ChatArea from '@/components/ChatArea';
import ConnectionStatus from '@/components/ConnectionStatus';
import usePeerConnection from '@/hooks/usePeerConnection';

const Index = () => {
  const [isSetupDialogOpen, setIsSetupDialogOpen] = useState(true);
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');

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
    connectToPeer,
    sendMessage
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

  return (
    <div className="chat-layout">
      {/* User setup dialog */}
      <Dialog open={isSetupDialogOpen} onOpenChange={setIsSetupDialogOpen}>
        <DialogContent className="sm:max-w-md glass-panel">
          <form onSubmit={handleSubmitUsername}>
            <DialogHeader>
              <DialogTitle>Welcome to Peer Chat</DialogTitle>
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
      
      {/* Main chat interface */}
      {!isSetupDialogOpen && (
        <>
          <Sidebar
            users={users}
            currentUserId={userId}
            onConnectToPeer={connectToPeer}
          />
          
          <ChatArea
            messages={messages}
            users={users}
            currentUserId={userId}
            onSendMessage={sendMessage}
            isConnected={status === 'connected'}
          />
          
          <ConnectionStatus status={status} />
        </>
      )}
    </div>
  );
};

export default Index;
