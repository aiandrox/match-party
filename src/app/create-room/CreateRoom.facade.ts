import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { getUserName, saveUserName } from '@/lib/localStorage';

export function useCreateRoomFacade() {
  const [initialHostName, setInitialHostName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // 前回入力した名前を復元
  useEffect(() => {
    setInitialHostName(getUserName());
  }, []);

  const createRoom = useCallback(async (hostName: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // 動的インポートでFirebase初期化を避ける
      const { createRoom } = await import('@/lib/roomService');
      const result = await createRoom(hostName);
      
      // userIdをlocalStorageに保存
      const { saveUserIdForRoom } = await import('@/lib/localStorage');
      saveUserIdForRoom(result.roomCode, result.hostUserId);

      // 次回のために名前を保存
      saveUserName(hostName);

      // ルーム作成成功時にルームページへリダイレクト
      router.push(`/room?code=${result.roomCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ルームの作成に失敗しました');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const navigateToHome = useCallback(() => {
    router.push('/');
  }, [router]);

  return {
    initialHostName,
    isLoading,
    error,
    createRoom,
    navigateToHome,
  };
}