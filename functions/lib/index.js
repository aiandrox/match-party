"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupExpiredRooms = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const firebase_functions_1 = require("firebase-functions");
// Firebase Admin SDK を初期化
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
/**
 * 期限切れルームとそれに紐づくデータを削除する
 * スケジュール: 毎日実行
 */
exports.cleanupExpiredRooms = (0, scheduler_1.onSchedule)({
    schedule: '0 0 * * *',
    region: 'asia-northeast1'
}, async () => {
    const startTime = Date.now();
    firebase_functions_1.logger.info('Starting cleanup of expired rooms');
    try {
        const now = firestore_1.Timestamp.now();
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
            firebase_functions_1.logger.info('No expired rooms found');
            return;
        }
        firebase_functions_1.logger.info(`Found ${expiredRoomsSnapshot.size} expired rooms`);
        // 各ルームを処理
        for (const roomDoc of expiredRoomsSnapshot.docs) {
            const roomId = roomDoc.id;
            const roomData = roomDoc.data();
            firebase_functions_1.logger.info(`Processing room ${roomData.code} (${roomId})`);
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
        firebase_functions_1.logger.info('Cleanup completed successfully', Object.assign(Object.assign({}, deletionStats), { executionTime: `${executionTime}ms` }));
    }
    catch (error) {
        firebase_functions_1.logger.error('Cleanup failed', error);
        throw error;
    }
});
/**
 * 指定されたルームに関連するデータを削除する
 */
async function deleteRoomData(roomId) {
    let deletedUsers = 0;
    let deletedGameRounds = 0;
    let deletedGameAnswers = 0;
    // ユーザーを削除
    const usersSnapshot = await db.collection('users')
        .where('roomId', '==', roomId)
        .get();
    const userDeletePromises = usersSnapshot.docs.map((doc) => doc.ref.delete());
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
        const answerDeletePromises = gameAnswersSnapshot.docs.map((doc) => doc.ref.delete());
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
//# sourceMappingURL=index.js.map