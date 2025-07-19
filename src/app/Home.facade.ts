'use client';

import { useRouter } from 'next/navigation';

export interface HomeFacade {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

export function useHomeFacade(): HomeFacade {
  const router = useRouter();

  const handleCreateRoom = () => {
    router.push('/create-room');
  };

  const handleJoinRoom = () => {
    router.push('/join-room');
  };

  return {
    onCreateRoom: handleCreateRoom,
    onJoinRoom: handleJoinRoom,
  };
}