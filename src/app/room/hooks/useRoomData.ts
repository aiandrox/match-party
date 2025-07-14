import { useEffect, useState } from "react";
import { Room } from "@/types";

interface UseRoomDataReturn {
  room: Room | null;
  isLoading: boolean;
  error: string | null;
  currentUserId: string | null;
}

export function useRoomData(roomCode: string): UseRoomDataReturn {
  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!roomCode) {
      setError("ルームコードが指定されていません");
      setIsLoading(false);
      return;
    }

    // localStorageからユーザーIDを取得
    const userId = localStorage.getItem(`userId_${roomCode}`);
    setCurrentUserId(userId);

    let unsubscribe: (() => void) | undefined;

    const loadRoom = async () => {
      try {
        // userIdが取得できない場合はルーム情報を表示しない
        if (!userId) {
          setError("このルームへの参加権限が確認できません");
          setIsLoading(false);
          return;
        }

        // 動的インポートでFirebase初期化を避ける
        const { getRoomByCode } = await import("@/lib/roomService");
        const roomData = await getRoomByCode(roomCode);
        if (!roomData) {
          setError("ルームが見つかりません");
          setIsLoading(false);
          return;
        }

        // ルームの有効期限をチェック
        const now = new Date();
        const expiresAt =
          roomData.expiresAt instanceof Date ? roomData.expiresAt : new Date(roomData.expiresAt);

        if (now > expiresAt) {
          setError("このルームは有効期限が切れています");
          setIsLoading(false);
          return;
        }

        // ユーザーがルームの参加者として存在するかチェック
        const isParticipant = roomData.participants.some((p) => p.id === userId);
        if (!isParticipant) {
          setError("このルームへの参加権限がありません");
          setIsLoading(false);
          return;
        }

        setRoom(roomData);
        setIsLoading(false);

        // リアルタイム更新の監視を開始
        const { subscribeToRoom } = await import("@/lib/roomService");
        unsubscribe = subscribeToRoom(roomData.id, (updatedRoom) => {
          if (updatedRoom) {
            // 有効期限の再チェック
            const now = new Date();
            const expiresAt =
              updatedRoom.expiresAt instanceof Date ? updatedRoom.expiresAt : new Date(updatedRoom.expiresAt);

            if (now > expiresAt) {
              setError("このルームは有効期限が切れています");
              setRoom(null);
              return;
            }

            // 参加者として存在するかチェック
            const isParticipant = updatedRoom.participants.some((p) => p.id === userId);
            if (isParticipant) {
              setRoom(updatedRoom);
            } else {
              setError("ルームから退出されました");
              setRoom(null);
            }
          } else {
            setError("ルームが削除されました");
            setRoom(null);
          }
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "ルームの読み込みに失敗しました");
        setIsLoading(false);
      }
    };

    loadRoom();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [roomCode]);

  return { room, isLoading, error, currentUserId };
}