import { Room } from "@/types";
import { useWaitingRoomPresenter } from "./useWaitingRoomPresenter";

interface WaitingRoomViewProps {
  room: Room;
  currentUserId: string | null;
}

export function WaitingRoomView({ room, currentUserId }: WaitingRoomViewProps) {
  const { isStartingGame, copySuccess, isHost, canStartGame, startGame, copyRoomCode } =
    useWaitingRoomPresenter({ room, currentUserId });

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">ゲームルーム</h2>
        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
          参加者募集中
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-gray-600 mb-2">ルームコード:</div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-mono bg-white px-3 py-2 rounded border font-bold text-slate-800 flex-1">
              {room.code}
            </span>
            <button
              onClick={copyRoomCode}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors text-sm font-medium"
            >
              {copySuccess ? "✓" : "コピー"}
            </button>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-gray-600 mb-2">参加者数:</div>
          <div className="text-3xl font-bold text-gray-900">{room.participants.length}/20</div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">参加者一覧</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {room.participants.map((participant) => {
            const isCurrentUser = participant.id === currentUserId;
            return (
              <div
                key={participant.id}
                className={`bg-white rounded-lg p-3 border ${
                  isCurrentUser ? "border-blue-300 bg-blue-50" : "border-gray-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      participant.isHost
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {participant.isHost ? "👑" : "👤"}
                  </div>
                  <div className="flex-1">
                    <div
                      className={`font-medium ${isCurrentUser ? "text-blue-900" : "text-gray-900"}`}
                    >
                      {participant.name}
                      {isCurrentUser && (
                        <span className="text-sm text-blue-600 ml-2">(あなた)</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {participant.isHost ? "主催者" : "参加者"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isHost && (
        <div className="text-center">
          <button
            onClick={startGame}
            disabled={!canStartGame || isStartingGame}
            className={`px-8 py-3 rounded-lg font-semibold text-lg transition-colors ${
              canStartGame && !isStartingGame
                ? "bg-slate-600 hover:bg-slate-700 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isStartingGame ? "開始中..." : "ゲーム開始"}
          </button>
          {!canStartGame && (
            <p className="text-sm text-gray-600 mt-2">ゲーム開始には2人以上の参加者が必要です</p>
          )}
        </div>
      )}

      {!isHost && (
        <div className="text-center">
          <p className="text-gray-600">主催者がゲームを開始するまでお待ちください</p>
        </div>
      )}
    </div>
  );
}
