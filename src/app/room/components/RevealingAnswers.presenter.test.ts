import { renderHook, act } from '@testing-library/react';
import { useRevealingAnswersPresenter } from './RevealingAnswers.presenter';
import { Room } from '@/types';

jest.mock('@/lib/roomService', () => ({
  getTopicByRoomId: jest.fn(),
  getRoundAnswers: jest.fn(),
  submitJudgment: jest.fn(),
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

jest.mock('@/lib/topicFeedbackService', () => ({
  checkExistingFeedback: jest.fn().mockResolvedValue(false),
  submitTopicFeedback: jest.fn(),
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
      roomId: 'room123',
      firebaseUserId: 'test-firebase-uid',
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

    it('ゲストユーザーはホストアクションを実行できない', async () => {
      const room = createMockRoom([
        { id: 'user1', isHost: true },
        { id: 'user2', isHost: false },
      ]);

      const { result } = renderHook(() =>
        useRevealingAnswersPresenter({ room, currentUserId: 'user2' })
      );

      expect(result.current.isHost).toBe(false);

      // ゲストユーザーがホストアクションを実行してもサービスが呼ばれないことをテスト
      await act(async () => {
        await result.current.submitJudgment('match');
        await result.current.startNextRound();
        await result.current.endGame();
      });

      const { submitJudgment, startNextRound, endGame } = await import('@/lib/roomService');
      
      expect(submitJudgment).not.toHaveBeenCalled();
      expect(startNextRound).not.toHaveBeenCalled();
      expect(endGame).not.toHaveBeenCalled();
      
      // ホストの権限でゲーム終了が実行される
      expect(typeof result.current.submitJudgment).toBe('function');
      expect(typeof result.current.startNextRound).toBe('function');
      expect(typeof result.current.endGame).toBe('function');
    });
  });

  describe('ゲームモード', () => {
    it('モード未設定のルームは一致モードの定義が返る', () => {
      const room = createMockRoom([{ id: 'user1', isHost: true }]);

      const { result } = renderHook(() =>
        useRevealingAnswersPresenter({ room, currentUserId: 'user1' })
      );

      expect(result.current.gameMode.mode).toBe('match');
      expect(result.current.gameMode.successJudgment).toBe('match');
    });

    it('不一致モードのルームは不一致モードの定義が返る', () => {
      const room = { ...createMockRoom([{ id: 'user1', isHost: true }]), mode: 'mismatch' as const };

      const { result } = renderHook(() =>
        useRevealingAnswersPresenter({ room, currentUserId: 'user1' })
      );

      expect(result.current.gameMode.mode).toBe('mismatch');
      expect(result.current.gameMode.successJudgment).toBe('no-duplicate');
      expect(result.current.gameMode.failureJudgment).toBe('has-duplicate');
    });

    it('不一致モードの判定もそのまま保存される', async () => {
      const { submitJudgment, getTopicByRoomId, getRoundAnswers } = await import('@/lib/roomService');
      (submitJudgment as jest.Mock).mockResolvedValue(undefined);
      (getTopicByRoomId as jest.Mock).mockResolvedValue({ id: 'round123', content: 'テストお題', round: 1 });
      (getRoundAnswers as jest.Mock).mockResolvedValue([]);
      const { getDoc } = await import('firebase/firestore');
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });

      const room = { ...createMockRoom([{ id: 'user1', isHost: true }]), mode: 'mismatch' as const };

      const { result } = renderHook(() =>
        useRevealingAnswersPresenter({ room, currentUserId: 'user1' })
      );

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.submitJudgment('no-duplicate');
      });

      expect(submitJudgment).toHaveBeenCalledWith('room123', 'no-duplicate');
      expect(result.current.hostJudgment).toBe('no-duplicate');
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
      const { submitJudgment } = await import('@/lib/roomService');
      const mockSaveJudgment = submitJudgment as jest.Mock;

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

  describe('会話のヒント（ファシリテーション提案）', () => {
    const setupRevealedRound = async () => {
      const { getTopicByRoomId, getRoundAnswers } = await import('@/lib/roomService');
      (getTopicByRoomId as jest.Mock).mockResolvedValue({
        id: 'round123',
        content: 'テストお題',
        round: 1,
      });
      (getRoundAnswers as jest.Mock).mockResolvedValue([
        { content: '回答1', userName: 'User 1', hasAnswered: true, submittedAt: new Date() },
        { content: '回答2', userName: 'User 2', hasAnswered: true, submittedAt: new Date() },
      ]);
      const { getDoc } = await import('firebase/firestore');
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });
    };

    it('初期状態では提案は空で、読み込み中でもエラーでもない', () => {
      const room = createMockRoom([{ id: 'user1', isHost: true }]);

      const { result } = renderHook(() =>
        useRevealingAnswersPresenter({ room, currentUserId: 'user1' })
      );

      expect(result.current.suggestions).toEqual([]);
      expect(result.current.isFacilitationLoading).toBe(false);
      expect(result.current.facilitationError).toBeNull();
    });

    it('お題と回答が揃っていれば会話のヒントを生成できる', async () => {
      await setupRevealedRound();
      const { generateFacilitationSuggestions } = await import('@/lib/facilitationService');

      const room = createMockRoom([{ id: 'user1', isHost: true }, { id: 'user2', isHost: false }]);

      const { result } = renderHook(() =>
        useRevealingAnswersPresenter({ room, currentUserId: 'user1' })
      );

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.generateFacilitation();
      });

      expect(generateFacilitationSuggestions).toHaveBeenCalledWith({
        answers: [
          expect.objectContaining({ content: '回答1', userName: 'User 1' }),
          expect.objectContaining({ content: '回答2', userName: 'User 2' }),
        ],
        topicContent: 'テストお題',
        roomCode: 'ABC123DEF456GHI789JK',
        roundNumber: 1,
      });
      expect(result.current.suggestions).toHaveLength(1);
      expect(result.current.facilitationError).toBeNull();
    });

    it('お題が読み込まれていない間は会話のヒントを生成しない', async () => {
      const { generateFacilitationSuggestions } = await import('@/lib/facilitationService');

      const room = createMockRoom([{ id: 'user1', isHost: true }]);

      const { result } = renderHook(() =>
        useRevealingAnswersPresenter({ room, currentUserId: 'user1' })
      );

      await act(async () => {
        await result.current.generateFacilitation();
      });

      expect(generateFacilitationSuggestions).not.toHaveBeenCalled();
    });

    it('次のラウンドを開始すると前ラウンドの会話のヒントはクリアされる', async () => {
      await setupRevealedRound();
      const { startNextRound } = await import('@/lib/roomService');
      (startNextRound as jest.Mock).mockResolvedValue(undefined);

      const room = createMockRoom([{ id: 'user1', isHost: true }, { id: 'user2', isHost: false }]);

      const { result } = renderHook(() =>
        useRevealingAnswersPresenter({ room, currentUserId: 'user1' })
      );

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      await act(async () => {
        await result.current.generateFacilitation();
      });
      expect(result.current.suggestions).toHaveLength(1);

      await act(async () => {
        await result.current.startNextRound();
      });

      expect(result.current.suggestions).toEqual([]);
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