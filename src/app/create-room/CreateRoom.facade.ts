import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function useCreateRoomFacade() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const createRoom = async (hostName: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // 動的インポートでFirebase初期化を避ける
      const { createRoom } = await import('@/lib/roomService');
      const result = await createRoom(hostName);
      
      // userIdをlocalStorageに保存
      const { saveUserIdForRoom } = await import('@/lib/localStorage');
      saveUserIdForRoom(result.roomCode, result.hostUserId);
      
      // ルーム作成成功時にルームページへリダイレクト
      router.push(`/room?code=${result.roomCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ルームの作成に失敗しました');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToHome = () => {
    router.push('/');
  };

  return {
    isLoading,
    error,
    createRoom,
    navigateToHome,
  };
}