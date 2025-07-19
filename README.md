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
- **サーバーレス**: Firebase Cloud Functions v2（自動クリーンアップ）
- **ホスティング**: Firebase Hosting（静的サイト・CDN）
- **CI/CD**: GitHub Actions（自動ビルド・デプロイ）
- **監視**: Firebase コンソール、自動ログ収集

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
│   └── topics.json         # お題データ（72個）
├── lib/                    # ユーティリティ・サービス
│   ├── roomService.ts      # ルーム管理
│   ├── gameRoundService.ts # ゲームラウンド管理
│   ├── gameHistoryService.ts # ゲーム履歴管理
│   ├── topicService.ts     # お題管理
│   └── utils.ts            # 共通関数
├── types/                  # TypeScript型定義
└── functions/              # Firebase Cloud Functions
    ├── src/index.ts        # 自動クリーンアップ機能
    └── package.json        # Functions依存関係
```

## 🏗️ 開発ステータス

### 🎉 プロダクション完了 - 企業品質レベル ✅

**Phase 1-5 全完了**
- [x] **プロジェクト基盤**: Next.js 15 + Firebase環境構築
- [x] **ルーム管理**: ルーム作成・参加・権限管理
- [x] **ゲーム機能**: お題表示・回答収集・判定システム
- [x] **リアルタイム同期**: Firebase Firestoreでの即座同期
- [x] **自動運用**: Cloud Functions v2・期限切れデータ削除
- [x] **UI/UX改善**: 統一されたナビゲーション・レスポンシブ
- [x] **コンテンツ拡充**: お題データ72個・多様なカテゴリー
- [x] **CI/CD最適化**: GitHub Actions・Functions含む自動化
- [x] **型安全性**: TypeScript完全対応・エラーゼロ
- [x] **回答永続化**: ページリロード対応・状態復元
- [x] **音響効果**: クイズ番組レベルの高品質音源・派手なアニメーション

### 🎉 最新アップデート（2025-07-19）

**音響効果システム完全実装**:
- 🎵 3段階音響効果（問題音・正解音・不正解音）
- ✨ 派手なアニメーション（拡大縮小・回転・光る影効果）
- 🎊 紙吹雪エフェクト（一致時のみ）
- 🔊 高品質MP3音源（otologic.jp提供）
- 🔧 Firestore権限問題の解決

### 🔄 将来的な拡張候補
- [x] ~~音声・視覚効果の追加~~ ✅ **実装完了**
- [ ] ユーザー投稿お題機能
- [ ] 詳細な統計・分析機能
- [ ] 多言語対応

## 🤝 貢献

プルリクエストやイシューは歓迎します！

## 📞 サポート

質問やバグ報告は [Issues](https://github.com/aiandrox/match-party/issues) でお願いします。

## 🎵 音源ライセンス

このプロジェクトで使用している音響効果は以下のサイトから取得しています：

- **効果音**: [On-Jin ～音人～](https://otologic.jp/)
  - ピンポーン音（正解音）
  - ブザー音（不正解音） 
  - 問題音
  - フリー音素材として無償使用許可済み
  - 著作権: otologic.jp
