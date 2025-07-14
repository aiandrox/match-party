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
  getDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { GameRound, Topic, GameRoundStatus, JudgmentResult } from "@/types";

// アクティブなゲームラウンドを作成
export async function createGameRound(topicId: string, roundNumber: number): Promise<string> {
  try {
    const gameRoundData: Omit<GameRound, "id"> = {
      topicId,
      roundNumber,
      status: GameRoundStatus.ACTIVE,
      createdAt: new Date(),
    };

    const gameRoundRef = await addDoc(collection(db, "gameRounds"), {
      ...gameRoundData,
      createdAt: serverTimestamp(),
    });

    return gameRoundRef.id;
  } catch (error) {
    console.error("createGameRound error:", error);
    throw new Error("ゲームラウンドの作成に失敗しました");
  }
}

// ゲームラウンドを完了状態に更新
export async function completeGameRound(
  gameRoundId: string,
  judgment?: JudgmentResult
): Promise<void> {
  try {
    const gameRoundRef = doc(db, "gameRounds", gameRoundId);
    const updateData: any = {
      status: GameRoundStatus.COMPLETED,
    };

    // judgmentがundefinedでない場合のみ追加
    if (judgment !== undefined) {
      updateData.judgment = judgment;
    }

    await updateDoc(gameRoundRef, updateData);
  } catch (error) {
    console.error("completeGameRound error:", error);
    throw new Error("ゲームラウンドの完了に失敗しました");
  }
}

// ゲームラウンドの回答数を更新（回答数フィールド削除により不要）
// export async function updateGameRoundAnsweredCount(
//   gameRoundId: string,
//   answeredCount: number
// ): Promise<void> {
//   try {
//     const gameRoundRef = doc(db, 'gameRounds', gameRoundId);
//     await updateDoc(gameRoundRef, {
//       answeredCount
//     });
//   } catch (error) {
//     console.error('updateGameRoundAnsweredCount error:', error);
//     throw new Error('回答数の更新に失敗しました');
//   }
// }

// ゲームラウンドの判定を更新
export async function updateGameRoundJudgment(
  gameRoundId: string,
  judgment: JudgmentResult
): Promise<void> {
  try {
    const gameRoundRef = doc(db, "gameRounds", gameRoundId);
    await updateDoc(gameRoundRef, {
      judgment,
    });
  } catch (error) {
    console.error("updateGameRoundJudgment error:", error);
    throw new Error("判定の更新に失敗しました");
  }
}

// ゲームラウンドの詳細情報を取得（お題情報含む）
export async function getGameRoundWithTopic(gameRoundId: string): Promise<{
  round: GameRound | null;
  topic: Topic | null;
}> {
  try {
    const gameRoundDoc = await getDoc(doc(db, "gameRounds", gameRoundId));

    if (!gameRoundDoc.exists()) {
      return { round: null, topic: null };
    }

    const gameRoundData = gameRoundDoc.data();
    const round: GameRound = {
      id: gameRoundDoc.id,
      ...gameRoundData,
      createdAt:
        gameRoundData.createdAt instanceof Timestamp
          ? gameRoundData.createdAt.toDate()
          : gameRoundData.createdAt,
    } as GameRound;

    // お題情報を取得
    const topicDoc = await getDoc(doc(db, "topics", round.topicId));
    let topic: Topic | null = null;

    if (topicDoc.exists()) {
      const topicData = topicDoc.data();
      topic = {
        id: topicDoc.id,
        ...topicData,
        createdAt:
          topicData.createdAt instanceof Timestamp
            ? topicData.createdAt.toDate()
            : topicData.createdAt,
      } as Topic;
    }

    return { round, topic };
  } catch (error) {
    console.error("getGameRoundWithTopic error:", error);
    return { round: null, topic: null };
  }
}

// roomIdから全ラウンドを取得
export async function getGameRoundsByRoomId(roomId: string): Promise<Array<{
  round: GameRound;
  topic: Topic | null;
}>> {
  try {
    // 1. まずroomIdから全てのtopicを取得
    const topicsQuery = query(
      collection(db, 'topics'),
      where('roomId', '==', roomId),
      orderBy('round', 'asc')
    );
    const topicsSnapshot = await getDocs(topicsQuery);
    
    const results: Array<{
      round: GameRound;
      topic: Topic | null;
    }> = [];
    
    // 2. 各topicに対して対応するgameRoundを取得
    for (const topicDoc of topicsSnapshot.docs) {
      const topicData = topicDoc.data();
      const topic: Topic = {
        id: topicDoc.id,
        ...topicData,
        createdAt: topicData.createdAt instanceof Timestamp ? topicData.createdAt.toDate() : topicData.createdAt
      } as Topic;
      
      // topicIdでgameRoundを検索
      const gameRoundQuery = query(
        collection(db, 'gameRounds'),
        where('topicId', '==', topicDoc.id)
      );
      const gameRoundSnapshot = await getDocs(gameRoundQuery);
      
      if (!gameRoundSnapshot.empty) {
        const gameRoundDoc = gameRoundSnapshot.docs[0];
        const gameRoundData = gameRoundDoc.data();
        const round: GameRound = {
          id: gameRoundDoc.id,
          ...gameRoundData,
          createdAt: gameRoundData.createdAt instanceof Timestamp ? gameRoundData.createdAt.toDate() : gameRoundData.createdAt
        } as GameRound;
        
        results.push({ round, topic });
      }
    }
    
    return results;
  } catch (error) {
    console.error('getGameRoundsByRoomId error:', error);
    return [];
  }
}

// アクティブなゲームラウンドを取得（gameHistories削除により不要）
// export async function getActiveGameRound(gameHistoryId: string): Promise<GameRound | null> {
//   ...
// }

// 特定のゲームラウンドの回答を取得
export async function getGameRoundAnswers(
  gameRoundId: string
): Promise<Array<{ userId: string; content: string; userName: string; submittedAt: Date }>> {
  try {
    const answersQuery = query(
      collection(db, "gameAnswers"),
      where("gameRoundId", "==", gameRoundId),
      orderBy("submittedAt", "asc")
    );
    const answersSnapshot = await getDocs(answersQuery);

    return answersSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        userId: data.userId || "",
        content: data.content,
        userName: data.userName,
        submittedAt:
          data.submittedAt instanceof Timestamp ? data.submittedAt.toDate() : data.submittedAt,
      };
    });
  } catch (error) {
    console.error("getGameRoundAnswers error:", error);
    return [];
  }
}
