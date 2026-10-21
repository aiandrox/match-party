import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import * as Sentry from "@sentry/node";
import { callVertexAI } from "./vertexAI";

const db = getFirestore();

/**
 * ファシリテーション提案を生成するCallable Function
 * JWT認証により、このプロダクトからのアクセスのみ許可
 */
export const generateFacilitationSuggestions = onCall(
  {
    region: "asia-northeast1",
    cors: true,
  },
  async (request) => {
    try {
      // JWT認証チェック
      if (!request.auth) {
        throw new HttpsError("unauthenticated", "Authentication required");
      }

      const { answers, topicContent, roomCode } = request.data;

      // データ検証
      if (!answers || !Array.isArray(answers) || !topicContent || !roomCode) {
        throw new HttpsError("invalid-argument", "Missing required parameters");
      }

      // ルーム存在確認とホスト権限チェック
      const roomDoc = await db.collection("rooms").where("code", "==", roomCode).limit(1).get();
      if (roomDoc.empty) {
        throw new HttpsError("not-found", "Room not found");
      }

      // ユーザーがホストかチェック
      const userDoc = await db
        .collection("users")
        .where("roomId", "==", roomDoc.docs[0].id)
        .where("firebaseUserId", "==", request.auth.uid)
        .where("isHost", "==", true)
        .limit(1)
        .get();

      if (userDoc.empty) {
        throw new HttpsError(
          "permission-denied",
          "Only hosts can generate facilitation suggestions"
        );
      }

      // ゲームモードチェック: クライアントの申告ではなくサーバーが読んだルームの状態で判断する。
      // 会話のヒントを使うのは一致モード（match / 未設定）のみ。それ以外は Vertex AI を呼ぶ前に拒否して
      // コストを遮断する（fail-closed。モードが増えても意図せず通らない）。
      // （クライアント側 src/lib/gameMode.ts の isFacilitationAvailable と対になる意図的な二重定義）
      const roomMode = roomDoc.docs[0].data().mode ?? "match";
      if (roomMode !== "match") {
        throw new HttpsError(
          "failed-precondition",
          "Facilitation suggestions are not available in this game mode",
          { reason: "unsupported-game-mode", mode: roomMode }
        );
      }

      // Vertex AI呼び出し
      const vertexResult = await callVertexAI(answers, topicContent);

      logger.info("Facilitation suggestions generated", {
        roomCode,
        userId: request.auth.uid,
        suggestionsCount: vertexResult.suggestions.length,
      });

      return vertexResult;
    } catch (error) {
      logger.error("Facilitation generation failed", error);

      Sentry.captureException(error, {
        tags: {
          function: "generateFacilitationSuggestions",
          userId: request.auth?.uid,
        },
      });

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError("internal", "Facilitation generation failed");
    }
  }
);
