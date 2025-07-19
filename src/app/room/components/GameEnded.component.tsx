import { Room, JudgmentResult } from "@/types";
import { useGameEndedPresenter } from "./GameEnded.presenter";

interface GameEndedViewProps {
  room: Room;
  currentUserId: string | null;
}

export function GameEndedView({ room, currentUserId }: GameEndedViewProps) {
  const {
    gameRounds,
    isLoadingHistory,
    selectedRound,
    roundAnswers,
    loadRoundAnswers,
    gameStatistics,
    answerStyle,
  } = useGameEndedPresenter({ room, currentUserId });

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">ゲーム終了</h2>
        <div className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
          終了
        </div>
      </div>

      <div className="mb-6">
        {/* ゲーム統計 */}
        {!isLoadingHistory && gameStatistics.totalRounds > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-blue-600 text-sm font-medium mb-1">総ラウンド数</div>
              <div className="text-3xl font-bold text-blue-900">{gameStatistics.totalRounds}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-green-600 text-sm font-medium mb-1">一致回数</div>
              <div className="text-3xl font-bold text-green-900">
                {gameStatistics.matchedRounds}
              </div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="text-yellow-600 text-sm font-medium mb-1">一致率</div>
              <div className="text-3xl font-bold text-yellow-900">{gameStatistics.matchRate}%</div>
            </div>
          </div>
        )}
      </div>

      <div className="mb-6">
        {/* ゲーム結果一覧 */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">ゲーム結果</h3>
          {isLoadingHistory ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto mb-4"></div>
              <p className="text-gray-600">履歴を読み込んでいます...</p>
            </div>
          ) : gameRounds.length > 0 ? (
            <div className="max-h-96 overflow-y-auto border rounded-lg p-4">
              <div className="space-y-3">
                {gameRounds.map((round) => (
                  <div
                    key={round.id}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => loadRoundAnswers(round)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-gray-900">第{round.roundNumber}ラウンド</div>
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          round.judgment === JudgmentResult.MATCH
                            ? "bg-green-100 text-green-800"
                            : round.judgment === JudgmentResult.NO_MATCH
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {round.judgment === JudgmentResult.MATCH
                          ? "一致"
                          : round.judgment === JudgmentResult.NO_MATCH
                          ? "不一致"
                          : "判定なし"}
                      </div>
                    </div>
                    <div className="text-gray-700 mb-2 font-bold">{round.topicContent}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">ゲーム履歴がありません</p>
            </div>
          )}
        </div>

        {/* 選択したラウンドの回答詳細 */}
        {selectedRound && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              第{selectedRound.roundNumber}ラウンドの回答
            </h3>
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <div className="font-medium text-blue-900 mb-2">お題:</div>
              <div className="text-blue-800 font-bold">{selectedRound.topicContent}</div>
            </div>

            {roundAnswers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {roundAnswers.map((answer, index) => {
                  return (
                    <div
                      key={`${answer.userName}-${index}`}
                      className={`p-4 rounded-lg border ${answerStyle.bgColor}`}
                    >
                      <p className={`font-bold text-xl mb-2 ${answerStyle.textColor}`}>
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
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>このラウンドには回答がありません</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ホームに戻るボタン */}
      <div className="text-center">
        <button
          onClick={() => (window.location.href = "/")}
          className="px-8 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
        >
          ホームに戻る
        </button>
      </div>
    </div>
  );
}
