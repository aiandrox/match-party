import React, { memo } from 'react';
import { Room } from "@/types";
import { useWaitingRoomPresenter } from "./WaitingRoom.presenter";
import { MAX_PARTICIPANTS } from "@/lib/utils";

interface WaitingRoomViewProps {
  room: Room;
  currentUserId: string | null;
}

export const WaitingRoomView = memo(({ room, currentUserId }: WaitingRoomViewProps) => {
  const { 
    isStartingGame, 
    inviteUrlCopySuccess, 
    isHost, 
    canStartGame, 
    startGame, 
    copyInviteUrl,
    inviteUrl,
    isCurrentUser
  } = useWaitingRoomPresenter({ room, currentUserId });

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">ゲームルーム</h2>
        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
          参加者募集中
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <div className="text-blue-800 mb-2 font-medium">招待URL:</div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono bg-white px-3 py-2 rounded border text-slate-700 flex-1 break-all">
            {inviteUrl ? inviteUrl : "招待URLを生成中..."}
          </span>
          <button
            onClick={copyInviteUrl}
            className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors text-sm font-medium whitespace-nowrap"
          >
            {inviteUrlCopySuccess ? "✓" : "URLコピー"}
          </button>
        </div>
        <p className="text-xs text-blue-600 mt-2">
          このURLを友達に送って、簡単にルームに招待できます
        </p>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-900">参加者一覧</h3>
          <div className="text-sm text-gray-600">
            {room.participants.length}/{MAX_PARTICIPANTS}人
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {room.participants.map((participant) => {
            const isCurrentUserFlag = isCurrentUser(participant.id);
            return (
              <div
                key={participant.id}
                className={`bg-white rounded-lg p-3 border ${
                  isCurrentUserFlag ? "border-blue-300 bg-blue-50" : "border-gray-200"
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
                      className={`font-medium ${isCurrentUserFlag ? "text-blue-900" : "text-gray-900"}`}
                    >
                      {participant.name}
                      {isCurrentUserFlag && (
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
});

WaitingRoomView.displayName = 'WaitingRoomView';
