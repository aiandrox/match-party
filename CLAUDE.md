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
npm run test                    # 通常のテスト実行
npm run test:watch              # ウォッチモードでテスト実行
npm run test:coverage           # カバレッジ付きテスト実行
npm run test:ci                 # CI環境用テスト実行

# カバレッジ確認
npm run test:coverage
open coverage/lcov-report/index.html  # HTMLレポートを開く

# デプロイ
firebase deploy
```

### テスト戦略（t_wada思想準拠）

#### 基本方針
- **テスト必須**: 新機能実装時は必ずテスト作成
- **MVP活用**: アーキテクチャの責任分離によりテストが容易
- **CI/CD統合**: 全デプロイ前にテスト実行を必須とする

#### テスティングトロフィー採用
```
        /\      E2E (few, expensive, slow)
       /  \     
      /    \    Integration (some, moderate)
     /      \   
    /________\  Unit (many, cheap, fast)
```

- **Unit Tests (多数)**: Presenter層を中心とした単体テスト
- **Integration Tests (適数)**: Facade層での統合テスト  
- **E2E Tests (少数)**: 重要ユーザーフローのみ

#### t_wada テスト哲学
テスト駆動開発の第一人者である和田卓人氏の思想を採用：

**1. 動作・仕様重視、実装詳細回避**
```javascript
// ❌ 実装詳細をテスト
expect(component.state.isLoading).toBe(true);

// ✅ ユーザーが見る動作をテスト  
expect(screen.getByText('読み込み中...')).toBeInTheDocument();
```

**2. 意味のあるモック戦略**
- **外部依存のみモック**: API、データベース、外部サービス
- **内部ロジックは実際に実行**: 計算、状態管理、バリデーション
- **ブラウザAPIは最小限**: localStorage、navigator等

**3. 自然言語によるテスト名**
```javascript
// ✅ 仕様を自然言語で記述
it('ホストフラグがtrueのユーザーはホストとして認識される', () => {
  // テストの意図が明確
});

// ❌ 技術的すぎる名前
it('isHost returns true when user.isHost is true', () => {
  // 実装に依存しすぎ
});
```

#### MVPアーキテクチャとの相性
- **Presenter**: 純粋なロジックなので単体テストが容易
- **Component**: UIの動作をテスト、Presenterをモック
- **Facade**: 全体統合の動作をテスト

#### 実践指針
- **テスト可読性**: 日本語テスト名で仕様を明確に
- **テスト独立性**: 各テストは他のテストに依存しない
- **テスト高速性**: モックを活用して高速実行
- **テスト信頼性**: 外部要因による不安定さを排除
- **カバレッジ確認**: `npm run test:coverage`でカバレッジ測定
- **段階的改善**: Presenter → Utils → Component → Facade → E2E の順でカバレッジ向上

### 重要なルール
- **意思決定ログ**: 全ての技術選択、設計判断は`docs/`配下に記録
- **環境変数**: `.env.local`で管理（Git除外済み）
- **セキュリティ**: FirestoreルールとAPI キー管理を徹底
- **テスト**: 各機能実装後は必ずテスト実行と追加
- **コードレビュー**: 技術的な違和感や改善点は積極的に指摘する（ユーザーの学習支援）

## 🚫 厳格な開発制約（違反厳禁）
- **動的ルーティング禁止**: `[id]`形式は使用不可 → クエリパラメータ`?id=123`を使用
- **as any 禁止**: 型安全性維持のため → 適切な型定義更新を行う
- **正規化DB設計**: 外部キー参照による状態管理を徹底
- **後方互換性**: 既存機能を破壊しない漸進的な改善
- **アーキテクチャ準拠**: MVPパターンに従った責務分離を維持
- **コンポーネント分離**: UI（View）とビジネスロジック（Presenter）の混在禁止
- **ドキュメント管理**: 全ドキュメント更新・不要ファイル削除を徹底

## 📝 ドキュメント管理ルール

### 必須対応事項
- **全ドキュメント更新**: 機能変更・アーキテクチャ変更時は関連する全ドキュメントを更新
- **不要ファイル削除**: 古くなった・不要になったドキュメントは削除
- **最新状況反映**: プロジェクト状態・Phase進行・完了機能を正確に記録
- **リンク整備**: README.mdからdocs内ファイルへの適切なリンク設定

### ドキュメント分類
- **README.md**: プロジェクト概要・使い方・技術スタック・ドキュメントリンク
- **CLAUDE.md**: 開発ガイド・制約・セッション継続情報
- **docs/**: 技術詳細・要件・設計・開発記録
- **不要削除対象**: セットアップログ・一時的な分析ファイル・古い仕様書

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
5. **docs/testing-guide.md** - テスト戦略・カバレッジ確認方法
6. **docs/diary.md** - 開発日記（前回の思考・感情）
7. **docs/user-todos.md** - ユーザーのTODOリスト

## 現在の状況（2025-07-19更新）

### 完成状況 - MVP Phase 1-6 + テスト基盤構築完了 🎉
- **プロジェクト状態**: エンタープライズ品質レベル（テスト基盤・CI/CD統合完了）
- **技術スタック確定**: Next.js 15 + TypeScript + Tailwind CSS + Firebase Hosting + Firestore + Cloud Functions v2 + localStorage
- **デプロイ状況**: Firebase Hosting本番稼働（https://match-party-findy.web.app/）
- **CI/CD**: GitHub Actions完全自動化、テスト実行必須化、Functions含む
- **アーキテクチャ**: MVP（Model-View-Presenter）+ Facade + Container-Component パターン全統一
- **品質**: 型安全性・ESLint警告解決・テスト基盤・CI/CD品質ゲート完全対応
- **テスト**: Jest + Testing Library、44テスト実装、カバレッジ測定・CI統合完了

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
- ✅ 自動クリーンアップ機能（Cloud Functions v2）
- ✅ 期限切れルーム削除（毎日午前0時実行）
- ✅ 長期運用基盤整備

**Phase 5（品質・最適化）**
- ✅ Firebase Functions v2完全移行
- ✅ CI/CD最適化（Functions自動ビルド統合）
- ✅ UI/UX統一（戻るボタン動作一貫性）
- ✅ お題データ拡張（30→72個）
- ✅ TopicData型簡素化（interface→string）
- ✅ エラー解決・型安全性確保

**Phase 6（アーキテクチャリファクタリング）**
- ✅ 全アプリケーション完全リファクタリング（MVP + Facade + Container-Component パターン）
- ✅ app/roomディレクトリ完全リファクタリング（1,092行→モジュラー設計）
- ✅ app/create-roomディレクトリ リファクタリング（106行→MVP パターン）
- ✅ app/join-roomディレクトリ リファクタリング（158行→MVP パターン）
- ✅ MVP（Model-View-Presenter）パターン全ページ統一
- ✅ Facadeパターンによるグローバル状態管理
- ✅ Container-Componentパターンによる完全な責務分離
- ✅ Custom Hookパターンによるビジネスロジック再利用化
- ✅ 各ページの独立コンポーネント化とアーキテクチャ統一
- ✅ ESLintルール最適化（未使用パラメータ警告解決）
- ✅ お題データ拡張（72→447個）

**Phase 7（テスト基盤構築・CI/CD統合）**
- ✅ Jest + @testing-library/react テスト環境構築完了
- ✅ Presenter層ユニットテスト実装（CreateRoom・JoinRoom完了）
- ✅ Utils層ユニットテスト実装（バリデーション・ルームコード生成等）
- ✅ 44個のテスト実装、全テスト合格確認
- ✅ カバレッジ測定機能実装（Jest Coverage）
- ✅ CI/CDパイプライン構築（GitHub Actions 3ワークフロー）
- ✅ テスト失敗時のデプロイ停止機能
- ✅ カバレッジレポート自動生成・HTML出力
- ✅ 包括的テストガイド作成（docs/testing-guide.md）
- ✅ テスト戦略ドキュメント整備
- ✅ 最重要技術的負債「テスト欠如」完全解決

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
- **CI/CD自動化**: GitHub Actions、Functions含む完全ビルド
- **ナビゲーション統一**: 全戻るボタンがTOPページ遷移
- **型安全性**: TypeScriptエラーゼロ、最新型定義活用
- **開発環境分離**: Firebase Emulatorで本番データを保護
- **アーキテクチャパターン**: MVP + Facade + Container-Component パターン採用
- **モジュラー設計**: 1,092行モノリス→8ファイル分散による保守性向上

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