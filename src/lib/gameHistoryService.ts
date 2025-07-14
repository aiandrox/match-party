import { 
  collection, 
  addDoc, 
  doc, 
  getDocs,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  serverTimestamp,
  Timestamp,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { GameHistory, GameRound, GameAnswer, GameParticipant, Room } from '@/types';

// ゲーム履歴を作成
export async function createGameHistory(room: Room): Promise<string> {
  try {
    const hostUser = room.participants.find(p => p.isHost);
    if (!hostUser) {
      throw new Error('主催者が見つかりません');
    }

    const gameHistoryData: Omit<GameHistory, 'id'> = {
      roomCode: room.code,
      hostName: hostUser.name,
      participantCount: room.participants.length,
      totalRounds: 0, // 初期値、後で更新
      status: 'completed', // 開始時点では完了予定
      startedAt: new Date(),
      endedAt: new Date(), // 後で更新
      duration: 0, // 後で計算
      createdAt: new Date()
    };

    const historyRef = await addDoc(collection(db, 'gameHistories'), {
      ...gameHistoryData,
      startedAt: serverTimestamp(),
      endedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    });

    // 参加者情報を保存
    const batch = writeBatch(db);
    
    room.participants.forEach(participant => {
      const participantData: Omit<GameParticipant, 'id'> = {
        gameHistoryId: historyRef.id,
        userName: participant.name,
        isHost: participant.isHost,
        joinedAt: participant.joinedAt,
        totalAnswers: 0, // 後で更新
        matchedRounds: 0, // 後で更新
        createdAt: new Date()
      };

      const participantRef = doc(collection(db, 'gameParticipants'));
      batch.set(participantRef, {
        ...participantData,
        joinedAt: participant.joinedAt instanceof Date ? Timestamp.fromDate(participant.joinedAt) : participant.joinedAt,
        createdAt: serverTimestamp()
      });
    });

    await batch.commit();
    return historyRef.id;
  } catch (error) {
    console.error('createGameHistory error:', error);
    throw new Error('ゲーム履歴の作成に失敗しました');
  }
}

// この関数は gameRoundService.ts に移動されました
// createGameRound は gameRoundService.createGameRound を使用してください

// 回答履歴を作成
export async function createGameAnswer(
  gameHistoryId: string,
  gameRoundId: string,
  userName: string,
  content: string,
  submittedAt: Date
): Promise<void> {
  try {
    const answerData: Omit<GameAnswer, 'id'> = {
      gameHistoryId,
      gameRoundId,
      userName,
      content,
      submittedAt,
      createdAt: new Date()
    };

    await addDoc(collection(db, 'gameAnswers'), {
      ...answerData,
      submittedAt: Timestamp.fromDate(submittedAt),
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('createGameAnswer error:', error);
    throw new Error('回答履歴の作成に失敗しました');
  }
}

// この関数は gameRoundService.ts に移動されました
// updateGameRoundOnComplete は gameRoundService.completeGameRound を使用してください

// ゲーム完了時の更新
export async function updateGameHistoryOnComplete(
  gameHistoryId: string,
  totalRounds: number,
  startedAt: Date | Timestamp,
  status: 'completed' | 'abandoned' = 'completed'
): Promise<void> {
  try {
    const endedAt = new Date();
    const startedAtDate = startedAt instanceof Timestamp ? startedAt.toDate() : startedAt;
    const duration = Math.floor((endedAt.getTime() - startedAtDate.getTime()) / 1000);

    const historyRef = doc(db, 'gameHistories', gameHistoryId);
    await updateDoc(historyRef, {
      totalRounds,
      status,
      endedAt: serverTimestamp(),
      duration
    });

    // 参加者統計を更新
    await updateParticipantStats(gameHistoryId);
  } catch (error) {
    console.error('updateGameHistoryOnComplete error:', error);
    throw new Error('ゲーム履歴の完了更新に失敗しました');
  }
}

// 参加者統計を更新
async function updateParticipantStats(gameHistoryId: string): Promise<void> {
  try {
    // 参加者一覧を取得
    const participantsQuery = query(
      collection(db, 'gameParticipants'),
      where('gameHistoryId', '==', gameHistoryId)
    );
    const participantsSnapshot = await getDocs(participantsQuery);

    // 回答データを取得
    const answersQuery = query(
      collection(db, 'gameAnswers'),
      where('gameHistoryId', '==', gameHistoryId)
    );
    const answersSnapshot = await getDocs(answersQuery);

    // ラウンドデータを取得
    const roundsQuery = query(
      collection(db, 'gameRounds'),
      where('gameHistoryId', '==', gameHistoryId)
    );
    const roundsSnapshot = await getDocs(roundsQuery);

    const batch = writeBatch(db);

    // 各参加者の統計を計算
    participantsSnapshot.docs.forEach(participantDoc => {
      const participant = participantDoc.data() as GameParticipant;
      
      // その参加者の回答数を計算
      const userAnswers = answersSnapshot.docs.filter(
        doc => doc.data().userName === participant.userName
      );
      
      // 一致したラウンド数を計算
      const matchedRounds = roundsSnapshot.docs.filter(
        doc => doc.data().judgment === 'match'
      ).length;

      batch.update(participantDoc.ref, {
        totalAnswers: userAnswers.length,
        matchedRounds
      });
    });

    await batch.commit();
  } catch (error) {
    console.error('updateParticipantStats error:', error);
    // エラーでも処理を継続（統計更新は致命的ではない）
  }
}

// ゲーム履歴一覧を取得
export async function getGameHistories(limitCount: number = 10): Promise<GameHistory[]> {
  try {
    const historiesQuery = query(
      collection(db, 'gameHistories'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const historiesSnapshot = await getDocs(historiesQuery);

    return historiesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startedAt: data.startedAt instanceof Timestamp ? data.startedAt.toDate() : data.startedAt,
        endedAt: data.endedAt instanceof Timestamp ? data.endedAt.toDate() : data.endedAt,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt
      } as GameHistory;
    });
  } catch (error) {
    console.error('getGameHistories error:', error);
    return [];
  }
}

// 特定のゲーム履歴詳細を取得
export async function getGameHistoryDetails(gameHistoryId: string): Promise<{
  history: GameHistory | null;
  rounds: any[];
  participants: GameParticipant[];
}> {
  try {
    // ゲーム履歴を取得
    const historyDoc = await getDoc(doc(db, 'gameHistories', gameHistoryId));
    let history: GameHistory | null = null;
    
    if (historyDoc.exists()) {
      const data = historyDoc.data();
      history = {
        id: historyDoc.id,
        ...data,
        startedAt: data.startedAt instanceof Timestamp ? data.startedAt.toDate() : data.startedAt,
        endedAt: data.endedAt instanceof Timestamp ? data.endedAt.toDate() : data.endedAt,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt
      } as GameHistory;
    }

    // ラウンド履歴を取得（お題情報含む）
    const { getGameRoundsWithTopics } = await import('@/lib/gameRoundService');
    const roundsWithTopics = await getGameRoundsWithTopics(gameHistoryId);
    
    // 後方互換性のために古い形式に変換
    const rounds: any[] = roundsWithTopics.map(({ round, topic }) => ({
      id: round.id,
      gameHistoryId: round.gameHistoryId,
      roundNumber: round.roundNumber,
      topicContent: topic?.content || '',
      totalParticipants: round.totalParticipants,
      answeredCount: round.answeredCount,
      judgment: round.judgment,
      startedAt: round.startedAt,
      answersRevealedAt: round.completedAt || round.startedAt,
      judgmentAt: round.judgmentAt,
      createdAt: round.createdAt
    }));

    // 参加者履歴を取得
    const participantsQuery = query(
      collection(db, 'gameParticipants'),
      where('gameHistoryId', '==', gameHistoryId),
      orderBy('joinedAt', 'asc')
    );
    const participantsSnapshot = await getDocs(participantsQuery);
    const participants: GameParticipant[] = participantsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        joinedAt: data.joinedAt instanceof Timestamp ? data.joinedAt.toDate() : data.joinedAt,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt
      } as GameParticipant;
    });

    return { history, rounds, participants };
  } catch (error) {
    console.error('getGameHistoryDetails error:', error);
    return { history: null, rounds: [], participants: [] };
  }
}

// 特定のラウンドの回答一覧を取得
export async function getGameRoundAnswers(gameRoundId: string): Promise<GameAnswer[]> {
  try {
    const answersQuery = query(
      collection(db, 'gameAnswers'),
      where('gameRoundId', '==', gameRoundId),
      orderBy('submittedAt', 'asc')
    );
    const answersSnapshot = await getDocs(answersQuery);

    return answersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        submittedAt: data.submittedAt instanceof Timestamp ? data.submittedAt.toDate() : data.submittedAt,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt
      } as GameAnswer;
    });
  } catch (error) {
    console.error('getGameRoundAnswers error:', error);
    return [];
  }
}