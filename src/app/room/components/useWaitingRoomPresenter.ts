import { useState, useCallback } from "react";
import { Room } from "@/types";

interface UseWaitingRoomPresenterProps {
  room: Room;
  currentUserId: string | null;
}

interface UseWaitingRoomPresenterReturn {
  isStartingGame: boolean;
  copySuccess: boolean;
  isHost: boolean;
  canStartGame: boolean;
  startGame: () => Promise<void>;
  copyRoomCode: () => Promise<void>;
}

export function useWaitingRoomPresenter({
  room,
  currentUserId
}: UseWaitingRoomPresenterProps): UseWaitingRoomPresenterReturn {
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

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

  const copyRoomCode = useCallback(async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(room.code);
      } else {
        // フォールバック：execCommandを使用
        const textArea = document.createElement("textarea");
        textArea.value = room.code;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("コピーに失敗しました:", error);
    }
  }, [room.code]);

  return {
    isStartingGame,
    copySuccess,
    isHost,
    canStartGame,
    startGame,
    copyRoomCode
  };
}