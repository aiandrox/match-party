import {onSchedule} from 'firebase-functions/v2/scheduler';
import {getFirestore, Timestamp} from 'firebase-admin/firestore';
import {logger} from 'firebase-functions';
import * as Sentry from '@sentry/node';

const db = getFirestore();

/**
 * 期限切れルームとそれに紐づくデータを削除する
 * スケジュール: 毎日実行
 */
export const cleanupExpiredRooms = onSchedule({
  schedule: '0 0 * * *',
  region: 'asia-northeast1'
}, async () => {
  const startTime = Date.now();
  logger.info('Starting cleanup of expired rooms');

  try {
    const now = Timestamp.now();
    const deletionStats = {
      deletedRooms: 0,
      deletedUsers: 0,
      deletedGameRounds: 0,
      deletedGameAnswers: 0,
    };

    // 期限切れルームを取得（一度に50件まで）
    const expiredRoomsSnapshot = await db.collection('rooms')
        .where('expiresAt', '<', now)
        .limit(50)
        .get();

    if (expiredRoomsSnapshot.empty) {
      logger.info('No expired rooms found');
      return;
    }

    logger.info(`Found ${expiredRoomsSnapshot.size} expired rooms`);

    // 各ルームを処理
    for (const roomDoc of expiredRoomsSnapshot.docs) {
      const roomId = roomDoc.id;
      const roomData = roomDoc.data();

      logger.info(`Processing room ${roomData.code} (${roomId})`);

      // 関連データを削除
      const deleted = await deleteRoomData(roomId);
      deletionStats.deletedUsers += deleted.users;
      deletionStats.deletedGameRounds += deleted.gameRounds;
      deletionStats.deletedGameAnswers += deleted.gameAnswers;

      // ルーム自体を削除
      await roomDoc.ref.delete();
      deletionStats.deletedRooms++;
    }

    const executionTime = Date.now() - startTime;
    logger.info('Cleanup completed successfully', {
      ...deletionStats,
      executionTime: `${executionTime}ms`,
    });
  } catch (error) {
    logger.error('Cleanup failed', error);
    
    // Sentryにエラーを報告
    Sentry.captureException(error, {
      tags: {
        function: 'cleanupExpiredRooms',
        action: 'cleanup-rooms'
      },
      extra: {
        timestamp: new Date().toISOString(),
        region: 'asia-northeast1'
      }
    });
    
    throw error;
  }
});

/**
 * 指定されたルームに関連するデータを削除する
 */
async function deleteRoomData(roomId: string): Promise<{
  users: number;
  gameRounds: number;
  gameAnswers: number;
}> {
  let deletedUsers = 0;
  let deletedGameRounds = 0;
  let deletedGameAnswers = 0;

  // ユーザーを削除
  const usersSnapshot = await db.collection('users')
      .where('roomId', '==', roomId)
      .get();

  const userDeletePromises = usersSnapshot.docs.map((doc: any) => doc.ref.delete());
  await Promise.all(userDeletePromises);
  deletedUsers = usersSnapshot.size;

  // ゲームラウンドとゲーム回答を削除
  const gameRoundsSnapshot = await db.collection('gameRounds')
      .where('roomId', '==', roomId)
      .get();

  for (const gameRoundDoc of gameRoundsSnapshot.docs) {
    const gameRoundId = gameRoundDoc.id;

    // ゲーム回答を削除
    const gameAnswersSnapshot = await db.collection('gameAnswers')
        .where('gameRoundId', '==', gameRoundId)
        .get();

    const answerDeletePromises = gameAnswersSnapshot.docs.map((doc: any) => doc.ref.delete());
    await Promise.all(answerDeletePromises);
    deletedGameAnswers += gameAnswersSnapshot.size;

    // ゲームラウンドを削除
    await gameRoundDoc.ref.delete();
    deletedGameRounds++;
  }

  return {
    users: deletedUsers,
    gameRounds: deletedGameRounds,
    gameAnswers: deletedGameAnswers,
  };
}