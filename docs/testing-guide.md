# テストガイド

**最終更新**: 2025-07-19  
**現在の状況**: Phase 6完了・MVP統一アーキテクチャによるテスト基盤構築完了

## 📋 概要

Match Partyプロジェクトでは、MVP（Model-View-Presenter）アーキテクチャを活用した包括的なテスト戦略を採用しています。責任分離が明確になされているため、各層を効率的にテストできます。

## 🧪 テスト実行方法

### ローカル開発環境

```bash
# 全テスト実行
npm test

# ウォッチモードでテスト実行
npm run test:watch

# カバレッジ付きでテスト実行
npm run test:coverage

# CI環境用テスト実行（カバレッジ付き、ウォッチなし）
npm run test:ci
```

### CI/CD環境

GitHub Actionsで以下のタイミングで自動実行：
- `push` または `pull_request` 時（main/develop ブランチ）
- Firebase Hosting デプロイ前

## 📊 カバレッジ確認方法

### 1. ローカルでカバレッジ確認

```bash
# カバレッジレポート生成
npm run test:coverage

# HTML形式のレポートを開く
open coverage/lcov-report/index.html
```

### 2. カバレッジレポートの見方

コマンド実行後、ターミナルに以下の形式でカバレッジが表示されます：

```
---------------------------------|---------|----------|---------|---------|-------------------
File                             | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
---------------------------------|---------|----------|---------|---------|-------------------
All files                        |   87.24 |    84.25 |   85.76 |   87.51 |                   
 app/create-room/components      |   100   |    100   |   100   |   100   |                   
  CreateRoom.presenter.ts        |   100   |    100   |   100   |   100   |                   
 lib                             |   91.66 |    100   |    80   |   90.47 |                   
  utils.ts                       |   91.66 |    100   |    80   |   90.47 | 10-11             
---------------------------------|---------|----------|---------|---------|-------------------
```

#### カバレッジ指標の説明

- **% Stmts (Statements)**: 実行された文の割合
- **% Branch**: 分岐条件の網羅率  
- **% Funcs (Functions)**: テストされた関数の割合
- **% Lines**: 実行された行の割合
- **Uncovered Line #s**: テストされていない行番号

### 3. HTML形式のカバレッジレポート

詳細な分析には HTML レポートを使用：

```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

HTML レポートの特徴：
- **ファイル別カバレッジ**: 各ファイルの詳細な分析
- **行別表示**: テストされた行（緑）/されていない行（赤）
- **分岐分析**: if文やswitch文の網羅状況  
- **インタラクティブ**: クリックして詳細確認可能

### 4. CI/CDでのカバレッジ

GitHub Actions では自動でカバレッジレポートが生成され：
- **PRコメント**: プルリクエストにカバレッジ情報を自動コメント
- **Codecov連携**: 外部サービスでトレンド分析（設定済み）
- **アーティファクト**: カバレッジレポートをダウンロード可能

## 🎯 現在のテスト状況

### ✅ テスト済み

1. **Presenter層** - ビジネスロジック
   - `CreateRoom.presenter.test.ts` - 15テスト
   - `JoinRoom.presenter.test.ts` - 17テスト  
   - バリデーション、状態管理、エラーハンドリング

2. **Utility層** - 共通関数
   - `utils.test.ts` - 12テスト
   - ルームコード生成、バリデーション、日時計算

### 📝 今後のテスト計画

1. **Component層** - UI コンポーネント
   - React Testing Library を使用
   - ユーザーインタラクション、レンダリング

2. **Facade層** - API統合
   - Firebase操作、ルーティング、localStorage

3. **E2Eテスト** - エンドツーエンド
   - Playwright または Cypress
   - 重要ユーザーフローの自動化

## 🏗️ テストアーキテクチャ

### MVP パターンの活用

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Component     │  │   Presenter     │  │    Facade       │
│   (View層)      │  │  (ロジック層)   │  │  (統合層)       │  
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ React Testing   │  │ Jest Unit Test  │  │ Integration     │
│ Library         │  │                 │  │ Test            │
│                 │  │ ✅ 完了済み    │  │                 │
│                 │  │                 │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### テストファイル配置

```
src/
├── app/create-room/components/
│   ├── CreateRoom.presenter.ts
│   ├── CreateRoom.presenter.test.ts  ✅
│   ├── CreateRoom.component.tsx
│   └── CreateRoom.component.test.tsx (予定)
├── lib/
│   ├── utils.ts
│   └── utils.test.ts  ✅
```

## 🔧 テスト設定

### Jest 設定 (`jest.config.js`)

```javascript
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/data/**/*',
  ],
};
```

### モック設定 (`jest.setup.js`)

- Firebase モック
- Next.js Router モック
- localStorage モック

## 📈 カバレッジ改善のベストプラクティス

### 1. 段階的改善

```bash
# 現在のカバレッジを確認
npm run test:coverage

# 低いカバレッジのファイルを特定
# HTML レポートで詳細分析

# 1ファイルずつテストを追加
# 新しいテスト作成後、再度確認
```

### 2. 優先順位

1. **Presenter** - ビジネスロジック（最優先）
2. **Utils** - 共通関数
3. **Components** - UI コンポーネント  
4. **Facades** - API統合
5. **E2E** - ユーザーフロー

### 3. 品質指標

MVP アーキテクチャでは以下を目標：

- **Presenter層**: 90%以上
- **Utils層**: 95%以上  
- **Component層**: 80%以上
- **Facade層**: 70%以上

## 🚨 注意事項

### カバレッジの限界

- **100%カバレッジ ≠ 完璧なテスト**
- **エラーケース**も忘れずにテスト
- **ユーザビリティ**はE2Eテストで確認

### CI/CD での考慮点

- テスト失敗時はデプロイ停止
- カバレッジ低下時は警告
- 新機能追加時は必ずテスト追加

## 🔍 トラブルシューティング

### よくある問題

1. **モックエラー**
   ```bash
   # Firebase モック問題
   # jest.setup.js を確認
   ```

2. **型エラー**  
   ```bash
   # @types/jest がインストール済みか確認
   npm list @types/jest
   ```

3. **カバレッジが表示されない**
   ```bash
   # .gitignore で coverage/ が除外されていることを確認
   ```

### デバッグコマンド

```bash
# 詳細ログでテスト実行  
npm test -- --verbose

# 特定ファイルのみテスト
npm test CreateRoom.presenter.test.ts

# ウォッチモードで開発
npm run test:watch
```

---

## 📚 関連ドキュメント

- [開発ワークフロー](./development-workflow.md)
- [アーキテクチャ仕様](./architecture.md)
- [セキュリティガイド](./security.md)
- [データベース設計](./database-design.md)

**💡 ヒント**: テストは**継続的な改善**が重要です。新機能追加時は必ずテストも追加し、カバレッジの向上を図りましょう。