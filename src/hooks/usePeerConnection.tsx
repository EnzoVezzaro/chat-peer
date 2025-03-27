import { useState, useEffect, useCallback, useRef } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { toast } from 'sonner';
import { ConnectionStatus, Message, User, Channel, Server } from '@/types/types';

type UsePeerConnectionProps = {
  userId: string;
  username: string;
};

type PeerMessage =
  | { type: 'message'; payload: Message & { channelId?: string } }
  | { type: 'user-info'; payload: User }
  | { type: 'typing'; payload: { userId: string; isTyping: boolean } }
  | { type: 'read'; payload: { messageId: string } }
  | { type: 'channel'; payload: Channel[] }
  | { type: 'server'; payload: Server[] }
  | { type: 'media-offer'; payload: { sdp: string; type: 'offer' } }
  | { type: 'media-answer'; payload: { sdp: string; type: 'answer' } }
  | { type: 'media-end'; payload: { userId: string } };

type PersonalChats = { [peerId: string]: Message[] };

const usePeerConnection = ({ userId, username }: UsePeerConnectionProps) => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [personalChats, setPersonalChats] = useState<PersonalChats>({});
  const [channels, setChannels] = useState<Channel[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [currentChannelId, setCurrentChannelId] = useState<string | null>(null);
  const [currentServerId, setCurrentServerId] = useState<string | null>(null);
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [userStreams, setUserStreams] = useState<{[userId: string]: MediaStream}>({});
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<Record<string, DataConnection>>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Default channels
  useEffect(() => {
    if (!channels.length) {
      const defaultChannels: Channel[] = [
        {
          id: 'general',
          name: 'general',
          description: 'General discussion',
          isPrivate: true,
          type: 'text',
          members: [],
          messages: []
        },
        {
          id: 'voice',
          name: 'Voice Chat',
          description: 'Voice channel',
          isPrivate: true,
          type: 'voice',
          members: [],
          messages: []
        },
        {
          id: 'announcements',
          name: 'Announcements',
          description: 'Important announcements',
          isPrivate: true,
          type: 'announcement',
          members: [],
          messages: []
        }
      ];
      
      setChannels(defaultChannels);
      setCurrentChannelId('general');
    }
  }, [channels.length]);

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

        peer.on('call', (call) => {
          // Answer incoming calls with local stream if available
          if (localStreamRef.current) {
            call.answer(localStreamRef.current);
          } else {
            // Try to get media if not available
            navigator.mediaDevices.getUserMedia({ video: true, audio: true })
              .then(stream => {
                localStreamRef.current = stream;
                call.answer(stream);
              })
              .catch(() => call.answer());
          }
          
          call.on('stream', (remoteStream) => {
            console.log('Received remote stream from', call.peer);
            setUserStreams(prev => ({
              ...prev,
              [call.peer]: remoteStream
            }));
          });

          call.on('close', () => {
            console.log('Call ended with', call.peer);
            setUserStreams(prev => {
              const newStreams = {...prev};
              delete newStreams[call.peer];
              return newStreams;
            });
          });
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
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
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
      
      // Send channel list
      if (channels.length > 0) {
        sendToPeer(peerId, {
          type: 'channel',
          payload: channels
        });
      }
      
      // Send server list
      if (servers.length > 0) {
        sendToPeer(peerId, {
          type: 'server',
          payload: servers
        });
      }
    });

    conn.on('data', (data: PeerMessage) => {
      console.log('Received data:', data);
      
      switch (data.type) {
        case 'message': {
          const messageData = data.payload as Message & { channelId?: string };
          setMessages((prev) => [...prev, messageData]);

          // Update channel messages
          setChannels(prev => prev.map(channel => {
            if (channel.id === messageData.channelId) {
              return {
                ...channel,
                messages: [...channel.messages, messageData]
              };
            }
            return channel;
          }));
          break;
        }
        case 'user-info': {
          const userData = data.payload as User;
          setUsers((prev) => [
            ...prev.filter(u => u.id !== userData.id),
            userData
          ]);
          break;
        }
          
        case 'typing': {
          const typingData = data.payload as { userId: string; isTyping: boolean };
          setUsers(prev => prev.map(user => {
            if (user.id === typingData.userId) {
              return { ...user, isTyping: typingData.isTyping };
            }
            return user;
          }));
          break;
        }
          
        case 'channel': {
          const channelData = data.payload as Channel[];
          setChannels(prev => {
            // Merge with existing channels
            const existingIds = new Set(prev.map(c => c.id));
            const newChannels = channelData.filter(c => !existingIds.has(c.id));
            return [...prev, ...newChannels];
          });
          console.log('here: channel receive: ', channels, channelData);
          
          break;
        }
          
        case 'server': {
          const serverData = data.payload as Server[];
          setServers(prev => {
            // Merge with existing servers
            const existingIds = new Set(prev.map(s => s.id));
            const newServers = serverData.filter(s => !existingIds.has(s.id));
            return [...prev, ...newServers];
          });
          break;
        }
          
        case 'media-offer': {
          // Handle media offer (for future implementation)
          break;
        }
          
        case 'media-answer': {
          // Handle media answer (for future implementation)
          break;
        }
          
        case 'media-end': {
          // Handle media end (for future implementation)
          break;
        }
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
  }, [userId, username, channels, currentChannelId, servers]);

  // Connect to a peer
  const connectToPeer = useCallback(async (peerId: string, channelId: string | null) => {
    if (!peerRef.current || peerId === userId) return;

    // Don't reconnect if already connected
    if (connectionsRef.current[peerId]) return;

    try {
      const conn = peerRef.current.connect(peerId);
      setupConnection(conn);
      toast.success(`Connecting to ${peerId}...`);

      // Ensure we have media before initiating call
      if (!localStreamRef.current && isVideoEnabled) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: isAudioEnabled 
          });
          localStreamRef.current = stream;
        } catch (error) {
          console.error('Failed to get media:', error);
        }
      }

      // Initiate call if we have a local stream
      if (localStreamRef.current) {
        const call = peerRef.current.call(peerId, localStreamRef.current);
        call.on('stream', (remoteStream) => {
          console.log('Received remote stream from call to', peerId);
          setUserStreams(prev => ({
            ...prev,
            [peerId]: remoteStream
          }));
        });
        
        call.on('close', () => {
          console.log('Call ended with', peerId);
          setUserStreams(prev => {
            const newStreams = {...prev};
            delete newStreams[peerId];
            return newStreams;
          });
        });
      }
    } catch (error) {
      console.error('Failed to connect to peer:', error);
      toast.error(`Failed to connect to ${peerId}`);
    }
  }, [userId, setupConnection, isVideoEnabled, isAudioEnabled]);

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
  const broadcast = useCallback((data: PeerMessage, isPrivate: boolean = false) => {
    if (isPrivate) return;
    Object.values(connectionsRef.current).forEach(conn => {
      if (conn.open) {
        conn.send(data);
      }
    });
  }, []);

  // Update channel
  const updateChannelPrivacy = (privacy: boolean) => {
    setChannels(prev => {
      return prev.map(channel => {
        if (channel.id === currentChannelId) {
          return {
            ...channel,
            isPrivate: privacy
          };
        }
        return channel;
      });
    });
  };

  // Send a message
  const sendMessage = useCallback((content: string, type: 'text' | 'image' | 'audio' | 'video' = 'text') => {
    if ((!content.trim() && type === 'text') || status !== 'connected') return;

    const message: Message = {
      id: `${userId}-${Date.now()}`,
      content,
      senderId: userId,
      timestamp: Date.now(),
      read: false,
      type
    };

    const currentChannel = channels.find((channel) => channel.id === currentChannelId);
    console.log('check room: ', currentChannel);

    // Shared chat
    setMessages((prev) => [...prev, message]);

    setChannels(prev => {
      return prev.map(channel => {
        if (channel.id === currentChannelId) {
          return {
            ...channel,
            messages: [...channel.messages, message]
          };
        }
        return channel;
      });
    });

    if (currentChannel && !currentChannel.isPrivate) {
      broadcast({
        type: 'message',
        payload: {
          ...message,
          channelId: currentChannelId
        }
      });
    }

    return message;
  }, [userId, status, broadcast, sendToPeer, currentChannelId, connectedPeers]);

  // Update typing status
  const updateTypingStatus = useCallback((isUserTyping: boolean) => {
    if (isTyping === isUserTyping) return;
    
    setIsTyping(isUserTyping);
    
    // Send typing status to peers
    broadcast({
      type: 'typing',
      payload: { userId, isTyping: isUserTyping }
    });
    
    // Clear previous timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Set timeout to clear typing status
    if (isUserTyping) {
      const timeout = setTimeout(() => {
        setIsTyping(false);
        broadcast({
          type: 'typing',
          payload: { userId, isTyping: false }
        });
      }, 3000);
      
      setTypingTimeout(timeout);
    }
  }, [isTyping, typingTimeout, broadcast, userId]);

  // Toggle audio
  const toggleAudio = useCallback(async () => {
    try {
      if (!localStreamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: isVideoEnabled });
        localStreamRef.current = stream;
        
        // Call all connected peers
        callAllPeers();
        
        setIsAudioEnabled(true);
        toast.success('Microphone enabled');
      } else {
        const audioTracks = localStreamRef.current.getAudioTracks();
        
        if (audioTracks.length > 0) {
          const isCurrentlyEnabled = audioTracks[0].enabled;
          audioTracks.forEach(track => {
            track.enabled = !isCurrentlyEnabled;
          });
          
          setIsAudioEnabled(!isCurrentlyEnabled);
          toast.success(isCurrentlyEnabled ? 'Microphone disabled' : 'Microphone enabled');
        } else {
          // No audio tracks, need to get new stream
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: isVideoEnabled });
          
          // Replace current stream
          if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
          }
          
          localStreamRef.current = stream;
          callAllPeers();
          
          setIsAudioEnabled(true);
          toast.success('Microphone enabled');
        }
      }
    } catch (error) {
      console.error('Error toggling audio:', error);
      toast.error('Failed to toggle microphone');
    }
  }, [isVideoEnabled]);

  // Toggle video
// Move callAllPeers above toggleVideo
const callAllPeers = useCallback(() => {
  if (!peerRef.current || !localStreamRef.current) return;
  
  connectedPeers.forEach(peerId => {
    try {
      const call = peerRef.current!.call(peerId, localStreamRef.current!);
      
      call.on('stream', (remoteStream) => {
        console.log('Received remote stream from', peerId);
        setUserStreams(prev => ({
          ...prev,
          [peerId]: remoteStream
        }));
      });
    } catch (error) {
      console.error('Error calling peer:', error);
    }
  });
}, [connectedPeers, peerRef, localStreamRef, setUserStreams]);

const toggleVideo = useCallback(async () => {
  try {
    if (!localStreamRef.current) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: isAudioEnabled, video: true });
      localStreamRef.current = stream;
      
      // Call all connected peers
      callAllPeers();
      
      setIsVideoEnabled(true);
      toast.success('Camera enabled');
    } else {
      const videoTracks = localStreamRef.current.getVideoTracks();
      
      if (videoTracks.length > 0) {
        const isCurrentlyEnabled = videoTracks[0].enabled;
        videoTracks.forEach(track => {
          track.enabled = !isCurrentlyEnabled;
        });
        
        setIsVideoEnabled(!isCurrentlyEnabled);
        toast.success(isCurrentlyEnabled ? 'Camera disabled' : 'Camera enabled');
      } else {
        // No video tracks, need to get new stream
        const stream = await navigator.mediaDevices.getUserMedia({ audio: isAudioEnabled, video: true });
        
        // Replace current stream
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => track.stop());
        }
        
        localStreamRef.current = stream;
        callAllPeers();
        
        setIsVideoEnabled(true);
        toast.success('Camera enabled');
      }
    }
  } catch (error) {
    console.error('Error toggling video:', error);
    toast.error('Failed to toggle camera');
  }
}, [isAudioEnabled, callAllPeers]);

  // Share screen
  const shareScreen = useCallback(async () => {
    try {
      if (isScreenSharing && screenStreamRef.current) {
        // Stop screen sharing
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
        setIsScreenSharing(false);
        toast.success('Screen sharing stopped');
        
        // Restore previous stream if available
        if (localStreamRef.current) {
          callAllPeers();
        }
      };
      
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      
      // Add event listener for when user stops sharing
      stream.getVideoTracks()[0].onended = () => {
        setIsScreenSharing(false);
        screenStreamRef.current = null;
        toast.success('Screen sharing stopped');
        
        // Restore previous stream if available
        if (localStreamRef.current) {
          callAllPeers();
        }
      };
      
      screenStreamRef.current = stream;
      setIsScreenSharing(true);
      toast.success('Screen sharing started');
      
      // Call all peers with screen share
      callAllPeersWithScreen();
      
    } catch (error) {
      console.error('Error sharing screen:', error);
      toast.error('Failed to share screen');
    }
  }, [isScreenSharing]);

  // Call all peers with screen share
  const callAllPeersWithScreen = useCallback(() => {
    if (!peerRef.current || !screenStreamRef.current) return;
    
    connectedPeers.forEach(peerId => {
      try {
        const call = peerRef.current!.call(peerId, screenStreamRef.current!);
        
        call.on('stream', (remoteStream) => {
          console.log('Received remote stream from', peerId);
          setUserStreams(prev => ({
            ...prev,
            [peerId]: remoteStream
          }));
        });
      } catch (error) {
        console.error('Error calling peer with screen:', error);
      }
    });
  }, [connectedPeers]);

  // Upload and share image
  const uploadImage = useCallback(async (file: File) => {
    try {
      if (!file) return;
      
      // Convert file to data URL
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          const imageDataUrl = event.target.result as string;
          
          // Send image message
          sendMessage(imageDataUrl, 'image');
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    }
  }, [sendMessage]);

  // Create a new channel
  const createChannel = useCallback((name: string, type: 'text' | 'voice' | 'announcement' = 'text') => {
    if (!name.trim()) return;
    
    const channel: Channel = {
      id: `channel-${Date.now()}`,
      name: name.trim(),
      description: `${name} channel`,
      isPrivate: true,
      type,
      members: [],
      messages: []
    };
    
    setChannels(prev => [...prev, channel]);
    setCurrentChannelId(channel.id);
    
    // Broadcast new channel
    broadcast({
      type: 'channel',
      payload: [channel]
    }, channel.isPrivate);
    
    toast.success(`Created ${type} channel: ${name}`);
    
    return channel;
  }, [broadcast]);

  // Create a new server (which is a channel)
  const createServer = useCallback((name: string) => {
    if (!name.trim()) return;
    
    // Create a channel instead
    return createChannel(name, 'text');
  }, [createChannel]);

  // Select channel
  const selectChannel = useCallback((channelId: string) => {
    setCurrentChannelId(channelId);
  }, []);

  // Select server (just a wrapper to keep API compatibility)
  const selectServer = useCallback((serverId: string) => {
    // Treat servers as channels
    selectChannel(serverId);
  }, [selectChannel]);

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
      
      // Stop media streams
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }
      
      setIsAudioEnabled(false);
      setIsVideoEnabled(false);
      setIsScreenSharing(false);
    }
  }, []);

  return {
    status,
    users,
    messages,
    channels,
    servers,
    currentChannelId,
    currentServerId,
    connectedPeers,
    userStreams,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    localStream: localStreamRef.current,
    connectToPeer,
    sendMessage,
    updateTypingStatus,
    toggleAudio,
    toggleVideo,
    shareScreen,
    uploadImage,
    createChannel,
    createServer,
    selectChannel,
    selectServer,
    updateChannelPrivacy,
    disconnect
  };
};

export default usePeerConnection;
