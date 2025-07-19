# 開発ワークフロー

**現在の状況**: ✅ Phase 7完了、エンタープライズ品質基盤実現（テスト・CI/CD・IaC）
**最終更新**: 2025-07-19

## Git運用方針

### ブランチ戦略（実際の運用）
- **main**: 本番環境用（常に動作する状態、自動デプロイ対象）
- **develop**: 使用していない（シンプルな運用を採用）
- **feature/***: 機能開発用（直接mainにマージ）
- **hotfix/***: 緊急修正用

### 実際の開発フロー
1. **機能開発**: `main`から直接開発（小規模チームのため）
2. **機能実装**: 小さな単位でコミット、Claude Codeとのペアプログラミング
3. **自動テスト**: GitHub Actions 4段階パイプライン（テスト→Firestore→Functions→Hosting）
4. **品質ゲート**: テスト失敗時は自動デプロイ停止
5. **自動デプロイ**: `main`ブランチへのpushで全サービス自動デプロイ

## 開発ステップ

### Phase 1: 基盤構築
```bash
git checkout -b feature/project-setup
```
- [ ] Next.js プロジェクト初期化
- [ ] Firebase プロジェクト設定
- [ ] 基本的なフォルダ構造作成
- [ ] 開発環境構築（ESLint, Prettier, TypeScript）

### Phase 2: 認証・ルーム管理
```bash
git checkout develop
git checkout -b feature/room-management
```
- [ ] Firebase Authentication設定
- [ ] ルーム作成機能
- [ ] 参加者入室機能
- [ ] リアルタイム参加者リスト

### Phase 3: ゲーム機能
```bash
git checkout develop  
git checkout -b feature/game-mechanics
```
- [ ] お題表示機能
- [ ] 回答送信機能
- [ ] 回答公開機能
- [ ] 一致判定機能

### Phase 4: UI/UX
```bash
git checkout develop
git checkout -b feature/ui-improvements
```
- [ ] レスポンシブデザイン
- [ ] 音声・視覚効果
- [ ] エラーハンドリング

## コミットメッセージ規約

### 形式
```
<type>(<scope>): <description>

<body>

<footer>
```

### タイプ
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント更新
- `style`: コードスタイル変更
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: 設定変更、依存関係更新

### 例
```
feat(room): add room creation functionality

- Implement room code generation
- Add Firestore room collection
- Create room creation API endpoint

Closes #123
```

## 開発環境セットアップ

### 必要なツール
```bash
# Node.js (必須: v20以上)
node --version

# Firebase CLI
npm install -g firebase-tools

# OpenTofu (インフラ管理用)
brew install opentofu

# プロジェクト依存関係
npm install
```

### 環境変数設定
```bash
# .env.local (Gitignoreで除外済み)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# 開発環境分離
NEXT_PUBLIC_USE_EMULATOR=false  # 本番データベース使用
NEXT_PUBLIC_USE_EMULATOR=true   # ローカルエミュレータ使用
```

### 開発環境の選択

#### 本番データベース使用（従来の方法）
```bash
# .env.localでNEXT_PUBLIC_USE_EMULATOR=false
npm run dev
```

#### ローカルエミュレータ使用（推奨）
```bash
# 1. 環境変数設定
cp .env.local.example .env.local
# .env.local内でNEXT_PUBLIC_USE_EMULATOR=trueに設定

# 2. エミュレータ起動
npm run dev:with-emulator

# 3. エミュレータUI確認
# http://localhost:4000 でFirestoreデータを確認可能
```

#### エミュレータの利点
- **本番データを汚さない**: 開発中のテストデータが本番に影響しない
- **高速開発**: ローカルでの高速なDB操作
- **オフライン開発**: インターネット接続不要
- **データリセット**: 必要に応じて簡単にデータを削除可能

## テスト戦略

### テストレベル
1. **Unit Tests**: 個別関数・コンポーネント
2. **Integration Tests**: Firebase連携、API通信
3. **E2E Tests**: 実際のゲームフロー

### テストコマンド（Jest + Testing Library）
```bash
# 通常のテスト実行（44テスト実装済み）
npm test

# ウォッチモードでテスト実行
npm run test:watch

# カバレッジ付きテスト実行
npm run test:coverage

# CI環境用テスト実行
npm run test:ci

# カバレッジ確認（HTMLレポート）
open coverage/lcov-report/index.html
```

## デプロイ戦略

### 環境
- **Development**: Firebase Hosting (develop branch)
- **Production**: Firebase Hosting (main branch)

### CI/CD自動デプロイ（GitHub Actions）
```bash
# mainブランチpush時に4段階パイプライン自動実行
# 1. テスト実行 (npm run lint + npm run test:ci)
# 2. Firestore デプロイ (rules + indexes)
# 3. Functions デプロイ (Cloud Functions v2)
# 4. Hosting デプロイ (Next.js静的サイト)

# 手動デプロイ（必要時のみ）
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules,firestore:indexes
```

### インフラ管理（Terraform/OpenTofu）
```bash
# IAM権限管理
cd terraform
tofu plan     # 変更確認
tofu apply    # 権限適用
```

## 開発時の注意点

### セキュリティ
- API キーや機密情報は環境変数で管理
- Firestore セキュリティルールの適切な設定
- 入力値のバリデーション

### パフォーマンス
- リアルタイム接続の効率的な管理
- 不要なre-renderの削減
- 適切なローディング状態表示

### 運用
- エラーログの収集設定
- パフォーマンス監視
- 定期的なセキュリティアップデート

## 完了済み作業（2025-07-11）

### 基盤設定
- ✅ Firebase プロジェクト初期化（match-party-findy）
- ✅ Firebase MCP設定完了
- ✅ GitHub MCP設定完了
- ✅ developブランチ作成・初期コミット
- ✅ GitHub Actions自動デプロイ設定
- ✅ 音声通知システム設定

### 作成済みファイル
- ✅ `.firebaserc`, `firebase.json`
- ✅ `firestore.rules`, `firestore.indexes.json`
- ✅ `.github/workflows/` (自動デプロイ設定)
- ✅ `docs/firebase-setup-log.md`

## 次のアクション

1. ✅ `develop`ブランチ作成
2. Phase 1の`feature/project-setup`ブランチで開発開始
3. 各機能完成時に適切なテストとレビュー実施
4. 段階的にデプロイ・検証を実施

## 開発環境の現状

**準備完了:**
- Firebase MCP（Firestore操作、デプロイ等）
- GitHub MCP（リポジトリ操作、Issues/PR管理等）
- 自動デプロイ設定（GitHub Actions）
- 音声通知システム（確認・完了通知）

**次のステップ:**
- Next.jsプロジェクト構築（Phase 1）
- プロジェクト基本構造の作成
- WebSocketを使ったリアルタイム通信実装