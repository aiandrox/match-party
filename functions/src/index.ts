import {onSchedule} from 'firebase-functions/v2/scheduler';
import {onCall, HttpsError} from 'firebase-functions/v2/https';
import {initializeApp} from 'firebase-admin/app';
import {getFirestore, Timestamp} from 'firebase-admin/firestore';
import {logger} from 'firebase-functions';
import * as Sentry from '@sentry/node';
import {GoogleAuth} from 'google-auth-library';

// Firebase Admin SDK を初期化
initializeApp();
const db = getFirestore();

// Sentry初期化
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: process.env.NODE_ENV === 'development',
  initialScope: {
    tags: {
      component: 'cloud-functions',
    },
  },
});

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

// ====== ファシリテーション機能 ======

/**
 * ファシリテーション提案を生成するCallable Function
 * JWT認証により、このプロダクトからのアクセスのみ許可
 */
export const generateFacilitationSuggestions = onCall({
  region: 'asia-northeast1',
  cors: true
}, async (request) => {
  try {
    // JWT認証チェック
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const {answers, topicContent, roundNumber, roomCode} = request.data;

    // データ検証
    if (!answers || !Array.isArray(answers) || !topicContent || !roomCode) {
      throw new HttpsError('invalid-argument', 'Missing required parameters');
    }

    // ルーム存在確認とホスト権限チェック
    const roomDoc = await db.collection('rooms').where('code', '==', roomCode).limit(1).get();
    if (roomDoc.empty) {
      throw new HttpsError('not-found', 'Room not found');
    }

    // ユーザーがホストかチェック
    const userDoc = await db.collection('users')
      .where('roomId', '==', roomDoc.docs[0].id)
      .where('firebaseUserId', '==', request.auth.uid)
      .where('isHost', '==', true)
      .limit(1)
      .get();

    if (userDoc.empty) {
      throw new HttpsError('permission-denied', 'Only hosts can generate facilitation suggestions');
    }

    // Vertex AI呼び出し
    const vertexResult = await callVertexAI(answers, topicContent, roundNumber);
    
    logger.info('Facilitation suggestions generated', {
      roomCode,
      userId: request.auth.uid,
      suggestionsCount: vertexResult.suggestions.length
    });

    return vertexResult;

  } catch (error) {
    logger.error('Facilitation generation failed', error);
    
    Sentry.captureException(error, {
      tags: {
        function: 'generateFacilitationSuggestions',
        userId: request.auth?.uid
      }
    });

    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Facilitation generation failed');
  }
});

/**
 * Vertex AI API呼び出し
 */
async function callVertexAI(answers: any[], topicContent: string, roundNumber: number) {
  const projectId = 'match-party-findy';
  const location = 'us-central1';
  const modelId = 'gemini-2.5-flash-lite';

  // Service Account認証
  const googleAuth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });
  
  const authClient = await googleAuth.getClient();
  const accessToken = await authClient.getAccessToken();

  if (!accessToken.token) {
    throw new Error('Failed to obtain access token');
  }

  // プロンプト生成
  const prompt = createFacilitationPrompt(answers, topicContent, roundNumber);
  
  // Vertex AI API呼び出し
  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:generateContent`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [{text: prompt}]
      }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
        maxOutputTokens: 1024
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Vertex AI API error: ${response.status}`);
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  if (!text) {
    throw new Error('Empty response from Vertex AI');
  }

  return parseGeminiResponse(text);
}

/**
 * ファシリテーション用プロンプト生成
 */
function createFacilitationPrompt(answers: any[], topicContent: string, roundNumber: number): string {
  const answersText = answers
    .filter(a => a.hasAnswered)
    .map(a => `${a.userName}: ${a.content}`)
    .join('\n');

  return `
あなたはチームビルディングの専門ファシリテーターです。
お題「${topicContent}」（第${roundNumber}ラウンド）に対する以下の回答を分析し、
主催者が使える自然な話題振りを3-5個提案してください。

参加者の回答:
${answersText}

以下のJSON形式で提案してください（JSONのみ出力、説明文は不要）:
{
  "suggestions": [
    {
      "type": "individual",
      "target": "参加者名",
      "message": "○○さんの回答について詳しく聞いてみませんか？",
      "priority": 4,
      "category": "unique"
    },
    {
      "type": "group",
      "message": "みなさん××が多いですね！共通体験を聞かせてください",
      "priority": 3,
      "category": "common"
    }
  ]
}

制約:
- type: "individual", "group", "comparison" のいずれか
- category: "common", "unique", "interesting", "follow_up" のいずれか
- priority: 1-5 (5が最高優先度)
- 自然で親しみやすい日本語を使用
- 参加者の名前は実際の回答者名を使用
- 最大5個まで
`;
}

/**
 * Geminiレスポンス解析
 */
function parseGeminiResponse(text: string) {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
        return {
          suggestions: parsed.suggestions.map((s: any) => ({
            id: `fs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...s
          })),
          analysisTimestamp: new Date(),
          totalAnswers: 0,
          uniqueAnswers: 0,
          commonPatterns: []
        };
      }
    }
    
    throw new Error('Invalid JSON format');
  } catch (error) {
    logger.error('Gemini response parse error:', error);
    
    // フォールバック
    return {
      suggestions: [{
        id: `fs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'group',
        message: '回答について詳しく聞いてみませんか？',
        priority: 3,
        category: 'common'
      }],
      analysisTimestamp: new Date(),
      totalAnswers: 0,
      uniqueAnswers: 0,
      commonPatterns: []
    };
  }
}

