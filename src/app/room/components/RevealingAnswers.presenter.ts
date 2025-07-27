import { useState, useEffect, useCallback, useMemo } from "react";
import { Room, JudgmentResult, FacilitationSuggestion } from "@/types";

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
  suggestions: FacilitationSuggestion[];
  isFacilitationLoading: boolean;
  facilitationError: string | null;
  handleGenerateFacilitation: () => Promise<void>;
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
  const [suggestions, setSuggestions] = useState<FacilitationSuggestion[]>([]);
  const [isFacilitationLoading, setIsFacilitationLoading] = useState(false);
  const [facilitationError, setFacilitationError] = useState<string | null>(null);

  const isHost = room.participants.some((p) => p.id === currentUserId && p.isHost);

  // 回答データの読み込み
  const loadAnswersForRevealing = useCallback(async (roomData: Room) => {
    try {
      if (!roomData.currentGameRoundId) {
        return;
      }
      const { getRoundAnswers } = await import("@/lib/roomService");
      const answers = await getRoundAnswers(
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

              // ファシリテーション提案も更新
              if (gameRound.facilitationSuggestions) {
                setSuggestions(gameRound.facilitationSuggestions as FacilitationSuggestion[]);
              }
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

        // 既存のファシリテーション提案をGameRoundから読み込み
        if (room.currentGameRoundId) {
          const { getDoc, doc } = await import("firebase/firestore");
          const { db } = await import("@/lib/firebase");
          const gameRoundDoc = await getDoc(doc(db, "gameRounds", room.currentGameRoundId));
          if (gameRoundDoc.exists()) {
            const gameRoundData = gameRoundDoc.data();
            if (gameRoundData.facilitationSuggestions) {
              setSuggestions(gameRoundData.facilitationSuggestions as FacilitationSuggestion[]);
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
      if (!currentGameRoundId || !isHost) return;

      try {
        const { submitJudgment } = await import("@/lib/roomService");
        await submitJudgment(room.id, judgment);
        setHostJudgment(judgment);
      } catch (err) {
        console.error("Host judgment failed:", err);
      }
    },
    [room.id, currentGameRoundId, isHost]
  );

  const startNextRound = useCallback(async () => {
    if (!room || !isHost) return;

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
  }, [room, isHost]);

  const endGame = useCallback(async () => {
    if (!room || !isHost) return;

    setIsEndingGame(true);
    try {
      const { endGame: endGameService } = await import("@/lib/roomService");
      await endGameService(room.id);
    } catch (error) {
      console.error("ゲーム終了に失敗しました:", error);
    } finally {
      setIsEndingGame(false);
    }
  }, [room, isHost]);

  // 判定結果に基づく色設定を返す関数
  const judgmentStyle = useMemo((): JudgmentStyle => {
    if (hostJudgment === "match") {
      return {
        bgColor: "bg-emerald-100 border-emerald-300",
        textColor: "text-emerald-900",
      };
    } else if (hostJudgment === "no-match") {
      return {
        bgColor: "bg-rose-100 border-rose-300",
        textColor: "text-rose-900",
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
      import("@/lib/gameEffects").then(async ({ playMatchSound, createConfettiEffect }) => {
        await playMatchSound();
        createConfettiEffect();
        // アニメーションを2秒後に停止
        setTimeout(() => {
          setHasAnimated(true);
        }, 2000);
      });
    } else if (judgment === "no-match") {
      import("@/lib/gameEffects").then(async ({ playNoMatchSound }) => {
        await playNoMatchSound();
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

  // ファシリテーション提案生成
  const handleGenerateFacilitation = useCallback(async () => {
    if (!room.currentGameRoundId || allAnswers.length === 0 || !currentTopicContent) {
      return;
    }

    setIsFacilitationLoading(true);
    setFacilitationError(null);

    try {
      const { generateFacilitationSuggestions } = await import('@/lib/facilitationService');
      const { saveFacilitationSuggestionsToGameRound } = await import('@/lib/gameRoundService');
      
      const result = await generateFacilitationSuggestions({
        answers: allAnswers,
        topicContent: currentTopicContent.content,
        roundNumber: currentTopicContent.round,
        roomCode: room.code
      });

      setSuggestions(result.suggestions);
      
      // GameRoundに保存
      await saveFacilitationSuggestionsToGameRound(room.currentGameRoundId!, result.suggestions);
    } catch (error) {
      console.error('ファシリテーション提案の生成に失敗しました:', error);
      setFacilitationError('提案の生成に失敗しました。もう一度お試しください。');
    } finally {
      setIsFacilitationLoading(false);
    }
  }, [room.code, room.currentGameRoundId, allAnswers, currentTopicContent]);

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
    suggestions,
    isFacilitationLoading,
    facilitationError,
    handleGenerateFacilitation,
  };
}
