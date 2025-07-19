import { render, screen, fireEvent } from '@testing-library/react';
import { WaitingRoomView } from './WaitingRoom.component';
import { Room } from '@/types';

jest.mock('./WaitingRoom.presenter', () => ({
  useWaitingRoomPresenter: jest.fn(),
}));

// MAX_PARTICIPANTSのモック
jest.mock('@/lib/utils', () => ({
  MAX_PARTICIPANTS: 20,
}));

// window.locationのモック
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
  },
  writable: true,
});

describe('WaitingRoomView', () => {
  const mockUseWaitingRoomPresenter = require('./WaitingRoom.presenter').useWaitingRoomPresenter;
  const defaultPresenterReturn = {
    isStartingGame: false,
    inviteUrlCopySuccess: false,
    isHost: false,
    canStartGame: false,
    startGame: jest.fn(),
    copyInviteUrl: jest.fn(),
    inviteUrl: 'http://localhost:3000/join-room?code=ABC123DEF456GHI789JK',
    isCurrentUser: jest.fn((id: string) => id === 'user1'),
  };

  const createMockRoom = (participants: Array<{ id: string; name: string; isHost: boolean }> = []): Room => ({
    id: 'room123',
    code: 'ABC123DEF456GHI789JK',
    status: 'waiting',
    participants: participants.map(p => ({
      id: p.id,
      name: p.name,
      isHost: p.isHost,
      hasAnswered: false,
      joinedAt: new Date(),
      isReady: false,
      roomId: 'room123',
    })),
    currentGameRoundId: undefined,
    createdAt: new Date(),
    expiresAt: new Date(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWaitingRoomPresenter.mockReturnValue(defaultPresenterReturn);
  });

  describe('基本表示', () => {
    it('待機画面の基本要素が表示される', () => {
      const room = createMockRoom([{ id: 'user1', name: 'ホスト', isHost: true }]);
      
      render(<WaitingRoomView room={room} currentUserId="user1" />);

      expect(screen.getByText('ゲームルーム')).toBeInTheDocument();
      expect(screen.getByText('参加者募集中')).toBeInTheDocument();
      expect(screen.getByText('招待URL:')).toBeInTheDocument();
      expect(screen.getByText('参加者一覧')).toBeInTheDocument();
    });

    it('招待URLが正しく表示される', () => {
      const room = createMockRoom([{ id: 'user1', name: 'ホスト', isHost: true }]);
      
      render(<WaitingRoomView room={room} currentUserId="user1" />);

      expect(screen.getByText('http://localhost:3000/join-room?code=ABC123DEF456GHI789JK')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'URLコピー' })).toBeInTheDocument();
      expect(screen.getByText('このURLを友達に送って、簡単にルームに招待できます')).toBeInTheDocument();
    });

    it('招待URLが生成中の場合は適切なメッセージが表示される', () => {
      mockUseWaitingRoomPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        inviteUrl: null,
      });

      const room = createMockRoom([{ id: 'user1', name: 'ホスト', isHost: true }]);
      render(<WaitingRoomView room={room} currentUserId="user1" />);

      expect(screen.getByText('招待URLを生成中...')).toBeInTheDocument();
      expect(screen.queryByText('http://localhost:3000/join-room?code=ABC123DEF456GHI789JK')).not.toBeInTheDocument();
    });

    it('参加者数の表示が正しい', () => {
      const room = createMockRoom([
        { id: 'user1', name: 'ホスト', isHost: true },
        { id: 'user2', name: 'ゲスト', isHost: false }
      ]);
      
      render(<WaitingRoomView room={room} currentUserId="user1" />);

      expect(screen.getByText('2/20人')).toBeInTheDocument();
    });
  });

  describe('参加者一覧表示', () => {
    it('参加者情報が正しく表示される', () => {
      const room = createMockRoom([
        { id: 'user1', name: 'ホスト', isHost: true },
        { id: 'user2', name: 'ゲスト', isHost: false }
      ]);
      
      render(<WaitingRoomView room={room} currentUserId="user1" />);

      expect(screen.getByText('ホスト')).toBeInTheDocument();
      expect(screen.getByText('ゲスト')).toBeInTheDocument();
      expect(screen.getByText('主催者')).toBeInTheDocument();
      expect(screen.getByText('参加者')).toBeInTheDocument();
    });

    it('現在のユーザーに特別なマークが表示される', () => {
      const room = createMockRoom([
        { id: 'user1', name: 'ホスト', isHost: true },
        { id: 'user2', name: 'ゲスト', isHost: false }
      ]);
      
      render(<WaitingRoomView room={room} currentUserId="user2" />);

      expect(screen.getByText('(あなた)')).toBeInTheDocument();
    });

    it('ホストと一般参加者で異なるアイコンが表示される', () => {
      const room = createMockRoom([
        { id: 'user1', name: 'ホスト', isHost: true },
        { id: 'user2', name: 'ゲスト', isHost: false }
      ]);
      
      render(<WaitingRoomView room={room} currentUserId="user1" />);

      expect(screen.getByText('👑')).toBeInTheDocument(); // ホストアイコン
      expect(screen.getByText('👤')).toBeInTheDocument(); // 一般参加者アイコン
    });
  });

  describe('URLコピー機能', () => {
    it('URLコピーボタンクリック時にPresenterのcopyInviteUrlが呼ばれる', () => {
      const copyInviteUrl = jest.fn();
      mockUseWaitingRoomPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        copyInviteUrl,
      });

      const room = createMockRoom([{ id: 'user1', name: 'ホスト', isHost: true }]);
      render(<WaitingRoomView room={room} currentUserId="user1" />);

      const copyButton = screen.getByRole('button', { name: 'URLコピー' });
      fireEvent.click(copyButton);

      expect(copyInviteUrl).toHaveBeenCalled();
    });

    it('コピー成功時にボタンの表示が変わる', () => {
      mockUseWaitingRoomPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        inviteUrlCopySuccess: true,
      });

      const room = createMockRoom([{ id: 'user1', name: 'ホスト', isHost: true }]);
      render(<WaitingRoomView room={room} currentUserId="user1" />);

      expect(screen.getByRole('button', { name: '✓' })).toBeInTheDocument();
    });
  });

  describe('ホスト機能', () => {
    it('ホストの場合はゲーム開始ボタンが表示される', () => {
      mockUseWaitingRoomPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        isHost: true,
        canStartGame: true,
      });

      const room = createMockRoom([{ id: 'user1', name: 'ホスト', isHost: true }]);
      render(<WaitingRoomView room={room} currentUserId="user1" />);

      expect(screen.getByRole('button', { name: 'ゲーム開始' })).toBeInTheDocument();
      expect(screen.queryByText('主催者がゲームを開始するまでお待ちください')).not.toBeInTheDocument();
    });

    it('ホストでない場合は待機メッセージが表示される', () => {
      mockUseWaitingRoomPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        isHost: false,
      });

      const room = createMockRoom([{ id: 'user1', name: 'ホスト', isHost: true }]);
      render(<WaitingRoomView room={room} currentUserId="user2" />);

      expect(screen.getByText('主催者がゲームを開始するまでお待ちください')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'ゲーム開始' })).not.toBeInTheDocument();
    });

    it('ゲーム開始ボタンクリック時にPresenterのstartGameが呼ばれる', () => {
      const startGame = jest.fn();
      mockUseWaitingRoomPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        isHost: true,
        canStartGame: true,
        startGame,
      });

      const room = createMockRoom([{ id: 'user1', name: 'ホスト', isHost: true }]);
      render(<WaitingRoomView room={room} currentUserId="user1" />);

      const startButton = screen.getByRole('button', { name: 'ゲーム開始' });
      fireEvent.click(startButton);

      expect(startGame).toHaveBeenCalled();
    });
  });

  describe('ゲーム開始状態', () => {
    it('ゲーム開始不可の場合はボタンが無効化され説明が表示される', () => {
      mockUseWaitingRoomPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        isHost: true,
        canStartGame: false,
      });

      const room = createMockRoom([{ id: 'user1', name: 'ホスト', isHost: true }]);
      render(<WaitingRoomView room={room} currentUserId="user1" />);

      const startButton = screen.getByRole('button', { name: 'ゲーム開始' });
      expect(startButton).toBeDisabled();
      expect(screen.getByText('ゲーム開始には2人以上の参加者が必要です')).toBeInTheDocument();
    });

    it('ゲーム開始中はローディング表示になる', () => {
      mockUseWaitingRoomPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        isHost: true,
        canStartGame: true,
        isStartingGame: true,
      });

      const room = createMockRoom([{ id: 'user1', name: 'ホスト', isHost: true }]);
      render(<WaitingRoomView room={room} currentUserId="user1" />);

      expect(screen.getByRole('button', { name: '開始中...' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '開始中...' })).toBeDisabled();
    });

    it('ゲーム開始可能な場合はボタンが有効になる', () => {
      mockUseWaitingRoomPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        isHost: true,
        canStartGame: true,
        isStartingGame: false,
      });

      const room = createMockRoom([
        { id: 'user1', name: 'ホスト', isHost: true },
        { id: 'user2', name: 'ゲスト', isHost: false }
      ]);
      render(<WaitingRoomView room={room} currentUserId="user1" />);

      const startButton = screen.getByRole('button', { name: 'ゲーム開始' });
      expect(startButton).not.toBeDisabled();
      expect(screen.queryByText('ゲーム開始には2人以上の参加者が必要です')).not.toBeInTheDocument();
    });
  });
});