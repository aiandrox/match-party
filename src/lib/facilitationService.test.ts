// jest.setup.js で facilitationService 自体がモックされているため、このファイルでは実物を使う
jest.unmock('@/lib/facilitationService');

const mockHttpsCallable = jest.fn();
const mockCallable = jest.fn();

jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({})),
  httpsCallable: (...args: unknown[]) => mockHttpsCallable(...args),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ currentUser: { uid: 'test-uid' } })),
}));

import { generateFacilitationSuggestions } from './facilitationService';

describe('generateFacilitationSuggestions', () => {
  const input = {
    answers: [
      { content: '回答1', userName: 'User 1', hasAnswered: true },
      { content: '回答2', userName: 'User 2', hasAnswered: true },
    ],
    topicContent: 'テストお題',
    roomCode: 'ABC123DEF456GHI789JK',
    roundNumber: 1,
  };

  const callableError = (code: string, details?: unknown) => Object.assign(new Error(code), { code, details });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockHttpsCallable.mockReturnValue(mockCallable);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('サーバーの結果がそのまま返る', async () => {
    const data = { suggestions: [{ id: 's1' }], analysisTimestamp: new Date(), totalAnswers: 2, uniqueAnswers: 2, commonPatterns: [] };
    mockCallable.mockResolvedValue({ data });

    await expect(generateFacilitationSuggestions(input)).resolves.toEqual(data);
    expect(mockCallable).toHaveBeenCalledWith({
      answers: input.answers,
      topicContent: 'テストお題',
      roundNumber: 1,
      roomCode: 'ABC123DEF456GHI789JK',
    });
  });

  it('回答が1件もない場合はサーバーを呼ばずに空の結果を返す', async () => {
    const result = await generateFacilitationSuggestions({ ...input, answers: [] });

    expect(result.suggestions).toEqual([]);
    expect(mockCallable).not.toHaveBeenCalled();
  });

  describe('サーバーが明示的に拒否した場合はフォールバックせずエラーにする', () => {
    it('会話のヒントを使わないゲームモードのルームでは、その旨のメッセージになる', async () => {
      mockCallable.mockRejectedValue(
        callableError('functions/failed-precondition', { reason: 'unsupported-game-mode', mode: 'mismatch' })
      );

      await expect(generateFacilitationSuggestions(input)).rejects.toThrow(
        'このゲームモードでは会話のヒントは利用できません。'
      );
    });

    it('理由が不明な failed-precondition は、ルーム状態による汎用メッセージになる', async () => {
      mockCallable.mockRejectedValue(callableError('functions/failed-precondition'));

      await expect(generateFacilitationSuggestions(input)).rejects.toThrow(
        '現在のルームの状態では会話のヒントを利用できません。'
      );
    });

    it('主催者以外の呼び出しは権限エラーになる', async () => {
      mockCallable.mockRejectedValue(callableError('functions/permission-denied'));

      await expect(generateFacilitationSuggestions(input)).rejects.toThrow('この機能は主催者のみ利用できます。');
    });
  });

  it('一時的な障害（unavailable など）ではローカルフォールバックの提案が返る', async () => {
    mockCallable.mockRejectedValue(callableError('functions/unavailable'));

    const result = await generateFacilitationSuggestions(input);

    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.totalAnswers).toBe(2);
  });
});
