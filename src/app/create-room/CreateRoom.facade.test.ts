import { renderHook, act } from '@testing-library/react';
import { useCreateRoomFacade } from './CreateRoom.facade';

// 外部依存をモック
jest.mock('@/lib/roomService', () => ({
  createRoom: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('useCreateRoomFacade', () => {
  const mockCreateRoom = require('@/lib/roomService').createRoom;
  const mockPush = jest.fn();
  const mockUseRouter = require('next/navigation').useRouter;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
    });
  });

  describe('初期状態', () => {
    it('初期状態が正しく設定される', () => {
      const { result } = renderHook(() => useCreateRoomFacade());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.createRoom).toBe('function');
      expect(typeof result.current.navigateToHome).toBe('function');
    });
  });

  describe('ルーム作成機能', () => {
    it('ルーム作成が成功した場合、作成されたルームに遷移する', async () => {
      const mockRoomData = {
        roomCode: 'ABC123DEF456GHI789JK',
        hostUserId: 'user123',
      };
      mockCreateRoom.mockResolvedValue(mockRoomData);

      const { result } = renderHook(() => useCreateRoomFacade());

      await act(async () => {
        await result.current.createRoom('テストホスト');
      });

      expect(mockCreateRoom).toHaveBeenCalledWith('テストホスト');
      expect(mockPush).toHaveBeenCalledWith('/room?code=ABC123DEF456GHI789JK');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('ルーム作成中はローディング状態になる', async () => {
      let resolvePromise: (value: any) => void;
      const mockPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockCreateRoom.mockReturnValue(mockPromise);

      const { result } = renderHook(() => useCreateRoomFacade());

      act(() => {
        result.current.createRoom('テストホスト');
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();

      await act(async () => {
        resolvePromise!({
          roomCode: 'ABC123DEF456GHI789JK',
          hostUserId: 'user123',
        });
        await mockPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('ルーム作成が失敗した場合、エラー状態になる', async () => {
      const mockError = new Error('ルーム作成に失敗しました');
      mockCreateRoom.mockRejectedValue(mockError);

      const { result } = renderHook(() => useCreateRoomFacade());

      await act(async () => {
        try {
          await result.current.createRoom('テストホスト');
        } catch {
          // エラーは期待されるので無視
        }
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('ルーム作成に失敗しました');
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('ローディング状態が正しく管理される', async () => {
      let resolvePromise: (value: any) => void;
      const mockPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockCreateRoom.mockReturnValue(mockPromise);

      const { result } = renderHook(() => useCreateRoomFacade());

      // 実行前は非ローディング
      expect(result.current.isLoading).toBe(false);

      // 実行開始
      act(() => {
        result.current.createRoom('テストホスト');
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise!({
          roomCode: 'ABC123DEF456GHI789JK',
          hostUserId: 'user123',
        });
        await mockPromise;
      });

      expect(result.current.isLoading).toBe(false);
      expect(mockCreateRoom).toHaveBeenCalledTimes(1);
    });
  });

  describe('ナビゲーション機能', () => {
    it('navigateToHomeが呼ばれるとホームに遷移する', () => {
      const { result } = renderHook(() => useCreateRoomFacade());

      result.current.navigateToHome();

      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  describe('エラーハンドリング', () => {
    it('Errorオブジェクトのメッセージが適切に設定される', async () => {
      const mockError = new Error('ネットワークエラーが発生しました');
      mockCreateRoom.mockRejectedValue(mockError);

      const { result } = renderHook(() => useCreateRoomFacade());

      await act(async () => {
        try {
          await result.current.createRoom('テストホスト');
        } catch {
          // エラーは期待されるので無視
        }
      });

      expect(result.current.error).toBe('ネットワークエラーが発生しました');
    });

    it('文字列エラーも適切に処理される', async () => {
      mockCreateRoom.mockRejectedValue('文字列エラー');

      const { result } = renderHook(() => useCreateRoomFacade());

      await act(async () => {
        try {
          await result.current.createRoom('テストホスト');
        } catch {
          // エラーは期待されるので無視
        }
      });

      expect(result.current.error).toBe('ルームの作成に失敗しました');
    });

    it('不明なエラーの場合はデフォルトメッセージが設定される', async () => {
      mockCreateRoom.mockRejectedValue(null);

      const { result } = renderHook(() => useCreateRoomFacade());

      await act(async () => {
        try {
          await result.current.createRoom('テストホスト');
        } catch {
          // エラーは期待されるので無視
        }
      });

      expect(result.current.error).toBe('ルームの作成に失敗しました');
    });
  });
});