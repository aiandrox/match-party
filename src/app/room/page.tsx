"use client";

import { Suspense, lazy, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRoomData } from "./Room.facade";

// Lazy load game state components for better performance
const WaitingRoomView = lazy(() =>
  import("./components/WaitingRoom.component").then(m => ({ 
    default: m.WaitingRoomView 
  }))
);

const PlayingGameView = lazy(() =>
  import("./components/PlayingGame.component").then(m => ({ 
    default: m.PlayingGameView 
  }))
);

const RevealingAnswersView = lazy(() =>
  import("./components/RevealingAnswers.component").then(m => ({ 
    default: m.RevealingAnswersView 
  }))
);

const GameEndedView = lazy(() =>
  import("./components/GameEnded.component").then(m => ({ 
    default: m.GameEndedView 
  }))
);

function RoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCode = searchParams.get("code") || "";

  const { room, isLoading, error, currentUserId, needsJoin } = useRoomData(roomCode);

  // 参加権限がない場合は自動的にjoin-roomにリダイレクト
  useEffect(() => {
    if (needsJoin && roomCode) {
      router.push(`/join-room?code=${roomCode}`);
    }
  }, [needsJoin, roomCode, router]);

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

  // Component loading fallback
  const GameComponentFallback = () => (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    </div>
  );

  // ステータスに応じた表示
  const renderRoomView = () => {
    const componentProps = { room, currentUserId };
    
    switch (room.status) {
      case "waiting":
        return (
          <Suspense fallback={<GameComponentFallback />}>
            <WaitingRoomView {...componentProps} />
          </Suspense>
        );
      case "playing":
        return (
          <Suspense fallback={<GameComponentFallback />}>
            <PlayingGameView {...componentProps} />
          </Suspense>
        );
      case "revealing":
        return (
          <Suspense fallback={<GameComponentFallback />}>
            <RevealingAnswersView {...componentProps} />
          </Suspense>
        );
      case "ended":
        return (
          <Suspense fallback={<GameComponentFallback />}>
            <GameEndedView {...componentProps} />
          </Suspense>
        );
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
