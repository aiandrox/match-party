import React, { memo } from "react";
import { Room } from "@/types";
import { usePlayingGamePresenter } from "./PlayingGame.presenter";
import { useAnswerVisibility } from "@/hooks/useAnswerVisibility";

interface PlayingGameViewProps {
  room: Room;
  currentUserId: string | null;
}

export const PlayingGameView = memo(({ room, currentUserId }: PlayingGameViewProps) => {
  const {
    currentTopicContent,
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
    isLastUnansweredUser,
  } = usePlayingGamePresenter({ room, currentUserId });

  const { isAnswerHidden, toggleAnswerVisibility } = useAnswerVisibility();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">ゲーム中</h2>
        <div className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium">
          ゲーム進行中
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-medium text-blue-900">
            お題 {currentTopicContent && `(第${currentTopicContent.round}ラウンド)`}
          </h3>
          {isHost && (
            <button
              onClick={changeTopic}
              disabled={!canChangeTopic}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${canChangeTopicStyle}`}
            >
              {isChangingTopic ? "変更中..." : "変更"}
            </button>
          )}
        </div>
        <p className="text-blue-800 text-xl font-semibold">
          {currentTopicContent ? currentTopicContent.content : "お題を読み込み中..."}
        </p>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-lg font-semibold text-gray-900">あなたの回答</h3>
          <button
            onClick={toggleAnswerVisibility}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 border ${
              isAnswerHidden
                ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300"
                : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
            }`}
            title={isAnswerHidden ? "自分の回答を表示する" : "自分の回答を非表示にする"}
          >
            <span className="flex items-center gap-1">
              {isAnswerHidden ? (
                <>
                  <span>👁️</span>
                  <span>表示する</span>
                </>
              ) : (
                <>
                  <span>🔒</span>
                  <span>非表示にする</span>
                </>
              )}
            </span>
          </button>
        </div>

        {/* ゲーム説明テキスト */}
        <p className="text-sm text-gray-500 mb-3">
          他の参加者と同じ回答を目指しましょう！
        </p>

        {hasSubmittedAnswer ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-emerald-800 font-medium">回答済み</p>
            {isAnswerHidden ? (
              <p className="text-emerald-700 text-lg mt-2 font-bold">*****</p>
            ) : (
              <p className="text-emerald-700 text-lg mt-2 font-bold">{submittedAnswer}</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* 最後の未回答者向けリマインドメッセージ */}
            {isLastUnansweredUser && (
              <div className="bg-yellow-50 p-3 rounded-lg mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-600 text-sm">⚠️</span>
                  <p className="text-yellow-800 text-sm">回答をお忘れではないですか？</p>
                </div>
              </div>
            )}
            
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="回答を入力してください..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              disabled={isSubmittingAnswer}
            />
            <button
              onClick={submitAnswer}
              disabled={!answer.trim() || isSubmittingAnswer}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                answer.trim() && !isSubmittingAnswer
                  ? "bg-slate-600 hover:bg-slate-700 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isSubmittingAnswer ? "送信中..." : "回答を送信"}
            </button>
          </div>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          回答状況 ({answerStatistics.answeredCount}/{answerStatistics.totalCount})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {room.participants.map((participant) => (
            <div
              key={participant.id}
              className={`flex items-center space-x-2 p-2 rounded ${
                participant.hasAnswered ? "bg-emerald-100" : "bg-gray-100"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  participant.hasAnswered ? "bg-emerald-500" : "bg-gray-400"
                }`}
              />
              <span className="text-sm text-gray-700 truncate">
                {participant.name}
                {participant.id === currentUserId && " (あなた)"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {isHost && (
        <div className="text-center">
          <button
            onClick={forceRevealAnswers}
            disabled={!canForceReveal}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${canForceRevealStyle}`}
          >
            {isForceRevealing ? "公開中..." : "回答を強制公開"}
          </button>
          {showForceRevealHelp && (
            <p className="text-sm text-gray-600 mt-2">回答公開には2人以上の回答が必要です</p>
          )}
        </div>
      )}
    </div>
  );
});

PlayingGameView.displayName = "PlayingGameView";
