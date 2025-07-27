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
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700">
              会話のヒント
            </h4>
          </div>
        </div>
        
        <button
          onClick={onGenerateSuggestions}
          disabled={isLoading || suggestions.length > 0}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            isLoading || suggestions.length > 0
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-gray-600 hover:bg-gray-700 text-white'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 border-2 border-gray-400 border-t-gray-600 rounded-full animate-spin"></div>
              生成中
            </div>
          ) : suggestions.length > 0 ? (
            <div className="flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              完了
            </div>
          ) : (
            '生成する'
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-2 mb-3">
          <p className="text-red-700 text-xs">
            {error}
          </p>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-2">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className={`p-3 rounded border ${getCategoryStyle(suggestion.category)}`}
            >
              <div className="flex items-start gap-2">
                <div className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center ${getCategoryIconStyle(suggestion.category)}`}>
                  {getCategoryIcon(suggestion.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 text-sm leading-relaxed mb-2">
                    {suggestion.message}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {suggestion.target && (
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <p className="text-xs text-gray-600">
                            {suggestion.target}さん
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${getTypeStyle(suggestion.type)}`}>
                        {getTypeLabel(suggestion.type)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {suggestions.length === 0 && !isLoading && !error && (
        <div className="text-center py-6">
          <p className="text-gray-500 text-xs">
            回答を元にAIが会話のヒントを提案します
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
      return 'bg-blue-50 border-blue-200';
    case 'unique':
      return 'bg-orange-50 border-orange-200';
    case 'interesting':
      return 'bg-green-50 border-green-200';
    case 'follow_up':
      return 'bg-purple-50 border-purple-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
}

// カテゴリーアイコンのスタイル
function getCategoryIconStyle(category: string): string {
  switch (category) {
    case 'common':
      return 'bg-blue-100 text-blue-600';
    case 'unique':
      return 'bg-orange-100 text-orange-600';
    case 'interesting':
      return 'bg-green-100 text-green-600';
    case 'follow_up':
      return 'bg-purple-100 text-purple-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

// カテゴリーアイコン
function getCategoryIcon(category: string): JSX.Element {
  switch (category) {
    case 'common':
      return (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case 'unique':
      return (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      );
    case 'interesting':
      return (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      );
    case 'follow_up':
      return (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
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