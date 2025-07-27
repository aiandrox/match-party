import React, { memo } from 'react';
import { Room } from "@/types";
import { useRevealingAnswersPresenter } from "./RevealingAnswers.presenter";
import { FacilitationSuggestions } from "./FacilitationSuggestions.component";
import { useFacilitation } from "../hooks/useFacilitation";

interface RevealingAnswersViewProps {
  room: Room;
  currentUserId: string | null;
}

export const RevealingAnswersView = memo(({ room, currentUserId }: RevealingAnswersViewProps) => {
  const {
    currentTopicContent,
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
  } = useRevealingAnswersPresenter({ room, currentUserId });

  const {
    suggestions,
    isLoading: isFacilitationLoading,
    error: facilitationError,
    generateSuggestions,
    clearSuggestions
  } = useFacilitation();

  const handleGenerateFacilitation = async () => {
    if (!currentTopicContent || !room.code) return;

    await generateSuggestions({
      answers: allAnswers,
      topicContent: currentTopicContent.content,
      roundNumber: currentTopicContent.round,
      roomCode: room.code
    });
  };

  const handleStartNextRound = () => {
    clearSuggestions(); // 次のラウンド開始時に提案をクリア
    startNextRound();
  };

  const handleEndGame = () => {
    clearSuggestions(); // ゲーム終了時に提案をクリア
    endGame();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">回答発表</h2>
        <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
          回答公開中
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">
          お題 {currentTopicContent && `(第${currentTopicContent.round}ラウンド)`}
        </h3>
        <p className="text-blue-800 text-xl font-semibold">
          {currentTopicContent ? currentTopicContent.content : "お題を読み込み中..."}
        </p>
      </div>

      {/* 判定結果表示 */}
      {hostJudgment && (
        <div className="mb-6 text-center">
          {hostJudgment === "match" ? (
            <h3
              className={`text-3xl font-bold text-green-800 mb-2 ${
                !hasAnimated ? "animate-match-text" : ""
              }`}
            >
              🎉✨ 全員一致 ✨🎉
            </h3>
          ) : (
            <h3
              className={`text-3xl font-bold text-red-800 mb-2 ${
                !hasAnimated ? "animate-no-match-text" : ""
              }`}
            >
              💥 全員一致ならず 💥
            </h3>
          )}
        </div>
      )}

      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {allAnswers.map((answer, index) => {
            return (
              <div key={index} className={`p-4 rounded-lg border ${judgmentStyle.bgColor}`}>
                <p
                  className={`font-bold text-xl mb-2 transition-colors duration-500 ${judgmentStyle.textColor}`}
                >
                  {answer.hasAnswered ? answer.content : ""}
                </p>
                <p
                  className={`text-sm text-right ${
                    answer.hasAnswered ? "text-gray-600" : "text-gray-400"
                  }`}
                >
                  {answer.userName}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ファシリテーション提案（一致判定前に表示） */}
      {!hostJudgment && (
        <FacilitationSuggestions
          suggestions={suggestions}
          isLoading={isFacilitationLoading}
          error={facilitationError}
          onGenerateSuggestions={handleGenerateFacilitation}
          isHost={isHost}
        />
      )}

      {/* ホストのみに一致判定ボタンを表示 */}
      {isHost && !hostJudgment && (
        <div className="text-center mb-6">
          <p className="text-gray-700 font-medium mb-4">回答の一致を判定してください</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => submitJudgment("match")}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
            >
              全員一致
            </button>
            <button
              onClick={() => submitJudgment("no-match")}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors"
            >
              全員一致ならず
            </button>
          </div>
        </div>
      )}

      {/* 次のラウンドまたはゲーム終了ボタン */}
      {isHost && hostJudgment && (
        <div className="text-center space-y-4">
          <div className="flex justify-center gap-4">
            <button
              onClick={handleStartNextRound}
              disabled={isStartingNextRound}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                !isStartingNextRound
                  ? "bg-slate-600 hover:bg-slate-700 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isStartingNextRound ? "開始中..." : "次のラウンド"}
            </button>
            <button
              onClick={handleEndGame}
              disabled={isEndingGame}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                !isEndingGame
                  ? "bg-gray-600 hover:bg-gray-700 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isEndingGame ? "終了中..." : "ゲーム終了"}
            </button>
          </div>
        </div>
      )}

      {/* 非ホストの場合の待機メッセージ */}
      {!isHost && (
        <div className="text-center">
          <p className="text-gray-600">主催者が次のアクションを選択するまでお待ちください</p>
        </div>
      )}
    </div>
  );
});

RevealingAnswersView.displayName = 'RevealingAnswersView';
