import { render, screen, fireEvent } from '@testing-library/react';
import { PlayingGameView } from './PlayingGame.component';
import { Room } from '@/types';

jest.mock('./PlayingGame.presenter', () => ({
  usePlayingGamePresenter: jest.fn(),
}));

jest.mock('@/lib/gameEffects', () => ({
  playQuestionSound: jest.fn(),
}));

describe('PlayingGameView', () => {
  const mockUsePlayingGamePresenter = require('./PlayingGame.presenter').usePlayingGamePresenter;
  
  const defaultPresenterReturn = {
    currentTopicContent: null,
    answer: '',
    setAnswer: jest.fn(),
    submittedAnswer: '',
    isSubmittingAnswer: false,
    hasSubmittedAnswer: false,
    isHost: false,
    isForceRevealing: false,
    isChangingTopic: false,
    submitAnswer: jest.fn(),
    forceRevealAnswers: jest.fn(),
    changeTopic: jest.fn(),
    answerStatistics: {
      answeredCount: 0,
      totalCount: 0,
    },
    canChangeTopicStyle: 'bg-gray-300 text-gray-500 cursor-not-allowed',
    canForceRevealStyle: 'bg-gray-300 text-gray-500 cursor-not-allowed',
    canForceReveal: false,
    showForceRevealHelp: true,
    canChangeTopic: false,
  };

  const createMockRoom = (participants: Array<{ id: string; name: string; isHost: boolean; hasAnswered: boolean }> = []): Room => ({
    id: 'room123',
    code: 'ABC123DEF456GHI789JK',
    status: 'playing',
    participants: participants.map(p => ({
      id: p.id,
      name: p.name,
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
    mockUsePlayingGamePresenter.mockReturnValue(defaultPresenterReturn);
  });

  describe('基本表示', () => {
    it('ゲーム画面の基本要素が表示される', () => {
      mockUsePlayingGamePresenter.mockReturnValue({
        ...defaultPresenterReturn,
        answerStatistics: {
          answeredCount: 0,
          totalCount: 1,
        },
      });

      const room = createMockRoom([{ id: 'user1', name: 'プレイヤー1', isHost: false, hasAnswered: false }]);
      
      render(<PlayingGameView room={room} currentUserId="user1" />);

      expect(screen.getByText('ゲーム中')).toBeInTheDocument();
      expect(screen.getByText('ゲーム進行中')).toBeInTheDocument();
      expect(screen.getByText('お題')).toBeInTheDocument();
      expect(screen.getByText('あなたの回答')).toBeInTheDocument();
      expect(screen.getByText('回答状況 (0/1)')).toBeInTheDocument();
    });

    it('お題が表示される', () => {
      mockUsePlayingGamePresenter.mockReturnValue({
        ...defaultPresenterReturn,
        currentTopicContent: { content: 'テストお題', round: 2 },
      });

      const room = createMockRoom([{ id: 'user1', name: 'プレイヤー1', isHost: false, hasAnswered: false }]);
      render(<PlayingGameView room={room} currentUserId="user1" />);

      expect(screen.getByText('お題 (第2ラウンド)')).toBeInTheDocument();
      expect(screen.getByText('テストお題')).toBeInTheDocument();
    });

    it('お題読み込み中は適切なメッセージが表示される', () => {
      const room = createMockRoom([{ id: 'user1', name: 'プレイヤー1', isHost: false, hasAnswered: false }]);
      render(<PlayingGameView room={room} currentUserId="user1" />);

      expect(screen.getByText('お題を読み込み中...')).toBeInTheDocument();
    });
  });

  describe('回答入力機能', () => {
    it('未回答の場合は回答入力フォームが表示される', () => {
      const room = createMockRoom([{ id: 'user1', name: 'プレイヤー1', isHost: false, hasAnswered: false }]);
      render(<PlayingGameView room={room} currentUserId="user1" />);

      expect(screen.getByPlaceholderText('回答を入力してください...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '回答を送信' })).toBeInTheDocument();
    });

    it('回答入力時にPresenterのsetAnswerが呼ばれる', () => {
      const setAnswer = jest.fn();
      mockUsePlayingGamePresenter.mockReturnValue({
        ...defaultPresenterReturn,
        setAnswer,
      });

      const room = createMockRoom([{ id: 'user1', name: 'プレイヤー1', isHost: false, hasAnswered: false }]);
      render(<PlayingGameView room={room} currentUserId="user1" />);

      const input = screen.getByPlaceholderText('回答を入力してください...');
      fireEvent.change(input, { target: { value: 'テスト回答' } });

      expect(setAnswer).toHaveBeenCalledWith('テスト回答');
    });

    it('回答送信ボタンクリック時にPresenterのsubmitAnswerが呼ばれる', () => {
      const submitAnswer = jest.fn();
      mockUsePlayingGamePresenter.mockReturnValue({
        ...defaultPresenterReturn,
        answer: 'テスト回答',
        submitAnswer,
      });

      const room = createMockRoom([{ id: 'user1', name: 'プレイヤー1', isHost: false, hasAnswered: false }]);
      render(<PlayingGameView room={room} currentUserId="user1" />);

      const submitButton = screen.getByRole('button', { name: '回答を送信' });
      fireEvent.click(submitButton);

      expect(submitAnswer).toHaveBeenCalled();
    });

    it('空の回答では送信ボタンが無効化される', () => {
      mockUsePlayingGamePresenter.mockReturnValue({
        ...defaultPresenterReturn,
        answer: '',
      });

      const room = createMockRoom([{ id: 'user1', name: 'プレイヤー1', isHost: false, hasAnswered: false }]);
      render(<PlayingGameView room={room} currentUserId="user1" />);

      const submitButton = screen.getByRole('button', { name: '回答を送信' });
      expect(submitButton).toBeDisabled();
    });

    it('送信中は入力欄と送信ボタンが無効化される', () => {
      mockUsePlayingGamePresenter.mockReturnValue({
        ...defaultPresenterReturn,
        answer: 'テスト回答',
        isSubmittingAnswer: true,
      });

      const room = createMockRoom([{ id: 'user1', name: 'プレイヤー1', isHost: false, hasAnswered: false }]);
      render(<PlayingGameView room={room} currentUserId="user1" />);

      expect(screen.getByPlaceholderText('回答を入力してください...')).toBeDisabled();
      expect(screen.getByRole('button', { name: '送信中...' })).toBeDisabled();
    });

  });

  describe('回答完了状態', () => {
    it('回答済みの場合は回答が表示される', () => {
      mockUsePlayingGamePresenter.mockReturnValue({
        ...defaultPresenterReturn,
        hasSubmittedAnswer: true,
        submittedAnswer: '送信済み回答',
      });

      const room = createMockRoom([{ id: 'user1', name: 'プレイヤー1', isHost: false, hasAnswered: true }]);
      render(<PlayingGameView room={room} currentUserId="user1" />);

      expect(screen.getByText('回答済み')).toBeInTheDocument();
      expect(screen.getByText('送信済み回答')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('回答を入力してください...')).not.toBeInTheDocument();
    });
  });

  describe('回答状況表示', () => {
    it('参加者の回答状況が正しく表示される', () => {
      const room = createMockRoom([
        { id: 'user1', name: 'プレイヤー1', isHost: false, hasAnswered: true },
        { id: 'user2', name: 'プレイヤー2', isHost: false, hasAnswered: false },
        { id: 'user3', name: 'プレイヤー3', isHost: true, hasAnswered: true },
      ]);

      mockUsePlayingGamePresenter.mockReturnValue({
        ...defaultPresenterReturn,
        answerStatistics: {
          answeredCount: 2,
          totalCount: 3,
        },
      });

      render(<PlayingGameView room={room} currentUserId="user2" />);

      expect(screen.getByText('回答状況 (2/3)')).toBeInTheDocument();
      expect(screen.getByText('プレイヤー1')).toBeInTheDocument();
      expect(screen.getByText('プレイヤー2 (あなた)')).toBeInTheDocument();
      expect(screen.getByText('プレイヤー3')).toBeInTheDocument();
    });

    it('回答済みと未回答で異なるスタイルが適用される', () => {
      const room = createMockRoom([
        { id: 'user1', name: 'プレイヤー1', isHost: false, hasAnswered: true },
        { id: 'user2', name: 'プレイヤー2', isHost: false, hasAnswered: false },
      ]);

      render(<PlayingGameView room={room} currentUserId="user1" />);

      const answeredContainer = screen.getByText('プレイヤー1 (あなた)').closest('div');
      const notAnsweredContainer = screen.getByText('プレイヤー2').closest('div');

      expect(answeredContainer).toHaveClass('bg-emerald-100');
      expect(notAnsweredContainer).toHaveClass('bg-gray-100');
    });
  });

  describe('ホスト機能', () => {
    it('ホストの場合はお題変更ボタンが表示される', () => {
      mockUsePlayingGamePresenter.mockReturnValue({
        ...defaultPresenterReturn,
        isHost: true,
      });

      const room = createMockRoom([{ id: 'user1', name: 'ホスト', isHost: true, hasAnswered: false }]);
      render(<PlayingGameView room={room} currentUserId="user1" />);

      expect(screen.getByRole('button', { name: '変更' })).toBeInTheDocument();
    });

    it('お題変更ボタンクリック時にPresenterのchangeTopicが呼ばれる', () => {
      const changeTopic = jest.fn();
      mockUsePlayingGamePresenter.mockReturnValue({
        ...defaultPresenterReturn,
        isHost: true,
        changeTopic,
        canChangeTopic: true,
        canChangeTopicStyle: 'bg-gray-600 hover:bg-gray-700 text-white',
      });

      const room = createMockRoom([{ id: 'user1', name: 'ホスト', isHost: true, hasAnswered: false }]);
      render(<PlayingGameView room={room} currentUserId="user1" />);

      const changeButton = screen.getByRole('button', { name: '変更' });
      fireEvent.click(changeButton);

      expect(changeTopic).toHaveBeenCalled();
    });

    it('誰かが回答済みの場合はお題変更ボタンが無効化される', () => {
      mockUsePlayingGamePresenter.mockReturnValue({
        ...defaultPresenterReturn,
        isHost: true,
        answerStatistics: {
          answeredCount: 1,
          totalCount: 2,
        },
        canChangeTopic: false,
        canChangeTopicStyle: 'bg-gray-300 text-gray-500 cursor-not-allowed',
      });

      const room = createMockRoom([
        { id: 'user1', name: 'ホスト', isHost: true, hasAnswered: false },
        { id: 'user2', name: 'プレイヤー', isHost: false, hasAnswered: true }
      ]);
      render(<PlayingGameView room={room} currentUserId="user1" />);

      const changeButton = screen.getByRole('button', { name: '変更' });
      expect(changeButton).toBeDisabled();
    });

    it('ホストの場合は強制公開ボタンが表示される', () => {
      mockUsePlayingGamePresenter.mockReturnValue({
        ...defaultPresenterReturn,
        isHost: true,
      });

      const room = createMockRoom([
        { id: 'user1', name: 'ホスト', isHost: true, hasAnswered: true },
        { id: 'user2', name: 'プレイヤー', isHost: false, hasAnswered: true }
      ]);
      render(<PlayingGameView room={room} currentUserId="user1" />);

      expect(screen.getByRole('button', { name: '回答を強制公開' })).toBeInTheDocument();
    });

    it('強制公開ボタンクリック時にPresenterのforceRevealAnswersが呼ばれる', () => {
      const forceRevealAnswers = jest.fn();
      mockUsePlayingGamePresenter.mockReturnValue({
        ...defaultPresenterReturn,
        isHost: true,
        forceRevealAnswers,
        answerStatistics: {
          answeredCount: 2,
          totalCount: 2,
        },
        canForceReveal: true,
        canForceRevealStyle: 'bg-slate-600 hover:bg-slate-700 text-white',
      });

      const room = createMockRoom([
        { id: 'user1', name: 'ホスト', isHost: true, hasAnswered: true },
        { id: 'user2', name: 'プレイヤー', isHost: false, hasAnswered: true }
      ]);
      render(<PlayingGameView room={room} currentUserId="user1" />);

      const forceButton = screen.getByRole('button', { name: '回答を強制公開' });
      fireEvent.click(forceButton);

      expect(forceRevealAnswers).toHaveBeenCalled();
    });

    it('回答が2人未満の場合は強制公開ボタンが無効化される', () => {
      mockUsePlayingGamePresenter.mockReturnValue({
        ...defaultPresenterReturn,
        isHost: true,
      });

      const room = createMockRoom([
        { id: 'user1', name: 'ホスト', isHost: true, hasAnswered: true }
      ]);
      render(<PlayingGameView room={room} currentUserId="user1" />);

      const forceButton = screen.getByRole('button', { name: '回答を強制公開' });
      expect(forceButton).toBeDisabled();
      expect(screen.getByText('回答公開には2人以上の回答が必要です')).toBeInTheDocument();
    });

    it('ゲストの場合はホスト機能が表示されない', () => {
      const room = createMockRoom([{ id: 'user1', name: 'ゲスト', isHost: false, hasAnswered: false }]);
      render(<PlayingGameView room={room} currentUserId="user1" />);

      expect(screen.queryByRole('button', { name: '変更' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '回答を強制公開' })).not.toBeInTheDocument();
    });
  });

  describe('ローディング状態', () => {
    it('お題変更中は適切な表示になる', () => {
      mockUsePlayingGamePresenter.mockReturnValue({
        ...defaultPresenterReturn,
        isHost: true,
        isChangingTopic: true,
      });

      const room = createMockRoom([{ id: 'user1', name: 'ホスト', isHost: true, hasAnswered: false }]);
      render(<PlayingGameView room={room} currentUserId="user1" />);

      expect(screen.getByRole('button', { name: '変更中...' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '変更中...' })).toBeDisabled();
    });

    it('強制公開中は適切な表示になる', () => {
      mockUsePlayingGamePresenter.mockReturnValue({
        ...defaultPresenterReturn,
        isHost: true,
        isForceRevealing: true,
      });

      const room = createMockRoom([
        { id: 'user1', name: 'ホスト', isHost: true, hasAnswered: true },
        { id: 'user2', name: 'プレイヤー', isHost: false, hasAnswered: true }
      ]);
      render(<PlayingGameView room={room} currentUserId="user1" />);

      expect(screen.getByRole('button', { name: '公開中...' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '公開中...' })).toBeDisabled();
    });
  });

  describe('音声効果', () => {
    it('お題が表示された場合のレンダリングが正常に動作する', () => {
      mockUsePlayingGamePresenter.mockReturnValue({
        ...defaultPresenterReturn,
        currentTopicContent: { content: 'テストお題', round: 1 },
        answerStatistics: {
          answeredCount: 0,
          totalCount: 1,
        },
      });

      const room = createMockRoom([{ id: 'user1', name: 'プレイヤー1', isHost: false, hasAnswered: false }]);
      render(<PlayingGameView room={room} currentUserId="user1" />);

      expect(screen.getByText('テストお題')).toBeInTheDocument();
      expect(screen.getByText('お題 (第1ラウンド)')).toBeInTheDocument();
    });

    it('お題がない場合のレンダリングが正常に動作する', () => {
      const room = createMockRoom([{ id: 'user1', name: 'プレイヤー1', isHost: false, hasAnswered: false }]);
      render(<PlayingGameView room={room} currentUserId="user1" />);

      expect(screen.getByText('お題を読み込み中...')).toBeInTheDocument();
    });
  });
});