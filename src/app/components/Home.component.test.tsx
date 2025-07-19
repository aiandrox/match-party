import { render, screen, fireEvent } from '@testing-library/react';
import { HomeView } from './Home.component';

describe('HomeView', () => {
  const defaultProps = {
    onCreateRoom: jest.fn(),
    onJoinRoom: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基本表示', () => {
    it('タイトルが表示される', () => {
      render(<HomeView {...defaultProps} />);

      expect(screen.getByText('M')).toBeInTheDocument();
      expect(screen.getByText('P')).toBeInTheDocument();
      expect(screen.getByText('y')).toBeInTheDocument();
      
      // h1要素として表示されることを確認
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('ゲーム説明が表示される', () => {
      render(<HomeView {...defaultProps} />);

      expect(screen.getByText('みんなで回答の一致を目指すリアルタイムゲーム')).toBeInTheDocument();
    });

    it('ゲームの流れセクションが表示される', () => {
      render(<HomeView {...defaultProps} />);

      expect(screen.getByText('ゲームの流れ')).toBeInTheDocument();
      expect(screen.getByText('1. ルーム参加')).toBeInTheDocument();
      expect(screen.getByText('2. 回答入力')).toBeInTheDocument();
      expect(screen.getByText('3. 一致を確認')).toBeInTheDocument();
      expect(screen.getByText('最大20人で参加可能')).toBeInTheDocument();
      expect(screen.getByText('同じお題に皆で回答')).toBeInTheDocument();
      expect(screen.getByText('全員一致を目指そう！')).toBeInTheDocument();
    });

    it('ルーム作成セクションが表示される', () => {
      render(<HomeView {...defaultProps} />);

      expect(screen.getByText('新しいゲームルームを作成して、友達を招待しましょう')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'ルームを作成' })).toBeInTheDocument();
      
      // 見出しレベル2として存在することを確認
      expect(screen.getByRole('heading', { level: 2, name: 'ルームを作成' })).toBeInTheDocument();
    });

    it('ルーム参加セクションが表示される', () => {
      render(<HomeView {...defaultProps} />);

      expect(screen.getByText('ルームコードを入力して、既存のゲームに参加しましょう')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'ルームに参加' })).toBeInTheDocument();
      
      // 見出しレベル2として存在することを確認
      expect(screen.getByRole('heading', { level: 2, name: 'ルームに参加' })).toBeInTheDocument();
    });
  });

  describe('ユーザー操作', () => {
    it('ルームを作成ボタンをクリックするとonCreateRoomが呼ばれる', () => {
      const onCreateRoom = jest.fn();
      render(<HomeView {...defaultProps} onCreateRoom={onCreateRoom} />);

      const createButton = screen.getByRole('button', { name: 'ルームを作成' });
      fireEvent.click(createButton);

      expect(onCreateRoom).toHaveBeenCalledTimes(1);
    });

    it('ルームに参加ボタンをクリックするとonJoinRoomが呼ばれる', () => {
      const onJoinRoom = jest.fn();
      render(<HomeView {...defaultProps} onJoinRoom={onJoinRoom} />);

      const joinButton = screen.getByRole('button', { name: 'ルームに参加' });
      fireEvent.click(joinButton);

      expect(onJoinRoom).toHaveBeenCalledTimes(1);
    });

    it('複数回クリックしても正しく呼ばれる', () => {
      const onCreateRoom = jest.fn();
      const onJoinRoom = jest.fn();
      render(<HomeView onCreateRoom={onCreateRoom} onJoinRoom={onJoinRoom} />);

      const createButton = screen.getByRole('button', { name: 'ルームを作成' });
      const joinButton = screen.getByRole('button', { name: 'ルームに参加' });

      fireEvent.click(createButton);
      fireEvent.click(joinButton);
      fireEvent.click(createButton);

      expect(onCreateRoom).toHaveBeenCalledTimes(2);
      expect(onJoinRoom).toHaveBeenCalledTimes(1);
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なrole属性が設定されている', () => {
      render(<HomeView {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'ルームを作成' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'ルームに参加' })).toBeInTheDocument();
    });

    it('メインコンテンツが適切にマークアップされている', () => {
      render(<HomeView {...defaultProps} />);

      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
      expect(main).toHaveClass('min-h-screen');
    });
  });

  describe('スタイリング', () => {
    it('適切なCSSクラスが適用されている', () => {
      render(<HomeView {...defaultProps} />);

      const main = screen.getByRole('main');
      expect(main).toHaveClass('min-h-screen', 'bg-gradient-to-br', 'from-slate-50', 'to-gray-100');
    });

    it('ボタンに適切なスタイルクラスが適用されている', () => {
      render(<HomeView {...defaultProps} />);

      const createButton = screen.getByRole('button', { name: 'ルームを作成' });
      const joinButton = screen.getByRole('button', { name: 'ルームに参加' });

      expect(createButton).toHaveClass('btn', 'btn-primary', 'w-full', 'h-12');
      expect(joinButton).toHaveClass('btn', 'btn-secondary', 'w-full', 'h-12');
    });
  });
});