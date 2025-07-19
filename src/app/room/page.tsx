"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRoomData } from "./Room.facade";
import {
  WaitingRoomView,
  PlayingGameView,
  RevealingAnswersView,
  GameEndedView,
} from "./components";

function RoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCode = searchParams.get("code") || "";

  const { room, isLoading, error, currentUserId } = useRoomData(roomCode);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto mb-4"></div>
          <p className="text-gray-600">ルーム情報を読み込んでいます...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">エラーが発生しました</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              {error.includes("有効期限が切れています") && (
                <button
                  onClick={() => router.push("/create-room")}
                  className="w-full px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                >
                  新しいルームを作成
                </button>
              )}
              {error.includes("参加権限がありません") && (
                <button
                  onClick={() => router.push("/join-room")}
                  className="w-full px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                >
                  ルームに参加
                </button>
              )}
              <button
                onClick={() => router.push("/")}
                className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                ホームに戻る
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-gray-500 text-6xl mb-4">❓</div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">ルームが見つかりません</h2>
            <p className="text-gray-600 mb-6">
              指定されたルームコードのルームが見つかりませんでした。
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push("/join-room")}
                className="w-full px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
              >
                ルームに参加
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                ホームに戻る
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ステータスに応じた表示
  const renderRoomView = () => {
    switch (room.status) {
      case "waiting":
        return <WaitingRoomView room={room} currentUserId={currentUserId} />;
      case "playing":
        return <PlayingGameView room={room} currentUserId={currentUserId} />;
      case "revealing":
        return <RevealingAnswersView room={room} currentUserId={currentUserId} />;
      case "ended":
        return <GameEndedView room={room} currentUserId={currentUserId} />;
      default:
        return (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">不明なゲーム状態</h2>
              <p className="text-gray-600 mb-6">不明なゲーム状態です: {room.status}</p>
              <button
                onClick={() => router.push("/")}
                className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
              >
                ホームに戻る
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">{renderRoomView()}</div>
      </div>
    </div>
  );
}

export default function RoomContainer() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto mb-4"></div>
            <p className="text-gray-600">読み込み中...</p>
          </div>
        </div>
      }
    >
      <RoomContent />
    </Suspense>
  );
}
