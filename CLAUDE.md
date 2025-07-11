# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

リアルタイムお題回答一致ゲームのWebアプリケーション。プレイヤーは同じお題に回答し、回答の一致を目指すゲームです。WebSocketを使用してリアルタイム同期を実現し、主催者・参加者モデルで動作します。

## アーキテクチャ

`docs/spec.md`の仕様に基づき、以下の構成で実装：

### 主要コンポーネント
- **ルーム管理**: 主催者がルームを作成し、固有URLで参加者を招待
- **リアルタイム同期**: WebSocketベースの通信でライブ更新
- **ゲームフロー**: お題表示 → 回答送信 → 回答公開 → 一致判定 → 次ラウンド

### データモデル
以下の主要エンティティを管理：
- **Room**: ステータス（待機/プレイ中/公開中/終了）、参加者、現在のお題
- **User**: 名前、主催者フラグ、ルーム関連付け
- **Topic**: お題内容とルームへの割り当て
- **Answer**: 特定のお題に対するユーザーの回答

### ゲームステータス
- `waiting`: ルーム作成済み、参加者待ち
- `playing`: お題表示中、回答収集中
- `revealing`: 全回答表示中、判定待ち
- `ended`: ゲーム終了

## 技術選択（確定）

**Firebase採用**により決定済み：
- **理由**: 設定ファイルベースで管理しやすい、サーバーレス、無料枠が充実
- **実装**: Firestore + Firebase Hosting + GitHub Actions
- **リアルタイム**: Firestore Realtime Listeners（WebSocketは使用せず）

## 実装予定の主要機能（Phase 2以降）

### ルーム管理
- 固有ルームコード生成
- 主催者コントロール（ゲーム開始、回答公開、一致判定）
- 参加者名前入力とリアルタイム参加者リスト更新
- 30分自動ルーム削除

### ゲームメカニクス
- 全参加者への同時お題表示
- 回答送信とステータス追跡（回答済み/未回答）
- 回答公開トリガー（全員回答完了 OR 主催者強制公開）
- 一致/不一致判定と音声・視覚フィードバック
- ラウンド進行またはゲーム終了

### ユーザーエクスペリエンス
- モバイル対応レスポンシブデザイン
- 音声フィードバック（成功/失敗音）
- 視覚フィードバック（背景色変更）
- リアルタイム参加者ステータス表示

## 開発フロー

### Git運用
- **ブランチ戦略**: feature/* → develop → main
- **開発開始**: 必ず適切なブランチから新しいfeatureブランチを作成
- **コミット**: 機能単位で小さくコミット、明確なメッセージ
- **マージ**: PRレビュー後にdevelopへマージ

### 開発コマンド
```bash
# 新機能開発開始
git checkout develop
git checkout -b feature/機能名

# 開発環境起動
npm run dev
firebase emulators:start

# テスト実行
npm run test
npm run test:e2e

# デプロイ
firebase deploy
```

### 重要なルール
- **意思決定ログ**: 全ての技術選択、設計判断は`docs/`配下に記録
- **環境変数**: `.env.local`で管理（Git除外済み）
- **セキュリティ**: FirestoreルールとAPI キー管理を徹底
- **テスト**: 各機能実装後は必ずテスト実行
- **コードレビュー**: 技術的な違和感や改善点は積極的に指摘する（ユーザーの学習支援）

## 開発メモ

- プロジェクト基盤構築完了（Next.js + Firebase + CI/CD）
- Firebase無料枠での運用（使用量監視機能実装予定）
- 認証: 名前入力のみ（ルーム内重複不可、2-20文字、日英数字）
- ルーム: 20文字英数字コード、20人上限、30分有効期限
- お題: 事前定義JSON管理、30文字以下
- MVP重視: 音声効果・監視ツール・セキュリティ対策は後フェーズ
- 詳細要件: `docs/requirements.md`参照
- 本番環境: https://match-party-findy.web.app

## セッション継続性のための重要ファイル

新しいセッション開始時は以下を必ず確認：
1. **CLAUDE.md**（このファイル）- プロジェクト全体概要
2. **docs/requirements.md** - 詳細要件定義
3. **docs/tech-decision.md** - 技術選定の経緯と理由
4. **docs/development-workflow.md** - 開発プロセス
5. **docs/diary.md** - 開発日記（前回の思考・感情）
6. **docs/user-todos.md** - ユーザーのTODOリスト

## 現在の状況（2025-07-11終了時点）

- **フェーズ**: プロジェクト基盤構築完了（Phase 1完了）
- **実装済み**: Next.js + Firebase + GitHub Actions環境構築完了
- **次のステップ**: Phase 2 - ルーム管理機能実装開始
- **進行中**: feature/project-setup → main へのプルリクエスト作成済み

## 技術スタック（確定）

- **フロントエンド**: Next.js 15.3.5 + TypeScript + Tailwind CSS
- **バックエンド**: Firebase (Firestore + Realtime Database)
- **ホスティング**: Firebase Hosting
- **CI/CD**: GitHub Actions
- **開発環境**: ESLint + npm

## 重要な注意事項

### Firebase無料枠制限
- **Firestore**: 読み取り50,000回/日、書き込み20,000回/日
- **Hosting**: ストレージ10GB、転送量360MB/月
- **プレビューデプロイ**: 転送量消費に注意、必要時のみ有効化推奨

### GitHub MCP権限設定
- **必要権限**: `repo`（フルアクセス）または `pull_requests:write`
- **現在の問題**: プルリクエスト作成時に「Resource not found」エラー
- **解決方法**: Personal Access Tokenの権限追加が必要

### 開発ブランチ戦略
- **現在**: `feature/project-setup`（基盤構築完了）
- **次回**: `feature/room-management`（ルーム管理機能）
- **運用**: feature/* → main（developブランチは不使用）