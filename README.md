# Match Party

リアルタイムお題回答一致ゲーム - みんなで同じ答えを目指そう！

## ゲーム概要

プレイヤー全員が同じお題に回答し、回答の一致を目指すリアルタイムゲームです。

### 特徴
- **スマホ対応**: タブレット・スマートフォンで快適にプレイ
- **大人数対応**: パーティーゲームに最適
- **リアルタイム**: 参加者の状況をリアルタイムで同期
- **簡単参加**: ルームコードで簡単に参加可能
- **豊富なお題**: 多様なお題でゲームが飽きない
- **エンタープライズ品質**: MVP + Facade + Container-Component統一アーキテクチャ

## 本番サイト

**現在稼働中**: https://match-party-findy.web.app/

## 技術スタック

### フロントエンド
- **Next.js 15**: App Router + Static Export
- **TypeScript**: 厳密な型安全性
- **Tailwind CSS**: ユーティリティファーストCSS
- **MVP パターン**: 全ページ統一アーキテクチャ

### バックエンド・インフラ
- **Firebase Firestore**: リアルタイムデータベース
- **Firebase Cloud Functions v2**: 自動クリーンアップ・サーバーレス
- **Firebase Hosting**: 静的サイト・グローバルCDN
- **localStorage**: シンプルな名前ベース認証（Firebase Auth不使用）

### 開発・運用
- **GitHub Actions**: CI/CDパイプライン（テスト→Firestore→Functions→Hosting）
- **Jest + Testing Library**: 多数のテスト実装、カバレッジ測定統合
- **Terraform/OpenTofu**: IAM権限のインフラストラクチャ・アズ・コード管理
- **Firebase Emulator**: 本番データを汚さない開発環境
- **ESLint + TypeScript**: 型安全性・コード品質保証
- **自動監視**: Cloud Functions による期限切れルーム削除

## 使い方

### ホストの場合
1. 「ルームを作成」をクリック
2. あなたの名前を入力
3. 生成されたルームコードを参加者に共有

### 参加者の場合
1. 「ルームに参加」をクリック
2. ルームコードと名前を入力
3. ゲーム開始を待機

## 開発環境

### 必要な環境
- Node.js 20+
- npm または yarn
- Firebase CLI
- OpenTofu（インフラ管理時）

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

### テスト・ビルド・デプロイ
```bash
# テスト実行
npm test                    # 通常のテスト実行
npm run test:coverage       # カバレッジ付きテスト実行

# 本番ビルド
npm run build

# Firebase デプロイ（手動時）
firebase deploy

# CI/CDによる自動デプロイ
# mainブランチへのpushで自動実行：
# 1. テスト実行 → 2. Firestore → 3. Functions → 4. Hosting
```

## ドキュメント

### 技術ドキュメント
- **[アーキテクチャパターンガイド](docs/architecture-pattern-guide.md)**: MVP + Facade + Container-Component統一設計パターン
- **[アーキテクチャリファクタリング記録](docs/architecture-refactoring.md)**: 全アプリケーション統一アーキテクチャ変革記録
- **[データベース設計](docs/database-design.md)**: Firebase Firestore設計・コレクション構造
- **[開発ワークフロー](docs/development-workflow.md)**: 開発環境・CI/CD・デプロイ手順

### 要件・仕様書
- **[要件仕様書](docs/spec.md)**: ゲーム仕様・機能フロー
- **[詳細要件定義](docs/requirements.md)**: 技術要件・実装優先度
- **[技術選定記録](docs/tech-decision.md)**: Firebase選定理由・代替案比較

### 開発ガイド
- **[CLAUDE.md](CLAUDE.md)**: プロジェクト全体概要・開発制約・セッション継続ガイド
- **[テストガイド](docs/testing-guide.md)**: テスト戦略・カバレッジ確認・CI/CD

## 貢献

プルリクエストやイシューは歓迎します！

## サポート

質問やバグ報告は [Issues](https://github.com/aiandrox/match-party/issues) でお願いします。

## 音源ライセンス

音響効果（将来追加予定）: [On-Jin ～音人～](https://otologic.jp/)
- フリー音素材として無償使用許可済み
- 著作権: otologic.jp
