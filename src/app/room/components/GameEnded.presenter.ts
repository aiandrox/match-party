import { useState, useEffect, useCallback } from "react";
import { Room } from "@/types";

interface UseGameEndedPresenterProps {
  room: Room;
  currentUserId: string | null;
}

interface UseGameEndedPresenterReturn {
  gameRounds: any[];
  isLoadingHistory: boolean;
  selectedRound: any;
  roundAnswers: any[];
  loadRoundAnswers: (_gameRound: any) => Promise<void>;
}

export function useGameEndedPresenter({
  room
}: UseGameEndedPresenterProps): UseGameEndedPresenterReturn {
  const [gameRounds, setGameRounds] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedRound, setSelectedRound] = useState<any>(null);
  const [roundAnswers, setRoundAnswers] = useState<any[]>([]);

  // ゲーム履歴の読み込み
  const loadGameRounds = useCallback(async () => {
    if (!room || room.status !== "ended") return;

    setIsLoadingHistory(true);
    try {
      const { getGameRoundsByRoomId } = await import("@/lib/gameRoundService");
      const rounds = await getGameRoundsByRoomId(room.id);
      setGameRounds(rounds);
    } catch (error) {
      console.error("ゲーム履歴の読み込みに失敗しました:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [room]);

  // 特定のラウンドの回答を読み込み
  const loadRoundAnswers = useCallback(async (_gameRound: any) => {
    try {
      const { getGameRoundAnswersWithParticipants } = await import("@/lib/gameRoundService");
      const answers = await getGameRoundAnswersWithParticipants(_gameRound.id, room.participants);
      setRoundAnswers(answers);
      setSelectedRound(_gameRound);
    } catch (error) {
      console.error("ラウンド回答の読み込みに失敗しました:", error);
    }
  }, [room.participants]);

  // ゲーム終了時に履歴を自動読み込み
  useEffect(() => {
    loadGameRounds();
  }, [loadGameRounds]);

  return {
    gameRounds,
    isLoadingHistory,
    selectedRound,
    roundAnswers,
    loadRoundAnswers
  };
}