'use client';

import { CreateRoomView } from './components';
import { useCreateRoomFacade } from './CreateRoom.facade';

export default function CreateRoomPage() {
  const {
    initialHostName,
    isLoading,
    error,
    createRoom,
    navigateToHome,
  } = useCreateRoomFacade();

  return (
    <CreateRoomView
      initialHostName={initialHostName}
      onSubmit={createRoom}
      onBack={navigateToHome}
      globalError={error}
      isGlobalLoading={isLoading}
    />
  );
}