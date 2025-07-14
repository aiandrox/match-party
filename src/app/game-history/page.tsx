'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GameHistory, GameRound, GameParticipant, GameAnswer } from '@/types';

// 履歴表示用の拡張されたGameRound型
interface GameRoundWithTopic extends GameRound {
  topicContent: string;
}

function GameHistoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const historyId = searchParams.get('id');
  
  const [histories, setHistories] = useState<GameHistory[]>([]);
  const [history, setHistory] = useState<GameHistory | null>(null);
  const [rounds, setRounds] = useState<GameRoundWithTopic[]>([]);
  const [participants, setParticipants] = useState<GameParticipant[]>([]);
  const [selectedRound, setSelectedRound] = useState<GameRoundWithTopic | null>(null);
  const [roundAnswers, setRoundAnswers] = useState<GameAnswer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (historyId) {
      // 詳細表示
      const loadHistoryDetail = async () => {
        try {
          const { getGameHistoryDetails } = await import('@/lib/gameHistoryService');
          const data = await getGameHistoryDetails(historyId);
          
          if (!data.history) {
            setError('履歴が見つかりません');
            return;
          }

          setHistory(data.history);
          setRounds(data.rounds);
          setParticipants(data.participants);
        } catch (err) {
          setError('履歴の読み込みに失敗しました');
        } finally {
          setIsLoading(false);
        }
      };

      loadHistoryDetail();
    } else {
      // 一覧表示
      const loadHistories = async () => {
        try {
          const { getGameHistories } = await import('@/lib/gameHistoryService');
          const data = await getGameHistories(20);
          setHistories(data);
        } catch (err) {
          setError('履歴の読み込みに失敗しました');
        } finally {
          setIsLoading(false);
        }
      };

      loadHistories();
    }
  }, [historyId]);

  const loadRoundAnswers = async (round: GameRoundWithTopic) => {
    try {
      const { getGameRoundAnswers } = await import('@/lib/gameHistoryService');
      const answers = await getGameRoundAnswers(round.id);
      setRoundAnswers(answers);
      setSelectedRound(round);
    } catch (err) {
      // 回答の読み込みに失敗した場合は空の配列を設定
      setRoundAnswers([]);
    }
  };


  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getJudgmentColor = (judgment: 'match' | 'no-match' | null | undefined) => {
    switch (judgment) {
      case 'match':
        return 'bg-green-100 text-green-800';
      case 'no-match':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getJudgmentText = (judgment: 'match' | 'no-match' | null | undefined) => {
    switch (judgment) {
      case 'match':
        return '一致';
      case 'no-match':
        return '不一致';
      default:
        return '判定なし';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">履歴を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  // 詳細表示モード
  if (historyId && history) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-6">
            <button
              onClick={() => router.push('/game-history')}
              className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← 履歴一覧に戻る
            </button>
          </div>

          {/* ゲーム概要 */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  ゲーム履歴
                </h1>
                <p className="text-gray-600">主催者: {history.hostName}</p>
              </div>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                history.status === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {history.status === 'completed' ? '完了' : '途中終了'}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {history.participantCount}
                </div>
                <div className="text-sm text-gray-500">参加者</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {history.totalRounds}
                </div>
                <div className="text-sm text-gray-500">ラウンド</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-900 font-medium">
                  {formatDate(history.startedAt)}
                </div>
                <div className="text-sm text-gray-500">開始時刻</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 参加者一覧 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                参加者 ({participants.length}名)
              </h2>
              <div className="space-y-3">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900">
                        {participant.userName}
                      </span>
                      {participant.isHost && (
                        <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          主催者
                        </span>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div>回答数: {participant.totalAnswers}</div>
                      <div>一致: {participant.matchedRounds}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ラウンド一覧 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                ラウンド一覧 ({rounds.length}ラウンド)
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {rounds.map((round) => (
                  <div
                    key={round.id}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => loadRoundAnswers(round)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-gray-900">
                        第{round.roundNumber}ラウンド
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getJudgmentColor(round.judgment)}`}>
                        {getJudgmentText(round.judgment)}
                      </div>
                    </div>
                    <div className="text-sm text-gray-700 mb-2">
                      {round.topicContent}
                    </div>
                    <div className="text-xs text-gray-500">
                      回答数: {round.answeredCount}/{round.totalParticipants}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 選択したラウンドの回答一覧 */}
          {selectedRound && (
            <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                第{selectedRound.roundNumber}ラウンドの回答
              </h3>
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <div className="font-medium text-blue-900 mb-2">お題:</div>
                <div className="text-blue-800">{selectedRound.topicContent}</div>
              </div>
              
              {roundAnswers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roundAnswers.map((answer) => (
                    <div
                      key={answer.id}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-gray-900">
                          {answer.userName}
                        </div>
                      </div>
                      <div className="text-gray-700 text-lg">
                        {answer.content}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  このラウンドには回答がありません
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ゲーム履歴
          </h1>
          <p className="text-gray-600">
            過去のゲームの記録を確認できます
          </p>
        </div>

        <div className="mb-6">
          <button
            onClick={() => router.push('/')}
            className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← ホームに戻る
          </button>
        </div>

        {histories.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-600 mb-4">まだゲーム履歴がありません</p>
            <button
              onClick={() => router.push('/create-room')}
              className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
            >
              新しいゲームを始める
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {histories.map((history) => (
              <div
                key={history.id}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => router.push(`/game-history?id=${history.id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      ゲーム履歴
                    </h3>
                    <p className="text-sm text-gray-500">
                      主催者: {history.hostName}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      history.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {history.status === 'completed' ? '完了' : '途中終了'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {history.participantCount}
                    </div>
                    <div className="text-sm text-gray-500">参加者</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {history.totalRounds}
                    </div>
                    <div className="text-sm text-gray-500">ラウンド</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-900 font-medium">
                      {formatDate(history.startedAt)}
                    </div>
                    <div className="text-sm text-gray-500">開始時刻</div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <span className="text-sm text-blue-600 hover:text-blue-800">
                    詳細を見る →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GameHistoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    }>
      <GameHistoryContent />
    </Suspense>
  );
}