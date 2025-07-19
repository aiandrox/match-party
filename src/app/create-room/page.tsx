'use client';

import { CreateRoomView } from './components';
import { useCreateRoomFacade } from './CreateRoom.facade';

export default function CreateRoomPage() {
  const {
    isLoading,
    error,
    createRoom,
    navigateToHome,
  } = useCreateRoomFacade();

  return (
    <CreateRoomView
      onSubmit={createRoom}
      onBack={navigateToHome}
      globalError={error}
      isGlobalLoading={isLoading}
    />
  );
}