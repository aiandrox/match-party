import { useState, useEffect, useCallback } from "react";
import { Room } from "@/types";

interface UsePlayingGamePresenterProps {
  room: Room;
  currentUserId: string | null;
}

interface UsePlayingGamePresenterReturn {
  currentTopicContent: { content: string; round: number } | null;
  currentGameRoundId: string | null;
  answer: string;
  setAnswer: (value: string) => void;
  submittedAnswer: string;
  isSubmittingAnswer: boolean;
  hasSubmittedAnswer: boolean;
  isHost: boolean;
  isForceRevealing: boolean;
  isChangingTopic: boolean;
  submitAnswer: () => Promise<void>;
  forceRevealAnswers: () => Promise<void>;
  changeTopic: () => Promise<void>;
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

  // 現在のユーザーの回答状態を確認
  useEffect(() => {
    const currentUser = room.participants.find((p) => p.id === currentUserId);
    if (currentUser) {
      setHasSubmittedAnswer(currentUser.hasAnswered);
    }
  }, [room.participants, currentUserId]);

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
    changeTopic
  };
}