import { renderHook, act } from '@testing-library/react';
import { useCreateRoomPresenter } from './CreateRoom.presenter';

describe('useCreateRoomPresenter', () => {
  const mockOnSubmit = jest.fn();
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with empty host name', () => {
    const { result } = renderHook(() =>
      useCreateRoomPresenter({
        onSubmit: mockOnSubmit,
        onBack: mockOnBack,
        globalError: null,
        isGlobalLoading: false,
      })
    );

    expect(result.current.hostName).toBe('');
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should update host name when handleHostNameChange is called', () => {
    const { result } = renderHook(() =>
      useCreateRoomPresenter({
        onSubmit: mockOnSubmit,
        onBack: mockOnBack,
        globalError: null,
        isGlobalLoading: false,
      })
    );

    act(() => {
      result.current.handleHostNameChange('TestUser');
    });

    expect(result.current.hostName).toBe('TestUser');
    expect(result.current.error).toBeNull();
  });

  it('should clear validation error when valid input is provided', () => {
    const { result } = renderHook(() =>
      useCreateRoomPresenter({
        onSubmit: mockOnSubmit,
        onBack: mockOnBack,
        globalError: null,
        isGlobalLoading: false,
      })
    );

    // First set an invalid input to trigger validation error
    act(() => {
      result.current.handleSubmit(new Event('submit') as any);
    });

    expect(result.current.error).toBeTruthy();

    // Then provide valid input
    act(() => {
      result.current.handleHostNameChange('ValidUser');
    });

    expect(result.current.error).toBeNull();
  });

  describe('validation', () => {
    it('should show error for empty host name', () => {
      const { result } = renderHook(() =>
        useCreateRoomPresenter({
          onSubmit: mockOnSubmit,
          onBack: mockOnBack,
          globalError: null,
          isGlobalLoading: false,
        })
      );

      act(() => {
        result.current.handleSubmit(new Event('submit') as any);
      });

      expect(result.current.error).toBe('名前を入力してください');
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show error for too short host name', () => {
      const { result } = renderHook(() =>
        useCreateRoomPresenter({
          onSubmit: mockOnSubmit,
          onBack: mockOnBack,
          globalError: null,
          isGlobalLoading: false,
        })
      );

      act(() => {
        result.current.handleHostNameChange('a');
      });

      act(() => {
        result.current.handleSubmit(new Event('submit') as any);
      });

      expect(result.current.error).toBe('名前は2文字以上20文字以内で、日本語・英数字のみ使用できます');
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show error for too long host name', () => {
      const { result } = renderHook(() =>
        useCreateRoomPresenter({
          onSubmit: mockOnSubmit,
          onBack: mockOnBack,
          globalError: null,
          isGlobalLoading: false,
        })
      );

      act(() => {
        result.current.handleHostNameChange('ThisNameIsWayTooLongForValidation');
      });

      act(() => {
        result.current.handleSubmit(new Event('submit') as any);
      });

      expect(result.current.error).toBe('名前は2文字以上20文字以内で、日本語・英数字のみ使用できます');
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show error for invalid characters', () => {
      const { result } = renderHook(() =>
        useCreateRoomPresenter({
          onSubmit: mockOnSubmit,
          onBack: mockOnBack,
          globalError: null,
          isGlobalLoading: false,
        })
      );

      act(() => {
        result.current.handleHostNameChange('Test@User');
      });

      act(() => {
        result.current.handleSubmit(new Event('submit') as any);
      });

      expect(result.current.error).toBe('名前は2文字以上20文字以内で、日本語・英数字のみ使用できます');
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should accept valid Japanese name', () => {
      const { result } = renderHook(() =>
        useCreateRoomPresenter({
          onSubmit: mockOnSubmit,
          onBack: mockOnBack,
          globalError: null,
          isGlobalLoading: false,
        })
      );

      act(() => {
        result.current.handleHostNameChange('田中太郎');
      });

      act(() => {
        result.current.handleSubmit(new Event('submit') as any);
      });

      expect(result.current.error).toBeNull();
      expect(mockOnSubmit).toHaveBeenCalledWith('田中太郎');
    });

    it('should accept valid alphanumeric name', () => {
      const { result } = renderHook(() =>
        useCreateRoomPresenter({
          onSubmit: mockOnSubmit,
          onBack: mockOnBack,
          globalError: null,
          isGlobalLoading: false,
        })
      );

      act(() => {
        result.current.handleHostNameChange('Player123');
      });

      act(() => {
        result.current.handleSubmit(new Event('submit') as any);
      });

      expect(result.current.error).toBeNull();
      expect(mockOnSubmit).toHaveBeenCalledWith('Player123');
    });
  });

  it('should handle back navigation', () => {
    const { result } = renderHook(() =>
      useCreateRoomPresenter({
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
      useCreateRoomPresenter({
        onSubmit: mockOnSubmit,
        onBack: mockOnBack,
        globalError: null,
        isGlobalLoading: true,
      })
    );

    expect(result.current.isLoading).toBe(true);
  });

  it('should show global error when no validation error exists', () => {
    const globalError = 'Network error occurred';
    const { result } = renderHook(() =>
      useCreateRoomPresenter({
        onSubmit: mockOnSubmit,
        onBack: mockOnBack,
        globalError,
        isGlobalLoading: false,
      })
    );

    expect(result.current.error).toBe('Network error occurred');
  });
});