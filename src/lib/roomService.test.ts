import { submitAnswer } from './roomService';

// Firestoreをメモリ上のストアで置き換える（トランザクションは直列に実行される）
const mockStore = new Map<string, Record<string, unknown>>();
let mockQueue: Promise<unknown> = Promise.resolve();

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: jest.fn(),
  arrayUnion: jest.fn(),
  serverTimestamp: jest.fn(() => 'server-timestamp'),
  Timestamp: { fromDate: jest.fn((date: Date) => date) },
  doc: jest.fn((_db: unknown, ...segments: string[]) => ({ path: segments.join('/') })),
  runTransaction: jest.fn((_db: unknown, updateFn: (_transaction: unknown) => Promise<unknown>) => {
    const run = mockQueue.then(() => {
      const transaction = {
        get: async (ref: { path: string }) => ({
          exists: () => mockStore.has(ref.path),
          data: () => mockStore.get(ref.path),
        }),
        update: (ref: { path: string }, data: Record<string, unknown>) => {
          mockStore.set(ref.path, { ...mockStore.get(ref.path), ...data });
        },
        set: (ref: { path: string }, data: Record<string, unknown>) => {
          mockStore.set(ref.path, data);
        },
      };
      return updateFn(transaction);
    });
    mockQueue = run.catch(() => undefined);
    return run;
  }),
}));

jest.mock('@/lib/firebase', () => ({ db: {} }));
jest.mock('@/lib/authService', () => ({ ensureAnonymousAuth: jest.fn() }));
jest.mock('@/lib/topicService', () => ({ getRandomTopic: jest.fn() }));

const participant = (id: string, name: string, hasAnswered = false) => ({
  id,
  name,
  isHost: id === 'host',
  roomId: 'room1',
  hasAnswered,
  firebaseUserId: `uid-${id}`,
});

const setupRoom = (participants: ReturnType<typeof participant>[]) => {
  mockStore.set('rooms/room1', {
    status: 'playing',
    currentGameRoundId: 'round1',
    participants,
  });
};

const room = () => mockStore.get('rooms/room1') as {
  status: string;
  participants: ReturnType<typeof participant>[];
};

const savedAnswers = () =>
  [...mockStore.entries()].filter(([path]) => path.startsWith('gameAnswers/'));

describe('submitAnswer', () => {
  beforeEach(() => {
    mockStore.clear();
  });

  it('回答すると回答済みになり、回答がゲーム履歴に保存される', async () => {
    setupRoom([participant('host', 'ホスト'), participant('user1', 'たろう')]);

    await submitAnswer('room1', 'user1', ' ラーメン ');

    expect(room().participants.find(p => p.id === 'user1')?.hasAnswered).toBe(true);
    expect(savedAnswers()).toEqual([
      ['gameAnswers/round1_user1', expect.objectContaining({
        gameRoundId: 'round1',
        userId: 'user1',
        userName: 'たろう',
        content: 'ラーメン',
      })],
    ]);
    expect(room().status).toBe('playing');
  });

  it('最後の1人が回答すると回答公開に移行する', async () => {
    setupRoom([participant('host', 'ホスト', true), participant('user1', 'たろう')]);

    await submitAnswer('room1', 'user1', 'ラーメン');

    expect(room().status).toBe('revealing');
  });

  it('同じ人が再送信しても回答は1件だけ保存される', async () => {
    setupRoom([participant('host', 'ホスト'), participant('user1', 'たろう')]);

    await submitAnswer('room1', 'user1', 'ラーメン');
    await submitAnswer('room1', 'user1', 'うどん');

    expect(savedAnswers()).toHaveLength(1);
    expect(savedAnswers()[0][1]).toEqual(expect.objectContaining({ content: 'ラーメン' }));
  });

  it('複数人が同時に回答しても全員が回答済みになり、回答公開に移行する', async () => {
    setupRoom([
      participant('host', 'ホスト'),
      participant('user1', 'たろう'),
      participant('user2', 'はなこ'),
    ]);

    await Promise.all([
      submitAnswer('room1', 'host', 'カレー'),
      submitAnswer('room1', 'user1', 'ラーメン'),
      submitAnswer('room1', 'user2', 'すし'),
    ]);

    expect(room().participants.every(p => p.hasAnswered)).toBe(true);
    expect(room().status).toBe('revealing');
    expect(savedAnswers()).toHaveLength(3);
  });

  it('ホストが強制公開した後に回答してもステータスは変わらない', async () => {
    setupRoom([participant('host', 'ホスト', true), participant('user1', 'たろう')]);
    mockStore.set('rooms/room1', { ...room(), status: 'revealing' });

    await submitAnswer('room1', 'user1', 'ラーメン');

    expect(room().status).toBe('revealing');
  });

  it('ルームが存在しない場合はエラーになる', async () => {
    await expect(submitAnswer('room1', 'user1', 'ラーメン')).rejects.toThrow('ルームが見つかりません');
  });
});
