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

// 特定のラウンドの回答一覧を取得
export async function getGameRoundAnswers(gameRoundId: string): Promise<Array<{
  id: string;
  userName: string;
  content: string;
  submittedAt: Date;
}>> {
  try {
    const { collection, getDocs, query, where, orderBy, Timestamp } = await import('firebase/firestore');
    const { db } = await import('./firebase');
    
    const answersQuery = query(
      collection(db, "gameAnswers"),
      where("gameRoundId", "==", gameRoundId),
      orderBy("submittedAt", "asc")
    );
    const answersSnapshot = await getDocs(answersQuery);

    return answersSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userName: data.userName,
        content: data.content,
        submittedAt: data.submittedAt instanceof Timestamp ? data.submittedAt.toDate() : data.submittedAt,
      };
    });
  } catch (error) {
    console.error("getGameRoundAnswers error:", error);
    return [];
  }
}