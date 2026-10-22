import React, { memo } from 'react';
import { GameMode } from '@/types';
import { useCreateRoomPresenter } from './CreateRoom.presenter';

interface CreateRoomViewProps {
  initialHostName?: string;
  onSubmit: (_hostName: string, _mode: GameMode) => Promise<void>;
  onBack: () => void;
  globalError: string | null;
  isGlobalLoading: boolean;
}

export const CreateRoomView = memo(({
  initialHostName,
  onSubmit,
  onBack,
  globalError,
  isGlobalLoading
}: CreateRoomViewProps) => {
  const {
    hostName,
    mode,
    modeOptions,
    isLoading,
    error,
    handleSubmit,
    handleBack,
    handleHostNameChange,
    handleModeChange,
  } = useCreateRoomPresenter({
    initialHostName,
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
                onChange={(e) => handleHostNameChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                maxLength={20}
                disabled={isLoading}
              />
              <p className="mt-1 text-sm text-gray-500">
                2-20文字（日本語、英数字のみ）
              </p>
            </div>

            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-2">ゲームモード</legend>
              <div className="space-y-2">
                {modeOptions.map((option) => {
                  const isSelected = option.mode === mode;
                  return (
                    <label
                      key={option.mode}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-slate-500 bg-slate-50'
                          : 'border-gray-300 hover:border-gray-400'
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="radio"
                        name="gameMode"
                        value={option.mode}
                        checked={isSelected}
                        onChange={() => handleModeChange(option.mode)}
                        disabled={isLoading}
                        className="mt-1 accent-slate-600"
                      />
                      <span className="flex-1">
                        <span className="block font-medium text-gray-900">{option.label}</span>
                        <span className="block text-sm text-gray-500">{option.description}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

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
              {isLoading ? '作成中...' : 'ルームを作成'}
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

CreateRoomView.displayName = 'CreateRoomView';