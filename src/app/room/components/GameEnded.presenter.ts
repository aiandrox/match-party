import { useState, useEffect, useCallback, useMemo } from "react";
import { Room } from "@/types";

interface UseGameEndedPresenterProps {
  room: Room;
  currentUserId: string | null;
}

interface GameStatistics {
  totalRounds: number;
  matchedRounds: number;
  matchRate: number;
}

interface AnswerStyle {
  bgColor: string;
  textColor: string;
}

interface UseGameEndedPresenterReturn {
  gameRounds: any[];
  isLoadingHistory: boolean;
  selectedRound: any;
  roundAnswers: any[];
  loadRoundAnswers: (_gameRound: any) => Promise<void>;
  gameStatistics: GameStatistics;
  answerStyle: AnswerStyle;
}

export function useGameEndedPresenter({
  room,
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
  const loadRoundAnswers = useCallback(
    async (_gameRound: any) => {
      try {
        const { getGameRoundAnswersWithParticipants } = await import("@/lib/gameRoundService");
        const answers = await getGameRoundAnswersWithParticipants(_gameRound.id, room.participants);
        setRoundAnswers(answers);
        setSelectedRound(_gameRound);
      } catch (error) {
        console.error("ラウンド回答の読み込みに失敗しました:", error);
      }
    },
    [room.participants]
  );

  // ゲーム終了時に履歴を自動読み込み
  useEffect(() => {
    loadGameRounds();
  }, [loadGameRounds]);

  // 統計情報を計算
  const gameStatistics: GameStatistics = {
    totalRounds: gameRounds.length,
    matchedRounds: gameRounds.filter((round) => round.judgment === "match").length,
    matchRate:
      gameRounds.length > 0
        ? Math.round(
            (gameRounds.filter((round) => round.judgment === "match").length / gameRounds.length) *
              100
          )
        : 0,
  };

  // 判定結果に基づく色設定を返す関数
  const answerStyle: AnswerStyle = useMemo(() => {
    if (selectedRound?.judgment === "match") {
      return {
        bgColor: "bg-emerald-100 border-emerald-300",
        textColor: "text-emerald-900",
      };
    } else if (selectedRound?.judgment === "no-match") {
      return {
        bgColor: "bg-rose-100 border-rose-300",
        textColor: "text-rose-900",
      };
    }
    return {
      bgColor: "bg-gray-50 border-gray-200",
      textColor: "text-gray-900",
    };
  }, [selectedRound]);

  return {
    gameRounds,
    isLoadingHistory,
    selectedRound,
    roundAnswers,
    loadRoundAnswers,
    gameStatistics,
    answerStyle,
  };
}
