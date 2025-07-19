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

  // お題情報の取得とリアルタイム監視
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const loadAndSubscribeTopic = async () => {
      try {
        const { getTopicByRoomId } = await import("@/lib/roomService");
        const topic = await getTopicByRoomId(room.id);
        if (topic) {
          setCurrentTopicContent(topic);
          setCurrentGameRoundId(topic.id);

          // GameRoundの変更をリアルタイム監視
          const { subscribeToGameRound } = await import("@/lib/gameRoundService");
          unsubscribe = subscribeToGameRound(topic.id, (updatedGameRound) => {
            if (updatedGameRound) {
              setCurrentTopicContent({
                content: updatedGameRound.topicContent,
                round: updatedGameRound.roundNumber
              });
            }
          });
        }
      } catch (error) {
        console.error("お題の読み込みに失敗しました:", error);
      }
    };

    loadAndSubscribeTopic();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [room.id]);

  // currentGameRoundIdの変更を監視（次のラウンドに進んだ場合）
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (room.currentGameRoundId && room.currentGameRoundId !== currentGameRoundId) {
      const subscribeToNewRound = async () => {
        try {
          const { subscribeToGameRound } = await import("@/lib/gameRoundService");
          unsubscribe = subscribeToGameRound(room.currentGameRoundId!, (updatedGameRound) => {
            if (updatedGameRound) {
              setCurrentTopicContent({
                content: updatedGameRound.topicContent,
                round: updatedGameRound.roundNumber
              });
              setCurrentGameRoundId(updatedGameRound.id);
            }
          });
        } catch (error) {
          console.error("新しいラウンドの監視に失敗しました:", error);
        }
      };

      subscribeToNewRound();
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [room.currentGameRoundId, currentGameRoundId]);

  // 現在のユーザーの回答状態を確認＆既存回答を取得
  useEffect(() => {
    const currentUser = room.participants.find((p) => p.id === currentUserId);
    if (currentUser) {
      setHasSubmittedAnswer(currentUser.hasAnswered);
      
      // 回答済みの場合、既存の回答を取得して表示
      if (currentUser.hasAnswered && currentGameRoundId && currentUserId && !submittedAnswer) {
        const loadExistingAnswer = async () => {
          try {
            const { getUserAnswerForGameRound } = await import("@/lib/gameHistoryService");
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
      const { changeTopicIfNoAnswers } = await import("@/lib/roomService");
      await changeTopicIfNoAnswers(room.id);
    } catch (error) {
      console.error("お題の変更に失敗しました:", error);
    } finally {
      setIsChangingTopic(false);
    }
  }, [room.id, isHost, isChangingTopic]);

  // 回答統計を計算
  const answerStatistics: AnswerStatistics = {
    answeredCount: room.participants.filter((p) => p.hasAnswered).length,
    totalCount: room.participants.length
  };

  // 問題音を1回だけ再生する関数
  const playQuestionSoundOnce = useCallback(() => {
    if (currentTopicContent) {
      import("@/lib/gameEffects").then(({ playQuestionSound }) => {
        playQuestionSound();
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
      ? "bg-orange-600 hover:bg-orange-700 text-white"
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
    canChangeTopic
  };
}