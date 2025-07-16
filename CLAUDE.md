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

# 開発環境起動（本番データベース使用）
npm run dev

# 開発環境起動（ローカルエミュレータ使用）
npm run dev:with-emulator

# エミュレータのみ起動
npm run dev:emulator

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

## 🚫 厳格な開発制約（違反厳禁）
- **動的ルーティング禁止**: `[id]`形式は使用不可 → クエリパラメータ`?id=123`を使用
- **as any 禁止**: 型安全性維持のため → 適切な型定義更新を行う
- **正規化DB設計**: 外部キー参照による状態管理を徹底
- **後方互換性**: 既存機能を破壊しない漸進的な改善

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

## 現在の状況（2025-07-16更新）

### 完成状況 - MVP Phase 1-4 完全完了 🎉
- **プロジェクト状態**: プロダクションレディ（長期運用対応）
- **技術スタック確定**: Next.js 15 + TypeScript + Tailwind CSS + Firebase Hosting + Firestore + Cloud Functions + localStorage
- **デプロイ状況**: Firebase Hosting本番稼働（https://match-party-findy.web.app/）

### 実装完了機能

**Phase 1（プロジェクト基盤）**
- ✅ Next.js 15環境構築とFirebase統合
- ✅ TypeScript + Tailwind CSS設定
- ✅ コンポーネント設計とルーティング
- ✅ Firebase Hosting自動デプロイ

**Phase 2（ルーム管理）**
- ✅ ルーム作成（20文字コード生成、重複チェック）
- ✅ ルーム参加（名前バリデーション、人数制限、再参加機能）
- ✅ リアルタイム参加者更新
- ✅ ホスト権限管理とセキュリティ強化
- ✅ localStorage活用のユーザー識別システム
- ✅ 30分有効期限管理

**Phase 3（ゲーム機能）**
- ✅ ゲーム開始とお題表示（30個のお題データ）
- ✅ 回答送信とリアルタイム同期
- ✅ 全員回答完了の自動検知
- ✅ 回答公開機能
- ✅ 主催者による手動一致判定
- ✅ 判定結果の全参加者配信
- ✅ ゲーム状態管理（waiting → playing → revealing）
- ✅ UI/UX改善（回答表示、色分け、レイアウト）

**Phase 4（データ管理・運用）**
- ✅ 自動クリーンアップ機能（Cloud Functions）
- ✅ 期限切れルーム削除（毎日午前0時実行）
- ✅ 長期運用基盤整備

### URL構造
- ホーム: `/`
- ルーム作成: `/create-room`
- ルーム参加: `/join-room`  
- ルーム表示: `/room?code=ABC123`

### 技術的な決定事項
- **静的サイト方式採用**: Firebase Hostingの無料枠活用
- **クエリパラメータ**: 動的ルートの代替として採用
- **localStorage管理**: ユーザーIDをルーム固有キーで保存
- **セキュリティ**: 参加権限チェック、Firestore参加者リスト照合
- **リアルタイム**: Firestore onSnapshotで実現
- **自動クリーンアップ**: Cloud Functions v2で期限切れルーム削除
- **開発環境分離**: Firebase Emulatorで本番データを保護

### 開発環境の設定

#### Firebase Emulator使用（推奨）
本番データベースを汚すことなく開発可能：

```bash
# 1. 環境変数設定
cp .env.local.example .env.local
# .env.local内でNEXT_PUBLIC_USE_EMULATOR=trueに設定

# 2. エミュレータ起動
npm run dev:with-emulator

# 3. エミュレータUI確認
# http://localhost:4000 でFirestoreデータを確認可能
```

#### 本番データベース使用
```bash
# 通常の開発（.env.localでNEXT_PUBLIC_USE_EMULATOR=false）
npm run dev
```

#### 環境変数設定
```
# .env.local
NEXT_PUBLIC_USE_EMULATOR=true  # ローカル開発時
NEXT_PUBLIC_USE_EMULATOR=false # 本番データベース使用時
```