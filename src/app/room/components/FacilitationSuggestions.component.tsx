import React, { memo } from 'react';
import { FacilitationSuggestion } from '@/types';

interface FacilitationSuggestionsProps {
  suggestions: FacilitationSuggestion[];
  isLoading: boolean;
  error: string | null;
  onGenerateSuggestions: () => void;
  isHost: boolean;
}

export const FacilitationSuggestions = memo(({
  suggestions,
  isLoading,
  error,
  onGenerateSuggestions,
  isHost
}: FacilitationSuggestionsProps) => {
  if (!isHost) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
          <h3 className="text-lg font-semibold text-purple-900">
            ファシリテーション提案
          </h3>
          <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-medium">
            AI
          </span>
        </div>
        
        <button
          onClick={onGenerateSuggestions}
          disabled={isLoading}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              生成中...
            </div>
          ) : (
            '提案を生成'
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-800 text-sm">
            <span className="font-medium">エラー:</span> {error}
          </p>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className={`p-3 rounded-lg border-l-4 ${getCategoryStyle(suggestion.category)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-gray-800 font-medium">
                    {suggestion.message}
                  </p>
                  {suggestion.target && (
                    <p className="text-sm text-gray-600 mt-1">
                      対象: {suggestion.target}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTypeStyle(suggestion.type)}`}>
                    {getTypeLabel(suggestion.type)}
                  </span>
                  <div className="flex items-center">
                    {Array.from({ length: suggestion.priority }).map((_, i) => (
                      <div key={i} className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-0.5"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {suggestions.length === 0 && !isLoading && !error && (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">
            「提案を生成」ボタンを押して、AIによる会話のきっかけを取得しましょう
          </p>
        </div>
      )}
    </div>
  );
});

// カテゴリーに応じたスタイル
function getCategoryStyle(category: string): string {
  switch (category) {
    case 'common':
      return 'bg-blue-50 border-blue-300';
    case 'unique':
      return 'bg-orange-50 border-orange-300';
    case 'interesting':
      return 'bg-green-50 border-green-300';
    case 'follow_up':
      return 'bg-purple-50 border-purple-300';
    default:
      return 'bg-gray-50 border-gray-300';
  }
}

// タイプに応じたスタイル
function getTypeStyle(type: string): string {
  switch (type) {
    case 'individual':
      return 'bg-yellow-100 text-yellow-800';
    case 'group':
      return 'bg-blue-100 text-blue-800';
    case 'comparison':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// タイプのラベル
function getTypeLabel(type: string): string {
  switch (type) {
    case 'individual':
      return '個人';
    case 'group':
      return 'グループ';
    case 'comparison':
      return '比較';
    default:
      return type;
  }
}

FacilitationSuggestions.displayName = 'FacilitationSuggestions';