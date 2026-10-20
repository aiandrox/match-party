import { renderHook, act } from '@testing-library/react';
import { useGameEndedPresenter } from './GameEnded.presenter';
import { GameRound, Room } from '@/types';

jest.mock('@/lib/gameRoundService', () => ({
  getGameRoundsByRoomId: jest.fn(),
  getGameRoundAnswersWithParticipants: jest.fn(),
}));

describe('useGameEndedPresenter', () => {
  const createMockRoom = (status: 'waiting' | 'playing' | 'revealing' | 'ended' = 'ended', participants: Array<{ id: string }> = []): Room => ({
    id: 'room123',
    code: 'ABC123DEF456GHI789JK',
    status,
    participants: participants.map((p, index) => ({
      id: p.id,
      name: `User ${index + 1}`,
      isHost: index === 0,
      hasAnswered: false,
      joinedAt: new Date(),
      roomId: 'room123',
      firebaseUserId: 'test-firebase-uid',
    })),
    currentGameRoundId: undefined,
    createdAt: new Date(),
    expiresAt: new Date(),
  });

  const createMockGameRound = (overrides: Partial<GameRound> = {}): GameRound => ({
    id: 'round1',
    roomId: 'room123',
    roundNumber: 1,
    topicContent: 'テストお題',
    status: 'completed',
    createdAt: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('初期状態', () => {
    it('初期状態では適切な初期値が設定される', async () => {
      const { getGameRoundsByRoomId } = await import('@/lib/gameRoundService');
      const mockGetGameRounds = getGameRoundsByRoomId as jest.Mock;
      mockGetGameRounds.mockResolvedValue([]);

      const room = createMockRoom('ended', [{ id: 'user1' }]);

      const { result } = renderHook(() =>
        useGameEndedPresenter({ room, currentUserId: 'user1' })
      );

      expect(result.current.gameRounds).toEqual([]);
      expect(result.current.selectedRound).toBeNull();
      expect(result.current.roundAnswers).toEqual([]);
      expect(typeof result.current.loadRoundAnswers).toBe('function');

      // useEffect完了を待つ
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isLoadingHistory).toBe(false);
    });
  });

  describe('ゲーム履歴読み込み', () => {
    it('ゲーム終了状態でのみ履歴を読み込む', async () => {
      const { getGameRoundsByRoomId } = await import('@/lib/gameRoundService');
      const mockGetGameRounds = getGameRoundsByRoomId as jest.Mock;
      mockGetGameRounds.mockResolvedValue([
        { id: 'round1', roundNumber: 1, topicContent: 'テストお題1' },
        { id: 'round2', roundNumber: 2, topicContent: 'テストお題2' },
      ]);

      const room = createMockRoom('ended', [{ id: 'user1' }]);

      renderHook(() =>
        useGameEndedPresenter({ room, currentUserId: 'user1' })
      );

      // useEffectが実行されるまで待機
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockGetGameRounds).toHaveBeenCalledWith('room123');
    });

    it('ゲーム終了以外の状態では履歴を読み込まない', async () => {
      const { getGameRoundsByRoomId } = await import('@/lib/gameRoundService');
      const mockGetGameRounds = getGameRoundsByRoomId as jest.Mock;

      const room = createMockRoom('playing', [{ id: 'user1' }]);

      renderHook(() =>
        useGameEndedPresenter({ room, currentUserId: 'user1' })
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockGetGameRounds).not.toHaveBeenCalled();
    });

    it('履歴読み込みが完了するとローディング状態が終了する', async () => {
      const { getGameRoundsByRoomId } = await import('@/lib/gameRoundService');
      const mockGetGameRounds = getGameRoundsByRoomId as jest.Mock;
      mockGetGameRounds.mockResolvedValue([
        { id: 'round1', roundNumber: 1, topicContent: 'テストお題1' }
      ]);

      const room = createMockRoom('ended', [{ id: 'user1' }]);

      const { result } = renderHook(() =>
        useGameEndedPresenter({ room, currentUserId: 'user1' })
      );

      // useEffectが実行される前は初期状態
      expect(result.current.gameRounds).toEqual([]);

      // useEffectの完了を待つ
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isLoadingHistory).toBe(false);
    });
  });

  describe('ラウンド回答読み込み機能', () => {
    it('特定のラウンドの回答を読み込める', async () => {
      const { getGameRoundAnswersWithParticipants } = await import('@/lib/gameRoundService');
      const mockGetAnswers = getGameRoundAnswersWithParticipants as jest.Mock;
      mockGetAnswers.mockResolvedValue([
        { content: '回答1', userName: 'User 1' },
        { content: '回答2', userName: 'User 2' },
      ]);

      const room = createMockRoom('ended', [{ id: 'user1' }, { id: 'user2' }]);
      const testRound = createMockGameRound();

      const { result } = renderHook(() =>
        useGameEndedPresenter({ room, currentUserId: 'user1' })
      );

      await act(async () => {
        await result.current.loadRoundAnswers(testRound);
      });

      expect(mockGetAnswers).toHaveBeenCalledWith('round1', room.participants);
      expect(result.current.selectedRound).toEqual(testRound);
    });
  });

  describe('基本機能の提供', () => {
    it('必要な状態と機能がすべて提供される', () => {
      const room = createMockRoom('ended', [{ id: 'user1' }]);

      const { result } = renderHook(() =>
        useGameEndedPresenter({ room, currentUserId: 'user1' })
      );

      expect(Array.isArray(result.current.gameRounds)).toBe(true);
      expect(typeof result.current.isLoadingHistory).toBe('boolean');
      expect(result.current.selectedRound).toBeDefined();
      expect(Array.isArray(result.current.roundAnswers)).toBe(true);
      expect(typeof result.current.loadRoundAnswers).toBe('function');
    });
  });

  describe('統計情報', () => {
    it('一致したラウンド数と一致率が集計される', async () => {
      const { getGameRoundsByRoomId } = await import('@/lib/gameRoundService');
      const mockGetGameRounds = getGameRoundsByRoomId as jest.Mock;
      mockGetGameRounds.mockResolvedValue([
        createMockGameRound({ id: 'round1', roundNumber: 1, judgment: 'match' }),
        createMockGameRound({ id: 'round2', roundNumber: 2, judgment: 'no-match' }),
        createMockGameRound({ id: 'round3', roundNumber: 3, judgment: 'match' }),
      ]);

      const room = createMockRoom('ended', [{ id: 'user1' }]);

      const { result } = renderHook(() =>
        useGameEndedPresenter({ room, currentUserId: 'user1' })
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.gameStatistics).toEqual({
        totalRounds: 3,
        matchedRounds: 2,
        matchRate: 67,
      });
    });

    it('判定なしのラウンドは一致として数えない', async () => {
      const { getGameRoundsByRoomId } = await import('@/lib/gameRoundService');
      const mockGetGameRounds = getGameRoundsByRoomId as jest.Mock;
      mockGetGameRounds.mockResolvedValue([
        createMockGameRound({ id: 'round1', roundNumber: 1, judgment: 'match' }),
        createMockGameRound({ id: 'round2', roundNumber: 2 }),
      ]);

      const room = createMockRoom('ended', [{ id: 'user1' }]);

      const { result } = renderHook(() =>
        useGameEndedPresenter({ room, currentUserId: 'user1' })
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.gameStatistics).toEqual({
        totalRounds: 2,
        matchedRounds: 1,
        matchRate: 50,
      });
    });

    it('選択したラウンドの判定結果に応じて回答の配色が変わる', async () => {
      const { getGameRoundAnswersWithParticipants } = await import('@/lib/gameRoundService');
      const mockGetAnswers = getGameRoundAnswersWithParticipants as jest.Mock;
      mockGetAnswers.mockResolvedValue([]);

      const room = createMockRoom('ended', [{ id: 'user1' }]);

      const { result } = renderHook(() =>
        useGameEndedPresenter({ room, currentUserId: 'user1' })
      );

      expect(result.current.answerStyle.bgColor).toBe('bg-gray-50 border-gray-200');

      await act(async () => {
        await result.current.loadRoundAnswers(createMockGameRound({ judgment: 'match' }));
      });
      expect(result.current.answerStyle.bgColor).toBe('bg-emerald-100 border-emerald-300');

      await act(async () => {
        await result.current.loadRoundAnswers(createMockGameRound({ judgment: 'no-match' }));
      });
      expect(result.current.answerStyle.bgColor).toBe('bg-rose-100 border-rose-300');
    });
  });

  describe('エラーハンドリング', () => {
    it('履歴読み込みエラー時もアプリケーションが正常に動作する', async () => {
      const { getGameRoundsByRoomId } = await import('@/lib/gameRoundService');
      const mockGetGameRounds = getGameRoundsByRoomId as jest.Mock;
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockGetGameRounds.mockRejectedValue(new Error('Network error'));

      const room = createMockRoom('ended', [{ id: 'user1' }]);

      renderHook(() =>
        useGameEndedPresenter({ room, currentUserId: 'user1' })
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(consoleSpy).toHaveBeenCalledWith('ゲーム履歴の読み込みに失敗しました:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('ラウンド回答読み込みエラー時もアプリケーションが正常に動作する', async () => {
      const { getGameRoundAnswersWithParticipants } = await import('@/lib/gameRoundService');
      const mockGetAnswers = getGameRoundAnswersWithParticipants as jest.Mock;
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockGetAnswers.mockRejectedValue(new Error('Network error'));

      const room = createMockRoom('ended', [{ id: 'user1' }]);
      const testRound = createMockGameRound();

      const { result } = renderHook(() =>
        useGameEndedPresenter({ room, currentUserId: 'user1' })
      );

      await act(async () => {
        await result.current.loadRoundAnswers(testRound);
      });

      expect(consoleSpy).toHaveBeenCalledWith('ラウンド回答の読み込みに失敗しました:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });
});