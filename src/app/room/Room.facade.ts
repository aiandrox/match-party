import { useEffect, useState, useMemo, useCallback } from "react";
import { Room } from "@/types";
import { getUserIdForRoom } from "@/lib/localStorage";

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

  // Get user ID with memoization
  const userId = useMemo(() => {
    return roomCode ? getUserIdForRoom(roomCode) : null;
  }, [roomCode]);

  // Room expiration check function (memoized)
  const checkRoomExpiration = useCallback((roomData: Room): boolean => {
    const now = new Date();
    const expiresAt = roomData.expiresAt instanceof Date 
      ? roomData.expiresAt 
      : new Date(roomData.expiresAt);
    return now > expiresAt;
  }, []);

  // Participant validation function (memoized)
  const isValidParticipant = useCallback((roomData: Room, userId: string | null): boolean => {
    return userId ? roomData.participants.some((p) => p.id === userId) : false;
  }, []);

  useEffect(() => {
    if (!roomCode) {
      setError("ルームコードが指定されていません");
      setIsLoading(false);
      return;
    }

    // Use memoized userId
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

        // Use optimized room validation functions
        if (checkRoomExpiration(roomData)) {
          setError("このルームは有効期限が切れています");
          setIsLoading(false);
          return;
        }

        if (!isValidParticipant(roomData, userId)) {
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
            // Use optimized validation functions
            if (checkRoomExpiration(updatedRoom)) {
              setError("このルームは有効期限が切れています");
              setRoom(null);
              return;
            }

            if (isValidParticipant(updatedRoom, userId)) {
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
  }, [roomCode, userId, checkRoomExpiration, isValidParticipant]);

  return { room, isLoading, error, currentUserId };
}