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
import { Room, User, CreateRoomResponse, JoinRoomResponse } from '@/types';
import { generateRoomCode, generateUserId } from './utils';
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
      status: 'waiting',
      participants: [],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30分後
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
    
    // ルームの状態確認
    if (roomData.status !== 'waiting') {
      throw new Error('このルームは既にゲームが開始されています');
    }
    
    // 有効期限確認
    const now = new Date();
    const expiresAt = roomData.expiresAt instanceof Timestamp 
      ? roomData.expiresAt.toDate() 
      : roomData.expiresAt;
    
    if (now > expiresAt) {
      throw new Error('このルームは有効期限が切れています');
    }
    
    // 参加者数確認
    if (roomData.participants.length >= 20) {
      throw new Error('このルームは満員です');
    }
    
    // localStorageから既存のuserIdを確認
    const existingUserId = localStorage.getItem(`userId_${roomCode}`);
    
    if (existingUserId) {
      // 既存のユーザーIDで参加者リストに存在するかチェック
      const existingUser = roomData.participants.find(p => p.id === existingUserId);
      
      if (existingUser) {
        // 名前が一致する場合は再参加として処理
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
export function subscribeToRoom(roomId: string, callback: (roomData: Room | null) => void) {
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
    if (roomData.status !== 'waiting') {
      throw new Error('ゲームは既に開始されています');
    }
    
    if (roomData.participants.length < 2) {
      throw new Error('ゲーム開始には2人以上の参加者が必要です');
    }
    
    // ランダムなお題を取得
    const topicData = getRandomTopic();
    
    // お題をFirestoreに保存
    const topicRef = await addDoc(collection(db, 'topics'), {
      content: topicData.content,
      category: topicData.category,
      roomId: roomId,
      round: 1,
      createdAt: serverTimestamp()
    });
    
    // ルーム状態を更新
    await updateDoc(roomRef, {
      status: 'playing',
      currentTopicId: topicRef.id,
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