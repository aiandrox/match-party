import { renderHook, waitFor } from '@testing-library/react';
import { useRoomData } from './Room.facade';
import { Room } from '@/types';

// 外部依存をモック
jest.mock('@/lib/localStorage', () => ({
  getUserIdForRoom: jest.fn(),
}));

jest.mock('@/lib/roomService', () => ({
  getRoomByCode: jest.fn(),
  subscribeToRoom: jest.fn(),
}));

describe('useRoomData', () => {
  const mockGetUserIdForRoom = require('@/lib/localStorage').getUserIdForRoom;
  const mockGetRoomByCode = require('@/lib/roomService').getRoomByCode;
  const createMockRoom = (overrides: Partial<Room> = {}): Room => ({
    id: 'room123',
    code: 'ABC123DEF456GHI789JK',
    status: 'waiting',
    participants: [
      {
        id: 'user123',
        name: 'テストユーザー',
        isHost: true,
        joinedAt: new Date(),
        hasAnswered: false,
        isReady: false,
        roomId: 'room123',
      },
    ],
    currentGameRoundId: undefined,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30分後
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('初期状態とバリデーション', () => {
    it('初期状態が正しく設定される', () => {
      mockGetUserIdForRoom.mockReturnValue('user123');

      const { result } = renderHook(() => useRoomData('ABC123DEF456GHI789JK'));

      expect(result.current.room).toBeNull();
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.currentUserId).toBe('user123');
    });

    it('ルームコードが空の場合はエラーになる', async () => {
      const { result } = renderHook(() => useRoomData(''));

      await waitFor(() => {
        expect(result.current.error).toBe('ルームコードが指定されていません');
        expect(result.current.isLoading).toBe(false);
        expect(result.current.room).toBeNull();
      });
    });

    it('userIdが取得できない場合は参加権限エラーになる', async () => {
      mockGetUserIdForRoom.mockReturnValue(null);

      const { result } = renderHook(() => useRoomData('ABC123DEF456GHI789JK'));

      await waitFor(() => {
        expect(result.current.error).toBe('このルームへの参加権限が確認できません');
        expect(result.current.isLoading).toBe(false);
        expect(result.current.currentUserId).toBeNull();
      });
    });
  });

  describe('基本的なルーム取得', () => {
    beforeEach(() => {
      mockGetUserIdForRoom.mockReturnValue('user123');
    });

    it('ルームが見つからない場合はエラーになる', async () => {
      mockGetRoomByCode.mockResolvedValue(null);

      const { result } = renderHook(() => useRoomData('INVALID123CODE'));

      await waitFor(() => {
        expect(result.current.error).toBe('ルームが見つかりません');
        expect(result.current.isLoading).toBe(false);
        expect(result.current.room).toBeNull();
      });
    });

    it('期限切れのルームはエラーになる', async () => {
      jest.setSystemTime(new Date('2023-06-01'));
      const mockRoom = createMockRoom({
        expiresAt: new Date('2023-01-01'), // 過去の日付
      });
      mockGetRoomByCode.mockResolvedValue(mockRoom);

      const { result } = renderHook(() => useRoomData('ABC123DEF456GHI789JK'));

      await waitFor(() => {
        expect(result.current.error).toBe('このルームは有効期限が切れています');
        expect(result.current.isLoading).toBe(false);
        expect(result.current.room).toBeNull();
      });
    });

    it('参加者として登録されていないユーザーはアクセスできない', async () => {
      const mockRoom = createMockRoom({
        participants: [
          {
            id: 'otheruser',
            name: '他のユーザー',
            isHost: true,
            joinedAt: new Date(),
            hasAnswered: false,
            isReady: false,
            roomId: 'room123',
          },
        ],
      });
      mockGetRoomByCode.mockResolvedValue(mockRoom);

      const { result } = renderHook(() => useRoomData('ABC123DEF456GHI789JK'));

      await waitFor(() => {
        expect(result.current.error).toBe('このルームへの参加権限がありません');
        expect(result.current.isLoading).toBe(false);
        expect(result.current.room).toBeNull();
      });
    });
  });

  describe('エラーハンドリング', () => {
    beforeEach(() => {
      mockGetUserIdForRoom.mockReturnValue('user123');
    });

    it('ルーム取得でエラーが発生した場合', async () => {
      const mockError = new Error('ネットワークエラー');
      mockGetRoomByCode.mockRejectedValue(mockError);

      const { result } = renderHook(() => useRoomData('ABC123DEF456GHI789JK'));

      await waitFor(() => {
        expect(result.current.error).toBe('ネットワークエラー');
        expect(result.current.isLoading).toBe(false);
        expect(result.current.room).toBeNull();
      });
    });

    it('不明なエラーの場合はデフォルトメッセージが設定される', async () => {
      mockGetRoomByCode.mockRejectedValue(null);

      const { result } = renderHook(() => useRoomData('ABC123DEF456GHI789JK'));

      await waitFor(() => {
        expect(result.current.error).toBe('ルームの読み込みに失敗しました');
        expect(result.current.isLoading).toBe(false);
      });
    });
  });
});