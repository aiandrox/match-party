import { useState, useCallback } from "react";
import { Room } from "@/types";

interface UseWaitingRoomPresenterProps {
  room: Room;
  currentUserId: string | null;
}

interface UseWaitingRoomPresenterReturn {
  isStartingGame: boolean;
  inviteUrlCopySuccess: boolean;
  isHost: boolean;
  canStartGame: boolean;
  startGame: () => Promise<void>;
  copyInviteUrl: () => Promise<void>;
  inviteUrl?: string;
  isCurrentUser: (_participantId: string) => boolean;
}

export function useWaitingRoomPresenter({
  room,
  currentUserId,
}: UseWaitingRoomPresenterProps): UseWaitingRoomPresenterReturn {
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [inviteUrlCopySuccess, setInviteUrlCopySuccess] = useState(false);

  const isHost = room.participants.some((p) => p.id === currentUserId && p.isHost);
  const canStartGame = room.participants.length >= 2;

  const startGame = useCallback(async () => {
    if (!isHost || !canStartGame || isStartingGame) return;

    setIsStartingGame(true);
    try {
      const { startGame: startGameService } = await import("@/lib/roomService");
      await startGameService(room.id);
    } catch (error) {
      console.error("ゲーム開始エラー:", error);
    } finally {
      setIsStartingGame(false);
    }
  }, [room.id, isHost, canStartGame, isStartingGame]);

  // 招待URL生成
  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join-room?code=${room.code}`
      : undefined;

  // ユーザー識別関数
  const isCurrentUser = useCallback(
    (participantId: string) => {
      return participantId === currentUserId;
    },
    [currentUserId]
  );

  const copyInviteUrl = useCallback(async () => {
    if (!inviteUrl) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(inviteUrl);
      } else {
        // フォールバック：レガシーAPI使用（非推奨だが古いブラウザサポート用）
        const textArea = document.createElement("textarea");
        textArea.value = inviteUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setInviteUrlCopySuccess(true);
      setTimeout(() => setInviteUrlCopySuccess(false), 2000);
    } catch (error) {
      console.error("招待URLのコピーに失敗しました:", error);
    }
  }, [inviteUrl]);

  return {
    isStartingGame,
    inviteUrlCopySuccess,
    isHost,
    canStartGame,
    startGame,
    copyInviteUrl,
    inviteUrl,
    isCurrentUser,
  };
}
