import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Room } from "@/types";

interface UsePlayingGamePresenterProps {
  room: Room;
  currentUserId: string | null;
}

interface AnswerStatistics {
  answeredCount: number;
  totalCount: number;
}

interface UsePlayingGamePresenterReturn {
  currentTopicContent: { content: string; round: number } | null;
  currentGameRoundId: string | null;
  answer: string;
  setAnswer: (_answer: string) => void;
  submittedAnswer: string;
  isSubmittingAnswer: boolean;
  hasSubmittedAnswer: boolean;
  isHost: boolean;
  isForceRevealing: boolean;
  isChangingTopic: boolean;
  submitAnswer: () => Promise<void>;
  forceRevealAnswers: () => Promise<void>;
  changeTopic: () => Promise<void>;
  answerStatistics: AnswerStatistics;
  canChangeTopicStyle: string;
  canForceRevealStyle: string;
  canForceReveal: boolean;
  showForceRevealHelp: boolean;
  canChangeTopic: boolean;
  isLastUnansweredUser: boolean;
}

export function usePlayingGamePresenter({
  room,
  currentUserId
}: UsePlayingGamePresenterProps): UsePlayingGamePresenterReturn {
  const [currentTopicContent, setCurrentTopicContent] = useState<{ content: string; round: number } | null>(null);
  const [currentGameRoundId, setCurrentGameRoundId] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [submittedAnswer, setSubmittedAnswer] = useState("");
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [hasSubmittedAnswer, setHasSubmittedAnswer] = useState(false);
  const [isForceRevealing, setIsForceRevealing] = useState(false);
  const [isChangingTopic, setIsChangingTopic] = useState(false);
  const hasPlayedQuestionSound = useRef(false);

  const isHost = room.participants.some((p) => p.id === currentUserId && p.isHost);

  // GameRoundのリアルタイム監視（統合版 - 1つのサブスクリプションで両方のケースを処理）
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupGameRoundSubscription = async () => {
      try {
        let targetGameRoundId: string | null = null;

        // 初回ロード時はroom.idからお題を取得
        if (!currentGameRoundId) {
          const { getTopicByRoomId } = await import("@/lib/roomService");
          const topic = await getTopicByRoomId(room.id);
          if (topic) {
            targetGameRoundId = topic.id;
            setCurrentGameRoundId(topic.id);
            setCurrentTopicContent(topic);
          }
        }
        // room.currentGameRoundIdが変更された場合はそれを使用
        else if (room.currentGameRoundId && room.currentGameRoundId !== currentGameRoundId) {
          targetGameRoundId = room.currentGameRoundId;
        }
        // 既存のGameRoundが有効な場合はそれを継続
        else if (currentGameRoundId) {
          targetGameRoundId = currentGameRoundId;
        }

        // GameRoundのリアルタイム監視を設定
        if (targetGameRoundId) {
          const { subscribeToGameRound } = await import("@/lib/gameRoundService");
          unsubscribe = subscribeToGameRound(targetGameRoundId, (updatedGameRound) => {
            if (updatedGameRound) {
              setCurrentTopicContent({
                content: updatedGameRound.topicContent,
                round: updatedGameRound.roundNumber
              });
              setCurrentGameRoundId(updatedGameRound.id);
            }
          });
        }
      } catch (error) {
        console.error("GameRoundの監視設定に失敗しました:", error);
      }
    };

    setupGameRoundSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [room.id, room.currentGameRoundId, currentGameRoundId]);

  // 現在のユーザーの回答状態を確認＆既存回答を取得
  useEffect(() => {
    const currentUser = room.participants.find((p) => p.id === currentUserId);
    if (currentUser) {
      setHasSubmittedAnswer(currentUser.hasAnswered);
      
      // 回答済みの場合、既存の回答を取得して表示
      if (currentUser.hasAnswered && currentGameRoundId && currentUserId && !submittedAnswer) {
        const loadExistingAnswer = async () => {
          try {
            const { getUserAnswerForGameRound } = await import("@/lib/gameAnswerService");
            const existingAnswer = await getUserAnswerForGameRound(currentGameRoundId, currentUserId);
            if (existingAnswer) {
              setSubmittedAnswer(existingAnswer);
              setAnswer(existingAnswer);
            }
          } catch (error) {
            console.error("既存の回答の取得に失敗しました:", error);
          }
        };
        loadExistingAnswer();
      }
    }
  }, [room.participants, currentUserId, currentGameRoundId, submittedAnswer]);

  const submitAnswer = useCallback(async () => {
    if (!currentUserId || !answer.trim() || isSubmittingAnswer || hasSubmittedAnswer) return;

    setIsSubmittingAnswer(true);
    try {
      const { submitAnswer: submitAnswerService } = await import("@/lib/roomService");
      await submitAnswerService(room.id, currentUserId, answer.trim());
      setSubmittedAnswer(answer.trim());
      setHasSubmittedAnswer(true);
    } catch (error) {
      console.error("回答の送信に失敗しました:", error);
    } finally {
      setIsSubmittingAnswer(false);
    }
  }, [room.id, currentUserId, answer, isSubmittingAnswer, hasSubmittedAnswer]);

  const forceRevealAnswers = useCallback(async () => {
    if (!isHost || isForceRevealing) return;

    setIsForceRevealing(true);
    try {
      const { forceRevealAnswers: forceRevealAnswersService } = await import("@/lib/roomService");
      await forceRevealAnswersService(room.id);
    } catch (error) {
      console.error("回答公開に失敗しました:", error);
    } finally {
      setIsForceRevealing(false);
    }
  }, [room.id, isHost, isForceRevealing]);

  const changeTopic = useCallback(async () => {
    if (!isHost || isChangingTopic) return;

    setIsChangingTopic(true);
    try {
      const { changeTopic } = await import("@/lib/roomService");
      await changeTopic(room.id);
    } catch (error) {
      console.error("お題の変更に失敗しました:", error);
    } finally {
      setIsChangingTopic(false);
    }
  }, [room.id, isHost, isChangingTopic]);

  // 回答統計を計算
  const answerStatistics: AnswerStatistics = useMemo(() => ({
    answeredCount: room.participants.filter((p) => p.hasAnswered).length,
    totalCount: room.participants.length
  }), [room.participants]);

  // 問題音を1回だけ再生する関数
  const playQuestionSoundOnce = useCallback(() => {
    if (currentTopicContent) {
      import("@/lib/gameEffects").then(async ({ playQuestionSound }) => {
        await playQuestionSound();
      });
    }
  }, [currentTopicContent]);

  // 問題が表示された時に問題音を再生（1回のみ）
  useEffect(() => {
    if (currentTopicContent && !hasPlayedQuestionSound.current) {
      playQuestionSoundOnce();
      hasPlayedQuestionSound.current = true;
    }
  }, [currentTopicContent, playQuestionSoundOnce]);

  // お題変更ボタンのスタイルを決定
  const canChangeTopicStyle = useMemo(() => {
    return answerStatistics.answeredCount === 0 && !isChangingTopic
      ? "bg-gray-600 hover:bg-gray-700 text-white"
      : "bg-gray-300 text-gray-500 cursor-not-allowed";
  }, [answerStatistics.answeredCount, isChangingTopic]);

  // 強制公開ボタンのスタイルを決定
  const canForceRevealStyle = useMemo(() => {
    return answerStatistics.answeredCount >= 2 && !isForceRevealing
      ? "bg-slate-600 hover:bg-slate-700 text-white"
      : "bg-gray-300 text-gray-500 cursor-not-allowed";
  }, [answerStatistics.answeredCount, isForceRevealing]);

  // 強制公開ボタンが有効かどうか
  const canForceReveal = useMemo(() => {
    return answerStatistics.answeredCount >= 2 && !isForceRevealing;
  }, [answerStatistics.answeredCount, isForceRevealing]);

  // 強制公開のヘルプメッセージを表示するかどうか
  const showForceRevealHelp = useMemo(() => {
    return answerStatistics.answeredCount < 2;
  }, [answerStatistics.answeredCount]);

  // お題変更ボタンが有効かどうか
  const canChangeTopic = useMemo(() => {
    return answerStatistics.answeredCount === 0 && !isChangingTopic;
  }, [answerStatistics.answeredCount, isChangingTopic]);

  // 最後の未回答者かどうかを判定
  const isLastUnansweredUser = useMemo(() => {
    const unansweredCount = answerStatistics.totalCount - answerStatistics.answeredCount;
    const currentUser = room.participants.find((p) => p.id === currentUserId);
    
    return (
      answerStatistics.totalCount >= 2 && // 2人以上の参加者がいる
      unansweredCount === 1 && // 未回答者が1人のみ
      currentUser !== undefined && !currentUser.hasAnswered // 現在のユーザーが存在し未回答
    );
  }, [answerStatistics, room.participants, currentUserId]);

  return {
    currentTopicContent,
    currentGameRoundId,
    answer,
    setAnswer,
    submittedAnswer,
    isSubmittingAnswer,
    hasSubmittedAnswer,
    isHost,
    isForceRevealing,
    isChangingTopic,
    submitAnswer,
    forceRevealAnswers,
    changeTopic,
    answerStatistics,
    canChangeTopicStyle,
    canForceRevealStyle,
    canForceReveal,
    showForceRevealHelp,
    canChangeTopic,
    isLastUnansweredUser
  };
}