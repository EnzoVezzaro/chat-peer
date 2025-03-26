
import { useState, useEffect, useCallback, useRef } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { toast } from 'sonner';
import { ConnectionStatus, Message, User } from '@/types/types';

type UsePeerConnectionProps = {
  userId: string;
  username: string;
};

type PeerMessage = {
  type: 'message' | 'user-info' | 'typing' | 'read';
  payload: any;
};

const usePeerConnection = ({ userId, username }: UsePeerConnectionProps) => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);

  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<Record<string, DataConnection>>({});

  // Initialize peer connection
  useEffect(() => {
    if (!userId) return;

    const initPeer = async () => {
      setStatus('connecting');
      
      try {
        const peer = new Peer(userId, {
          debug: 2,
        });

        peer.on('open', (id) => {
          console.log('My peer ID is: ' + id);
          setStatus('connected');
          
          // Add self to users list
          setUsers((prev) => [
            ...prev.filter(u => u.id !== userId),
            { id: userId, name: username, status: 'online' }
          ]);
          
          toast.success('Connected to server');
        });

        peer.on('connection', (conn) => {
          setupConnection(conn);
        });

        peer.on('error', (err) => {
          console.error('Peer connection error:', err);
          toast.error(`Connection error: ${err.message}`);
          setStatus('disconnected');
        });

        peer.on('disconnected', () => {
          console.log('Peer disconnected');
          setStatus('disconnected');
          toast.error('Disconnected from server');
        });

        peerRef.current = peer;
      } catch (error) {
        console.error('Failed to create peer:', error);
        setStatus('disconnected');
        toast.error('Failed to connect');
      }
    };

    initPeer();

    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, [userId, username]);

  // Set up connection handlers
  const setupConnection = useCallback((conn: DataConnection) => {
    const peerId = conn.peer;
    
    conn.on('open', () => {
      console.log('Connection established with', peerId);
      
      // Store the connection
      connectionsRef.current[peerId] = conn;
      setConnectedPeers((prev) => [...new Set([...prev, peerId])]);
      
      // Send user info
      sendToPeer(peerId, {
        type: 'user-info',
        payload: {
          id: userId,
          name: username,
          status: 'online'
        }
      });
    });

    conn.on('data', (data: PeerMessage) => {
      console.log('Received data:', data);
      
      switch (data.type) {
        case 'message':
          const messageData = data.payload as Message;
          setMessages((prev) => [...prev, messageData]);
          break;
        
        case 'user-info':
          const userData = data.payload as User;
          setUsers((prev) => [
            ...prev.filter(u => u.id !== userData.id),
            userData
          ]);
          break;
          
        case 'typing':
          // Handle typing indicator
          break;
          
        case 'read':
          // Handle read receipts
          break;
      }
    });

    conn.on('close', () => {
      console.log('Connection closed with', peerId);
      
      // Remove the connection
      delete connectionsRef.current[peerId];
      setConnectedPeers((prev) => prev.filter(id => id !== peerId));
      
      // Update user status
      setUsers((prev) => 
        prev.map(user => 
          user.id === peerId 
            ? { ...user, status: 'offline' } 
            : user
        )
      );
    });

    conn.on('error', (err) => {
      console.error('Connection error:', err);
      toast.error(`Connection error with peer: ${err}`);
    });
  }, [userId, username]);

  // Connect to a peer
  const connectToPeer = useCallback((peerId: string) => {
    if (!peerRef.current || peerId === userId) return;
    
    // Don't reconnect if already connected
    if (connectionsRef.current[peerId]) return;
    
    try {
      const conn = peerRef.current.connect(peerId);
      setupConnection(conn);
    } catch (error) {
      console.error('Failed to connect to peer:', error);
      toast.error(`Failed to connect to ${peerId}`);
    }
  }, [userId, setupConnection]);

  // Send data to a specific peer
  const sendToPeer = useCallback((peerId: string, data: PeerMessage) => {
    const conn = connectionsRef.current[peerId];
    if (conn && conn.open) {
      conn.send(data);
      return true;
    }
    return false;
  }, []);

  // Send data to all connected peers
  const broadcast = useCallback((data: PeerMessage) => {
    Object.values(connectionsRef.current).forEach(conn => {
      if (conn.open) {
        conn.send(data);
      }
    });
  }, []);

  // Send a message
  const sendMessage = useCallback((content: string) => {
    if (!content.trim() || status !== 'connected') return;
    
    const message: Message = {
      id: `${userId}-${Date.now()}`,
      content,
      senderId: userId,
      timestamp: Date.now(),
      read: false
    };
    
    // Add to local messages
    setMessages((prev) => [...prev, message]);
    
    // Send to all peers
    broadcast({
      type: 'message',
      payload: message
    });
    
    return message;
  }, [userId, status, broadcast]);

  // Disconnect from all peers and server
  const disconnect = useCallback(() => {
    if (peerRef.current) {
      Object.values(connectionsRef.current).forEach(conn => {
        conn.close();
      });
      
      peerRef.current.disconnect();
      setStatus('disconnected');
      connectionsRef.current = {};
      setConnectedPeers([]);
    }
  }, []);

  return {
    status,
    users,
    messages,
    connectedPeers,
    connectToPeer,
    sendMessage,
    disconnect
  };
};

export default usePeerConnection;
