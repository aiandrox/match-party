import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateRoomView } from './CreateRoom.component';

jest.mock('./CreateRoom.presenter', () => ({
  useCreateRoomPresenter: jest.fn(),
}));

describe('CreateRoomView', () => {
  const mockUseCreateRoomPresenter = require('./CreateRoom.presenter').useCreateRoomPresenter;
  const defaultPresenterReturn = {
    hostName: '',
    isLoading: false,
    error: null,
    handleSubmit: jest.fn(),
    handleBack: jest.fn(),
    handleHostNameChange: jest.fn(),
  };

  const defaultProps = {
    onSubmit: jest.fn(),
    onBack: jest.fn(),
    globalError: null,
    isGlobalLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCreateRoomPresenter.mockReturnValue(defaultPresenterReturn);
  });

  describe('基本表示', () => {
    it('ルーム作成フォームの基本要素が表示される', () => {
      render(<CreateRoomView {...defaultProps} />);

      expect(screen.getByText('ルーム作成')).toBeInTheDocument();
      expect(screen.getByText('ホストとしてゲームルームを作成します')).toBeInTheDocument();
      expect(screen.getByLabelText('あなたの名前')).toBeInTheDocument();
      expect(screen.getByText('2-20文字（日本語、英数字のみ）')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'ルームを作成' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '戻る' })).toBeInTheDocument();
    });

    it('入力フィールドに適切な属性が設定される', () => {
      render(<CreateRoomView {...defaultProps} />);

      const input = screen.getByLabelText('あなたの名前');
      expect(input).toHaveAttribute('type', 'text');
      expect(input).toHaveAttribute('maxLength', '20');
      expect(input).toHaveAttribute('id', 'hostName');
    });
  });

  describe('Presenterとの統合', () => {
    it('Presenterから受け取った値が正しく表示される', () => {
      mockUseCreateRoomPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        hostName: 'テストホスト',
        error: 'エラーメッセージ',
      });

      render(<CreateRoomView {...defaultProps} />);

      expect(screen.getByDisplayValue('テストホスト')).toBeInTheDocument();
      expect(screen.getByText('エラーメッセージ')).toBeInTheDocument();
    });

    it('入力変更時にPresenterのhandleHostNameChangeが呼ばれる', () => {
      const handleHostNameChange = jest.fn();
      mockUseCreateRoomPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        handleHostNameChange,
      });

      render(<CreateRoomView {...defaultProps} />);

      const input = screen.getByLabelText('あなたの名前');
      fireEvent.change(input, { target: { value: '新しい名前' } });

      expect(handleHostNameChange).toHaveBeenCalledWith('新しい名前');
    });

    it('フォーム送信時にPresenterのhandleSubmitが呼ばれる', () => {
      const handleSubmit = jest.fn();
      mockUseCreateRoomPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        handleSubmit,
      });

      render(<CreateRoomView {...defaultProps} />);

      const form = screen.getByRole('button', { name: 'ルームを作成' }).closest('form')!;
      fireEvent.submit(form);

      expect(handleSubmit).toHaveBeenCalled();
    });

    it('戻るボタンクリック時にPresenterのhandleBackが呼ばれる', () => {
      const handleBack = jest.fn();
      mockUseCreateRoomPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        handleBack,
      });

      render(<CreateRoomView {...defaultProps} />);

      const backButton = screen.getByRole('button', { name: '戻る' });
      fireEvent.click(backButton);

      expect(handleBack).toHaveBeenCalled();
    });
  });

  describe('ローディング状態', () => {
    it('ローディング中は適切な表示と無効化が行われる', () => {
      mockUseCreateRoomPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        isLoading: true,
      });

      render(<CreateRoomView {...defaultProps} />);

      expect(screen.getByText('作成中...')).toBeInTheDocument();
      expect(screen.getByLabelText('あなたの名前')).toBeDisabled();
      expect(screen.getByRole('button', { name: '作成中...' })).toBeDisabled();
    });

    it('ローディング中でない場合は通常の表示', () => {
      mockUseCreateRoomPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        isLoading: false,
      });

      render(<CreateRoomView {...defaultProps} />);

      expect(screen.getByText('ルームを作成')).toBeInTheDocument();
      expect(screen.getByLabelText('あなたの名前')).not.toBeDisabled();
      expect(screen.getByRole('button', { name: 'ルームを作成' })).not.toBeDisabled();
    });
  });

  describe('エラー表示', () => {
    it('エラーがある場合はエラーメッセージが表示される', () => {
      mockUseCreateRoomPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        error: 'テストエラーメッセージ',
      });

      render(<CreateRoomView {...defaultProps} />);

      expect(screen.getByText('テストエラーメッセージ')).toBeInTheDocument();
      const errorContainer = screen.getByText('テストエラーメッセージ').closest('div');
      expect(errorContainer).toHaveClass('bg-rose-50');
    });

    it('エラーがない場合はエラーメッセージが表示されない', () => {
      mockUseCreateRoomPresenter.mockReturnValue({
        ...defaultPresenterReturn,
        error: null,
      });

      render(<CreateRoomView {...defaultProps} />);

      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
      expect(document.querySelector('.bg-rose-50')).not.toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    it('フォームが適切なラベルとroleを持つ', () => {
      render(<CreateRoomView {...defaultProps} />);

      const input = screen.getByRole('textbox', { name: 'あなたの名前' });
      expect(input).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'ルームを作成' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '戻る' })).toBeInTheDocument();
    });

    it('必要なaria属性が設定されている', () => {
      render(<CreateRoomView {...defaultProps} />);

      const input = screen.getByLabelText('あなたの名前');
      expect(input).toHaveAttribute('id', 'hostName');
      
      const label = screen.getByText('あなたの名前');
      expect(label).toHaveAttribute('for', 'hostName');
    });
  });
});