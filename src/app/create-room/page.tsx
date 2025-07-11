'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateRoomPage() {
  const [hostName, setHostName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hostName.trim()) {
      setError('名前を入力してください');
      return;
    }

    if (hostName.length < 2 || hostName.length > 20) {
      setError('名前は2文字以上20文字以内で入力してください');
      return;
    }

    if (!/^[a-zA-Z0-9ひらがなカタカナ漢字]+$/.test(hostName)) {
      setError('名前は日本語、英数字のみ使用できます');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 動的インポートでFirebase初期化を避ける
      const { createRoom } = await import('@/lib/roomService');
      const result = await createRoom(hostName);
      
      // ルーム作成成功時にルームページへリダイレクト
      router.push(`/room/${result.roomCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ルームの作成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              ルーム作成
            </h1>
            <p className="text-gray-600">
              ホストとしてゲームルームを作成します
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="hostName" className="block text-sm font-medium text-gray-700 mb-2">
                あなたの名前
              </label>
              <input
                type="text"
                id="hostName"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                placeholder="山田太郎"
                maxLength={20}
                disabled={isLoading}
              />
              <p className="mt-1 text-sm text-gray-500">
                2-20文字（日本語、英数字のみ）
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-slate-700 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? '作成中...' : 'ルームを作成'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.back()}
              className="text-slate-600 hover:text-slate-800 text-sm"
            >
              戻る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}