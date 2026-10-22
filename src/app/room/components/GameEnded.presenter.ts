import { useState, useEffect, useCallback, useMemo } from "react";
import { GameRound, Room, RoomStatus, RoundAnswer } from "@/types";
import { JudgmentStyle, getJudgmentStyle, isSuccessJudgment } from "@/lib/judgment";
import { GameModeDefinition, getGameModeDefinition } from "@/lib/gameMode";

interface UseGameEndedPresenterProps {
  room: Room;
  currentUserId: string | null;
}

// 成功 = 一致モードでは「一致」、不一致モードでは「被りなし」
interface GameStatistics {
  totalRounds: number;
  successRounds: number;
  successRate: number;
}

interface UseGameEndedPresenterReturn {
  gameRounds: GameRound[];
  isLoadingHistory: boolean;
  selectedRound: GameRound | null;
  roundAnswers: RoundAnswer[];
  loadRoundAnswers: (_gameRound: GameRound) => Promise<void>;
  gameStatistics: GameStatistics;
  answerStyle: JudgmentStyle;
  gameMode: GameModeDefinition;
}

export function useGameEndedPresenter({
  room,
}: UseGameEndedPresenterProps): UseGameEndedPresenterReturn {
  const [gameRounds, setGameRounds] = useState<GameRound[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedRound, setSelectedRound] = useState<GameRound | null>(null);
  const [roundAnswers, setRoundAnswers] = useState<RoundAnswer[]>([]);

  // 現在のゲームモード（未設定は一致モード）
  const gameMode = getGameModeDefinition(room.mode);

  // ゲーム履歴の読み込み
  const loadGameRounds = useCallback(async () => {
    if (!room || room.status !== RoomStatus.ENDED) return;

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
    async (gameRound: GameRound) => {
      try {
        const { getGameRoundAnswersWithParticipants } = await import("@/lib/gameRoundService");
        const answers = await getGameRoundAnswersWithParticipants(gameRound.id, room.participants);
        setRoundAnswers(answers);
        setSelectedRound(gameRound);
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
  const gameStatistics: GameStatistics = useMemo(() => {
    const totalRounds = gameRounds.length;
    const successRounds = gameRounds.filter((round) => isSuccessJudgment(round.judgment)).length;
    return {
      totalRounds,
      successRounds,
      successRate: totalRounds > 0 ? Math.round((successRounds / totalRounds) * 100) : 0,
    };
  }, [gameRounds]);

  // 選択中ラウンドの判定結果に基づく色設定
  const answerStyle: JudgmentStyle = useMemo(
    () => getJudgmentStyle(selectedRound?.judgment),
    [selectedRound]
  );

  return {
    gameRounds,
    isLoadingHistory,
    selectedRound,
    roundAnswers,
    loadRoundAnswers,
    gameStatistics,
    answerStyle,
    gameMode,
  };
}
