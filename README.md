# Match Party

リアルタイムお題回答一致ゲーム - みんなで同じ答えを目指そう！

## 🎮 ゲーム概要

プレイヤー全員が同じお題に回答し、回答の一致を目指すリアルタイムゲームです。

### 特徴
- 📱 **スマホ対応**: タブレット・スマートフォンで快適にプレイ
- 👥 **最大20人**: 大人数でのパーティーゲームに最適
- ⚡ **リアルタイム**: 参加者の状況をリアルタイムで同期
- 🔗 **簡単参加**: ルームコードで簡単に参加可能

## 🚀 デモサイト

https://match-party-findy.web.app/

## 🛠️ 技術スタック

- **フロントエンド**: Next.js 15, TypeScript, Tailwind CSS
- **バックエンド**: Firebase Firestore（リアルタイム同期）
- **ホスティング**: Firebase Hosting（静的サイト）
- **デプロイ**: GitHub Actions（自動デプロイ）

## 📱 使い方

### ホストの場合
1. 「ルームを作成」をクリック
2. あなたの名前を入力
3. 生成されたルームコードを参加者に共有

### 参加者の場合
1. 「ルームに参加」をクリック
2. ルームコードと名前を入力
3. ゲーム開始を待機

## 🔧 開発環境

### 必要な環境
- Node.js 18+
- npm または yarn
- Firebase CLI

### セットアップ
```bash
# リポジトリをクローン
git clone https://github.com/aiandrox/match-party.git
cd match-party

# 依存関係をインストール
npm install

# 環境変数を設定
cp .env.local.example .env.local
# .env.localを編集してFirebase設定を追加

# 開発サーバー起動
npm run dev
```

### ビルド・デプロイ
```bash
# 本番ビルド
npm run build

# Firebase デプロイ
firebase deploy
```

## 📁 プロジェクト構造

```
src/
├── app/                    # Next.js App Router
│   ├── create-room/        # ルーム作成ページ
│   ├── join-room/          # ルーム参加ページ
│   ├── room/               # ルーム表示ページ
│   │   ├── components/     # ルーム関連コンポーネント
│   │   │   ├── WaitingRoomView.tsx
│   │   │   ├── PlayingGameView.tsx
│   │   │   ├── RevealingAnswersView.tsx
│   │   │   ├── GameEndedView.tsx
│   │   │   └── *.ts        # Presenter Hooks
│   │   └── hooks/          # 共通フック
│   └── page.tsx            # ホームページ
├── data/                   # 静的データ
│   └── topics.json         # お題データ
├── lib/                    # ユーティリティ・サービス
│   ├── roomService.ts      # ルーム管理
│   ├── gameRoundService.ts # ゲームラウンド管理
│   ├── gameHistoryService.ts # ゲーム履歴管理
│   ├── topicService.ts     # お題管理
│   └── utils.ts            # 共通関数
└── types/                  # TypeScript型定義
```

## 🏗️ 開発ステータス

### MVP Phase 1-3 完了 ✅
- [x] **プロジェクト基盤**: Next.js 15 + Firebase環境構築
- [x] **ルーム管理**: ルーム作成・参加・権限管理
- [x] **ゲーム機能**: お題表示・回答収集・判定システム
- [x] **リアルタイム同期**: Firebase Firestoreでの即座同期
- [x] **UI/UX**: レスポンシブデザイン・統一されたUI
- [x] **ゲーム履歴**: ラウンド結果の保存・表示
- [x] **回答永続化**: ページリロード対応
- [x] **コンポーネント分離**: Presenter Hooks パターン

### Phase 4 検討中 🔄
- [ ] 音声・視覚効果の追加
- [ ] 詳細な統計情報
- [ ] Firebase使用量監視
- [ ] セキュリティ強化

## 🤝 貢献

プルリクエストやイシューは歓迎します！

## 📞 サポート

質問やバグ報告は [Issues](https://github.com/aiandrox/match-party/issues) でお願いします。
