import { renderHook, act } from '@testing-library/react';
import { useJoinRoomFacade } from './JoinRoom.facade';

// 外部依存をモック
jest.mock('@/lib/roomService', () => ({
  joinRoom: jest.fn(),
}));

jest.mock('@/lib/localStorage', () => {
  let store: Record<string, string> = {};
  return {
    saveUserIdForRoom: jest.fn(),
    saveUserName: jest.fn((name: string) => {
      store['userName'] = name;
    }),
    getUserName: jest.fn(() => store['userName'] ?? ''),
    __reset: () => {
      store = {};
    },
  };
});

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

describe('useJoinRoomFacade', () => {
  const mockJoinRoom = require('@/lib/roomService').joinRoom;
  const mockPush = jest.fn();
  const mockGet = jest.fn();
  const mockUseRouter = require('next/navigation').useRouter;
  const mockUseSearchParams = require('next/navigation').useSearchParams;
  const mockLocalStorage = require('@/lib/localStorage');

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.__reset();
    mockUseRouter.mockReturnValue({
      push: mockPush,
    });
    mockUseSearchParams.mockReturnValue({
      get: mockGet,
    });
  });

  describe('初期状態', () => {
    it('クエリパラメータにコードがない場合、初期ルームコードは空文字', () => {
      mockGet.mockReturnValue(null);

      const { result } = renderHook(() => useJoinRoomFacade());

      expect(result.current.initialRoomCode).toBe('');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('クエリパラメータにコードがある場合、初期ルームコードが設定される', () => {
      mockGet.mockReturnValue('ABC123DEF456GHI789JK');

      const { result } = renderHook(() => useJoinRoomFacade());

      expect(result.current.initialRoomCode).toBe('ABC123DEF456GHI789JK');
    });

    it('必要な機能がすべて提供される', () => {
      mockGet.mockReturnValue(null);

      const { result } = renderHook(() => useJoinRoomFacade());

      expect(typeof result.current.joinRoom).toBe('function');
      expect(typeof result.current.navigateToHome).toBe('function');
      expect(typeof result.current.initialRoomCode).toBe('string');
      expect(typeof result.current.isLoading).toBe('boolean');
    });

    it('前回入力した名前が保存されていない場合、initialUserNameは空文字', () => {
      mockGet.mockReturnValue(null);

      const { result } = renderHook(() => useJoinRoomFacade());

      expect(result.current.initialUserName).toBe('');
    });

    it('前回入力した名前が保存されている場合、initialUserNameに復元される', () => {
      mockGet.mockReturnValue(null);
      mockLocalStorage.saveUserName('たろう');

      const { result } = renderHook(() => useJoinRoomFacade());

      expect(result.current.initialUserName).toBe('たろう');
    });
  });

  describe('ルーム参加機能', () => {
    beforeEach(() => {
      mockGet.mockReturnValue(null);
    });

    it('ルーム参加が成功した場合、参加したルームに遷移する', async () => {
      const mockRoomData = {
        roomCode: 'ABC123DEF456GHI789JK',
        userId: 'user123',
      };
      mockJoinRoom.mockResolvedValue(mockRoomData);

      const { result } = renderHook(() => useJoinRoomFacade());

      await act(async () => {
        await result.current.joinRoom('ABC123DEF456GHI789JK', 'テストユーザー');
      });

      expect(mockJoinRoom).toHaveBeenCalledWith('ABC123DEF456GHI789JK', 'テストユーザー');
      expect(mockPush).toHaveBeenCalledWith('/room?code=ABC123DEF456GHI789JK');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('ルーム参加が成功した場合、入力した名前が次回のために保存される', async () => {
      mockJoinRoom.mockResolvedValue({
        roomCode: 'ABC123DEF456GHI789JK',
        userId: 'user123',
      });

      const { result } = renderHook(() => useJoinRoomFacade());

      await act(async () => {
        await result.current.joinRoom('ABC123DEF456GHI789JK', 'テストユーザー');
      });

      expect(mockLocalStorage.saveUserName).toHaveBeenCalledWith('テストユーザー');
    });

    it('ルーム参加が失敗した場合、名前は保存されない', async () => {
      mockJoinRoom.mockRejectedValue(new Error('ルームが見つかりません'));

      const { result } = renderHook(() => useJoinRoomFacade());

      await act(async () => {
        try {
          await result.current.joinRoom('INVALID', 'テストユーザー');
        } catch {
          // エラーは期待されるので無視
        }
      });

      expect(mockLocalStorage.saveUserName).not.toHaveBeenCalled();
    });

    it('ルーム参加中はローディング状態になる', async () => {
      let resolvePromise: (value: any) => void;
      const mockPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockJoinRoom.mockReturnValue(mockPromise);

      const { result } = renderHook(() => useJoinRoomFacade());

      act(() => {
        result.current.joinRoom('ABC123DEF456GHI789JK', 'テストユーザー');
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();

      await act(async () => {
        resolvePromise!({
          roomCode: 'ABC123DEF456GHI789JK',
          userId: 'user123',
        });
        await mockPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('ルーム参加が失敗した場合、エラー状態になる', async () => {
      const mockError = new Error('ルームが見つかりません');
      mockJoinRoom.mockRejectedValue(mockError);

      const { result } = renderHook(() => useJoinRoomFacade());

      await act(async () => {
        try {
          await result.current.joinRoom('INVALID123CODE', 'テストユーザー');
        } catch {
          // エラーは期待されるので無視
        }
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('ルームが見つかりません');
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('ローディング状態が正しく管理される', async () => {
      let resolvePromise: (value: any) => void;
      const mockPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockJoinRoom.mockReturnValue(mockPromise);

      const { result } = renderHook(() => useJoinRoomFacade());

      // 実行前は非ローディング
      expect(result.current.isLoading).toBe(false);

      // 実行開始
      act(() => {
        result.current.joinRoom('ABC123DEF456GHI789JK', 'テストユーザー');
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise!({
          userId: 'user123',
        });
        await mockPromise;
      });

      expect(result.current.isLoading).toBe(false);
      expect(mockJoinRoom).toHaveBeenCalledTimes(1);
    });
  });

  describe('ナビゲーション機能', () => {
    beforeEach(() => {
      mockGet.mockReturnValue(null);
    });

    it('navigateToHomeが呼ばれるとホームに遷移する', () => {
      const { result } = renderHook(() => useJoinRoomFacade());

      result.current.navigateToHome();

      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  describe('URLクエリパラメータ処理', () => {
    it('codeクエリパラメータが取得される', () => {
      mockGet.mockReturnValue('TEST123CODE456');

      const { result } = renderHook(() => useJoinRoomFacade());

      expect(mockGet).toHaveBeenCalledWith('code');
      expect(result.current.initialRoomCode).toBe('TEST123CODE456');
    });

    it('nullが返された場合は空文字に変換される', () => {
      mockGet.mockReturnValue(null);

      const { result } = renderHook(() => useJoinRoomFacade());

      expect(result.current.initialRoomCode).toBe('');
    });

    it('空文字が返された場合はそのまま使用される', () => {
      mockGet.mockReturnValue('');

      const { result } = renderHook(() => useJoinRoomFacade());

      expect(result.current.initialRoomCode).toBe('');
    });
  });

  describe('エラーハンドリング', () => {
    beforeEach(() => {
      mockGet.mockReturnValue(null);
    });

    it('Errorオブジェクトのメッセージが適切に設定される', async () => {
      const mockError = new Error('参加権限がありません');
      mockJoinRoom.mockRejectedValue(mockError);

      const { result } = renderHook(() => useJoinRoomFacade());

      await act(async () => {
        try {
          await result.current.joinRoom('ABC123DEF456GHI789JK', 'テストユーザー');
        } catch {
          // エラーは期待されるので無視
        }
      });

      expect(result.current.error).toBe('参加権限がありません');
    });

    it('文字列エラーも適切に処理される', async () => {
      mockJoinRoom.mockRejectedValue('ルームコードが無効です');

      const { result } = renderHook(() => useJoinRoomFacade());

      await act(async () => {
        try {
          await result.current.joinRoom('INVALID', 'テストユーザー');
        } catch {
          // エラーは期待されるので無視
        }
      });

      expect(result.current.error).toBe('ルームへの参加に失敗しました');
    });

    it('不明なエラーの場合はデフォルトメッセージが設定される', async () => {
      mockJoinRoom.mockRejectedValue(undefined);

      const { result } = renderHook(() => useJoinRoomFacade());

      await act(async () => {
        try {
          await result.current.joinRoom('ABC123DEF456GHI789JK', 'テストユーザー');
        } catch {
          // エラーは期待されるので無視
        }
      });

      expect(result.current.error).toBe('ルームへの参加に失敗しました');
    });
  });
});