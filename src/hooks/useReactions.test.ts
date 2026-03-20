import { renderHook, act } from '@testing-library/react';
import { useReactions } from './useReactions';

jest.mock('@/lib/reactionService', () => ({
  subscribeToReactions: jest.fn(),
  sendReaction: jest.fn(),
}));

describe('useReactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('gameRoundIdがない場合はリアクションを購読しない', () => {
    const { result } = renderHook(() => useReactions(null, 'user1', 'ぺいじゅん'));

    expect(result.current.displayReactions).toEqual([]);
    expect(result.current.cooldown).toBe(false);
  });

  it('初期状態ではdisplayReactionsが空でcooldownがfalse', () => {
    const { subscribeToReactions } = require('@/lib/reactionService');
    (subscribeToReactions as jest.Mock).mockReturnValue(jest.fn());

    const { result } = renderHook(() => useReactions('round1', 'user1', 'ぺいじゅん'));

    expect(result.current.displayReactions).toEqual([]);
    expect(result.current.cooldown).toBe(false);
  });

  it('sendReactionを呼び出すとcooldownがtrueになる', async () => {
    const { subscribeToReactions, sendReaction } = require('@/lib/reactionService');
    (subscribeToReactions as jest.Mock).mockReturnValue(jest.fn());
    (sendReaction as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useReactions('round1', 'user1', 'ぺいじゅん'));

    await act(async () => {
      await result.current.sendReaction('😂');
    });

    expect(result.current.cooldown).toBe(true);
  });

  it('クールダウン中はsendReactionが呼ばれない', async () => {
    const { subscribeToReactions, sendReaction } = require('@/lib/reactionService');
    (subscribeToReactions as jest.Mock).mockReturnValue(jest.fn());
    (sendReaction as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useReactions('round1', 'user1', 'ぺいじゅん'));

    await act(async () => {
      await result.current.sendReaction('😂');
    });

    // クールダウン中に再度送信
    await act(async () => {
      await result.current.sendReaction('👏');
    });

    expect(sendReaction).toHaveBeenCalledTimes(1);
  });

  it('1500ms後にcooldownがfalseに戻る', async () => {
    const { subscribeToReactions, sendReaction } = require('@/lib/reactionService');
    (subscribeToReactions as jest.Mock).mockReturnValue(jest.fn());
    (sendReaction as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useReactions('round1', 'user1', 'ぺいじゅん'));

    await act(async () => {
      await result.current.sendReaction('😂');
    });

    expect(result.current.cooldown).toBe(true);

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(result.current.cooldown).toBe(false);
  });

  it('userId・userNameがない場合はリアクションを送信しない', async () => {
    const { subscribeToReactions, sendReaction } = require('@/lib/reactionService');
    (subscribeToReactions as jest.Mock).mockReturnValue(jest.fn());

    const { result } = renderHook(() => useReactions('round1', null, null));

    await act(async () => {
      await result.current.sendReaction('😂');
    });

    expect(sendReaction).not.toHaveBeenCalled();
  });
});
