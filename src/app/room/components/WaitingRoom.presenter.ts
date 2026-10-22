import { useState, useCallback, useMemo } from "react";
import { GameMode, Room } from "@/types";
import { GAME_MODE_OPTIONS, GameModeDefinition, getGameModeDefinition } from "@/lib/gameMode";

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
  gameMode: GameModeDefinition;
  modeOptions: readonly GameModeDefinition[];
  isChangingMode: boolean;
  changeMode: (_mode: GameMode) => Promise<void>;
  copyInviteUrl: () => Promise<void>;
  inviteUrl?: string;
  isCurrentUser: (_participantId: string) => boolean;
  participantList: Array<{
    id: string;
    name: string;
    isHost: boolean;
    hasAnswered: boolean;
    isCurrentUser: boolean;
  }>;
  participantCount: number;
}

export function useWaitingRoomPresenter({
  room,
  currentUserId,
}: UseWaitingRoomPresenterProps): UseWaitingRoomPresenterReturn {
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [inviteUrlCopySuccess, setInviteUrlCopySuccess] = useState(false);
  const [isChangingMode, setIsChangingMode] = useState(false);

  // 現在のゲームモード（未設定は一致モード）
  const gameMode = getGameModeDefinition(room.mode);

  // メモ化された参加者リスト（パフォーマンス最適化）
  const participantList = useMemo(() => 
    room.participants.map(p => ({ 
      ...p, 
      isCurrentUser: p.id === currentUserId,
    })),
    [room.participants, currentUserId]
  );

  const participantCount = useMemo(() => room.participants.length, [room.participants]);
  
  const isHost = useMemo(() => 
    room.participants.some((p) => p.id === currentUserId && p.isHost),
    [room.participants, currentUserId]
  );
  
  const canStartGame = useMemo(() => 
    room.participants.length >= 2,
    [room.participants.length]
  );

  const startGame = useCallback(async () => {
    if (!isHost || !canStartGame || isStartingGame) return;

    setIsStartingGame(true);
    try {
      // Preload audio files for better game performance
      const { preloadGameAudio } = await import("@/lib/gameEffects");
      preloadGameAudio();
      
      const { startGame: startGameService } = await import("@/lib/roomService");
      await startGameService(room.id);
    } catch (error) {
      console.error("ゲーム開始エラー:", error);
    } finally {
      setIsStartingGame(false);
    }
  }, [room.id, isHost, canStartGame, isStartingGame]);

  // ゲームモード変更（主催者・待機中のみ）
  const changeMode = useCallback(
    async (mode: GameMode) => {
      if (!isHost || isChangingMode || isStartingGame || mode === gameMode.mode) return;

      setIsChangingMode(true);
      try {
        const { changeRoomMode } = await import("@/lib/roomService");
        await changeRoomMode(room.id, mode);
      } catch (error) {
        console.error("ゲームモードの変更に失敗しました:", error);
      } finally {
        setIsChangingMode(false);
      }
    },
    [room.id, isHost, isChangingMode, isStartingGame, gameMode.mode]
  );

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
    gameMode,
    modeOptions: GAME_MODE_OPTIONS,
    isChangingMode,
    changeMode,
    copyInviteUrl,
    inviteUrl,
    isCurrentUser,
    participantList,
    participantCount,
  };
}
