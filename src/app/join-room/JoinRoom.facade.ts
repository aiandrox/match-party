import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getUserName, saveUserName } from '@/lib/localStorage';

export function useJoinRoomFacade() {
  const [roomCode, setRoomCode] = useState('');
  const [initialUserName, setInitialUserName] = useState('');
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

  // 前回入力した名前を復元
  useEffect(() => {
    setInitialUserName(getUserName());
  }, []);

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

      // 次回のために名前を保存
      saveUserName(userName);
      
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
    initialUserName,
    isLoading,
    error,
    joinRoom,
    navigateToHome,
  };
}