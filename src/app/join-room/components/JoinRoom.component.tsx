import React, { memo } from 'react';
import { useJoinRoomPresenter } from './JoinRoom.presenter';

interface JoinRoomViewProps {
  initialRoomCode: string;
  onSubmit: (_roomCode: string, _userName: string) => Promise<void>;
  onBack: () => void;
  globalError: string | null;
  isGlobalLoading: boolean;
}

export const JoinRoomView = memo(({
  initialRoomCode,
  onSubmit,
  onBack,
  globalError,
  isGlobalLoading
}: JoinRoomViewProps) => {
  const {
    roomCode,
    userName,
    isLoading,
    error,
    handleSubmit,
    handleBack,
    handleRoomCodeChange,
    handleUserNameChange,
  } = useJoinRoomPresenter({
    initialRoomCode,
    onSubmit,
    onBack,
    globalError,
    isGlobalLoading
  });
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              ルーム参加
            </h1>
            <p className="text-gray-600">
              ルームコードを入力してゲームに参加しましょう
            </p>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                💡 <strong>再参加について:</strong> 以前参加したルームには、ゲーム中でも同じ名前を入力することで再度参加できます
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700 mb-2">
                ルームコード
              </label>
              <input
                type="text"
                id="roomCode"
                value={roomCode}
                onChange={(e) => handleRoomCodeChange(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent font-mono"
                placeholder="ABCD1234EFGH5678IJKL"
                maxLength={20}
                disabled={isLoading}
              />
              <p className="mt-1 text-sm text-gray-500">
                20文字の英数字コード
              </p>
            </div>

            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-2">
                あなたの名前
              </label>
              <input
                type="text"
                id="userName"
                value={userName}
                onChange={(e) => handleUserNameChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                maxLength={20}
                disabled={isLoading}
              />
              <p className="mt-1 text-sm text-gray-500">
                2-20文字（日本語、英数字のみ）
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                <p className="text-sm text-rose-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-slate-700 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? '参加中...' : 'ルームに参加'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={handleBack}
              className="text-slate-600 hover:text-slate-800 text-sm"
            >
              戻る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

JoinRoomView.displayName = 'JoinRoomView';