import { render, screen, fireEvent } from '@testing-library/react';
import { RevealingAnswersView } from './RevealingAnswers.component';
import { Room } from '@/types';

jest.mock('./RevealingAnswers.presenter', () => ({
  useRevealingAnswersPresenter: jest.fn(),
}));

// エフェクト関連のモック（テストしない）
jest.mock('@/lib/gameEffects', () => ({
  playMatchSound: jest.fn(),
  playNoMatchSound: jest.fn(),
  createConfettiEffect: jest.fn(),
  injectGameAnimations: jest.fn(),
}));

describe('RevealingAnswersView', () => {
  const mockUseRevealingAnswersPresenter = require('./RevealingAnswers.presenter').useRevealingAnswersPresenter;
  
  const defaultPresenterReturn = {
    currentTopicContent: null,
    allAnswers: [],
    hostJudgment: null,
    isHost: false,
    isStartingNextRound: false,
    isEndingGame: false,
    submitJudgment: jest.fn(),
    startNextRound: jest.fn(),
    endGame: jest.fn(),
    judgmentStyle: {
      bgColor: 'bg-gray-50 border-gray-200',
      textColor: 'text-gray-900'
    },
    hasAnimated: false,
  };

  const createMockRoom = (): Room => ({
    id: 'room123',
    code: 'ABC123DEF456GHI789JK',
    status: 'revealing',
    participants: [],
    currentGameRoundId: 'round123',
    createdAt: new Date(),
    expiresAt: new Date(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRevealingAnswersPresenter.mockReturnValue(defaultPresenterReturn);
  });

  describe('基本表示', () => {
    it('回答発表画面の基本要素が表示される', () => {
      const room = createMockRoom();
      render(<RevealingAnswersView room={room} currentUserId="user1" />);

      expect(screen.getByText('回答発表')).toBeInTheDocument();
      expect(screen.getByText('回答公開中')).toBeInTheDocument();
      expect(screen.getByText('お題')).toBeInTheDocument();
    });

    it('お題が表示される', () => {
      mockUseRevealingAnswersPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        currentTopicContent: { content: 'テストお題', round: 2 },
      });

      const room = createMockRoom();
      render(<RevealingAnswersView room={room} currentUserId="user1" />);

      expect(screen.getByText('お題 (第2ラウンド)')).toBeInTheDocument();
      expect(screen.getByText('テストお題')).toBeInTheDocument();
    });

    it('お題読み込み中は適切なメッセージが表示される', () => {
      const room = createMockRoom();
      render(<RevealingAnswersView room={room} currentUserId="user1" />);

      expect(screen.getByText('お題を読み込み中...')).toBeInTheDocument();
    });
  });

  describe('回答表示', () => {
    it('参加者の回答が表示される', () => {
      mockUseRevealingAnswersPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        allAnswers: [
          { content: '回答1', userName: 'プレイヤー1', hasAnswered: true, submittedAt: new Date() },
          { content: '回答2', userName: 'プレイヤー2', hasAnswered: true, submittedAt: new Date() },
        ],
      });

      const room = createMockRoom();
      render(<RevealingAnswersView room={room} currentUserId="user1" />);

      expect(screen.getByText('回答1')).toBeInTheDocument();
      expect(screen.getByText('回答2')).toBeInTheDocument();
      expect(screen.getByText('プレイヤー1')).toBeInTheDocument();
      expect(screen.getByText('プレイヤー2')).toBeInTheDocument();
    });

    it('未回答の参加者は空の回答が表示される', () => {
      mockUseRevealingAnswersPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        allAnswers: [
          { content: '回答1', userName: 'プレイヤー1', hasAnswered: true, submittedAt: new Date() },
          { content: '', userName: 'プレイヤー2', hasAnswered: false, submittedAt: null },
        ],
      });

      const room = createMockRoom();
      render(<RevealingAnswersView room={room} currentUserId="user1" />);

      expect(screen.getByText('回答1')).toBeInTheDocument();
      expect(screen.getByText('プレイヤー1')).toBeInTheDocument();
      expect(screen.getByText('プレイヤー2')).toBeInTheDocument();
      // 空の回答は表示されない
      expect(screen.queryByText('回答2')).not.toBeInTheDocument();
    });
  });

  describe('判定結果表示', () => {
    it('一致判定時は成功メッセージが表示される', () => {
      mockUseRevealingAnswersPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        hostJudgment: 'match',
      });

      const room = createMockRoom();
      render(<RevealingAnswersView room={room} currentUserId="user1" />);

      expect(screen.getByText('🎉✨ 全員一致 ✨🎉')).toBeInTheDocument();
    });

    it('不一致判定時は失敗メッセージが表示される', () => {
      mockUseRevealingAnswersPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        hostJudgment: 'no-match',
      });

      const room = createMockRoom();
      render(<RevealingAnswersView room={room} currentUserId="user1" />);

      expect(screen.getByText('💥 全員一致ならず 💥')).toBeInTheDocument();
    });

    it('判定前は判定結果が表示されない', () => {
      const room = createMockRoom();
      render(<RevealingAnswersView room={room} currentUserId="user1" />);

      expect(screen.queryByText('🎉✨ 全員一致 ✨🎉')).not.toBeInTheDocument();
      expect(screen.queryByText('💥 全員一致ならず 💥')).not.toBeInTheDocument();
    });
  });

  describe('ホスト判定機能', () => {
    it('ホストで判定前は判定ボタンが表示される', () => {
      mockUseRevealingAnswersPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        isHost: true,
        hostJudgment: null,
      });

      const room = createMockRoom();
      render(<RevealingAnswersView room={room} currentUserId="user1" />);

      expect(screen.getByText('回答の一致を判定してください')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '全員一致' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '全員一致ならず' })).toBeInTheDocument();
    });

    it('一致ボタンクリック時にPresenterのsubmitJudgmentが呼ばれる', () => {
      const submitJudgment = jest.fn();
      mockUseRevealingAnswersPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        isHost: true,
        hostJudgment: null,
        submitJudgment,
      });

      const room = createMockRoom();
      render(<RevealingAnswersView room={room} currentUserId="user1" />);

      const matchButton = screen.getByRole('button', { name: '全員一致' });
      fireEvent.click(matchButton);

      expect(submitJudgment).toHaveBeenCalledWith('match');
    });

    it('不一致ボタンクリック時にPresenterのsubmitJudgmentが呼ばれる', () => {
      const submitJudgment = jest.fn();
      mockUseRevealingAnswersPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        isHost: true,
        hostJudgment: null,
        submitJudgment,
      });

      const room = createMockRoom();
      render(<RevealingAnswersView room={room} currentUserId="user1" />);

      const noMatchButton = screen.getByRole('button', { name: '全員一致ならず' });
      fireEvent.click(noMatchButton);

      expect(submitJudgment).toHaveBeenCalledWith('no-match');
    });

    it('判定後は判定ボタンが非表示になる', () => {
      mockUseRevealingAnswersPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        isHost: true,
        hostJudgment: 'match',
      });

      const room = createMockRoom();
      render(<RevealingAnswersView room={room} currentUserId="user1" />);

      expect(screen.queryByText('回答の一致を判定してください')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '全員一致' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '全員一致ならず' })).not.toBeInTheDocument();
    });
  });

  describe('次のアクション選択', () => {
    it('ホストで判定後は次ラウンド・ゲーム終了ボタンが表示される', () => {
      mockUseRevealingAnswersPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        isHost: true,
        hostJudgment: 'match',
      });

      const room = createMockRoom();
      render(<RevealingAnswersView room={room} currentUserId="user1" />);

      expect(screen.getByRole('button', { name: '次のラウンド' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'ゲーム終了' })).toBeInTheDocument();
    });

    it('次のラウンドボタンクリック時にPresenterのstartNextRoundが呼ばれる', () => {
      const startNextRound = jest.fn();
      mockUseRevealingAnswersPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        isHost: true,
        hostJudgment: 'match',
        startNextRound,
      });

      const room = createMockRoom();
      render(<RevealingAnswersView room={room} currentUserId="user1" />);

      const nextRoundButton = screen.getByRole('button', { name: '次のラウンド' });
      fireEvent.click(nextRoundButton);

      expect(startNextRound).toHaveBeenCalled();
    });

    it('ゲーム終了ボタンクリック時にPresenterのendGameが呼ばれる', () => {
      const endGame = jest.fn();
      mockUseRevealingAnswersPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        isHost: true,
        hostJudgment: 'match',
        endGame,
      });

      const room = createMockRoom();
      render(<RevealingAnswersView room={room} currentUserId="user1" />);

      const endGameButton = screen.getByRole('button', { name: 'ゲーム終了' });
      fireEvent.click(endGameButton);

      expect(endGame).toHaveBeenCalled();
    });

    it('次ラウンド開始中はボタンが無効化される', () => {
      mockUseRevealingAnswersPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        isHost: true,
        hostJudgment: 'match',
        isStartingNextRound: true,
      });

      const room = createMockRoom();
      render(<RevealingAnswersView room={room} currentUserId="user1" />);

      expect(screen.getByRole('button', { name: '開始中...' })).toBeDisabled();
    });

    it('ゲーム終了中はボタンが無効化される', () => {
      mockUseRevealingAnswersPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        isHost: true,
        hostJudgment: 'match',
        isEndingGame: true,
      });

      const room = createMockRoom();
      render(<RevealingAnswersView room={room} currentUserId="user1" />);

      expect(screen.getByRole('button', { name: '終了中...' })).toBeDisabled();
    });
  });

  describe('ゲスト表示', () => {
    it('ゲストの場合は待機メッセージが表示される', () => {
      mockUseRevealingAnswersPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        isHost: false,
      });

      const room = createMockRoom();
      render(<RevealingAnswersView room={room} currentUserId="user1" />);

      expect(screen.getByText('主催者が次のアクションを選択するまでお待ちください')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '全員一致' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '次のラウンド' })).not.toBeInTheDocument();
    });
  });
});