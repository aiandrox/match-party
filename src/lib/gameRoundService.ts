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
} from "firebase/firestore";
import { db } from "./firebase";
import { GameRound, GameRoundStatus, JudgmentResult } from "@/types";

// アクティブなゲームラウンドを作成
export async function createGameRound(roomId: string, topicContent: string, roundNumber: number): Promise<string> {
  try {
    const gameRoundData: Omit<GameRound, "id"> = {
      roomId,
      topicContent,
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

// roomIdから全ラウンドを取得
export async function getGameRoundsByRoomId(roomId: string): Promise<Array<GameRound>> {
  try {
    // gameRoundsコレクションから直接roomIdで検索
    const gameRoundsQuery = query(
      collection(db, 'gameRounds'),
      where('roomId', '==', roomId),
      orderBy('roundNumber', 'asc')
    );
    const gameRoundsSnapshot = await getDocs(gameRoundsQuery);
    
    const results: Array<GameRound> = [];
    
    gameRoundsSnapshot.forEach(doc => {
      const gameRoundData = doc.data();
      const round: GameRound = {
        id: doc.id,
        ...gameRoundData,
        createdAt: gameRoundData.createdAt instanceof Timestamp ? gameRoundData.createdAt.toDate() : gameRoundData.createdAt
      } as GameRound;
      
      results.push(round);
    });
    
    return results;
  } catch (error) {
    console.error('getGameRoundsByRoomId error:', error);
    return [];
  }
}

// 特定のゲームラウンドの回答を取得
export async function getGameRoundAnswers(
  gameRoundId: string
): Promise<Array<{ content: string; userName: string; submittedAt: Date }>> {
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
