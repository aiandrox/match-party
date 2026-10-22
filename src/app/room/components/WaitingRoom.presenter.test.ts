import { renderHook, act } from '@testing-library/react';
import { useWaitingRoomPresenter } from './WaitingRoom.presenter';
import { Room } from '@/types';

// Mock roomService
jest.mock('@/lib/roomService', () => ({
  startGame: jest.fn(),
  changeRoomMode: jest.fn(),
}));

// ブラウザAPI環境のセットアップ（実際のブラウザ環境に近づける）
const setupBrowserEnvironment = () => {
  const mockWriteText = jest.fn();
  const mockExecCommand = jest.fn();

  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: mockWriteText },
    writable: true,
  });

  Object.defineProperty(document, 'execCommand', {
    value: mockExecCommand,
    writable: true,
  });

  Object.defineProperty(window, 'location', {
    value: { origin: 'http://localhost:3000' },
    writable: true,
  });

  Object.defineProperty(window, 'isSecureContext', {
    value: true,
    writable: true,
  });

  return { mockWriteText, mockExecCommand };
};

describe('useWaitingRoomPresenter', () => {
  const createMockRoom = (participants: Array<{ id: string; isHost: boolean }> = []): Room => ({
    id: 'room123',
    code: 'ABC123DEF456GHI789JK',
    status: 'waiting',
    participants: participants.map((p, index) => ({
      id: p.id,
      name: `User ${index + 1}`,
      isHost: p.isHost,
      joinedAt: new Date(),
      hasAnswered: false,
      roomId: 'room123',
      firebaseUserId: 'test-firebase-uid',
    })),
    currentGameRoundId: undefined,
    createdAt: new Date(),
    expiresAt: new Date(),
  });

  let browserMocks: ReturnType<typeof setupBrowserEnvironment>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    browserMocks = setupBrowserEnvironment();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('ホスト判定とゲーム開始権限', () => {
    it('ルーム参加者でホストフラグがtrueのユーザーはホストとして認識される', () => {
      const room = createMockRoom([
        { id: 'user1', isHost: true },
        { id: 'user2', isHost: false },
      ]);

      const { result } = renderHook(() =>
        useWaitingRoomPresenter({ room, currentUserId: 'user1' })
      );

      expect(result.current.isHost).toBe(true);
    });

    it('ルーム参加者でホストフラグがfalseのユーザーはゲストとして認識される', () => {
      const room = createMockRoom([
        { id: 'user1', isHost: true },
        { id: 'user2', isHost: false },
      ]);

      const { result } = renderHook(() =>
        useWaitingRoomPresenter({ room, currentUserId: 'user2' })
      );

      expect(result.current.isHost).toBe(false);
    });

    it('ルームに参加していないユーザーはホストではない', () => {
      const room = createMockRoom([{ id: 'user1', isHost: true }]);

      const { result } = renderHook(() =>
        useWaitingRoomPresenter({ room, currentUserId: 'unknown-user' })
      );

      expect(result.current.isHost).toBe(false);
    });
  });

  describe('ゲームモード', () => {
    it('モード未設定のルームは一致モードとして表示される', () => {
      const room = createMockRoom([{ id: 'user1', isHost: true }]);

      const { result } = renderHook(() =>
        useWaitingRoomPresenter({ room, currentUserId: 'user1' })
      );

      expect(result.current.gameMode.mode).toBe('match');
      expect(result.current.gameMode.badgeLabel).toBe('一致モード');
      expect(result.current.modeOptions.map((option) => option.mode)).toEqual(['match', 'mismatch']);
    });

    it('不一致モードのルームは不一致モードとして表示される', () => {
      const room = { ...createMockRoom([{ id: 'user1', isHost: true }]), mode: 'mismatch' as const };

      const { result } = renderHook(() =>
        useWaitingRoomPresenter({ room, currentUserId: 'user1' })
      );

      expect(result.current.gameMode.mode).toBe('mismatch');
      expect(result.current.gameMode.badgeLabel).toBe('不一致モード');
    });

    it('ホストはモードを変更できる', async () => {
      const { changeRoomMode } = await import('@/lib/roomService');
      (changeRoomMode as jest.Mock).mockResolvedValue(undefined);

      const room = createMockRoom([{ id: 'user1', isHost: true }]);

      const { result } = renderHook(() =>
        useWaitingRoomPresenter({ room, currentUserId: 'user1' })
      );

      await act(async () => {
        await result.current.changeMode('mismatch');
      });

      expect(changeRoomMode).toHaveBeenCalledWith('room123', 'mismatch');
      expect(result.current.isChangingMode).toBe(false);
    });

    it('ゲストはモードを変更できない', async () => {
      const { changeRoomMode } = await import('@/lib/roomService');

      const room = createMockRoom([
        { id: 'user1', isHost: true },
        { id: 'user2', isHost: false },
      ]);

      const { result } = renderHook(() =>
        useWaitingRoomPresenter({ room, currentUserId: 'user2' })
      );

      await act(async () => {
        await result.current.changeMode('mismatch');
      });

      expect(changeRoomMode).not.toHaveBeenCalled();
    });

    it('現在と同じモードを選んでも変更は行われない', async () => {
      const { changeRoomMode } = await import('@/lib/roomService');

      const room = createMockRoom([{ id: 'user1', isHost: true }]);

      const { result } = renderHook(() =>
        useWaitingRoomPresenter({ room, currentUserId: 'user1' })
      );

      await act(async () => {
        await result.current.changeMode('match');
      });

      expect(changeRoomMode).not.toHaveBeenCalled();
    });

    it('モード変更エラー時もアプリケーションが正常に動作する', async () => {
      const { changeRoomMode } = await import('@/lib/roomService');
      (changeRoomMode as jest.Mock).mockRejectedValue(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const room = createMockRoom([{ id: 'user1', isHost: true }]);

      const { result } = renderHook(() =>
        useWaitingRoomPresenter({ room, currentUserId: 'user1' })
      );

      await act(async () => {
        await result.current.changeMode('mismatch');
      });

      expect(consoleSpy).toHaveBeenCalledWith('ゲームモードの変更に失敗しました:', expect.any(Error));
      expect(result.current.isChangingMode).toBe(false);

      consoleSpy.mockRestore();
    });
  });

  describe('ゲーム開始条件', () => {
    it('参加者が2人以上いる場合はゲーム開始可能', () => {
      const room = createMockRoom([
        { id: 'user1', isHost: true },
        { id: 'user2', isHost: false },
      ]);

      const { result } = renderHook(() =>
        useWaitingRoomPresenter({ room, currentUserId: 'user1' })
      );

      expect(result.current.canStartGame).toBe(true);
    });

    it('参加者が1人の場合はゲーム開始不可', () => {
      const room = createMockRoom([{ id: 'user1', isHost: true }]);

      const { result } = renderHook(() =>
        useWaitingRoomPresenter({ room, currentUserId: 'user1' })
      );

      expect(result.current.canStartGame).toBe(false);
    });
  });

  describe('ゲーム開始機能', () => {
    it('ゲストはゲームを開始できない', async () => {
      const { startGame } = await import('@/lib/roomService');
      const mockStartGame = startGame as jest.Mock;
      const room = createMockRoom([
        { id: 'user1', isHost: true },
        { id: 'user2', isHost: false },
      ]);

      const { result } = renderHook(() =>
        useWaitingRoomPresenter({ room, currentUserId: 'user2' })
      );

      await act(async () => {
        await result.current.startGame();
      });

      expect(mockStartGame).not.toHaveBeenCalled();
    });

    it('参加者が1人の場合ホストでもゲームを開始できない', async () => {
      const { startGame } = await import('@/lib/roomService');
      const mockStartGame = startGame as jest.Mock;
      const room = createMockRoom([{ id: 'user1', isHost: true }]);

      const { result } = renderHook(() =>
        useWaitingRoomPresenter({ room, currentUserId: 'user1' })
      );

      await act(async () => {
        await result.current.startGame();
      });

      expect(mockStartGame).not.toHaveBeenCalled();
    });

    it('ホストで参加者が2人以上の場合ゲームを開始できる', async () => {
      const { startGame } = await import('@/lib/roomService');
      const mockStartGame = startGame as jest.Mock;
      mockStartGame.mockResolvedValue(undefined);
      const room = createMockRoom([
        { id: 'user1', isHost: true },
        { id: 'user2', isHost: false },
      ]);

      const { result } = renderHook(() =>
        useWaitingRoomPresenter({ room, currentUserId: 'user1' })
      );

      await act(async () => {
        await result.current.startGame();
      });

      expect(mockStartGame).toHaveBeenCalledWith('room123');
    });

    it('ゲーム開始中は重複実行を防ぐ', async () => {
      const { startGame } = await import('@/lib/roomService');
      const mockStartGame = startGame as jest.Mock;
      mockStartGame.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      const room = createMockRoom([
        { id: 'user1', isHost: true },
        { id: 'user2', isHost: false },
      ]);

      const { result } = renderHook(() =>
        useWaitingRoomPresenter({ room, currentUserId: 'user1' })
      );

      // 1回目の実行開始
      act(() => {
        result.current.startGame();
      });

      expect(result.current.isStartingGame).toBe(true);

      // 実行中に再度呼び出し
      await act(async () => {
        await result.current.startGame();
      });

      expect(mockStartGame).toHaveBeenCalledTimes(1);
    });
  });

  describe('招待URL共有機能', () => {
    it('正常なブラウザ環境では招待URLをクリップボードにコピーできる', async () => {
      const room = createMockRoom([{ id: 'user1', isHost: true }]);
      browserMocks.mockWriteText.mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useWaitingRoomPresenter({ room, currentUserId: 'user1' })
      );

      await act(async () => {
        await result.current.copyInviteUrl();
      });

      expect(browserMocks.mockWriteText).toHaveBeenCalledWith(
        'http://localhost:3000/join-room?code=ABC123DEF456GHI789JK'
      );
      expect(result.current.inviteUrlCopySuccess).toBe(true);
    });

    it('コピー成功状態は2秒後にリセットされる', async () => {
      const room = createMockRoom([{ id: 'user1', isHost: true }]);
      browserMocks.mockWriteText.mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useWaitingRoomPresenter({ room, currentUserId: 'user1' })
      );

      await act(async () => {
        await result.current.copyInviteUrl();
      });

      expect(result.current.inviteUrlCopySuccess).toBe(true);

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.inviteUrlCopySuccess).toBe(false);
    });

    it('コピーエラー時もアプリケーションが正常に動作する', async () => {
      const room = createMockRoom([{ id: 'user1', isHost: true }]);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      browserMocks.mockWriteText.mockRejectedValue(new Error('Clipboard error'));

      const { result } = renderHook(() =>
        useWaitingRoomPresenter({ room, currentUserId: 'user1' })
      );

      await act(async () => {
        await result.current.copyInviteUrl();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        '招待URLのコピーに失敗しました:',
        expect.any(Error)
      );
      expect(result.current.inviteUrlCopySuccess).toBe(false);

      consoleSpy.mockRestore();
    });
  });
});