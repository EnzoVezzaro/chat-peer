
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import usePeerConnection from '@/hooks/usePeerConnection';

type InviteDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (peerId: string, channelId?: string) => void;
  currentUserId: string;
};

const InviteDialog: React.FC<InviteDialogProps> = ({ 
  isOpen, 
  onClose, 
  onInvite,
  currentUserId
}) => {
  const [peerId, setPeerId] = useState('');

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!peerId.trim()) {
      toast.error('Please enter a peer ID');
      return;
    }
    
    if (peerId.trim() === currentUserId) {
      toast.error('Cannot invite yourself');
      return;
    }
    
    onInvite(peerId.trim(), currentUserId);
    setPeerId('');
    onClose(); 
  };

  const copyCurrentUserId = () => {
    navigator.clipboard.writeText(currentUserId);
    toast.success('Your ID copied to clipboard');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleInvite}>
          <DialogHeader>
            <DialogTitle>Invite Someone</DialogTitle>
            <DialogDescription>
              Enter the peer ID of the person you want to invite or share your ID with them.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="peer-id">Enter Peer ID</Label>
              <Input
                id="peer-id"
                placeholder="e.g. user-abc123"
                value={peerId}
                onChange={(e) => setPeerId(e.target.value)}
                autoFocus
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="your-id">Your Peer ID</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="your-id"
                  value={currentUserId}
                  readOnly
                  className="bg-muted"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyCurrentUserId}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this ID with others to let them connect to you.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" onClick={() => {
              onInvite(peerId, currentUserId);
              onClose();
            }}>Invite</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteDialog;
