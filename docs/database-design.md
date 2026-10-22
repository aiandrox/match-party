# Match Party データベース設計書

## 概要

Match PartyアプリケーションはFirebase Firestoreを使用し、リアルタイムゲームと履歴管理を両立するハイブリッドアプローチを採用しています。

**最終更新**: 2026-10-20  
**現在の状況**: ゲームモード（一致 / 不一致）対応を含む、実装と同期した構成

本書は `firestore.rules` と `src/lib/*Service.ts` の実装を正とし、同期して更新します。

## データベースコレクション一覧

### 1. `rooms` コレクション
**目的**: ゲームルーム情報と現在のゲーム状態を管理

| フィールド | 型 | 説明 | 使用箇所 |
|-----------|-----|-----|----------|
| `id` | String | Firestoreドキュメント自動生成ID | `roomService.ts` 全関数 |
| `code` | String | 20文字の英数字ルームコード（不変） | `createRoom()`, `getRoomByCode()`, `joinRoom()` |
| `status` | RoomStatus | ルーム状態 (`waiting`, `playing`, `revealing`, `ended`) | 状態遷移関数群, `room/page.tsx` 表示切り替え |
| `mode` | GameMode? | ゲームモード (`match`, `mismatch`)。**未設定は `match` として扱う**（既存ルームとの後方互換） | `createRoom()`, `changeRoomMode()`, 各 Presenter（`getGameModeDefinition`） |
| `participants` | Array<User> | 参加者配列（埋め込み・最大20人・減少しない） | `joinRoom()`, `submitAnswer()`, 各画面の参加者表示 |
| `currentGameRoundId` | String? | 現在のラウンドID（`gameRounds` 参照） | `startGame()`, `startNextRound()`, 各 Presenter の購読 |
| `createdAt` | Timestamp | ルーム作成時刻（不変） | `createRoom()` |
| `expiresAt` | Timestamp | ルーム有効期限（作成から30分・不変） | `createRoom()`, `Room.facade.ts` 期限チェック, Cloud Functions クリーンアップ |

**制約（`firestore.rules`）**
- 作成時: `status == 'waiting'`、`participants` は空、`currentGameRoundId` なし、`mode` は任意（指定時は `match` / `mismatch`）
- 更新時: `code` / `createdAt` / `expiresAt` 不変、状態遷移は `waiting → playing → revealing → (playing | ended)` のみ
- `mode` は `status == 'waiting'` のときのみ変更可。それ以外は実効値（未設定は `match`）が不変。キーの有無ではなく実効値で比較するため、フィールド削除による回避はできない

### 2. `users` コレクション
**目的**: 個別のユーザー・参加者情報を管理

| フィールド | 型 | 説明 | 使用箇所 |
|-----------|-----|-----|----------|
| `id` | String | Firestoreドキュメント自動生成ID | `roomService.ts`, localStorage のユーザー識別 |
| `name` | String | ユーザー表示名（2-20文字、日英数） | `createRoom()`, `joinRoom()` |
| `isHost` | Boolean | ホストかどうか | ホスト権限UI, Cloud Functions のホスト確認 |
| `roomId` | String | 所属ルームID（外部キー） | `roomService.ts`, Cloud Functions のホスト確認 |
| `joinedAt` | Timestamp | ルーム参加時刻 | `joinRoom()` |
| `hasAnswered` | Boolean | 現在のお題に回答済みか（`false → true` の一方向。リセットは `rooms.participants` 側で行う） | `submitAnswer()` |
| `firebaseUserId` | String | 匿名認証のUID（Cloud Functions 呼び出し時の本人確認用） | `authService.ts`, `functions/src/facilitation.ts` |

### 3. `gameRounds` コレクション
**目的**: ゲームセッション内の個別ラウンド情報（お題・判定）を管理

| フィールド | 型 | 説明 | 使用箇所 |
|-----------|-----|-----|----------|
| `id` | String | Firestoreドキュメント自動生成ID | `gameRoundService.ts` 全関数 |
| `roomId` | String | 所属ルームID（外部キー・不変） | `createGameRound()`, `getGameRoundsByRoomId()` |
| `topicContent` | String | お題内容（1-100文字。誰も回答していなければ変更可） | `createGameRound()`, `updateGameRoundTopic()` |
| `roundNumber` | Number | ゲーム内ラウンド番号（不変） | `createGameRound()` |
| `status` | GameRoundStatus | ラウンド状態 (`active`, `completed`) | `completeGameRound()` |
| `judgment` | JudgmentResult? | 主催者の判定結果。一致モード: `match` / `no-match`、不一致モード: `no-duplicate` / `has-duplicate` | `updateGameRoundJudgment()`, `src/lib/judgment.ts`（成功・失敗の導出） |
| `createdAt` | Timestamp | レコード作成時刻（不変） | `createGameRound()` |

**補足**: 判定値から成功・失敗・ラベル・配色を導出するロジックは `src/lib/judgment.ts` に集約しています。モードごとにどの判定値を成功とみなすかは `src/lib/gameMode.ts` で定義します。

#### 3-1. `gameRounds/{gameRoundId}/reactions` サブコレクション
**目的**: 回答発表中のスタンプリアクション（ラウンド終了時に一括削除）

| フィールド | 型 | 説明 | 使用箇所 |
|-----------|-----|-----|----------|
| `emoji` | String | リアクション絵文字 | `reactionService.ts` |
| `fromUserId` | String | 送信者ID | `reactionService.ts` |
| `fromUserName` | String | 送信者名（非正規化） | `reactionService.ts` |
| `createdAt` | Timestamp | 送信時刻 | `reactionService.ts` |

### 4. `gameAnswers` コレクション
**目的**: 特定のゲームラウンドにリンクしたユーザー回答を管理（作成のみ・更新不可）

**ドキュメントID**: `{gameRoundId}_{userId}`（1ラウンド1ユーザー1回答を保証。`submitAnswer()` が rooms の回答状態更新と同一トランザクションで作成し、既に存在する場合は作成しない。導入前の回答は自動生成ID）

| フィールド | 型 | 説明 | 使用箇所 |
|-----------|-----|-----|----------|
| `id` | String | `{gameRoundId}_{userId}` | `roomService.ts` `submitAnswer()` |
| `gameRoundId` | String | ゲームラウンドID（外部キー） | `getGameRoundAnswersWithParticipants()` |
| `userId` | String | 回答者ID（外部キー） | `getUserAnswerForGameRound()` |
| `userName` | String | ユーザー表示名（非正規化） | 回答発表・履歴の回答者名表示 |
| `content` | String | 回答内容（1-100文字） | 回答発表・履歴の回答表示 |
| `submittedAt` | Timestamp | 回答送信時刻 | 回答の並び順 |
| `createdAt` | Timestamp? | レコード作成時刻（`submittedAt` と5秒以内） | `roomService.ts` `submitAnswer()` |

### 5. `topicFeedbacks` コレクション
**目的**: お題に対する参加者の評価（👍 / 👎）を収集（作成のみ）

| フィールド | 型 | 説明 | 使用箇所 |
|-----------|-----|-----|----------|
| `topicContent` | String | 評価対象のお題（1-100文字） | `topicFeedbackService.ts` |
| `userId` | String | 評価者ID | `topicFeedbackService.ts`（重複送信チェック） |
| `userName` | String | 評価者名（非正規化） | `topicFeedbackService.ts` |
| `rating` | TopicFeedbackRating | 評価 (`good`, `bad`) | `topicFeedbackService.ts` |
| `createdAt` | Timestamp | 送信時刻 | `topicFeedbackService.ts` |

## 静的データ

### お題データ（`/src/data/topics.json`）
- **構造**: お題文字列の配列
- **使用箇所**: `topicService.ts` - ゲームラウンド用のランダムお題提供
- **モードとの関係**: 一致モード・不一致モードで共用（モード別のお題は持たない）

## テーブル間の関係

```
rooms (1) ←→ (n) users (participants配列として埋め込み + users.roomId)
rooms (1) ←→ (n) gameRounds (gameRounds.roomId外部キー)
rooms (1) ←→ (1) gameRounds (currentGameRoundId参照: 現在のラウンド)

gameRounds (1) ←→ (n) gameAnswers (gameAnswers.gameRoundId外部キー)
gameRounds (1) ←→ (n) reactions (サブコレクション)

topicFeedbacks はお題文字列で紐付く（ルーム・ラウンドへの外部キーは持たない）
```

## CRUD操作サマリー

### 作成（Create）
- **rooms**: `createRoom()` - 新しいゲームルーム（モード指定・デフォルトは `match`）
- **users**: `createRoom()`, `joinRoom()` - ホスト・参加者ユーザー
- **gameRounds**: `createGameRound()` - ラウンドレコード（`startGame()`, `startNextRound()` から）
- **gameAnswers**: `submitAnswer()` - 回答データ保存（rooms の回答状態更新とトランザクションで一括実行）
- **reactions**: `sendReaction()` - スタンプリアクション
- **topicFeedbacks**: `submitTopicFeedback()` - お題評価

### 読み取り（Read）
- **rooms**: `getRoomByCode()`, `subscribeToRoom()` - リアルタイムルーム監視
- **gameRounds**: `getCurrentRound()`, `subscribeToGameRound()`, `getGameRoundsByRoomId()` - 現在のラウンド・履歴
- **gameAnswers**: `getGameRoundAnswersWithParticipants()`, `getUserAnswerForGameRound()` - 回答取得
- **reactions**: `subscribeToReactions()` - リアルタイム監視
- **topicFeedbacks**: `checkExistingFeedback()` - 重複送信チェック

### 更新（Update）
- **rooms**: `changeRoomMode()`（待機中のみ）, `startGame()`, `submitAnswer()`, `forceRevealAnswers()`, `startNextRound()`, `endGame()` - ゲーム状態管理
- **gameRounds**: `updateGameRoundTopic()`, `updateGameRoundJudgment()`, `completeGameRound()` - お題変更・判定・ラウンド完了

### 削除（Delete）
- **reactions**: `deleteReactionsForRound()` - 次ラウンド開始時に一括削除
- その他のコレクションはクライアントからの削除不可（期限切れルームは Cloud Functions の日次クリーンアップで削除）

## ストレージ戦略

1. **リアルタイムゲーム状態**: `rooms` コレクションに参加者配列を埋め込み、高速リアルタイム更新
2. **ラウンド別データ**: 正規化された別コレクション（`gameRounds`, `gameAnswers`）で履歴・集計に対応
3. **非正規化フィールド**: ユーザー名を回答・リアクション・フィードバックに直接保存し、表示時の追加読み取りを避ける
4. **モードは `rooms` にのみ保持**: ラウンドや回答はモードを持たず、判定値（`judgment`）自体がどのモードの判定かを表す

## 実装上の重要な考慮事項

### セキュリティ
- Firestoreセキュリティルール（`firestore.rules`）でフィールドのホワイトリスト・値の列挙・状態遷移を強制
- Cloud Functions（会話のヒント生成）は匿名認証UIDでホストを確認し、ルームの `mode` をサーバー側で読んで不一致モードでは `failed-precondition` で拒否

### パフォーマンス
- リアルタイム更新には `onSnapshot` を使用
- `gameAnswers` / `gameRounds` は複合インデックス（`firestore.indexes.json`）で絞り込み

### 可用性
- 30分の自動ルーム削除による不要データクリーンアップ
- クライアント側での期限チェックとエラー表示

### 拡張性
- モードごとの文言・判定値・集計ラベルは `src/lib/gameMode.ts` に集約しており、新モード追加時は定義とルールの列挙値を増やすだけで済む
