import { 
  collection, 
  addDoc, 
  doc, 
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  serverTimestamp,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { GameRound, Topic, GameRoundStatus, JudgmentResult } from '@/types';

// アクティブなゲームラウンドを作成
export async function createGameRound(
  gameHistoryId: string,
  topicId: string,
  roundNumber: number,
  totalParticipants: number
): Promise<string> {
  try {
    const gameRoundData: Omit<GameRound, 'id'> = {
      gameHistoryId,
      topicId,
      roundNumber,
      status: GameRoundStatus.ACTIVE,
      totalParticipants,
      answeredCount: 0,
      startedAt: new Date(),
      createdAt: new Date()
    };

    const gameRoundRef = await addDoc(collection(db, 'gameRounds'), {
      ...gameRoundData,
      startedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    });

    return gameRoundRef.id;
  } catch (error) {
    console.error('createGameRound error:', error);
    throw new Error('ゲームラウンドの作成に失敗しました');
  }
}

// ゲームラウンドを完了状態に更新
export async function completeGameRound(
  gameRoundId: string,
  answeredCount: number,
  judgment?: JudgmentResult
): Promise<void> {
  try {
    const gameRoundRef = doc(db, 'gameRounds', gameRoundId);
    const updateData: any = {
      status: GameRoundStatus.COMPLETED,
      answeredCount,
      completedAt: serverTimestamp(),
      judgmentAt: judgment ? serverTimestamp() : null
    };
    
    // judgmentがundefinedでない場合のみ追加
    if (judgment !== undefined) {
      updateData.judgment = judgment;
    }
    
    await updateDoc(gameRoundRef, updateData);
  } catch (error) {
    console.error('completeGameRound error:', error);
    throw new Error('ゲームラウンドの完了に失敗しました');
  }
}

// ゲームラウンドの回答数を更新
export async function updateGameRoundAnsweredCount(
  gameRoundId: string,
  answeredCount: number
): Promise<void> {
  try {
    const gameRoundRef = doc(db, 'gameRounds', gameRoundId);
    await updateDoc(gameRoundRef, {
      answeredCount
    });
  } catch (error) {
    console.error('updateGameRoundAnsweredCount error:', error);
    throw new Error('回答数の更新に失敗しました');
  }
}

// ゲームラウンドの判定を更新
export async function updateGameRoundJudgment(
  gameRoundId: string,
  judgment: JudgmentResult
): Promise<void> {
  try {
    const gameRoundRef = doc(db, 'gameRounds', gameRoundId);
    await updateDoc(gameRoundRef, {
      judgment,
      judgmentAt: serverTimestamp()
    });
  } catch (error) {
    console.error('updateGameRoundJudgment error:', error);
    throw new Error('判定の更新に失敗しました');
  }
}

// ゲームラウンドの詳細情報を取得（お題情報含む）
export async function getGameRoundWithTopic(gameRoundId: string): Promise<{
  round: GameRound | null;
  topic: Topic | null;
}> {
  try {
    const gameRoundDoc = await getDoc(doc(db, 'gameRounds', gameRoundId));
    
    if (!gameRoundDoc.exists()) {
      return { round: null, topic: null };
    }

    const gameRoundData = gameRoundDoc.data();
    const round: GameRound = {
      id: gameRoundDoc.id,
      ...gameRoundData,
      startedAt: gameRoundData.startedAt instanceof Timestamp ? gameRoundData.startedAt.toDate() : gameRoundData.startedAt,
      completedAt: gameRoundData.completedAt instanceof Timestamp ? gameRoundData.completedAt.toDate() : gameRoundData.completedAt,
      judgmentAt: gameRoundData.judgmentAt instanceof Timestamp ? gameRoundData.judgmentAt.toDate() : gameRoundData.judgmentAt,
      createdAt: gameRoundData.createdAt instanceof Timestamp ? gameRoundData.createdAt.toDate() : gameRoundData.createdAt
    } as GameRound;

    // お題情報を取得
    const topicDoc = await getDoc(doc(db, 'topics', round.topicId));
    let topic: Topic | null = null;
    
    if (topicDoc.exists()) {
      const topicData = topicDoc.data();
      topic = {
        id: topicDoc.id,
        ...topicData,
        createdAt: topicData.createdAt instanceof Timestamp ? topicData.createdAt.toDate() : topicData.createdAt
      } as Topic;
    }

    return { round, topic };
  } catch (error) {
    console.error('getGameRoundWithTopic error:', error);
    return { round: null, topic: null };
  }
}

// ゲーム履歴の全ラウンドを取得（お題情報含む）
export async function getGameRoundsWithTopics(gameHistoryId: string): Promise<Array<{
  round: GameRound;
  topic: Topic | null;
}>> {
  try {
    const gameRoundsQuery = query(
      collection(db, 'gameRounds'),
      where('gameHistoryId', '==', gameHistoryId),
      orderBy('roundNumber', 'asc')
    );
    const gameRoundsSnapshot = await getDocs(gameRoundsQuery);

    const results: Array<{ round: GameRound; topic: Topic | null }> = [];

    for (const gameRoundDoc of gameRoundsSnapshot.docs) {
      const gameRoundData = gameRoundDoc.data();
      const round: GameRound = {
        id: gameRoundDoc.id,
        ...gameRoundData,
        startedAt: gameRoundData.startedAt instanceof Timestamp ? gameRoundData.startedAt.toDate() : gameRoundData.startedAt,
        completedAt: gameRoundData.completedAt instanceof Timestamp ? gameRoundData.completedAt.toDate() : gameRoundData.completedAt,
        judgmentAt: gameRoundData.judgmentAt instanceof Timestamp ? gameRoundData.judgmentAt.toDate() : gameRoundData.judgmentAt,
        createdAt: gameRoundData.createdAt instanceof Timestamp ? gameRoundData.createdAt.toDate() : gameRoundData.createdAt
      } as GameRound;

      // お題情報を取得
      const topicDoc = await getDoc(doc(db, 'topics', round.topicId));
      let topic: Topic | null = null;
      
      if (topicDoc.exists()) {
        const topicData = topicDoc.data();
        topic = {
          id: topicDoc.id,
          ...topicData,
          createdAt: topicData.createdAt instanceof Timestamp ? topicData.createdAt.toDate() : topicData.createdAt
        } as Topic;
      }

      results.push({ round, topic });
    }

    return results;
  } catch (error) {
    console.error('getGameRoundsWithTopics error:', error);
    return [];
  }
}

// アクティブなゲームラウンドを取得
export async function getActiveGameRound(gameHistoryId: string): Promise<GameRound | null> {
  try {
    const gameRoundsQuery = query(
      collection(db, 'gameRounds'),
      where('gameHistoryId', '==', gameHistoryId),
      where('status', '==', GameRoundStatus.ACTIVE),
      orderBy('roundNumber', 'desc')
    );
    const gameRoundsSnapshot = await getDocs(gameRoundsQuery);

    if (gameRoundsSnapshot.empty) {
      return null;
    }

    const gameRoundDoc = gameRoundsSnapshot.docs[0];
    const gameRoundData = gameRoundDoc.data();
    
    return {
      id: gameRoundDoc.id,
      ...gameRoundData,
      startedAt: gameRoundData.startedAt instanceof Timestamp ? gameRoundData.startedAt.toDate() : gameRoundData.startedAt,
      completedAt: gameRoundData.completedAt instanceof Timestamp ? gameRoundData.completedAt.toDate() : gameRoundData.completedAt,
      judgmentAt: gameRoundData.judgmentAt instanceof Timestamp ? gameRoundData.judgmentAt.toDate() : gameRoundData.judgmentAt,
      createdAt: gameRoundData.createdAt instanceof Timestamp ? gameRoundData.createdAt.toDate() : gameRoundData.createdAt
    } as GameRound;
  } catch (error) {
    console.error('getActiveGameRound error:', error);
    return null;
  }
}

// 特定のゲームラウンドの回答を取得
export async function getGameRoundAnswers(gameRoundId: string): Promise<Array<{ userId: string; content: string; userName: string; submittedAt: Date }>> {
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
        userId: data.userId || '',
        content: data.content,
        userName: data.userName,
        submittedAt: data.submittedAt instanceof Timestamp ? data.submittedAt.toDate() : data.submittedAt
      };
    });
  } catch (error) {
    console.error('getGameRoundAnswers error:', error);
    return [];
  }
}