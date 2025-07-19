// 回答履歴を作成（gameAnswers コレクションに直接保存）
export async function createGameAnswer(
  gameRoundId: string,
  userId: string,
  userName: string,
  content: string,
  submittedAt: Date
): Promise<void> {
  try {
    const { collection, addDoc, serverTimestamp, Timestamp } = await import('firebase/firestore');
    const { db } = await import('./firebase');
    
    const answerData = {
      gameRoundId,
      userId,
      userName,
      content,
      submittedAt: Timestamp.fromDate(submittedAt),
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, "gameAnswers"), answerData);
  } catch (error) {
    console.error("createGameAnswer error:", error);
    throw new Error("回答履歴の作成に失敗しました");
  }
}

// 特定のゲームラウンドとユーザーIDの回答を取得
export async function getUserAnswerForGameRound(
  gameRoundId: string, 
  userId: string
): Promise<string | null> {
  try {
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    const { db } = await import('./firebase');
    
    const answersQuery = query(
      collection(db, "gameAnswers"),
      where("gameRoundId", "==", gameRoundId),
      where("userId", "==", userId)
    );
    
    const querySnapshot = await getDocs(answersQuery);
    
    if (!querySnapshot.empty) {
      const answerDoc = querySnapshot.docs[0];
      const data = answerDoc.data();
      return data.content || null;
    }
    
    return null;
  } catch (error) {
    console.error("getUserAnswerForGameRound error:", error);
    return null;
  }
}

