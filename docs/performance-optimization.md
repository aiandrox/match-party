# パフォーマンス最適化ガイド

Match Partyアプリケーションのパフォーマンス分析と改善提案

**最終更新**: 2025-07-19
**対象**: 開発者・パフォーマンス担当者

## 📊 現在のパフォーマンス状況

### ✅ 良好な点
- **静的サイト生成**: 2.9MBの軽量ビルド
- **MVPアーキテクチャ**: 責任分離による保守性
- **TypeScript完全対応**: 型安全性確保
- **テスト基盤**: 44テスト実装済み
- **CI/CD自動化**: 品質ゲート確保

### ⚠️ 改善可能な点
- **JavaScriptバンドル**: 最大チャンク320KB
- **Firestore接続数**: 1ユーザーあたり最大3接続
- **再レンダリング**: メモ化未実装箇所が多数
- **お題データサイズ**: 447個の大型JSON

---

## 🚀 高優先度改善項目（短期実装）

### 1. 参加者リストのメモ化
**対象ファイル**: `src/app/room/components/WaitingRoom.presenter.ts`

**現状問題**:
- 参加者リスト（最大20人）の頻繁な再レンダリング
- 参加者変更時に全リストが再作成される

**改善案**:
```typescript
// WaitingRoom.presenter.ts
const participantList = useMemo(() => 
  room.participants.map(p => ({ 
    ...p, 
    isCurrentUser: p.id === currentUserId,
    status: p.hasAnswered ? 'answered' : 'waiting'
  })),
  [room.participants, currentUserId]
);

const participantCount = useMemo(() => room.participants.length, [room.participants]);
```

**期待効果**:
- 不要な再レンダリング50%削減
- 参加者20人時の処理負荷大幅軽減

**実装時間**: 2-3時間
**難易度**: 易

### 2. PresenterのuseCallback最適化
**対象ファイル**: 全Presenterファイル

**現状問題**:
- 関数の再生成による不要な再レンダリング
- 子コンポーネントへの prop変更による連鎖再レンダリング

**改善案**:
```typescript
// PlayingGame.presenter.ts
const submitAnswer = useCallback(async () => {
  if (!answer.trim() || isSubmitting) return;
  
  setIsSubmitting(true);
  try {
    const { submitAnswer } = await import("@/lib/roomService");
    await submitAnswer(room.id, currentUserId, currentUserName, answer);
    setAnswer("");
  } finally {
    setIsSubmitting(false);
  }
}, [room.id, currentUserId, currentUserName, answer, isSubmitting]);

const revealAnswers = useCallback(async () => {
  const { forceRevealAnswers } = await import("@/lib/roomService");
  await forceRevealAnswers(room.id);
}, [room.id]);
```

**対象関数**:
- `submitAnswer`, `revealAnswers`, `nextRound`, `endGame`
- `joinRoom`, `createRoom`
- 各種ナビゲーション関数

**期待効果**:
- 関数再生成による再レンダリング削減
- インタラクション応答性40-60%向上

**実装時間**: 4-6時間
**難易度**: 中

### 3. React.memoでView層最適化
**対象ファイル**: 全Componentファイル

**改善案**:
```typescript
// WaitingRoom.component.tsx
import React, { memo } from 'react';

const WaitingRoom = memo(({ room, isHost, onStartGame, onNavigateHome }) => {
  // コンポーネント内容
});

export default WaitingRoom;

// PlayingGame.component.tsx
const PlayingGame = memo(({ 
  room, answer, isSubmitting, onAnswerChange, onSubmitAnswer, onRevealAnswers 
}) => {
  // コンポーネント内容
});
```

**期待効果**:
- props未変更時の不要な再レンダリング完全排除
- View層の描画負荷軽減

**実装時間**: 2-3時間
**難易度**: 易

### 4. 音声ファイル最適化
**対象ファイル**: `public/sounds/`, `src/lib/gameEffects.ts`

**現状問題**:
- 音声ファイル圧縮率が最適でない可能性
- 全音声ファイルの事前読み込み

**改善案**:
```typescript
// Dynamic import for audio files
const playSound = async (soundType: 'success' | 'error' | 'question') => {
  const audioModule = await import(`@/sounds/${soundType}.mp3`);
  const audio = new Audio(audioModule.default);
  return audio.play();
};

// 音声ファイル形式最適化
// MP3 → WebM/OGG (ブラウザサポートに応じて)
```

**期待効果**:
- 初期バンドルサイズ200KB程度削減
- 必要時のみ音声読み込み

**実装時間**: 1-2時間
**難易度**: 易

---

## 🔥 Firestore接続最適化（重要）

### 現在の接続パターン分析

#### 1ユーザーあたりの最大同時接続数
```
waiting状態:   1接続 (Room監視)
playing状態:   3接続 (Room + GameRound×2)
revealing状態: 2接続 (Room + GameRound)
ended状態:     1接続 (Room監視)
```

#### 20人ルームでの総接続数
- **現在**: 20人 × 3接続 = **60接続** (playing状態)
- **最適化後**: 20人 × 2接続 = **40接続** (33%削減)

### 改善案1: GameRound監視の統一
**対象ファイル**: `src/app/room/components/PlayingGame.presenter.ts`

**現状問題**:
```typescript
// 現在：2つの独立したuseEffectでGameRound監視
useEffect(() => {
  // 初期お題の監視
  unsubscribe = subscribeToGameRound(topic.id, callback1);
}, [topic.id]);

useEffect(() => {
  // 次ラウンドの監視
  unsubscribe = subscribeToGameRound(room.currentGameRoundId, callback2);
}, [room.currentGameRoundId]);
```

**改善案**:
```typescript
// 統一されたGameRound監視
useEffect(() => {
  let unsubscribe: (() => void) | undefined;
  
  const subscribeToCurrentGameRound = async () => {
    // 優先順位：room.currentGameRoundId > topic.id
    const gameRoundId = room.currentGameRoundId || topic.id;
    
    if (gameRoundId && !unsubscribe) {
      const { subscribeToGameRound } = await import("@/lib/gameRoundService");
      unsubscribe = subscribeToGameRound(gameRoundId, (updatedGameRound) => {
        if (updatedGameRound) {
          setCurrentGameRound(updatedGameRound);
          // 状態に応じた処理統合
          handleGameRoundUpdate(updatedGameRound);
        }
      });
    }
  };
  
  subscribeToCurrentGameRound();
  
  return () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = undefined;
    }
  };
}, [room.currentGameRoundId, topic.id]);
```

### 改善案2: 接続管理の中央集権化
**新規ファイル**: `src/lib/firestoreConnectionManager.ts`

```typescript
class FirestoreConnectionManager {
  private connections = new Map<string, () => void>();
  private static instance: FirestoreConnectionManager;
  
  static getInstance() {
    if (!this.instance) {
      this.instance = new FirestoreConnectionManager();
    }
    return this.instance;
  }
  
  subscribe(key: string, callback: () => () => void) {
    // 既存接続を確実に終了
    this.unsubscribe(key);
    
    try {
      const unsubscribe = callback();
      this.connections.set(key, unsubscribe);
      console.log(`Firestore connection established: ${key}`);
    } catch (error) {
      console.error(`Failed to establish connection: ${key}`, error);
    }
  }
  
  unsubscribe(key: string) {
    const unsubscribe = this.connections.get(key);
    if (unsubscribe) {
      unsubscribe();
      this.connections.delete(key);
      console.log(`Firestore connection closed: ${key}`);
    }
  }
  
  unsubscribeAll() {
    this.connections.forEach((unsubscribe, key) => {
      unsubscribe();
      console.log(`Firestore connection closed: ${key}`);
    });
    this.connections.clear();
  }
  
  getActiveConnections() {
    return Array.from(this.connections.keys());
  }
}

// 使用例
const connectionManager = FirestoreConnectionManager.getInstance();

// Room.facade.ts
connectionManager.subscribe('room', () => 
  subscribeToRoom(roomId, callback)
);

// PlayingGame.presenter.ts
connectionManager.subscribe('gameRound', () => 
  subscribeToGameRound(gameRoundId, callback)
);
```

### 改善案3: Context APIでRoom監視共有
**新規ファイル**: `src/app/room/contexts/RoomContext.tsx`

```typescript
interface RoomContextType {
  room: Room | null;
  loading: boolean;
  error: string | null;
}

const RoomContext = createContext<RoomContextType | null>(null);

export const RoomProvider: React.FC<{ roomId: string; children: React.ReactNode }> = ({ 
  roomId, 
  children 
}) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const connectionManager = FirestoreConnectionManager.getInstance();
    
    connectionManager.subscribe('room', () => {
      const { subscribeToRoom } = await import("@/lib/roomService");
      return subscribeToRoom(roomId, (updatedRoom) => {
        setRoom(updatedRoom);
        setLoading(false);
      });
    });
    
    return () => connectionManager.unsubscribe('room');
  }, [roomId]);
  
  return (
    <RoomContext.Provider value={{ room, loading, error }}>
      {children}
    </RoomContext.Provider>
  );
};

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
};
```

---

## 📦 バンドルサイズ最適化

### Dynamic Import拡張
**対象ファイル**: `src/lib/gameEffects.ts`, 音声機能

**改善案**:
```typescript
// 音声機能の遅延読み込み
const playGameEffect = async (type: 'success' | 'error' | 'question') => {
  const gameEffects = await import('@/lib/gameEffects');
  return gameEffects.playSound(type);
};

// アニメーション機能の分離
const showAnimation = async (type: 'celebration' | 'thinking') => {
  const animations = await import('@/lib/animations');
  return animations.show(type);
};
```

### お題データのAPI化
**新規ファイル**: `src/api/topics.ts`

**改善案**:
```typescript
// 現在: src/data/topics.json (447個のお題がバンドルに含まれる)
// 改善: APIエンドポイント化

export const fetchTopics = async (): Promise<string[]> => {
  const response = await fetch('/api/topics');
  if (!response.ok) {
    throw new Error('Failed to fetch topics');
  }
  return response.json();
};

// Firebase Hostingでの静的API
// public/api/topics.json として配置
// CDNキャッシュ活用
```

### Tree Shaking強化
**対象ファイル**: Firebase imports

**改善案**:
```typescript
// 現在: 包括的なimport
import firebase from 'firebase/app';

// 改善: 必要機能のみimport
import { getFirestore, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
```

---

## 🎯 中期実装項目

### 1. 複合インデックス追加
**対象ファイル**: `firestore.indexes.json`

**改善案**:
```json
{
  "indexes": [
    {
      "collectionGroup": "rooms",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "code", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "rooms",
      "queryScope": "COLLECTION", 
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "expiresAt", "order": "ASCENDING" }
      ]
    }
  ]
}
```

### 2. バッチ書き込み導入
**対象ファイル**: `src/lib/roomService.ts`

**改善案**:
```typescript
import { writeBatch } from 'firebase/firestore';

export const createRoomWithBatch = async (roomData: RoomCreationData) => {
  const batch = writeBatch(db);
  
  // 現在：3回の個別書き込み
  // 改善：1回のバッチ書き込み
  batch.set(roomRef, roomData);
  batch.set(userRef, userData);
  batch.set(topicRef, topicData);
  
  await batch.commit();
};
```

### 3. Bundle Analyzer導入
**インストール**:
```bash
npm install --save-dev @next/bundle-analyzer
```

**設定追加**: `next.config.js`
```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // 既存設定
});
```

**使用方法**:
```bash
ANALYZE=true npm run build
```

---

## 📊 実装優先度と期待効果

### Phase 1（即効性・高効果）
| 項目 | 実装時間 | 難易度 | 効果 | 優先度 |
|------|----------|--------|------|--------|
| 参加者リストメモ化 | 2-3時間 | 易 | 再レンダリング50%削減 | 最高 |
| 音声ファイル最適化 | 1-2時間 | 易 | バンドル200KB削減 | 高 |
| React.memo導入 | 2-3時間 | 易 | View層最適化 | 高 |
| useCallback最適化 | 4-6時間 | 中 | インタラクション60%向上 | 高 |

### Phase 2（構造改善）
| 項目 | 実装時間 | 難易度 | 効果 | 優先度 |
|------|----------|--------|------|--------|
| Firestore接続統一 | 6-8時間 | 中 | 接続33%削減 | 高 |
| 接続管理中央化 | 4-6時間 | 中 | 安定性向上 | 中 |
| Dynamic Import拡張 | 3-4時間 | 中 | 初期バンドル50KB削減 | 中 |

### Phase 3（長期最適化）
| 項目 | 実装時間 | 難易度 | 効果 | 優先度 |
|------|----------|--------|------|--------|
| お題データAPI化 | 8-12時間 | 難 | 大幅なバンドル削減 | 中 |
| 複合インデックス | 2-3時間 | 中 | クエリ性能向上 | 低 |
| Bundle Analyzer | 1-2時間 | 易 | 継続的監視 | 低 |

---

## 🎯 総合的な期待効果

### パフォーマンス向上
- **初期読み込み時間**: 20-30%短縮
- **インタラクション応答性**: 40-60%向上  
- **バンドルサイズ**: 15-25%削減
- **Firestore接続数**: 33%削減（60→40接続）

### Lighthouse スコア予測
- **Performance**: 75-85点 → 90点以上
- **Accessibility**: 90-95点（維持）
- **Best Practices**: 85-90点 → 95点以上
- **SEO**: 80-90点（維持）

### 運用コスト削減
- **Firebase使用量**: 接続数削減により制限緩和
- **CDN転送量**: バンドルサイズ削減により軽減
- **ユーザー体験**: 応答性向上によるユーザー満足度向上

---

## 🔧 実装ガイドライン

### 開発手順
1. **Phase 1の高優先度項目から順次実装**
2. **各実装後にテスト実行・動作確認**
3. **パフォーマンス測定・効果検証**
4. **次Phase移行の判断**

### 測定・監視
```bash
# パフォーマンス測定
npm run build
npm run start
# Lighthouse測定実行

# バンドルサイズ分析
ANALYZE=true npm run build

# Firestore接続監視
console.log(connectionManager.getActiveConnections());
```

### 注意事項
- **Firebase無料枠制限の監視継続**
- **リアルタイム性とパフォーマンスのバランス**
- **既存テスト（44テスト）の品質維持**
- **MVPアーキテクチャパターンの保持**

このパフォーマンス最適化により、Match Partyは更に高速で快適なユーザーエクスペリエンスを提供できるようになります。