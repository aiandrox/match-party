import { sendReaction, deleteReactionsForRound } from './reactionService';

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(() => ({ seconds: 0 })),
  onSnapshot: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  writeBatch: jest.fn(),
  getDocs: jest.fn(),
  Timestamp: { fromDate: jest.fn() },
}));

jest.mock('@/lib/firebase', () => ({ db: {} }));

describe('reactionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendReaction', () => {
    it('指定した絵文字でリアクションをFirestoreに保存する', async () => {
      const { addDoc, collection } = await import('firebase/firestore');
      const mockAddDoc = addDoc as jest.Mock;
      const mockCollection = collection as jest.Mock;
      mockCollection.mockReturnValue('reactions-ref');
      mockAddDoc.mockResolvedValue({ id: 'reaction1' });

      await sendReaction('round1', 'user1', 'ぺいじゅん', '😂');

      expect(mockAddDoc).toHaveBeenCalledWith(
        'reactions-ref',
        expect.objectContaining({
          emoji: '😂',
          fromUserId: 'user1',
          fromUserName: 'ぺいじゅん',
        })
      );
    });
  });

  describe('deleteReactionsForRound', () => {
    it('リアクションが存在しない場合は何もしない', async () => {
      const { getDocs, writeBatch } = await import('firebase/firestore');
      const mockGetDocs = getDocs as jest.Mock;
      const mockWriteBatch = writeBatch as jest.Mock;
      mockGetDocs.mockResolvedValue({ empty: true, docs: [] });

      await deleteReactionsForRound('round1');

      expect(mockWriteBatch).not.toHaveBeenCalled();
    });

    it('リアクションが存在する場合はバッチ削除する', async () => {
      const { getDocs, writeBatch } = await import('firebase/firestore');
      const mockCommit = jest.fn().mockResolvedValue(undefined);
      const mockDelete = jest.fn();
      const mockGetDocs = getDocs as jest.Mock;
      const mockWriteBatch = writeBatch as jest.Mock;
      mockWriteBatch.mockReturnValue({ delete: mockDelete, commit: mockCommit });
      mockGetDocs.mockResolvedValue({
        empty: false,
        docs: [{ ref: 'ref1' }, { ref: 'ref2' }],
      });

      await deleteReactionsForRound('round1');

      expect(mockDelete).toHaveBeenCalledTimes(2);
      expect(mockCommit).toHaveBeenCalled();
    });
  });
});
