import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function useJoinRoomFacade() {
  const [roomCode, setRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // URLのクエリパラメータから部屋番号を取得
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setRoomCode(codeFromUrl.toUpperCase());
    }
  }, [searchParams]);

  const joinRoom = useCallback(async (roomCode: string, userName: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // 動的インポートでFirebase初期化を避ける
      const { joinRoom } = await import('@/lib/roomService');
      const result = await joinRoom(roomCode, userName);
      
      // userIdをlocalStorageに保存
      const { saveUserIdForRoom } = await import('@/lib/localStorage');
      saveUserIdForRoom(roomCode, result.userId);
      
      // ルーム参加成功時にルームページへリダイレクト
      router.push(`/room?code=${roomCode}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ルームへの参加に失敗しました';
      setError(errorMessage);
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const navigateToHome = useCallback(() => {
    router.push('/');
  }, [router]);

  return {
    initialRoomCode: roomCode,
    isLoading,
    error,
    joinRoom,
    navigateToHome,
  };
}