import { useState, useEffect, useCallback, useMemo } from "react";
import { Room, JudgmentResult, FacilitationSuggestion, TopicFeedbackRating, RoundAnswer } from "@/types";
import {
  JudgmentStyle,
  getJudgmentStyle,
  isFailureJudgment,
  isSuccessJudgment,
} from "@/lib/judgment";
import { GameModeDefinition, getGameModeDefinition } from "@/lib/gameMode";
import { useFacilitation } from "../hooks/useFacilitation";

interface UseRevealingAnswersPresenterProps {
  room: Room;
  currentUserId: string | null;
}

interface UseRevealingAnswersPresenterReturn {
  currentTopicContent: { content: string; round: number } | null;
  currentGameRoundId: string | null;
  allAnswers: RoundAnswer[];
  hostJudgment: JudgmentResult | null;
  gameMode: GameModeDefinition;
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
  generateFacilitation: () => Promise<void>;
  feedbackSent: boolean;
  isSubmittingFeedback: boolean;
  submitTopicFeedback: (_rating: TopicFeedbackRating) => Promise<void>;
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
  const [allAnswers, setAllAnswers] = useState<RoundAnswer[]>([]);
  const [hostJudgment, setHostJudgment] = useState<JudgmentResult | null>(null);
  const [isStartingNextRound, setIsStartingNextRound] = useState(false);
  const [isEndingGame, setIsEndingGame] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // ファシリテーション提案（AI の会話のヒント）の状態
  const {
    suggestions,
    isLoading: isFacilitationLoading,
    error: facilitationError,
    generateSuggestions,
    clearSuggestions,
  } = useFacilitation();

  const isHost = room.participants.some((p) => p.id === currentUserId && p.isHost);

  // 現在のゲームモード（未設定は一致モード）
  const gameMode = getGameModeDefinition(room.mode);

  // 回答データの読み込み
  const loadAnswersForRevealing = useCallback(async (roomData: Room) => {
    try {
      if (!roomData.currentGameRoundId) {
        return;
      }
      const { getRoundAnswers } = await import("@/lib/roomService");
      const answers = await getRoundAnswers(roomData.currentGameRoundId, roomData.participants);

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
      // 状態をリセット（リアルタイム更新で新しいお題が設定される）。前ラウンドの会話のヒントは持ち越さない
      setHostJudgment(null);
      setAllAnswers([]);
      clearSuggestions();
    } catch (error) {
      console.error("次のラウンドの開始に失敗しました:", error);
    } finally {
      setIsStartingNextRound(false);
    }
  }, [room, isHost, clearSuggestions]);

  const endGame = useCallback(async () => {
    if (!room || !isHost) return;

    setIsEndingGame(true);
    try {
      const { endGame: endGameService } = await import("@/lib/roomService");
      await endGameService(room.id);
      clearSuggestions();
    } catch (error) {
      console.error("ゲーム終了に失敗しました:", error);
    } finally {
      setIsEndingGame(false);
    }
  }, [room, isHost, clearSuggestions]);

  // 判定結果に基づく色設定
  const judgmentStyle = useMemo((): JudgmentStyle => getJudgmentStyle(hostJudgment), [hostJudgment]);

  // 判定結果に応じた効果音・エフェクト再生
  const playJudgmentEffects = useCallback((judgment: JudgmentResult | null) => {
    if (isSuccessJudgment(judgment)) {
      import("@/lib/gameEffects").then(async ({ playMatchSound, createConfettiEffect }) => {
        await playMatchSound();
        createConfettiEffect();
        // アニメーションを2秒後に停止
        setTimeout(() => {
          setHasAnimated(true);
        }, 2000);
      });
    } else if (isFailureJudgment(judgment)) {
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

  // ファシリテーション提案（会話のヒント）の生成
  const generateFacilitation = useCallback(async () => {
    if (allAnswers.length === 0 || !currentTopicContent) {
      return;
    }

    await generateSuggestions({
      answers: allAnswers,
      topicContent: currentTopicContent.content,
      roomCode: room.code,
      roundNumber: currentTopicContent.round,
    });
  }, [room.code, allAnswers, currentTopicContent, generateSuggestions]);

  // お題フィードバック送信
  const submitTopicFeedback = useCallback(
    async (rating: TopicFeedbackRating) => {
      if (!currentTopicContent || !currentUserId || feedbackSent || isSubmittingFeedback) {
        return;
      }

      // 現在のユーザー名を取得
      const currentUser = room.participants.find((p) => p.id === currentUserId);
      if (!currentUser) {
        console.error("現在のユーザーが見つかりません");
        return;
      }

      setIsSubmittingFeedback(true);
      try {
        const { submitTopicFeedback: submitFeedbackService } = await import(
          "@/lib/topicFeedbackService"
        );
        await submitFeedbackService({
          topicContent: currentTopicContent.content,
          userId: currentUserId,
          userName: currentUser.name,
          rating,
        });
        setFeedbackSent(true);
      } catch (error) {
        console.error("お題フィードバックの送信に失敗しました:", error);
      } finally {
        setIsSubmittingFeedback(false);
      }
    },
    [currentTopicContent, currentUserId, room.participants, feedbackSent, isSubmittingFeedback]
  );

  // 既存フィードバックの確認とフィードバック状態の初期化
  useEffect(() => {
    const checkExistingFeedback = async () => {
      if (!currentUserId || !currentTopicContent) {
        setFeedbackSent(false);
        return;
      }

      try {
        const { checkExistingFeedback: checkFeedback } = await import("@/lib/topicFeedbackService");
        const alreadySubmitted = await checkFeedback(currentUserId, currentTopicContent.content);
        setFeedbackSent(alreadySubmitted);
      } catch (error) {
        console.error("既存フィードバックの確認に失敗しました:", error);
        setFeedbackSent(false);
      }
    };

    checkExistingFeedback();
  }, [currentUserId, currentTopicContent]);

  return {
    currentTopicContent,
    currentGameRoundId,
    allAnswers,
    hostJudgment,
    gameMode,
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
    generateFacilitation,
    feedbackSent,
    isSubmittingFeedback,
    submitTopicFeedback,
  };
}
