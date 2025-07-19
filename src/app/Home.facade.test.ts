import { renderHook } from '@testing-library/react';
import { useHomeFacade } from './Home.facade';

// Next.jsルーターをモック
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('useHomeFacade', () => {
  const mockPush = jest.fn();
  const mockUseRouter = require('next/navigation').useRouter;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
    });
  });

  describe('ナビゲーション機能', () => {
    it('onCreateRoomが呼ばれると/create-roomに遷移する', () => {
      const { result } = renderHook(() => useHomeFacade());

      result.current.onCreateRoom();

      expect(mockPush).toHaveBeenCalledWith('/create-room');
    });

    it('onJoinRoomが呼ばれると/join-roomに遷移する', () => {
      const { result } = renderHook(() => useHomeFacade());

      result.current.onJoinRoom();

      expect(mockPush).toHaveBeenCalledWith('/join-room');
    });
  });

  describe('戻り値の型安全性', () => {
    it('必要なメソッドがすべて提供される', () => {
      const { result } = renderHook(() => useHomeFacade());

      expect(typeof result.current.onCreateRoom).toBe('function');
      expect(typeof result.current.onJoinRoom).toBe('function');
    });
  });

  describe('複数回呼び出し', () => {
    it('onCreateRoomを複数回呼び出してもそれぞれ遷移する', () => {
      const { result } = renderHook(() => useHomeFacade());

      result.current.onCreateRoom();
      result.current.onCreateRoom();

      expect(mockPush).toHaveBeenCalledTimes(2);
      expect(mockPush).toHaveBeenNthCalledWith(1, '/create-room');
      expect(mockPush).toHaveBeenNthCalledWith(2, '/create-room');
    });

    it('異なるメソッドを交互に呼び出せる', () => {
      const { result } = renderHook(() => useHomeFacade());

      result.current.onCreateRoom();
      result.current.onJoinRoom();
      result.current.onCreateRoom();

      expect(mockPush).toHaveBeenCalledTimes(3);
      expect(mockPush).toHaveBeenNthCalledWith(1, '/create-room');
      expect(mockPush).toHaveBeenNthCalledWith(2, '/join-room');
      expect(mockPush).toHaveBeenNthCalledWith(3, '/create-room');
    });
  });
});