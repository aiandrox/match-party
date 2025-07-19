import { renderHook, act } from '@testing-library/react';
import { usePlayingGamePresenter } from './PlayingGame.presenter';
import { Room } from '@/types';

// 外部依存をモック
jest.mock('@/lib/roomService', () => ({
  getTopicByRoomId: jest.fn(),
  submitAnswer: jest.fn(),
  forceRevealAnswers: jest.fn(),
  changeTopicIfNoAnswers: jest.fn(),
}));

jest.mock('@/lib/gameRoundService', () => ({
  subscribeToGameRound: jest.fn(),
}));

jest.mock('@/lib/gameHistoryService', () => ({
  getUserAnswerForGameRound: jest.fn(),
}));

describe('usePlayingGamePresenter', () => {
  // テスト用モックデータ作成
  const createMockRoom = (participants: Array<{ id: string; isHost: boolean; hasAnswered: boolean }>): Room => ({
    id: 'room123',
    code: 'ABC123DEF456GHI789JK',
    status: 'playing',
    participants: participants.map((p, index) => ({
      id: p.id,
      name: `User ${index + 1}`,
      isHost: p.isHost,
      hasAnswered: p.hasAnswered,
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

  describe('ホスト権限とアクション実行権限', () => {
    it('ホストフラグがtrueのユーザーはホストとして認識される', () => {
      const room = createMockRoom([
        { id: 'user1', isHost: true, hasAnswered: false },
        { id: 'user2', isHost: false, hasAnswered: false },
      ]);

      const { result } = renderHook(() =>
        usePlayingGamePresenter({ room, currentUserId: 'user1' })
      );

      expect(result.current.isHost).toBe(true);
    });

    it('ゲストはホストアクションを実行できない', async () => {
      const { forceRevealAnswers, changeTopicIfNoAnswers } = await import('@/lib/roomService');
      const mockForceReveal = forceRevealAnswers as jest.Mock;
      const mockChangeTopic = changeTopicIfNoAnswers as jest.Mock;
      
      const room = createMockRoom([
        { id: 'user1', isHost: true, hasAnswered: false },
        { id: 'user2', isHost: false, hasAnswered: false },
      ]);

      const { result } = renderHook(() =>
        usePlayingGamePresenter({ room, currentUserId: 'user2' })
      );

      await act(async () => {
        await result.current.forceRevealAnswers();
        await result.current.changeTopic();
      });

      expect(mockForceReveal).not.toHaveBeenCalled();
      expect(mockChangeTopic).not.toHaveBeenCalled();
    });
  });

  describe('回答送信機能', () => {
    it('有効な回答を送信できる', async () => {
      const { submitAnswer } = await import('@/lib/roomService');
      const mockSubmitAnswer = submitAnswer as jest.Mock;
      mockSubmitAnswer.mockResolvedValue(undefined);

      const room = createMockRoom([
        { id: 'user1', isHost: true, hasAnswered: false },
      ]);

      const { result } = renderHook(() =>
        usePlayingGamePresenter({ room, currentUserId: 'user1' })
      );

      act(() => {
        result.current.setAnswer('テスト回答');
      });

      await act(async () => {
        await result.current.submitAnswer();
      });

      // 回答送信サービスが呼び出される
      expect(mockSubmitAnswer).toHaveBeenCalledWith('room123', 'user1', 'テスト回答');
      expect(result.current.submittedAnswer).toBe('テスト回答');
    });

    it('空の回答は送信できない', async () => {
      const { submitAnswer } = await import('@/lib/roomService');
      const mockSubmitAnswer = submitAnswer as jest.Mock;

      const room = createMockRoom([
        { id: 'user1', isHost: true, hasAnswered: false },
      ]);

      const { result } = renderHook(() =>
        usePlayingGamePresenter({ room, currentUserId: 'user1' })
      );

      act(() => {
        result.current.setAnswer('   '); // 空白のみ
      });

      await act(async () => {
        await result.current.submitAnswer();
      });

      expect(mockSubmitAnswer).not.toHaveBeenCalled();
      expect(result.current.hasSubmittedAnswer).toBe(false);
    });

    it('既に回答済みの場合は再送信できない', async () => {
      const { submitAnswer } = await import('@/lib/roomService');
      const mockSubmitAnswer = submitAnswer as jest.Mock;

      const room = createMockRoom([
        { id: 'user1', isHost: true, hasAnswered: true }, // 既に回答済み
      ]);

      const { result } = renderHook(() =>
        usePlayingGamePresenter({ room, currentUserId: 'user1' })
      );

      act(() => {
        result.current.setAnswer('新しい回答');
      });

      await act(async () => {
        await result.current.submitAnswer();
      });

      expect(mockSubmitAnswer).not.toHaveBeenCalled();
    });

    it('送信中は重複送信を防ぐ', async () => {
      const { submitAnswer } = await import('@/lib/roomService');
      const mockSubmitAnswer = submitAnswer as jest.Mock;
      mockSubmitAnswer.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      const room = createMockRoom([
        { id: 'user1', isHost: true, hasAnswered: false },
      ]);

      const { result } = renderHook(() =>
        usePlayingGamePresenter({ room, currentUserId: 'user1' })
      );

      act(() => {
        result.current.setAnswer('テスト回答');
      });

      // 1回目の送信開始
      act(() => {
        result.current.submitAnswer();
      });

      expect(result.current.isSubmittingAnswer).toBe(true);

      // 送信中に再度呼び出し
      await act(async () => {
        await result.current.submitAnswer();
      });

      expect(mockSubmitAnswer).toHaveBeenCalledTimes(1);
    });

    it('回答は前後の空白を除去して送信される', async () => {
      const { submitAnswer } = await import('@/lib/roomService');
      const mockSubmitAnswer = submitAnswer as jest.Mock;
      mockSubmitAnswer.mockResolvedValue(undefined);

      const room = createMockRoom([
        { id: 'user1', isHost: true, hasAnswered: false },
      ]);

      const { result } = renderHook(() =>
        usePlayingGamePresenter({ room, currentUserId: 'user1' })
      );

      act(() => {
        result.current.setAnswer('  テスト回答  ');
      });

      await act(async () => {
        await result.current.submitAnswer();
      });

      expect(mockSubmitAnswer).toHaveBeenCalledWith('room123', 'user1', 'テスト回答');
      expect(result.current.submittedAnswer).toBe('テスト回答');
    });
  });

  describe('ホストアクション', () => {
    it('ホストは回答を強制公開できる', async () => {
      const { forceRevealAnswers } = await import('@/lib/roomService');
      const mockForceReveal = forceRevealAnswers as jest.Mock;
      mockForceReveal.mockResolvedValue(undefined);

      const room = createMockRoom([
        { id: 'user1', isHost: true, hasAnswered: false },
      ]);

      const { result } = renderHook(() =>
        usePlayingGamePresenter({ room, currentUserId: 'user1' })
      );

      await act(async () => {
        await result.current.forceRevealAnswers();
      });

      expect(mockForceReveal).toHaveBeenCalledWith('room123');
    });

    it('ホストはお題を変更できる', async () => {
      const { changeTopicIfNoAnswers } = await import('@/lib/roomService');
      const mockChangeTopic = changeTopicIfNoAnswers as jest.Mock;
      mockChangeTopic.mockResolvedValue(undefined);

      const room = createMockRoom([
        { id: 'user1', isHost: true, hasAnswered: false },
      ]);

      const { result } = renderHook(() =>
        usePlayingGamePresenter({ room, currentUserId: 'user1' })
      );

      await act(async () => {
        await result.current.changeTopic();
      });

      expect(mockChangeTopic).toHaveBeenCalledWith('room123');
    });

    it('強制公開中は重複実行を防ぐ', async () => {
      const { forceRevealAnswers } = await import('@/lib/roomService');
      const mockForceReveal = forceRevealAnswers as jest.Mock;
      mockForceReveal.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      const room = createMockRoom([
        { id: 'user1', isHost: true, hasAnswered: false },
      ]);

      const { result } = renderHook(() =>
        usePlayingGamePresenter({ room, currentUserId: 'user1' })
      );

      // 1回目の実行開始
      act(() => {
        result.current.forceRevealAnswers();
      });

      expect(result.current.isForceRevealing).toBe(true);

      // 実行中に再度呼び出し
      await act(async () => {
        await result.current.forceRevealAnswers();
      });

      expect(mockForceReveal).toHaveBeenCalledTimes(1);
    });

    it('お題変更中は重複実行を防ぐ', async () => {
      const { changeTopicIfNoAnswers } = await import('@/lib/roomService');
      const mockChangeTopic = changeTopicIfNoAnswers as jest.Mock;
      mockChangeTopic.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      const room = createMockRoom([
        { id: 'user1', isHost: true, hasAnswered: false },
      ]);

      const { result } = renderHook(() =>
        usePlayingGamePresenter({ room, currentUserId: 'user1' })
      );

      // 1回目の実行開始
      act(() => {
        result.current.changeTopic();
      });

      expect(result.current.isChangingTopic).toBe(true);

      // 実行中に再度呼び出し
      await act(async () => {
        await result.current.changeTopic();
      });

      expect(mockChangeTopic).toHaveBeenCalledTimes(1);
    });
  });

  describe('参加者状態の反映', () => {
    it('参加者データから回答状態を正しく読み取る', () => {
      const room = createMockRoom([
        { id: 'user1', isHost: true, hasAnswered: true }, // 回答済み
        { id: 'user2', isHost: false, hasAnswered: false }, // 未回答
      ]);

      const { result } = renderHook(() =>
        usePlayingGamePresenter({ room, currentUserId: 'user1' })
      );

      expect(result.current.hasSubmittedAnswer).toBe(true);
    });

    it('参加者状態が変更されると回答状態が更新される', () => {
      const initialRoom = createMockRoom([
        { id: 'user1', isHost: true, hasAnswered: false },
      ]);

      const { result, rerender } = renderHook(
        ({ room }) => usePlayingGamePresenter({ room, currentUserId: 'user1' }),
        { initialProps: { room: initialRoom } }
      );

      expect(result.current.hasSubmittedAnswer).toBe(false);

      // 回答済み状態に変更
      const updatedRoom = createMockRoom([
        { id: 'user1', isHost: true, hasAnswered: true },
      ]);

      rerender({ room: updatedRoom });

      expect(result.current.hasSubmittedAnswer).toBe(true);
    });
  });

  describe('エラーハンドリング', () => {
    it('回答送信エラー時もアプリケーションが正常に動作する', async () => {
      const { submitAnswer } = await import('@/lib/roomService');
      const mockSubmitAnswer = submitAnswer as jest.Mock;
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockSubmitAnswer.mockRejectedValue(new Error('Network error'));

      const room = createMockRoom([
        { id: 'user1', isHost: true, hasAnswered: false },
      ]);

      const { result } = renderHook(() =>
        usePlayingGamePresenter({ room, currentUserId: 'user1' })
      );

      act(() => {
        result.current.setAnswer('テスト回答');
      });

      await act(async () => {
        await result.current.submitAnswer();
      });

      expect(consoleSpy).toHaveBeenCalledWith('回答の送信に失敗しました:', expect.any(Error));
      expect(result.current.isSubmittingAnswer).toBe(false);
      expect(result.current.hasSubmittedAnswer).toBe(false);

      consoleSpy.mockRestore();
    });
  });
});