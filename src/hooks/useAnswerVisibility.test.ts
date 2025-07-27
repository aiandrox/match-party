import { renderHook, act } from '@testing-library/react';
import { useAnswerVisibility } from './useAnswerVisibility';

// localStorage をモック
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('useAnswerVisibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('初期状態では回答表示状態である', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => useAnswerVisibility());
    
    expect(result.current.isAnswerHidden).toBe(false);
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('match-party-hide-answers');
  });

  it('localStorageに保存された状態を復元できる', () => {
    mockLocalStorage.getItem.mockReturnValue('true');
    
    const { result } = renderHook(() => useAnswerVisibility());
    
    expect(result.current.isAnswerHidden).toBe(true);
  });

  it('表示/非表示を切り替えてlocalStorageに保存できる', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => useAnswerVisibility());
    
    // 初期状態は false
    expect(result.current.isAnswerHidden).toBe(false);
    
    // 非表示に切り替え
    act(() => {
      result.current.toggleAnswerVisibility();
    });
    
    expect(result.current.isAnswerHidden).toBe(true);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('match-party-hide-answers', 'true');
    
    // 表示に戻す
    act(() => {
      result.current.toggleAnswerVisibility();
    });
    
    expect(result.current.isAnswerHidden).toBe(false);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('match-party-hide-answers', 'false');
  });

  it('無効なlocalStorageの値はfalseとして扱われる', () => {
    mockLocalStorage.getItem.mockReturnValue('invalid-json');
    
    const { result } = renderHook(() => useAnswerVisibility());
    
    expect(result.current.isAnswerHidden).toBe(false);
  });
});