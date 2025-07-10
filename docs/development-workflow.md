# 開発ワークフロー

## Git運用方針

### ブランチ戦略
- **main**: 本番環境用（常に動作する状態を保持）
- **develop**: 開発統合用（機能開発の統合先）
- **feature/***: 機能開発用（例: feature/room-creation, feature/realtime-sync）
- **hotfix/***: 緊急修正用

### 開発フロー
1. **機能開発開始**: `develop`から`feature/*`ブランチを作成
2. **機能実装**: 小さな単位でコミット（機能単位、バグ修正単位）
3. **テスト**: 機能完成時にテスト実行
4. **マージ**: `feature/*` → `develop`へマージ
5. **リリース**: `develop` → `main`へマージ

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
# Node.js (推奨: v18以上)
node --version

# Firebase CLI
npm install -g firebase-tools

# プロジェクト依存関係
npm install
```

### 環境変数設定
```bash
# .env.local (Gitignoreで除外済み)
NEXT_PUBLIC_FIREBASE_CONFIG=...
```

## テスト戦略

### テストレベル
1. **Unit Tests**: 個別関数・コンポーネント
2. **Integration Tests**: Firebase連携、API通信
3. **E2E Tests**: 実際のゲームフロー

### テストコマンド
```bash
# 単体テスト
npm run test

# E2Eテスト
npm run test:e2e

# テストカバレッジ
npm run test:coverage
```

## デプロイ戦略

### 環境
- **Development**: Firebase Hosting (develop branch)
- **Production**: Firebase Hosting (main branch)

### 自動デプロイ
```bash
# 開発環境
firebase deploy --only hosting:dev

# 本番環境  
firebase deploy --only hosting:prod
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

## 次のアクション

1. `develop`ブランチ作成
2. Phase 1の`feature/project-setup`ブランチで開発開始
3. 各機能完成時に適切なテストとレビュー実施
4. 段階的にデプロイ・検証を実施