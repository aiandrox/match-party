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

