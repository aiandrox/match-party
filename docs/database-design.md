# Match Party データベース設計書

## 概要

Match PartyアプリケーションはFirebase Firestoreを使用し、リアルタイムゲームと履歴管理を両立するハイブリッドアプローチを採用しています。

**最終更新**: 2025-07-19  
**現在の状況**: Phase 6完了・MVP統一アーキテクチャによる全アプリケーション実装完了

## データベースコレクション一覧

### 1. `rooms` コレクション
**目的**: ゲームルーム情報と現在のゲーム状態を管理

| フィールド | 型 | 説明 | 使用箇所 |
|-----------|-----|-----|----------|
| `id` | String | Firestoreドキュメント自動生成ID | `roomService.ts` 全関数, `room/page.tsx` ルーム表示 |
| `code` | String | 20文字の英数字ルームコード | `roomService.ts` `createRoom()`, `getRoomByCode()`, `room/page.tsx` URL表示・共有 |
| `hostId` | String | ホストユーザーID | `roomService.ts` `createRoom()`, `room/page.tsx` ホスト権限チェック |
| `status` | RoomStatus | ルーム状態 (`waiting`, `playing`, `revealing`, `ended`) | `roomService.ts` 状態遷移関数群, `room/page.tsx` UI表示切り替え |
| `participants` | Array<User> | 参加者配列（埋め込み） | `roomService.ts` `joinRoom()`, `room/page.tsx` 参加者リスト表示 |
| `currentGameRoundId` | String? | 現在のラウンドID（参照） | `roomService.ts` ラウンド管理, `room/page.tsx` ラウンド状態表示 |
| `currentJudgment` | JudgmentResult? | 現在の判定結果 (`match`, `no-match`) | `roomService.ts` `saveHostJudgment()`, `room/page.tsx` 判定結果表示 |
| `createdAt` | Timestamp | ルーム作成時刻 | `roomService.ts` `createRoom()`, `room/page.tsx` 作成時刻表示 |
| `expiresAt` | Timestamp | ルーム有効期限（30分） | `roomService.ts` `createRoom()`, `room/page.tsx` 有効期限チェック |

### 2. `users` コレクション
**目的**: 個別のユーザー・参加者情報を管理

| フィールド | 型 | 説明 | 使用箇所 |
|-----------|-----|-----|----------|
| `id` | String | Firestoreドキュメント自動生成ID | `roomService.ts` 全関数, `room/page.tsx` ユーザー識別 |
| `name` | String | ユーザー表示名（2-20文字、日英数） | `roomService.ts` `createRoom()`, `joinRoom()`, `room/page.tsx` 名前表示 |
| `isHost` | Boolean | ホストかどうか | `roomService.ts` `createRoom()`, `room/page.tsx` ホスト権限UI |
| `roomId` | String | 所属ルームID（外部キー） | `roomService.ts` 全関数, `room/page.tsx` ルーム関連付け |
| `joinedAt` | Timestamp | ルーム参加時刻 | `roomService.ts` `joinRoom()`, `room/page.tsx` 参加順表示 |
| `isReady` | Boolean | 準備状態（現在未使用） | `roomService.ts` （将来の拡張用） |
| `hasAnswered` | Boolean | 現在のお題に回答済みか | `roomService.ts` `submitAnswer()`, `room/page.tsx` 回答状態表示 |

### 3. `topics` コレクション
**目的**: ゲームのお題・質問を各ルーム・ラウンドごとに管理

| フィールド | 型 | 説明 | 使用箇所 |
|-----------|-----|-----|----------|
| `id` | String | Firestoreドキュメント自動生成ID | `roomService.ts` 全関数, `room/page.tsx` お題識別 |
| `content` | String | お題内容（最大30文字） | `roomService.ts` `startGame()`, `room/page.tsx` お題表示 |
| `roomId` | String | 所属ルームID（外部キー） | `roomService.ts` `getTopicByRoomId()`, `room/page.tsx` ルーム関連付け |
| `round` | Number | ゲーム内ラウンド番号 | `roomService.ts` `startNextRound()`, `room/page.tsx` ラウンド表示 |
| `createdAt` | Timestamp | お題作成時刻 | `roomService.ts` `startGame()`, `room/page.tsx` 作成時刻表示 |

### 4. `answers` コレクション
**目的**: ユーザーの回答を管理（現在のゲーム進行に使用）

| フィールド | 型 | 説明 | 使用箇所 |
|-----------|-----|-----|----------|
| `id` | String | Firestoreドキュメント自動生成ID | `roomService.ts` `submitAnswer()`, `getAnswersByTopicId()`, `room/page.tsx` `loadAnswersForRevealing()` |
| `userId` | String | 回答者ID（外部キー） | `roomService.ts` `submitAnswer()`, `room/page.tsx` 回答者表示 |
| `topicId` | String | お題ID（外部キー） | `roomService.ts` `getAnswersByTopicId()`, `room/page.tsx` お題関連付け |
| `content` | String | 回答内容 | `roomService.ts` `submitAnswer()`, `room/page.tsx` 回答表示 |
| `submittedAt` | Timestamp | 回答送信時刻 | `roomService.ts` `submitAnswer()`, `room/page.tsx` 送信時刻表示 |

### 5. `gameRounds` コレクション
**目的**: ゲームセッション内の個別ラウンド情報を管理

| フィールド | 型 | 説明 | 使用箇所 |
|-----------|-----|-----|----------|
| `id` | String | Firestoreドキュメント自動生成ID | `gameRoundService.ts` 全関数, `room/page.tsx` ラウンド識別 |
| `topicId` | String | お題ID（外部キー） | `gameRoundService.ts` `createGameRound()`, `room/page.tsx` お題関連付け |
| `roundNumber` | Number | ゲーム内ラウンド番号 | `gameRoundService.ts` `createGameRound()`, `room/page.tsx` ラウンド表示 |
| `status` | GameRoundStatus | ラウンド状態 (`active`, `completed`) | `gameRoundService.ts` 状態管理, `room/page.tsx` 状態表示 |
| `judgment` | JudgmentResult? | 最終判定結果 (`match`, `no-match`) | `gameRoundService.ts` `updateGameRoundJudgment()`, `room/page.tsx` 判定結果表示 |
| `createdAt` | Timestamp | レコード作成時刻 | `gameRoundService.ts` `createGameRound()`, `room/page.tsx` 作成時刻表示 |

### 6. `gameAnswers` コレクション
**目的**: 特定のゲームラウンドにリンクしたユーザー回答を履歴として管理

| フィールド | 型 | 説明 | 使用箇所 |
|-----------|-----|-----|----------|
| `id` | String | Firestoreドキュメント自動生成ID | `gameHistoryService.ts` 全関数, `room/page.tsx` 回答識別 |
| `gameRoundId` | String | ゲームラウンドID（外部キー） | `gameHistoryService.ts` `getGameRoundAnswers()`, `room/page.tsx` ラウンド関連付け |
| `userName` | String | ユーザー表示名（非正規化） | `gameHistoryService.ts` `createGameAnswer()`, `room/page.tsx` 回答者名表示 |
| `content` | String | 回答内容 | `gameHistoryService.ts` `createGameAnswer()`, `room/page.tsx` 回答内容表示 |
| `submittedAt` | Timestamp | 回答送信時刻 | `gameHistoryService.ts` `createGameAnswer()`, `room/page.tsx` 送信時刻表示 |
| `createdAt` | Timestamp | レコード作成時刻 | `gameHistoryService.ts` `createGameAnswer()`, `room/page.tsx` 作成時刻表示 |


## 静的データ

### お題データ（`/src/data/topics.json`）
- **構造**: TopicDataオブジェクトの配列（`id`, `content`フィールド）
- **使用箇所**: `topicService.ts` - ゲームラウンド用のランダムお題提供

## テーブル間の関係

```
rooms (1) ←→ (n) users (participants配列として埋め込み)
rooms (1) ←→ (n) topics (roomId外部キー)
rooms (1) ←→ (1) gameRounds (currentGameRoundId参照)

gameRounds (1) ←→ (1) topics (topicId参照)
gameRounds (1) ←→ (n) gameAnswers (gameRoundId外部キー)

users (1) ←→ (n) answers (userId外部キー、現在のゲーム進行)
```

## CRUD操作サマリー

### 作成（Create）
- **rooms**: `createRoom()` - 新しいゲームルーム
- **users**: `createRoom()`, `joinRoom()` - ホスト・参加者ユーザー
- **topics**: `startGame()`, `startNextRound()` - ラウンド用お題
- **answers**: `submitAnswer()` - ユーザー回答（現在のゲーム進行）
- **gameRounds**: `createGameRound()` - ラウンドレコード
- **gameAnswers**: `createGameAnswer()` - 履歴用回答

### 読み取り（Read）
- **rooms**: `getRoomByCode()`, `subscribeToRoom()` - リアルタイムルーム監視
- **topics**: `getTopicByRoomId()`, `getCurrentGameRoundWithTopic()` - お題取得
- **answers**: `getAnswersByTopicId()` - 現在のゲーム回答取得
- **gameRounds**: `getGameRoundWithTopic()` - ラウンド情報
- **gameAnswers**: `getGameRoundAnswers()` - 履歴回答

### 更新（Update）
- **rooms**: `startGame()`, `submitAnswer()`, `saveHostJudgment()`, `forceRevealAnswers()`, `startNextRound()`, `endGame()` - ゲーム状態管理
- **gameRounds**: `completeGameRound()`, `updateGameRoundJudgment()` - ラウンド完了

### 削除（Delete）
- 明示的な削除操作なし（Firebase TTLによる自動クリーンアップ）

## ストレージ戦略

このアプリケーションは**シンプルなアプローチ**を採用：

1. **リアルタイムゲーム状態**: `rooms`コレクションに参加者配列を埋め込み、高速リアルタイム更新
2. **ラウンド別データ**: 正規化された別コレクション（`gameRounds`, `gameAnswers`）で効率的なクエリとレポート
3. **回答の二重保存**: 現在のゲーム進行用`answers`コレクションと履歴用`gameAnswers`コレクションで役割分担
4. **非正規化フィールド**: ユーザー名を履歴テーブルに直接保存し、ユーザー削除後もデータ整合性を維持

この設計により、アクティブなゲームでは優れたリアルタイム性能を提供しながら、必要最小限のラウンド別データを維持できます。

## 実装上の重要な考慮事項

### セキュリティ
- Firestoreセキュリティルールによりアクセス制御を実装
- 参加者の権限チェック（ルーム参加権限、ホスト権限など）

### パフォーマンス
- リアルタイム更新には`onSnapshot`を使用
- 大量データのページネーション対応
- インデックス最適化によるクエリ高速化

### 可用性
- 30分の自動ルーム削除による不要データクリーンアップ
- エラーハンドリングと再試行機能
- オフライン対応（Firebase自動同期）

### 拡張性
- 新機能追加に対応可能な正規化設計
- 統計データの効率的な集計
- 多言語対応を考慮したデータ構造