
import React from 'react';
import { User } from '@/types/types';

type SidebarProps = {
  users: User[];
  currentUserId: string;
  onConnectToPeer: (peerId: string) => void;
};

// Empty sidebar component as it's no longer needed
const Sidebar: React.FC<SidebarProps> = () => {
  return null;
};

export default Sidebar;
