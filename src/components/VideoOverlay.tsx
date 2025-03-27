
import React from 'react';
import { User } from '@/types/types';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';

type VideoOverlayProps = {
  localStream: MediaStream | null;
  remoteStreams: {[userId: string]: MediaStream};
  users: User[];
  currentUserId: string;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
};

const VideoOverlay: React.FC<VideoOverlayProps> = ({
  localStream,
  remoteStreams,
  users,
  currentUserId,
  isAudioEnabled,
  isVideoEnabled,
  onToggleAudio,
  onToggleVideo
}) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  
  React.useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);
  
  const remoteStreamIds = Object.keys(remoteStreams);
  
  if (!localStream && remoteStreamIds.length === 0) {
    return null;
  }
  
  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Local video */}
      {localStream && (
        <div className="local-video relative rounded-lg overflow-hidden shadow-lg border border-[#2b2d31]">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-48 object-cover bg-black"
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-1">
            <button 
              onClick={onToggleAudio} 
              className="p-1 rounded-full bg-[#2b2d31] text-white"
            >
              {isAudioEnabled ? <Mic size={16} /> : <MicOff size={16} />}
            </button>
            <button 
              onClick={onToggleVideo} 
              className="p-1 rounded-full bg-[#2b2d31] text-white"
            >
              {isVideoEnabled ? <Video size={16} /> : <VideoOff size={16} />}
            </button>
          </div>
          <div className="absolute bottom-2 left-2 text-xs text-white bg-[#2b2d31] px-2 py-1 rounded">
            {users.find(u => u.id === currentUserId)?.name || 'You'} (You)
          </div>
        </div>
      )}
      
      {/* Remote videos (display up to 4 at a time) */}
      {remoteStreamIds.length > 0 && (
        <div className="remote-videos grid grid-cols-2 gap-2">
          {remoteStreamIds.slice(0, 4).map(userId => {
            const user = users.find(u => u.id === userId);
            return (
              <div key={userId} className="relative rounded-lg overflow-hidden shadow-lg border border-[#2b2d31]">
                <video
                  autoPlay
                  playsInline
                  className="w-48 h-36 object-cover bg-black"
                  ref={el => {
                    if (el) {
                      el.srcObject = remoteStreams[userId];
                    }
                  }}
                />
                <div className="absolute bottom-2 left-2 text-xs text-white bg-[#2b2d31] px-2 py-1 rounded">
                  {user?.name || userId}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VideoOverlay;
