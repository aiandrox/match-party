'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Room } from '@/types';

function RoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCode = searchParams.get('code') || '';
  
  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!roomCode) {
      setError('ルームコードが指定されていません');
      setIsLoading(false);
      return;
    }

    // localStorageからユーザーIDを取得
    const userId = localStorage.getItem(`userId_${roomCode}`);
    setCurrentUserId(userId);

    let unsubscribe: (() => void) | undefined;

    const loadRoom = async () => {
      try {
        // userIdが取得できない場合はルーム情報を表示しない
        if (!userId) {
          setError('このルームへの参加権限が確認できません');
          setIsLoading(false);
          return;
        }

        // 動的インポートでFirebase初期化を避ける
        const { getRoomByCode } = await import('@/lib/roomService');
        const roomData = await getRoomByCode(roomCode);
        if (!roomData) {
          setError('ルームが見つかりません');
          setIsLoading(false);
          return;
        }

        // ユーザーがルームの参加者として存在するかチェック
        const isParticipant = roomData.participants.some(p => p.id === userId);
        if (!isParticipant) {
          setError('このルームへの参加権限がありません');
          setIsLoading(false);
          return;
        }

        setRoom(roomData);
        setIsLoading(false);

        // リアルタイム更新の監視を一時的に無効化（デバッグ用）
        // unsubscribe = subscribeToRoom(roomData.id, (updatedRoom) => {
        //   setRoom(updatedRoom);
        // });
      } catch (err) {
        setError('ルームの読み込みに失敗しました');
        setIsLoading(false);
      }
    };

    loadRoom();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [roomCode]);

  const copyRoomCode = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(roomCode);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } else {
        // fallback for non-HTTPS environments
        const textArea = document.createElement('textarea');
        textArea.value = roomCode;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        } catch (fallbackErr) {
          // eslint-disable-next-line no-console
          console.error('Copy failed:', fallbackErr);
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Copy failed:', err);
    }
  };

  const getStatusText = (status: Room['status']) => {
    switch (status) {
      case 'waiting':
        return '参加者募集中';
      case 'playing':
        return 'ゲーム進行中';
      case 'revealing':
        return '回答公開中';
      case 'ended':
        return 'ゲーム終了';
      default:
        return '不明';
    }
  };

  const getStatusColor = (status: Room['status']) => {
    switch (status) {
      case 'waiting':
        return 'bg-blue-100 text-blue-800';
      case 'playing':
        return 'bg-green-100 text-green-800';
      case 'revealing':
        return 'bg-yellow-100 text-yellow-800';
      case 'ended':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto mb-4"></div>
          <p className="text-gray-600">ルームを読み込んでいます...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.888-.833-2.828 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">エラー</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-x-2">
              {error.includes('参加権限') && (
                <button
                  onClick={() => router.push('/join-room')}
                  className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  ルームに参加
                </button>
              )}
              <button
                onClick={() => router.push('/')}
                className="bg-slate-600 text-white py-2 px-4 rounded-lg hover:bg-slate-700 transition-colors"
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
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              ゲームルーム
            </h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(room.status)}`}>
              {getStatusText(room.status)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">ルームコード</h3>
              <div className="flex items-center space-x-2">
                <code className="text-lg font-mono bg-white px-3 py-2 rounded border flex-1">
                  {room.code}
                </code>
                <button
                  onClick={copyRoomCode}
                  className="px-3 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 transition-colors"
                >
                  {copySuccess ? '✓' : 'コピー'}
                </button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">参加者数</h3>
              <p className="text-2xl font-bold text-gray-900">
                {room.participants.length} / 20
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">参加者一覧</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {room.participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center space-x-3 bg-white rounded-lg p-3"
                >
                  <div className="flex-shrink-0">
                    {participant.isHost ? (
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="text-yellow-600 text-sm font-medium">👑</span>
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-sm font-medium">👤</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {participant.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {participant.isHost ? 'ホスト' : '参加者'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {room.status === 'waiting' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              ゲーム開始前
            </h2>
            <p className="text-gray-600 mb-4">
              参加者がそろったらホストがゲームを開始できます。
            </p>
            {/* ホストのみにゲーム開始ボタンを表示 */}
            {room.participants.some(p => p.id === currentUserId && p.isHost) ? (
              <div className="space-y-3">
                <button
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    room.participants.length < 2
                      ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
                  }`}
                  disabled={room.participants.length < 2}
                >
                  ゲーム開始
                </button>
                {room.participants.length < 2 && (
                  <p className="text-sm text-gray-500 text-center">
                    ゲーム開始には2人以上の参加者が必要です
                  </p>
                )}
              </div>
            ) : (
              /* ホスト以外の参加者には待機メッセージを表示 */
              <div className="text-center">
                <p className="text-gray-600">
                  ホストがゲームを開始するまでお待ちください
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RoomPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto mb-4"></div>
          <p className="text-gray-600">ページを読み込んでいます...</p>
        </div>
      </div>
    }>
      <RoomContent />
    </Suspense>
  );
}