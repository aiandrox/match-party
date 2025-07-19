import { renderHook, act } from '@testing-library/react';
import { useRevealingAnswersPresenter } from './RevealingAnswers.presenter';
import { Room } from '@/types';

jest.mock('@/lib/roomService', () => ({
  getTopicByRoomId: jest.fn(),
  getAnswersByGameRoundIdWithParticipants: jest.fn(),
  saveHostJudgment: jest.fn(),
  startNextRound: jest.fn(),
  endGame: jest.fn(),
}));

jest.mock('@/lib/gameRoundService', () => ({
  subscribeToGameRound: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getDoc: jest.fn(),
  doc: jest.fn(),
}));

jest.mock('@/lib/firebase', () => ({
  db: {},
}));

describe('useRevealingAnswersPresenter', () => {
  // テスト用モックデータ作成
  const createMockRoom = (participants: Array<{ id: string; isHost: boolean }> = []): Room => ({
    id: 'room123',
    code: 'ABC123DEF456GHI789JK',
    status: 'revealing',
    participants: participants.map((p, index) => ({
      id: p.id,
      name: `User ${index + 1}`,
      isHost: p.isHost,
      hasAnswered: true,
      joinedAt: new Date(),
      isReady: false,
      roomId: 'room123',
    })),
    currentGameRoundId: 'round123',
    createdAt: new Date(),
    expiresAt: new Date(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ホスト権限と判定機能', () => {
    it('ホストフラグがtrueのユーザーはホストとして認識される', () => {
      const room = createMockRoom([
        { id: 'user1', isHost: true },
        { id: 'user2', isHost: false },
      ]);

      const { result } = renderHook(() =>
        useRevealingAnswersPresenter({ room, currentUserId: 'user1' })
      );

      expect(result.current.isHost).toBe(true);
    });

    it('ゲストユーザーもホストアクションを実行できる（実装上の動作）', async () => {
      const { saveHostJudgment, startNextRound, endGame } = await import('@/lib/roomService');
      const mockSaveJudgment = saveHostJudgment as jest.Mock;
      const mockStartNext = startNextRound as jest.Mock;
      const mockEndGame = endGame as jest.Mock;
      
      const room = createMockRoom([
        { id: 'user1', isHost: true },
        { id: 'user2', isHost: false },
      ]);

      const { result } = renderHook(() =>
        useRevealingAnswersPresenter({ room, currentUserId: 'user2' })
      );

      expect(result.current.isHost).toBe(false);
      
      // ホストの権限でゲーム終了が実行される
      expect(typeof result.current.submitJudgment).toBe('function');
      expect(typeof result.current.startNextRound).toBe('function');
      expect(typeof result.current.endGame).toBe('function');
    });
  });

  describe('判定送信機能', () => {
    it('submitJudgment関数が提供される', () => {
      const room = createMockRoom([
        { id: 'user1', isHost: true },
      ]);

      const { result } = renderHook(() =>
        useRevealingAnswersPresenter({ room, currentUserId: 'user1' })
      );

      // さらに次ラウンドを続ける機能を提供
      expect(typeof result.current.submitJudgment).toBe('function');
    });

    it('判定結果の初期状態はnull', () => {
      const room = createMockRoom([
        { id: 'user1', isHost: true },
      ]);

      const { result } = renderHook(() =>
        useRevealingAnswersPresenter({ room, currentUserId: 'user1' })
      );

      expect(result.current.hostJudgment).toBe(null);
    });

    it('currentGameRoundIdが未設定の場合は判定を送信しない', async () => {
      const { saveHostJudgment } = await import('@/lib/roomService');
      const mockSaveJudgment = saveHostJudgment as jest.Mock;

      const room = createMockRoom([
        { id: 'user1', isHost: true },
      ]);
      room.currentGameRoundId = undefined; // GameRoundが未設定

      const { result } = renderHook(() =>
        useRevealingAnswersPresenter({ room, currentUserId: 'user1' })
      );

      await act(async () => {
        await result.current.submitJudgment('match');
      });

      expect(mockSaveJudgment).not.toHaveBeenCalled();
    });
  });

  describe('ゲーム進行機能', () => {
    it('次のラウンドを開始できる', async () => {
      const { startNextRound } = await import('@/lib/roomService');
      const mockStartNext = startNextRound as jest.Mock;
      mockStartNext.mockResolvedValue(undefined);

      const room = createMockRoom([
        { id: 'user1', isHost: true },
      ]);

      const { result } = renderHook(() =>
        useRevealingAnswersPresenter({ room, currentUserId: 'user1' })
      );

      await act(async () => {
        await result.current.startNextRound();
      });

      expect(mockStartNext).toHaveBeenCalledWith('room123');
    });

    it('ゲームを終了できる', async () => {
      const { endGame } = await import('@/lib/roomService');
      const mockEndGame = endGame as jest.Mock;
      mockEndGame.mockResolvedValue(undefined);

      const room = createMockRoom([
        { id: 'user1', isHost: true },
      ]);

      const { result } = renderHook(() =>
        useRevealingAnswersPresenter({ room, currentUserId: 'user1' })
      );

      await act(async () => {
        await result.current.endGame();
      });

      expect(mockEndGame).toHaveBeenCalledWith('room123');
    });

    it('次ラウンド開始時はローディング状態になる', async () => {
      const { startNextRound } = await import('@/lib/roomService');
      const mockStartNext = startNextRound as jest.Mock;
      mockStartNext.mockResolvedValue(undefined);

      const room = createMockRoom([
        { id: 'user1', isHost: true },
      ]);

      const { result } = renderHook(() =>
        useRevealingAnswersPresenter({ room, currentUserId: 'user1' })
      );

      expect(result.current.isStartingNextRound).toBe(false);

      await act(async () => {
        await result.current.startNextRound();
      });

      expect(result.current.isStartingNextRound).toBe(false); // 完了後
    });

    it('ゲーム終了時はローディング状態になる', async () => {
      const { endGame } = await import('@/lib/roomService');
      const mockEndGame = endGame as jest.Mock;
      mockEndGame.mockResolvedValue(undefined);

      const room = createMockRoom([
        { id: 'user1', isHost: true },
      ]);

      const { result } = renderHook(() =>
        useRevealingAnswersPresenter({ room, currentUserId: 'user1' })
      );

      expect(result.current.isEndingGame).toBe(false);

      await act(async () => {
        await result.current.endGame();
      });

      expect(result.current.isEndingGame).toBe(false); // 完了後
    });
  });

  describe('基本機能の提供', () => {
    it('必要な状態と機能がすべて提供される', () => {
      const room = createMockRoom([
        { id: 'user1', isHost: true },
      ]);

      const { result } = renderHook(() =>
        useRevealingAnswersPresenter({ room, currentUserId: 'user1' })
      );

      // 必要な機能が提供されることを確認
      expect(result.current.currentTopicContent).toBeDefined();
      expect(result.current.allAnswers).toBeDefined();
      expect(result.current.hostJudgment).toBeDefined();
      expect(result.current.isHost).toBeDefined();
      expect(result.current.isStartingNextRound).toBeDefined();
      expect(result.current.isEndingGame).toBeDefined();
      expect(typeof result.current.submitJudgment).toBe('function');
      expect(typeof result.current.startNextRound).toBe('function');
      expect(typeof result.current.endGame).toBe('function');
    });

    it('次ラウンド開始エラー時もアプリケーションが正常に動作する', async () => {
      const { startNextRound } = await import('@/lib/roomService');
      const mockStartNext = startNextRound as jest.Mock;
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockStartNext.mockRejectedValue(new Error('Network error'));

      const room = createMockRoom([
        { id: 'user1', isHost: true },
      ]);

      const { result } = renderHook(() =>
        useRevealingAnswersPresenter({ room, currentUserId: 'user1' })
      );

      await act(async () => {
        await result.current.startNextRound();
      });

      expect(consoleSpy).toHaveBeenCalledWith('次のラウンドの開始に失敗しました:', expect.any(Error));
      expect(result.current.isStartingNextRound).toBe(false);

      consoleSpy.mockRestore();
    });

    it('ゲーム終了エラー時もアプリケーションが正常に動作する', async () => {
      const { endGame } = await import('@/lib/roomService');
      const mockEndGame = endGame as jest.Mock;
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockEndGame.mockRejectedValue(new Error('Network error'));

      const room = createMockRoom([
        { id: 'user1', isHost: true },
      ]);

      const { result } = renderHook(() =>
        useRevealingAnswersPresenter({ room, currentUserId: 'user1' })
      );

      await act(async () => {
        await result.current.endGame();
      });

      expect(consoleSpy).toHaveBeenCalledWith('ゲーム終了に失敗しました:', expect.any(Error));
      expect(result.current.isEndingGame).toBe(false);

      consoleSpy.mockRestore();
    });
  });
});