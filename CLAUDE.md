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

## 技術選択肢

仕様書では3つの実装方針を提案：

1. **Firebase** (Realtime Database + Hosting + Auth) - サーバーレス、シンプル、プロトタイプ向け
2. **Supabase** (PostgreSQL + Realtime + Auth) + Vercel/Next.js - リレーショナルDBとリアルタイム機能
3. **Node.js + Express + Socket.IO + PostgreSQL** - WebSocket実装の完全制御

## 実装すべき主要機能

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

- 既存コードベースなし - 新規プロジェクト
- Firebase無料枠での運用（Rate limit対策必要）
- 認証: 名前入力のみ（ルーム内重複不可、2-20文字、日英数字）
- ルーム: 20文字英数字コード、20人上限、30分有効期限
- お題: 事前定義JSON管理、30文字以下
- MVP重視: 音声効果・監視ツール・セキュリティ対策は後フェーズ
- 詳細要件: `docs/requirements.md`参照

## セッション継続性のための重要ファイル

新しいセッション開始時は以下を必ず確認：
1. **CLAUDE.md**（このファイル）- プロジェクト全体概要
2. **docs/requirements.md** - 詳細要件定義
3. **docs/tech-decision.md** - 技術選定の経緯と理由
4. **docs/development-workflow.md** - 開発プロセス
5. **docs/diary.md** - 開発日記（前回の思考・感情）
6. **docs/user-todos.md** - ユーザーのTODOリスト

## 現在の状況（2025-07-12更新）

- **フェーズ**: Phase 2完了 - ルーム管理機能デプロイ済み
- **技術スタック確定**: Next.js 15 + TypeScript + Tailwind CSS + Firebase Hosting + Firestore
- **デプロイ状況**: Firebase Hosting正常稼働（静的サイト）
- **実装完了機能**:
  - ✅ ルーム作成（ホスト名入力、20文字コード生成）
  - ✅ ルーム参加（コード入力、名前重複チェック）  
  - ✅ ルーム表示（参加者一覧、リアルタイム更新準備）
  - ✅ GitHub Actions自動デプロイ

### 次のステップ（Phase 3）
- Firebase Billing有効化（Firestore利用のため）
- GitHub Secretsの環境変数設定確認  
- ゲーム機能実装（お題表示、回答収集、一致判定）

### URL構造
- ホーム: `/`
- ルーム作成: `/create-room`
- ルーム参加: `/join-room`  
- ルーム表示: `/room?code=ABC123`

### 技術的な決定事項
- **静的サイト方式採用**: Firebase Hostingの無料枠活用
- **クエリパラメータ**: 動的ルートの代替として採用
- **環境変数**: GitHub Secretsで本番管理
- **リアルタイム**: Firestore onSnapshotで実現予定