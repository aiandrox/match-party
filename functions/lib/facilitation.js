"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFacilitationSuggestions = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const firebase_functions_1 = require("firebase-functions");
const Sentry = require("@sentry/node");
const vertexAI_1 = require("./vertexAI");
const db = (0, firestore_1.getFirestore)();
/**
 * ファシリテーション提案を生成するCallable Function
 * JWT認証により、このプロダクトからのアクセスのみ許可
 */
exports.generateFacilitationSuggestions = (0, https_1.onCall)({
    region: 'asia-northeast1',
    cors: true
}, async (request) => {
    var _a;
    try {
        // JWT認証チェック
        if (!request.auth) {
            throw new https_1.HttpsError('unauthenticated', 'Authentication required');
        }
        const { answers, topicContent, roundNumber, roomCode } = request.data;
        // データ検証
        if (!answers || !Array.isArray(answers) || !topicContent || !roomCode) {
            throw new https_1.HttpsError('invalid-argument', 'Missing required parameters');
        }
        // ルーム存在確認とホスト権限チェック
        const roomDoc = await db.collection('rooms').where('code', '==', roomCode).limit(1).get();
        if (roomDoc.empty) {
            throw new https_1.HttpsError('not-found', 'Room not found');
        }
        // ユーザーがホストかチェック
        const userDoc = await db.collection('users')
            .where('roomId', '==', roomDoc.docs[0].id)
            .where('firebaseUserId', '==', request.auth.uid)
            .where('isHost', '==', true)
            .limit(1)
            .get();
        if (userDoc.empty) {
            throw new https_1.HttpsError('permission-denied', 'Only hosts can generate facilitation suggestions');
        }
        // Vertex AI呼び出し
        const vertexResult = await (0, vertexAI_1.callVertexAI)(answers, topicContent, roundNumber);
        firebase_functions_1.logger.info('Facilitation suggestions generated', {
            roomCode,
            userId: request.auth.uid,
            suggestionsCount: vertexResult.suggestions.length
        });
        return vertexResult;
    }
    catch (error) {
        firebase_functions_1.logger.error('Facilitation generation failed', error);
        Sentry.captureException(error, {
            tags: {
                function: 'generateFacilitationSuggestions',
                userId: (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid
            }
        });
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Facilitation generation failed');
    }
});
//# sourceMappingURL=facilitation.js.map