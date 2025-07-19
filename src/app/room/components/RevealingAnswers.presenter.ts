import { useState, useEffect, useCallback, useMemo } from "react";
import { Room, JudgmentResult } from "@/types";

interface UseRevealingAnswersPresenterProps {
  room: Room;
  currentUserId: string | null;
}

interface JudgmentStyle {
  bgColor: string;
  textColor: string;
}

interface UseRevealingAnswersPresenterReturn {
  currentTopicContent: { content: string; round: number } | null;
  currentGameRoundId: string | null;
  allAnswers: Array<{
    content: string;
    userName: string;
    submittedAt: Date | null;
    hasAnswered: boolean;
  }>;
  hostJudgment: "match" | "no-match" | null;
  isHost: boolean;
  isStartingNextRound: boolean;
  isEndingGame: boolean;
  submitJudgment: (_judgment: JudgmentResult) => Promise<void>;
  startNextRound: () => Promise<void>;
  endGame: () => Promise<void>;
  judgmentStyle: JudgmentStyle;
  hasAnimated: boolean;
}

export function useRevealingAnswersPresenter({
  room,
  currentUserId,
}: UseRevealingAnswersPresenterProps): UseRevealingAnswersPresenterReturn {
  const [currentTopicContent, setCurrentTopicContent] = useState<{
    content: string;
    round: number;
  } | null>(null);
  const [currentGameRoundId, setCurrentGameRoundId] = useState<string | null>(null);
  const [allAnswers, setAllAnswers] = useState<
    Array<{ content: string; userName: string; submittedAt: Date | null; hasAnswered: boolean }>
  >([]);
  const [hostJudgment, setHostJudgment] = useState<"match" | "no-match" | null>(null);
  const [isStartingNextRound, setIsStartingNextRound] = useState(false);
  const [isEndingGame, setIsEndingGame] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  const isHost = room.participants.some((p) => p.id === currentUserId && p.isHost);

  // 回答データの読み込み
  const loadAnswersForRevealing = useCallback(async (roomData: Room) => {
    try {
      if (!roomData.currentGameRoundId) {
        return;
      }
      const { getAnswersByGameRoundIdWithParticipants } = await import("@/lib/roomService");
      const answers = await getAnswersByGameRoundIdWithParticipants(
        roomData.currentGameRoundId,
        roomData.participants
      );

      setAllAnswers(answers);

      // 判定結果も取得
      const { getDoc, doc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      const gameRoundDoc = await getDoc(doc(db, "gameRounds", roomData.currentGameRoundId));
      if (gameRoundDoc.exists()) {
        const gameRoundData = gameRoundDoc.data();
        if (gameRoundData.judgment) {
          setHostJudgment(gameRoundData.judgment);
        }
      }
    } catch (err) {
      console.error("Failed to load answers:", err);
    }
  }, []);

  // GameRound監視の設定
  useEffect(() => {
    let gameRoundUnsubscribe: (() => void) | undefined;

    const setupGameRoundSubscription = async () => {
      if (room.currentGameRoundId) {
        // 既存の監視があり、異なるGameRoundIdの場合は停止
        if (gameRoundUnsubscribe && currentGameRoundId !== room.currentGameRoundId) {
          gameRoundUnsubscribe();
          gameRoundUnsubscribe = undefined;
        }

        // 監視が未開始の場合は開始
        if (!gameRoundUnsubscribe) {
          const { subscribeToGameRound } = await import("@/lib/gameRoundService");
          gameRoundUnsubscribe = subscribeToGameRound(room.currentGameRoundId, (gameRound) => {
            if (gameRound) {
              // お題内容が変更された場合は更新
              setCurrentTopicContent({
                content: gameRound.topicContent,
                round: gameRound.roundNumber,
              });
              setCurrentGameRoundId(gameRound.id);

              // 判定結果も更新（重要：リアルタイム同期）
              setHostJudgment(gameRound.judgment || null);
            }
          });
        }
      }
    };

    setupGameRoundSubscription();

    return () => {
      if (gameRoundUnsubscribe) {
        gameRoundUnsubscribe();
      }
    };
  }, [room.currentGameRoundId, currentGameRoundId]);

  // 初期データの読み込み
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const { getTopicByRoomId } = await import("@/lib/roomService");
        const topic = await getTopicByRoomId(room.id);
        if (topic) {
          setCurrentTopicContent(topic);
          setCurrentGameRoundId(topic.id);

          // 回答データと判定結果を読み込み
          await loadAnswersForRevealing(room);

          // 既存の判定結果を取得
          if (room.currentGameRoundId) {
            const { getDoc, doc } = await import("firebase/firestore");
            const { db } = await import("@/lib/firebase");
            const gameRoundDoc = await getDoc(doc(db, "gameRounds", room.currentGameRoundId));
            if (gameRoundDoc.exists()) {
              const gameRoundData = gameRoundDoc.data();
              if (gameRoundData.judgment) {
                setHostJudgment(gameRoundData.judgment);
              }
            }
          }
        }
      } catch (error) {
        console.error("初期データの読み込みに失敗しました:", error);
      }
    };

    loadInitialData();
  }, [room, loadAnswersForRevealing]);

  const submitJudgment = useCallback(
    async (judgment: JudgmentResult) => {
      if (!currentGameRoundId) return;

      try {
        const { saveHostJudgment } = await import("@/lib/roomService");
        await saveHostJudgment(room.id, judgment);
        setHostJudgment(judgment);
      } catch (err) {
        console.error("Host judgment failed:", err);
      }
    },
    [room.id, currentGameRoundId]
  );

  const startNextRound = useCallback(async () => {
    if (!room) return;

    setIsStartingNextRound(true);
    try {
      const { startNextRound: startNextRoundService } = await import("@/lib/roomService");
      await startNextRoundService(room.id);
      // 状態をリセット（リアルタイム更新で新しいお題が設定される）
      setHostJudgment(null);
      setAllAnswers([]);
    } catch (error) {
      console.error("次のラウンドの開始に失敗しました:", error);
    } finally {
      setIsStartingNextRound(false);
    }
  }, [room]);

  const endGame = useCallback(async () => {
    if (!room) return;

    setIsEndingGame(true);
    try {
      const { endGame: endGameService } = await import("@/lib/roomService");
      await endGameService(room.id);
    } catch (error) {
      console.error("ゲーム終了に失敗しました:", error);
    } finally {
      setIsEndingGame(false);
    }
  }, [room]);

  // 判定結果に基づく色設定を返す関数
  const judgmentStyle = useMemo((): JudgmentStyle => {
    if (hostJudgment === "match") {
      return {
        bgColor: "bg-green-100 border-green-300",
        textColor: "text-green-900",
      };
    } else if (hostJudgment === "no-match") {
      return {
        bgColor: "bg-red-100 border-red-300",
        textColor: "text-red-900",
      };
    }
    return {
      bgColor: "bg-gray-50 border-gray-200",
      textColor: "text-gray-900",
    };
  }, [hostJudgment]);

  // 判定結果に応じた効果音・エフェクト再生
  const playJudgmentEffects = useCallback((judgment: "match" | "no-match" | null) => {
    if (judgment === "match") {
      import("@/lib/gameEffects").then(({ playMatchSound, createConfettiEffect }) => {
        playMatchSound();
        createConfettiEffect();
        // アニメーションを2秒後に停止
        setTimeout(() => {
          setHasAnimated(true);
        }, 2000);
      });
    } else if (judgment === "no-match") {
      import("@/lib/gameEffects").then(({ playNoMatchSound }) => {
        playNoMatchSound();
        // アニメーションを2秒後に停止
        setTimeout(() => {
          setHasAnimated(true);
        }, 2000);
      });
    }
  }, []);

  // アニメーションCSSの注入
  useEffect(() => {
    import("@/lib/gameEffects").then(({ injectGameAnimations }) => {
      injectGameAnimations();
    });
  }, []);

  // 判定結果に応じた効果音・エフェクト
  useEffect(() => {
    playJudgmentEffects(hostJudgment);
  }, [hostJudgment, playJudgmentEffects]);

  return {
    currentTopicContent,
    currentGameRoundId,
    allAnswers,
    hostJudgment,
    isHost,
    isStartingNextRound,
    isEndingGame,
    submitJudgment,
    startNextRound,
    endGame,
    judgmentStyle,
    hasAnimated,
  };
}
