'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export interface HomeFacade {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

export function useHomeFacade(): HomeFacade {
  const router = useRouter();

  const handleCreateRoom = useCallback(() => {
    router.push('/create-room');
  }, [router]);

  const handleJoinRoom = useCallback(() => {
    router.push('/join-room');
  }, [router]);

  return {
    onCreateRoom: handleCreateRoom,
    onJoinRoom: handleJoinRoom,
  };
}