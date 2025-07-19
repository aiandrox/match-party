import { render, screen, fireEvent } from '@testing-library/react';
import { JoinRoomView } from './JoinRoom.component';

// Presenterのモック（外部依存）
jest.mock('./JoinRoom.presenter', () => ({
  useJoinRoomPresenter: jest.fn(),
}));

describe('JoinRoomView', () => {
  const mockUseJoinRoomPresenter = require('./JoinRoom.presenter').useJoinRoomPresenter;
  const defaultPresenterReturn = {
    roomCode: '',
    userName: '',
    isLoading: false,
    error: null,
    handleSubmit: jest.fn(),
    handleBack: jest.fn(),
    handleRoomCodeChange: jest.fn(),
    handleUserNameChange: jest.fn(),
  };

  const defaultProps = {
    initialRoomCode: '',
    onSubmit: jest.fn(),
    onBack: jest.fn(),
    globalError: null,
    isGlobalLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseJoinRoomPresenter.mockReturnValue(defaultPresenterReturn);
  });

  describe('基本表示', () => {
    it('ルーム参加フォームの基本要素が表示される', () => {
      render(<JoinRoomView {...defaultProps} />);

      expect(screen.getByText('ルーム参加')).toBeInTheDocument();
      expect(screen.getByText('ルームコードを入力してゲームに参加しましょう')).toBeInTheDocument();
      expect(screen.getByLabelText('ルームコード')).toBeInTheDocument();
      expect(screen.getByLabelText('あなたの名前')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'ルームに参加' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '戻る' })).toBeInTheDocument();
    });

    it('再参加についての説明が表示される', () => {
      render(<JoinRoomView {...defaultProps} />);

      expect(screen.getByText(/再参加について/)).toBeInTheDocument();
      expect(screen.getByText(/以前参加したルームには、ゲーム中でも同じ名前を入力することで再度参加できます/)).toBeInTheDocument();
    });

    it('入力フィールドに適切な属性が設定される', () => {
      render(<JoinRoomView {...defaultProps} />);

      const roomCodeInput = screen.getByLabelText('ルームコード');
      expect(roomCodeInput).toHaveAttribute('type', 'text');
      expect(roomCodeInput).toHaveAttribute('maxLength', '20');
      expect(roomCodeInput).toHaveAttribute('id', 'roomCode');
      expect(roomCodeInput).toHaveAttribute('placeholder', 'ABCD1234EFGH5678IJKL');

      const userNameInput = screen.getByLabelText('あなたの名前');
      expect(userNameInput).toHaveAttribute('type', 'text');
      expect(userNameInput).toHaveAttribute('maxLength', '20');
      expect(userNameInput).toHaveAttribute('id', 'userName');
    });

    it('入力フィールドの説明テキストが表示される', () => {
      render(<JoinRoomView {...defaultProps} />);

      expect(screen.getByText('20文字の英数字コード')).toBeInTheDocument();
      expect(screen.getByText('2-20文字（日本語、英数字のみ）')).toBeInTheDocument();
    });
  });

  describe('Presenterとの統合', () => {
    it('Presenterから受け取った値が正しく表示される', () => {
      mockUseJoinRoomPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        roomCode: 'ABC123DEF456GHI789JK',
        userName: 'テストユーザー',
        error: 'エラーメッセージ',
      });

      render(<JoinRoomView {...defaultProps} />);

      expect(screen.getByDisplayValue('ABC123DEF456GHI789JK')).toBeInTheDocument();
      expect(screen.getByDisplayValue('テストユーザー')).toBeInTheDocument();
      expect(screen.getByText('エラーメッセージ')).toBeInTheDocument();
    });

    it('ルームコード入力変更時にPresenterのhandleRoomCodeChangeが呼ばれる', () => {
      const handleRoomCodeChange = jest.fn();
      mockUseJoinRoomPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        handleRoomCodeChange,
      });

      render(<JoinRoomView {...defaultProps} />);

      const input = screen.getByLabelText('ルームコード');
      fireEvent.change(input, { target: { value: 'abc123' } });

      // 大文字に変換されて渡される
      expect(handleRoomCodeChange).toHaveBeenCalledWith('ABC123');
    });

    it('ユーザー名入力変更時にPresenterのhandleUserNameChangeが呼ばれる', () => {
      const handleUserNameChange = jest.fn();
      mockUseJoinRoomPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        handleUserNameChange,
      });

      render(<JoinRoomView {...defaultProps} />);

      const input = screen.getByLabelText('あなたの名前');
      fireEvent.change(input, { target: { value: '新しい名前' } });

      expect(handleUserNameChange).toHaveBeenCalledWith('新しい名前');
    });

    it('フォーム送信時にPresenterのhandleSubmitが呼ばれる', () => {
      const handleSubmit = jest.fn();
      mockUseJoinRoomPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        handleSubmit,
      });

      render(<JoinRoomView {...defaultProps} />);

      const form = screen.getByRole('button', { name: 'ルームに参加' }).closest('form')!;
      fireEvent.submit(form);

      expect(handleSubmit).toHaveBeenCalled();
    });

    it('戻るボタンクリック時にPresenterのhandleBackが呼ばれる', () => {
      const handleBack = jest.fn();
      mockUseJoinRoomPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        handleBack,
      });

      render(<JoinRoomView {...defaultProps} />);

      const backButton = screen.getByRole('button', { name: '戻る' });
      fireEvent.click(backButton);

      expect(handleBack).toHaveBeenCalled();
    });
  });

  describe('ローディング状態', () => {
    it('ローディング中は適切な表示と無効化が行われる', () => {
      mockUseJoinRoomPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        isLoading: true,
      });

      render(<JoinRoomView {...defaultProps} />);

      expect(screen.getByText('参加中...')).toBeInTheDocument();
      expect(screen.getByLabelText('ルームコード')).toBeDisabled();
      expect(screen.getByLabelText('あなたの名前')).toBeDisabled();
      expect(screen.getByRole('button', { name: '参加中...' })).toBeDisabled();
    });

    it('ローディング中でない場合は通常の表示', () => {
      mockUseJoinRoomPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        isLoading: false,
      });

      render(<JoinRoomView {...defaultProps} />);

      expect(screen.getByText('ルームに参加')).toBeInTheDocument();
      expect(screen.getByLabelText('ルームコード')).not.toBeDisabled();
      expect(screen.getByLabelText('あなたの名前')).not.toBeDisabled();
      expect(screen.getByRole('button', { name: 'ルームに参加' })).not.toBeDisabled();
    });
  });

  describe('エラー表示', () => {
    it('エラーがある場合はエラーメッセージが表示される', () => {
      mockUseJoinRoomPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        error: 'テストエラーメッセージ',
      });

      render(<JoinRoomView {...defaultProps} />);

      expect(screen.getByText('テストエラーメッセージ')).toBeInTheDocument();
      const errorContainer = screen.getByText('テストエラーメッセージ').closest('div');
      expect(errorContainer).toHaveClass('bg-red-50');
    });

    it('エラーがない場合はエラーメッセージが表示されない', () => {
      mockUseJoinRoomPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        error: null,
      });

      render(<JoinRoomView {...defaultProps} />);

      expect(document.querySelector('.bg-red-50')).not.toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    it('フォームが適切なラベルとroleを持つ', () => {
      render(<JoinRoomView {...defaultProps} />);

      expect(screen.getByRole('textbox', { name: 'ルームコード' })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'あなたの名前' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'ルームに参加' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '戻る' })).toBeInTheDocument();
    });

    it('必要なaria属性が設定されている', () => {
      render(<JoinRoomView {...defaultProps} />);

      const roomCodeInput = screen.getByLabelText('ルームコード');
      expect(roomCodeInput).toHaveAttribute('id', 'roomCode');
      
      const userNameInput = screen.getByLabelText('あなたの名前');
      expect(userNameInput).toHaveAttribute('id', 'userName');
      
      const roomCodeLabel = screen.getByText('ルームコード');
      expect(roomCodeLabel).toHaveAttribute('for', 'roomCode');
      
      const userNameLabel = screen.getByText('あなたの名前');
      expect(userNameLabel).toHaveAttribute('for', 'userName');
    });
  });

  describe('特殊な入力処理', () => {
    it('ルームコード入力時に自動的に大文字変換される', () => {
      const handleRoomCodeChange = jest.fn();
      mockUseJoinRoomPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        handleRoomCodeChange,
      });

      render(<JoinRoomView {...defaultProps} />);

      const input = screen.getByLabelText('ルームコード');
      fireEvent.change(input, { target: { value: 'abcd1234efgh5678ijkl' } });

      expect(handleRoomCodeChange).toHaveBeenCalledWith('ABCD1234EFGH5678IJKL');
    });
  });
});