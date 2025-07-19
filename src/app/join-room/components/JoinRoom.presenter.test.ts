import { renderHook, act } from '@testing-library/react';
import { useJoinRoomPresenter } from './JoinRoom.presenter';

describe('useJoinRoomPresenter', () => {
  const mockOnSubmit = jest.fn();
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with provided room code', () => {
    const { result } = renderHook(() =>
      useJoinRoomPresenter({
        initialRoomCode: 'ABC123DEF456GHI789JK',
        onSubmit: mockOnSubmit,
        onBack: mockOnBack,
        globalError: null,
        isGlobalLoading: false,
      })
    );

    expect(result.current.userName).toBe('');
    expect(result.current.roomCode).toBe('ABC123DEF456GHI789JK');
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should update user name when handleUserNameChange is called', () => {
    const { result } = renderHook(() =>
      useJoinRoomPresenter({
        initialRoomCode: '',
        onSubmit: mockOnSubmit,
        onBack: mockOnBack,
        globalError: null,
        isGlobalLoading: false,
      })
    );

    act(() => {
      result.current.handleUserNameChange('TestUser');
    });

    expect(result.current.userName).toBe('TestUser');
    expect(result.current.error).toBeNull();
  });

  it('should update room code when handleRoomCodeChange is called', () => {
    const { result } = renderHook(() =>
      useJoinRoomPresenter({
        initialRoomCode: '',
        onSubmit: mockOnSubmit,
        onBack: mockOnBack,
        globalError: null,
        isGlobalLoading: false,
      })
    );

    act(() => {
      result.current.handleRoomCodeChange('ABC123DEF456GHI789JK');
    });

    expect(result.current.roomCode).toBe('ABC123DEF456GHI789JK');
    expect(result.current.error).toBeNull();
  });

  describe('validation', () => {
    it('should show error for empty user name', () => {
      const { result } = renderHook(() =>
        useJoinRoomPresenter({
          initialRoomCode: '',
          onSubmit: mockOnSubmit,
          onBack: mockOnBack,
          globalError: null,
          isGlobalLoading: false,
        })
      );

      act(() => {
        result.current.handleRoomCodeChange('VALIDROOMCODE123ABCD');
      });

      act(() => {
        result.current.handleSubmit(new Event('submit') as any);
      });

      expect(result.current.error).toBe('名前を入力してください');
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show error for empty room code', () => {
      const { result } = renderHook(() =>
        useJoinRoomPresenter({
          initialRoomCode: '',
          onSubmit: mockOnSubmit,
          onBack: mockOnBack,
          globalError: null,
          isGlobalLoading: false,
        })
      );

      act(() => {
        result.current.handleUserNameChange('TestUser');
        result.current.handleSubmit(new Event('submit') as any);
      });

      expect(result.current.error).toBe('ルームコードを入力してください');
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show error for invalid user name length', () => {
      const { result } = renderHook(() =>
        useJoinRoomPresenter({
          initialRoomCode: 'VALIDROOMCODE123ABCD',
          onSubmit: mockOnSubmit,
          onBack: mockOnBack,
          globalError: null,
          isGlobalLoading: false,
        })
      );

      act(() => {
        result.current.handleUserNameChange('a');
      });

      act(() => {
        result.current.handleSubmit(new Event('submit') as any);
      });

      expect(result.current.error).toBe('名前は2文字以上20文字以内で、日本語・英数字のみ使用できます');
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show error for invalid room code format', () => {
      const { result } = renderHook(() =>
        useJoinRoomPresenter({
          initialRoomCode: '',
          onSubmit: mockOnSubmit,
          onBack: mockOnBack,
          globalError: null,
          isGlobalLoading: false,
        })
      );

      act(() => {
        result.current.handleUserNameChange('TestUser');
        result.current.handleRoomCodeChange('SHORT');
      });

      act(() => {
        result.current.handleSubmit(new Event('submit') as any);
      });

      expect(result.current.error).toBe('ルームコードは20文字の英数字で入力してください');
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show error for invalid user name characters', () => {
      const { result } = renderHook(() =>
        useJoinRoomPresenter({
          initialRoomCode: 'VALIDROOMCODE123ABCD',
          onSubmit: mockOnSubmit,
          onBack: mockOnBack,
          globalError: null,
          isGlobalLoading: false,
        })
      );

      act(() => {
        result.current.handleUserNameChange('Test@User');
      });

      act(() => {
        result.current.handleSubmit(new Event('submit') as any);
      });

      expect(result.current.error).toBe('名前は2文字以上20文字以内で、日本語・英数字のみ使用できます');
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show error for invalid room code characters', () => {
      const { result } = renderHook(() =>
        useJoinRoomPresenter({
          initialRoomCode: '',
          onSubmit: mockOnSubmit,
          onBack: mockOnBack,
          globalError: null,
          isGlobalLoading: false,
        })
      );

      act(() => {
        result.current.handleUserNameChange('TestUser');
        result.current.handleRoomCodeChange('INVALID@CODE#123ABCD');
      });

      act(() => {
        result.current.handleSubmit(new Event('submit') as any);
      });

      expect(result.current.error).toBe('ルームコードは20文字の英数字で入力してください');
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should accept valid inputs', () => {
      const { result } = renderHook(() =>
        useJoinRoomPresenter({
          initialRoomCode: 'ABC123DEF456GHI789JK',
          onSubmit: mockOnSubmit,
          onBack: mockOnBack,
          globalError: null,
          isGlobalLoading: false,
        })
      );

      act(() => {
        result.current.handleUserNameChange('田中太郎');
      });

      act(() => {
        result.current.handleSubmit(new Event('submit') as any);
      });

      expect(result.current.error).toBeNull();
      expect(mockOnSubmit).toHaveBeenCalledWith('ABC123DEF456GHI789JK', '田中太郎');
    });
  });

  it('should handle back navigation', () => {
    const { result } = renderHook(() =>
      useJoinRoomPresenter({
        initialRoomCode: '',
        onSubmit: mockOnSubmit,
        onBack: mockOnBack,
        globalError: null,
        isGlobalLoading: false,
      })
    );

    act(() => {
      result.current.handleBack();
    });

    expect(mockOnBack).toHaveBeenCalled();
  });

  it('should show global loading state', () => {
    const { result } = renderHook(() =>
      useJoinRoomPresenter({
        initialRoomCode: '',
        onSubmit: mockOnSubmit,
        onBack: mockOnBack,
        globalError: null,
        isGlobalLoading: true,
      })
    );

    expect(result.current.isLoading).toBe(true);
  });

  it('should display global error when provided', () => {
    const globalError = 'Room not found';
    const { result } = renderHook(() =>
      useJoinRoomPresenter({
        initialRoomCode: '',
        onSubmit: mockOnSubmit,
        onBack: mockOnBack,
        globalError,
        isGlobalLoading: false,
      })
    );

    expect(result.current.error).toBe(globalError);
  });

  it('should update room code when initialRoomCode changes', () => {
    const { result, rerender } = renderHook(
      (props) => useJoinRoomPresenter(props),
      {
        initialProps: {
          initialRoomCode: 'INITIAL123456789ABCD',
          onSubmit: mockOnSubmit,
          onBack: mockOnBack,
          globalError: null,
          isGlobalLoading: false,
        }
      }
    );

    expect(result.current.roomCode).toBe('INITIAL123456789ABCD');

    rerender({
      initialRoomCode: 'UPDATED123456789EFGH',
      onSubmit: mockOnSubmit,
      onBack: mockOnBack,
      globalError: null,
      isGlobalLoading: false,
    });

    expect(result.current.roomCode).toBe('UPDATED123456789EFGH');
  });
});