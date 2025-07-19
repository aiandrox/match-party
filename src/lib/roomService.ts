import { 
  collection, 
  addDoc, 
  doc, 
  getDocs,
  query,
  where,
  onSnapshot,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { Room, User, CreateRoomResponse, JoinRoomResponse, JudgmentResult, GameRound } from '@/types';
import { generateRoomCode, generateUserId, createExpirationTime } from './utils';
import { getRandomTopic } from './topicService';

// ルーム作成
export async function createRoom(hostName: string): Promise<CreateRoomResponse> {
  try {
    // ルームコード生成（重複チェック付き）
    let roomCode = generateRoomCode();
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      const roomQuery = query(
        collection(db, 'rooms'),
        where('code', '==', roomCode)
      );
      const existingRooms = await getDocs(roomQuery);
      
      if (existingRooms.empty) {
        isUnique = true;
      } else {
        roomCode = generateRoomCode();
        attempts++;
      }
    }
    
    if (!isUnique) {
      throw new Error('ルームコードの生成に失敗しました。もう一度お試しください。');
    }

    // ホストユーザーID生成
    const hostId = generateUserId();
    
    // ルームデータ作成
    const roomData: Omit<Room, 'id'> = {
      code: roomCode,
      hostId: hostId,
      status: "waiting",
      participants: [],
      createdAt: new Date(),
      expiresAt: createExpirationTime()
    };

    // Firestoreにルーム作成
    const roomRef = await addDoc(collection(db, 'rooms'), {
      ...roomData,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(roomData.expiresAt)
    });

    // ホストユーザーデータ作成
    const hostData: Omit<User, 'id'> = {
      name: hostName,
      isHost: true,
      roomId: roomRef.id,
      joinedAt: new Date(),
      isReady: false,
      hasAnswered: false
    };

    // Firestoreにホストユーザー作成
    const hostRef = await addDoc(collection(db, 'users'), {
      ...hostData,
      joinedAt: serverTimestamp()
    });

    // ルームの参加者リストにホストを追加
    await updateDoc(roomRef, {
      participants: arrayUnion({
        id: hostRef.id,
        name: hostName,
        isHost: true,
        roomId: roomRef.id,
        joinedAt: new Date(),
        isReady: false,
        hasAnswered: false
      })
    });

    return {
      roomId: roomRef.id,
      roomCode: roomCode,
      hostId: hostRef.id
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('createRoom error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('ルームの作成に失敗しました');
  }
}

// ルーム参加
export async function joinRoom(roomCode: string, userName: string): Promise<JoinRoomResponse> {
  try {
    // ルームコードでルームを検索
    const roomQuery = query(
      collection(db, 'rooms'),
      where('code', '==', roomCode)
    );
    const roomSnapshot = await getDocs(roomQuery);
    
    if (roomSnapshot.empty) {
      throw new Error('指定されたルームが見つかりません');
    }
    
    const roomDoc = roomSnapshot.docs[0];
    const roomData = roomDoc.data() as Room;
    
    // 有効期限確認
    const now = new Date();
    const expiresAt = roomData.expiresAt instanceof Timestamp 
      ? roomData.expiresAt.toDate() 
      : roomData.expiresAt;
    
    if (now > expiresAt) {
      throw new Error('このルームは有効期限が切れています');
    }
    
    // localStorageから既存のuserIdを確認
    const existingUserId = localStorage.getItem(`userId_${roomCode}`);
    
    if (existingUserId) {
      // 既存のユーザーIDで参加者リストに存在するかチェック
      const existingUser = roomData.participants.find(p => p.id === existingUserId);
      
      if (existingUser) {
        // 名前が一致する場合は再参加として処理（ゲーム中でも可能）
        if (existingUser.name === userName) {
          return {
            roomId: roomDoc.id,
            userId: existingUserId
          };
        } else {
          throw new Error('この名前では再参加できません。以前使用した名前を入力してください');
        }
      }
      // 既存のuserIdが参加者リストにない場合は、localStorageをクリア
      localStorage.removeItem(`userId_${roomCode}`);
    }
    
    // 新規参加の場合のみゲーム状態をチェック
    if (roomData.status !== "waiting") {
      throw new Error('このルームは既にゲームが開始されています');
    }
    
    // 参加者数確認
    if (roomData.participants.length >= 20) {
      throw new Error('このルームは満員です');
    }
    
    // 同じ名前の参加者が既にいるかチェック（新規参加の場合）
    const existingParticipant = roomData.participants.find(
      p => p.name === userName
    );
    
    if (existingParticipant) {
      throw new Error('この名前は既に使用されています');
    }

    // ユーザーデータ作成
    const userData: Omit<User, 'id'> = {
      name: userName,
      isHost: false,
      roomId: roomDoc.id,
      joinedAt: new Date(),
      isReady: false,
      hasAnswered: false
    };

    // Firestoreにユーザー作成
    const userRef = await addDoc(collection(db, 'users'), {
      ...userData,
      joinedAt: serverTimestamp()
    });

    // ルームの参加者リストにユーザーを追加
    await updateDoc(roomDoc.ref, {
      participants: arrayUnion({
        id: userRef.id,
        name: userName,
        isHost: false,
        roomId: roomDoc.id,
        joinedAt: new Date(),
        isReady: false,
        hasAnswered: false
      })
    });

    return {
      roomId: roomDoc.id,
      userId: userRef.id
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('ルームへの参加に失敗しました');
  }
}

// ルーム情報取得
export async function getRoomByCode(roomCode: string): Promise<Room | null> {
  try {
    const roomQuery = query(
      collection(db, 'rooms'),
      where('code', '==', roomCode)
    );
    const roomSnapshot = await getDocs(roomQuery);
    
    if (roomSnapshot.empty) {
      return null;
    }
    
    const roomDoc = roomSnapshot.docs[0];
    const roomData = roomDoc.data();
    
    return {
      id: roomDoc.id,
      ...roomData,
      createdAt: roomData.createdAt instanceof Timestamp 
        ? roomData.createdAt.toDate() 
        : roomData.createdAt,
      expiresAt: roomData.expiresAt instanceof Timestamp 
        ? roomData.expiresAt.toDate() 
        : roomData.expiresAt
    } as Room;
  } catch (error) {
    return null;
  }
}

// ルーム情報をリアルタイムで監視
export function subscribeToRoom(roomId: string, callback: (_room: Room | null) => void) {
  const roomRef = doc(db, 'rooms', roomId);
  
  return onSnapshot(roomRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      const room: Room = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp 
          ? data.createdAt.toDate() 
          : data.createdAt,
        expiresAt: data.expiresAt instanceof Timestamp 
          ? data.expiresAt.toDate() 
          : data.expiresAt
      } as Room;
      callback(room);
    } else {
      callback(null);
    }
  }, (error) => {
    // eslint-disable-next-line no-console
    console.error('Firestore subscription error:', error);
    callback(null);
  });
}

// ゲーム開始
export async function startGame(roomId: string): Promise<void> {
  try {
    // ルーム情報を取得
    const roomRef = doc(db, 'rooms', roomId);
    const roomDoc = await getDoc(roomRef);
    
    if (!roomDoc.exists()) {
      throw new Error('ルームが見つかりません');
    }
    
    const roomData = roomDoc.data() as Room;
    
    // ゲーム開始可能かチェック
    if (roomData.status !== "waiting") {
      throw new Error('ゲームは既に開始されています');
    }
    
    if (roomData.participants.length < 2) {
      throw new Error('ゲーム開始には2人以上の参加者が必要です');
    }
    
    // ランダムなお題を取得
    const topicData = getRandomTopic();
    
    
    // ゲームラウンドを作成
    const { createGameRound } = await import('@/lib/gameRoundService');
    const gameRoundId = await createGameRound(
      roomId,
      topicData,
      1
    );
    
    // ルーム状態を更新
    await updateDoc(roomRef, {
      status: "playing",
      currentGameRoundId: gameRoundId,
      // 全参加者の回答状態をリセット
      participants: roomData.participants.map(p => ({
        ...p,
        hasAnswered: false
      }))
    });
    
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('startGame error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('ゲームの開始に失敗しました');
  }
}

// 現在のゲームラウンドとお題情報を取得
export async function getCurrentGameRoundWithTopic(roomId: string): Promise<{
  gameRound: any;
  topic: any;
  round: number;
} | null> {
  try {
    // ルーム情報を取得
    const roomRef = doc(db, 'rooms', roomId);
    const roomDoc = await getDoc(roomRef);
    
    if (!roomDoc.exists()) {
      return null;
    }
    
    const roomData = roomDoc.data();
    if (!roomData.currentGameRoundId) {
      return null;
    }
    
    // ゲームラウンド情報を取得
    const gameRoundDoc = await getDoc(doc(db, 'gameRounds', roomData.currentGameRoundId));
    
    if (!gameRoundDoc.exists()) {
      return null;
    }
    
    const gameRoundData = gameRoundDoc.data();
    const gameRound = {
      id: gameRoundDoc.id,
      ...gameRoundData,
      createdAt: gameRoundData.createdAt instanceof Timestamp ? gameRoundData.createdAt.toDate() : gameRoundData.createdAt
    } as GameRound;
    
    // topicContentはgameRoundに含まれているのでtopicオブジェクトを作成
    const topic = {
      id: gameRound.id,
      content: gameRound.topicContent,
      roomId: gameRound.roomId,
      round: gameRound.roundNumber,
      createdAt: gameRound.createdAt
    };
    
    return {
      gameRound,
      topic,
      round: gameRound.roundNumber
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('getCurrentGameRoundWithTopic error:', error);
    return null;
  }
}

// 後方互換性のための関数
export async function getTopicByRoomId(roomId: string): Promise<{ id: string; content: string; round: number } | null> {
  const result = await getCurrentGameRoundWithTopic(roomId);
  if (!result) {
    return null;
  }
  
  return {
    id: result.topic.id,
    content: result.topic.content,
    round: result.round
  };
}

// 回答を送信
export async function submitAnswer(roomId: string, userId: string, answer: string): Promise<void> {
  try {

    // ルーム情報を取得して参加者の回答状態を更新
    const roomRef = doc(db, 'rooms', roomId);
    const roomDoc = await getDoc(roomRef);
    
    if (!roomDoc.exists()) {
      throw new Error('ルームが見つかりません');
    }
    
    const roomData = roomDoc.data() as Room;
    
    // 参加者の回答状態を更新
    const updatedParticipants = roomData.participants.map(p => 
      p.id === userId ? { ...p, hasAnswered: true } : p
    );
    
    await updateDoc(roomRef, {
      participants: updatedParticipants
    });
    
    // ゲーム履歴に回答を保存
    if (roomData.currentGameRoundId) {
      const { createGameAnswer } = await import('@/lib/gameHistoryService');
      const user = roomData.participants.find(p => p.id === userId);
      if (user) {
        await createGameAnswer(
          roomData.currentGameRoundId,
          userId,
          user.name,
          answer.trim(),
          new Date()
        );
      }
    }
    
    // 全員回答したかチェック
    const allAnswered = updatedParticipants.every(p => p.hasAnswered);
    if (allAnswered) {
      // 自動的にrevealingステータスに移行
      await updateDoc(roomRef, {
        status: "revealing"
      });
    }
    
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('submitAnswer error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('回答の送信に失敗しました');
  }
}

// 特定のゲームラウンドの全回答を取得
export async function getAnswersByGameRoundId(gameRoundId: string): Promise<Array<{ content: string; userName: string; submittedAt: Date }>> {
  try {
    const { getGameRoundAnswers } = await import('@/lib/gameRoundService');
    return await getGameRoundAnswers(gameRoundId);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('getAnswersByGameRoundId error:', error);
    return [];
  }
}

// 特定のゲームラウンドの全回答を取得（未回答者も含む）
export async function getAnswersByGameRoundIdWithParticipants(gameRoundId: string, participants: Array<{ name: string; [key: string]: any }>): Promise<Array<{ content: string; userName: string; submittedAt: Date | null; hasAnswered: boolean }>> {
  try {
    const { getGameRoundAnswersWithParticipants } = await import('@/lib/gameRoundService');
    return await getGameRoundAnswersWithParticipants(gameRoundId, participants);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('getAnswersByGameRoundIdWithParticipants error:', error);
    return [];
  }
}


// 主催者による一致判定を保存
export async function saveHostJudgment(roomId: string, judgment: JudgmentResult): Promise<void> {
  try {
    // ルーム情報を取得
    const roomRef = doc(db, 'rooms', roomId);
    const roomDoc = await getDoc(roomRef);
    
    if (!roomDoc.exists()) {
      throw new Error('ルームが見つかりません');
    }
    
    const roomData = roomDoc.data() as Room;
    
    // ゲームラウンドの判定を更新
    if (roomData.currentGameRoundId) {
      const { updateGameRoundJudgment } = await import('@/lib/gameRoundService');
      await updateGameRoundJudgment(roomData.currentGameRoundId, judgment);
    }
    
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('saveHostJudgment error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('判定の保存に失敗しました');
  }
}

// 主催者による強制回答公開
export async function forceRevealAnswers(roomId: string): Promise<void> {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    const roomDoc = await getDoc(roomRef);
    
    if (!roomDoc.exists()) {
      throw new Error('ルームが見つかりません');
    }
    
    const roomData = roomDoc.data() as Room;
    
    // ゲーム中でない場合はエラー
    if (roomData.status !== 'playing') {
      throw new Error('ゲーム中のみ回答を公開できます');
    }
    
    // 回答済みの参加者数をチェック
    const answeredCount = roomData.participants.filter(p => p.hasAnswered).length;
    if (answeredCount < 2) {
      throw new Error('回答公開には2人以上の回答が必要です');
    }
    
    // 強制的にrevealingステータスに変更
    await updateDoc(roomRef, {
      status: 'revealing'
    });
    
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('forceRevealAnswers error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('回答公開に失敗しました');
  }
}

// 次のラウンドを開始
export async function startNextRound(roomId: string): Promise<void> {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    const roomDoc = await getDoc(roomRef);
    
    if (!roomDoc.exists()) {
      throw new Error('ルームが見つかりません');
    }
    
    const roomData = roomDoc.data() as Room;
    
    // 新しいお題を取得
    const topicData = getRandomTopic();
    
    // 現在のラウンド数を取得
    const { getTopicByRoomId } = await import('@/lib/roomService');
    const currentTopic = await getTopicByRoomId(roomId);
    const nextRound = currentTopic ? currentTopic.round + 1 : 2;
    
    
    // 前回のゲームラウンドを完了状態に更新
    if (roomData.currentGameRoundId) {
      const { completeGameRound } = await import('@/lib/gameRoundService');
      
      // 現在のゲームラウンドから判定を取得
      let judgment: JudgmentResult | undefined;
      if (roomData.currentGameRoundId) {
        const gameRoundDoc = await getDoc(doc(db, 'gameRounds', roomData.currentGameRoundId));
        if (gameRoundDoc.exists()) {
          const gameRoundData = gameRoundDoc.data();
          judgment = gameRoundData.judgment;
        }
      }
      
      await completeGameRound(roomData.currentGameRoundId, judgment);
    }
    
    // 新しいゲームラウンドを作成
    const { createGameRound } = await import('@/lib/gameRoundService');
    const newGameRoundId = await createGameRound(
      roomId,
      topicData,
      nextRound
    );
    
    // ルーム状態を更新（playingに戻す）
    await updateDoc(roomRef, {
      status: "playing",
      currentGameRoundId: newGameRoundId,
      // 全参加者の回答状態をリセット
      participants: roomData.participants.map(p => ({
        ...p,
        hasAnswered: false
      }))
    });
    
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('startNextRound error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('次のラウンドの開始に失敗しました');
  }
}

// お題変更（誰も回答していない場合のみ）
export async function changeTopicIfNoAnswers(roomId: string): Promise<void> {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    const roomDoc = await getDoc(roomRef);
    
    if (!roomDoc.exists()) {
      throw new Error('ルームが見つかりません');
    }
    
    const roomData = roomDoc.data() as Room;
    
    // ゲーム中でない場合はエラー
    if (roomData.status !== "playing") {
      throw new Error('ゲーム中のみお題を変更できます');
    }
    
    // 回答済みの参加者がいる場合はエラー
    const hasAnsweredParticipants = roomData.participants.some(p => p.hasAnswered);
    if (hasAnsweredParticipants) {
      throw new Error('既に回答している参加者がいるため、お題を変更できません');
    }
    
    // 新しいお題を取得
    const topicData = getRandomTopic();
    
    // 現在のゲームラウンドを更新
    if (roomData.currentGameRoundId) {
      const { updateGameRoundTopic } = await import('@/lib/gameRoundService');
      await updateGameRoundTopic(roomData.currentGameRoundId, topicData);
    }
    
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('changeTopicIfNoAnswers error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('お題の変更に失敗しました');
  }
}

// ゲームを終了
export async function endGame(roomId: string): Promise<void> {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    const roomDoc = await getDoc(roomRef);
    
    if (!roomDoc.exists()) {
      throw new Error('ルームが見つかりません');
    }
    
    await updateDoc(roomRef, {
      status: "ended"
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('endGame error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('ゲーム終了に失敗しました');
  }
}