# 期限切れデータ自動削除機能 セットアップガイド

## 概要

Firebase Cloud Functionsを使用して、期限切れのルーム（30分経過）とそれに関連するデータを毎日午前0時に自動削除する機能です。

## 前提条件

### 1. Firebase Blaze Plan への移行

Cloud Functionsを使用するには、Firebase プロジェクトを **Blaze Plan（従量課金プラン）** に移行する必要があります。

**使用量見積もり:**
- 実行回数: 30回/月（1日1回）
- 無料枠の0.0015%の使用量で実質無料

### 2. Firebase CLI の準備

```bash
# Firebase CLI をインストール
npm install -g firebase-tools

# ログイン
firebase login

# プロジェクトを選択
firebase use your-project-id
```

## セットアップ手順

### 1. 依存関係のインストール

```bash
# functions ディレクトリに移動
cd functions

# 依存関係をインストール
npm install
```

### 2. TypeScript のビルド

```bash
# TypeScript をビルド
npm run build
```

### 3. エミュレーターでのテスト（オプション）

```bash
# プロジェクトルートで
firebase emulators:start

# Functions のみ実行
firebase emulators:start --only functions
```

### 4. デプロイ

```bash
# Functions のみデプロイ
firebase deploy --only functions
```

## 実装されている機能

### 自動クリーンアップ (`cleanupExpiredRooms`)

- **実行頻度**: 1日1回（cron: `0 0 * * *`）
- **実行時間**: 毎日午前0時
- **処理内容**: 
  - 期限切れルーム（30分経過）を検索
  - 関連データ（users, gameRounds, gameAnswers）を削除
  - ルーム自体を削除
- **制限**: 一度に最大50件のルームを処理
- **ログ**: 実行結果、削除件数、実行時間を記録

## 使用方法

### 自動実行

デプロイ後、自動的に毎日午前0時に実行されます。実行状況は Firebase Console の Functions ログで確認できます。

```bash
# ログを確認
firebase functions:log
```

### 運用状況の確認

デプロイ後は毎日午前0時に自動実行されます。実行状況は Firebase Console で確認できます。

```bash
# ログを確認
firebase functions:log --only cleanupExpiredRooms

# リアルタイムログ監視
firebase functions:log --follow
```

## 削除対象データ

期限切れルーム（`expiresAt < 現在時刻`）に関連する以下のデータを削除：

1. **rooms** コレクション: 期限切れルーム
2. **users** コレクション: そのルームの参加者
3. **gameRounds** コレクション: そのルームのゲームラウンド
4. **gameAnswers** コレクション: そのルームのゲーム回答

## 安全性とパフォーマンス

### 削除の安全性

- 期限切れの判定は `expiresAt` フィールドで厳密に行われます
- 一度に処理するルーム数は50件に制限されています
- 削除操作は Promise.all で並列実行され、効率的です

### パフォーマンス

- 削除は段階的に行われるため、大量のデータでも安全です
- 実行時間と削除件数がログに記録されます
- エラーが発生した場合は詳細なログが出力されます

## 監視とメンテナンス

### ログの確認

```bash
# 最新のログを確認
firebase functions:log

# 特定の関数のログを確認
firebase functions:log --only cleanupExpiredRooms
```

### 使用量の監視

Firebase Console の「使用量と請求」で実際の使用量を確認できます。

### トラブルシューティング

#### 1. デプロイエラー

```bash
# Firebase CLI を更新
npm update -g firebase-tools

# 再度ログイン
firebase login --reauth
```

#### 2. 関数が実行されない

- Firebase Console で関数が正常にデプロイされているか確認
- ログでエラーメッセージを確認
- 必要に応じて再デプロイ

## コスト見積もり

月間使用量は無料枠の1%未満で実質無料：

```
月間使用量見積もり:
- 実行回数: 30回 / 2,000,000回 = 0.0015%
- 計算時間: 約0.075GB-sec / 400,000GB-sec = 0.000019%
- CPU時間: 約300秒 / 200,000秒 = 0.15%
```

## まとめ

この自動削除機能により：

1. **ストレージ使用量の最適化**: 不要なデータの自動削除
2. **パフォーマンス向上**: データベースサイズの最適化
3. **メンテナンスフリー**: 人手による作業が不要
4. **コスト効率**: 無料枠内での運用

Firebase の Blaze Plan への移行が必要ですが、実質無料で運用でき、アプリケーションの長期運用に必要な機能です。