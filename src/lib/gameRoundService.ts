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
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { GameRound, JudgmentResult } from "@/types";

// アクティブなゲームラウンドを作成
export async function createGameRound(roomId: string, topicContent: string, roundNumber: number): Promise<string> {
  try {
    const gameRoundData: Omit<GameRound, "id"> = {
      roomId,
      topicContent,
      roundNumber,
      status: "active",
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
      status: "completed",
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

// ゲームラウンドのお題を更新
export async function updateGameRoundTopic(
  gameRoundId: string,
  newTopicContent: string
): Promise<void> {
  try {
    const gameRoundRef = doc(db, "gameRounds", gameRoundId);
    await updateDoc(gameRoundRef, {
      topicContent: newTopicContent,
    });
  } catch (error) {
    console.error("updateGameRoundTopic error:", error);
    throw new Error("お題の更新に失敗しました");
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


// 特定のゲームラウンドの回答を取得（未回答者も含む）
export async function getGameRoundAnswersWithParticipants(
  gameRoundId: string,
  participants: Array<{ name: string; [key: string]: any }>
): Promise<Array<{ content: string; userName: string; submittedAt: Date | null; hasAnswered: boolean }>> {
  try {
    // 回答データを取得
    const answersQuery = query(
      collection(db, "gameAnswers"),
      where("gameRoundId", "==", gameRoundId),
      orderBy("submittedAt", "asc")
    );
    const answersSnapshot = await getDocs(answersQuery);

    const answersMap = new Map<string, { content: string; submittedAt: Date }>();
    answersSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      answersMap.set(data.userName, {
        content: data.content,
        submittedAt: data.submittedAt instanceof Timestamp ? data.submittedAt.toDate() : data.submittedAt,
      });
    });

    // 参加者リストと回答データを組み合わせ
    return participants.map((participant) => {
      const answer = answersMap.get(participant.name);
      return {
        content: answer?.content || "",
        userName: participant.name,
        submittedAt: answer?.submittedAt || null,
        hasAnswered: !!answer
      };
    });
  } catch (error) {
    console.error("getGameRoundAnswersWithParticipants error:", error);
    return [];
  }
}

// ゲームラウンドをリアルタイムで監視
export function subscribeToGameRound(gameRoundId: string, callback: (_gameRound: GameRound | null) => void) {
  const gameRoundRef = doc(db, 'gameRounds', gameRoundId);
  
  return onSnapshot(gameRoundRef, (docSnapshot) => {
    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      const gameRound: GameRound = {
        id: docSnapshot.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp 
          ? data.createdAt.toDate() 
          : data.createdAt
      } as GameRound;
      callback(gameRound);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('GameRound subscription error:', error);
    callback(null);
  });
}
