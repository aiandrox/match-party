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
│   └── page.tsx            # ホームページ
├── lib/                    # ユーティリティ・サービス
│   ├── roomService.ts      # Firebase Firestore連携
│   └── utils.ts            # 共通関数
└── types/                  # TypeScript型定義
```

## 🏗️ 開発ステータス

### Phase 2 完了 ✅
- [x] ルーム作成機能
- [x] ルーム参加機能  
- [x] ルーム表示機能
- [x] Firebase Hosting デプロイ

### Phase 3 予定 🔄
- [ ] お題表示システム
- [ ] 回答収集機能
- [ ] リアルタイム同期
- [ ] 回答一致判定

## 🤝 貢献

プルリクエストやイシューは歓迎します！

## 📄 ライセンス

MIT License

## 📞 サポート

質問やバグ報告は [Issues](https://github.com/aiandrox/match-party/issues) でお願いします。