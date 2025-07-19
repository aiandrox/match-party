'use client';

import { Suspense } from 'react';
import { JoinRoomView } from './components';
import { useJoinRoomFacade } from './JoinRoom.facade';

function JoinRoomPageContent() {
  const {
    initialRoomCode,
    isLoading,
    error,
    joinRoom,
    navigateToHome,
  } = useJoinRoomFacade();

  return (
    <JoinRoomView
      initialRoomCode={initialRoomCode}
      onSubmit={joinRoom}
      onBack={navigateToHome}
      globalError={error}
      isGlobalLoading={isLoading}
    />
  );
}

export default function JoinRoomPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JoinRoomPageContent />
    </Suspense>
  );
}