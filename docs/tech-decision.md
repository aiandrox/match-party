# 技術選定の決定記録

## 概要

リアルタイムお題回答一致ゲームの技術スタック選定において、Claude Codeでの実装・デバッグ・運用を最適化するための技術選択を記録する。

## 選択した技術スタック

**Firebase + Next.js + Vercel**

### 構成詳細
- **Firebase**: バックエンド・リアルタイム・認証・データベース
- **Next.js**: フロントエンド・SSR・TypeScript
- **Vercel**: フロントエンドホスティング・デプロイ

## 選択理由

### Claude Codeでの開発効率
1. **インフラのコード管理**: Firebase CLI + 設定ファイル（firebase.json, firestore.rules）で全設定を管理
2. **デプロイ自動化**: `firebase deploy`一発でインフラ＋アプリを更新
3. **バージョン管理**: 全設定がGitで追跡可能
4. **環境管理**: dev/staging/prod環境の切り替えが簡単

### 実装・デバッグ・運用の観点
- **実装**: NoSQL設計でも複雑性は低い、リアルタイム機能が標準搭載
- **デバッグ**: Firebaseコンソールでの状態確認が容易
- **運用**: サーバーレスでインフラ管理不要

## データ構造設計（NoSQL変更）

リレーショナル設計からFirestoreのコレクション構造に変換：

### コレクション構造
```
rooms/{roomId}
├── code: string
├── status: string ('waiting' | 'playing' | 'revealing' | 'ended')
├── hostId: string
├── participants: array of {id, name, isAnswered}
├── currentTopic: object {id, content, order}
├── createdAt: timestamp
└── updatedAt: timestamp

topics/{topicId}
├── content: string
├── createdAt: timestamp
└── order: number

answers/{answerId}
├── userId: string
├── roomId: string  
├── topicId: string
├── content: string
├── createdAt: timestamp
└── isRevealed: boolean

users/{userId}
├── name: string
├── roomId: string
├── isHost: boolean
└── createdAt: timestamp
```

### リアルタイム同期
- `rooms/{roomId}` - 参加者状態、ゲーム進行
- `answers` - 回答提出状況
- Firestore Realtime Listenersで自動更新

## 開発環境構成

### 必要なツール・コマンド
```bash
# Firebase CLI インストール
npm install -g firebase-tools

# プロジェクト初期化
firebase init

# ローカル開発サーバー
firebase emulators:start

# デプロイ
firebase deploy

# Next.js開発サーバー
npm run dev

# ビルド・テスト
npm run build
npm run test
```

### 設定ファイル管理
- `firebase.json`: Firebase設定
- `firestore.rules`: セキュリティルール
- `functions/`: Cloud Functions（必要に応じて）
- `next.config.js`: Next.js設定

## 代替案との比較

| 技術構成 | メリット | デメリット | Claude Code適性 |
|---------|----------|-----------|----------------|
| Firebase + Next.js | インフラコード管理、自動化 | NoSQL学習コスト | ★★★ |
| Supabase + Next.js | SQL、型安全 | インフラ管理が複雑 | ★★ |
| Node.js + Socket.IO | 完全制御 | 運用コスト高 | ★ |

## 次のステップ

1. Firebase プロジェクト作成
2. Next.js プロジェクト初期化
3. Firestore データベース設計実装
4. 認証システム構築
5. リアルタイム同期実装
6. UI/UX 実装
7. テスト・デプロイ