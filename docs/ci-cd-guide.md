# CI/CD運用ガイド

GitHub Actions による4段階CI/CDパイプラインの詳細ガイド

**最終更新**: 2025-07-19
**対象**: 開発者・運用担当者

## 🔄 CI/CDパイプライン概要

### 4段階自動デプロイフロー

```
mainブランチpush → テスト実行 → Firestore → Functions → Hosting
                    ↓ 失敗時      ↓          ↓         ↓
                  停止・通知    rules+indexes  v2       静的サイト
```

### パイプライン詳細

#### Stage 1: テスト実行
- **実行内容**: `npm run lint` + `npm run test:ci`
- **目的**: コード品質保証、44テスト実行
- **失敗時**: 後続ステップ全停止

#### Stage 2: Firestore デプロイ
- **実行内容**: `firebase deploy --only firestore:rules,firestore:indexes`
- **目的**: セキュリティルール・インデックス更新
- **対象ファイル**: `firestore.rules`, `firestore.indexes.json`

#### Stage 3: Functions デプロイ
- **実行内容**: `firebase deploy --only functions`
- **目的**: Cloud Functions v2（Node.js 20）デプロイ
- **対象ファイル**: `functions/src/index.ts`

#### Stage 4: Hosting デプロイ
- **実行内容**: Next.js静的サイトデプロイ
- **目的**: フロントエンドアプリケーション更新
- **対象ファイル**: `out/` ディレクトリ

## 🔧 設定ファイル

### GitHub Actions ワークフロー
- **ファイル**: `.github/workflows/firebase-hosting-merge.yml`
- **トリガー**: mainブランチへのpush
- **実行時間**: 約5-10分

### 認証設定
- **Google Cloud Auth**: `google-github-actions/auth@v2`
- **認証情報**: `FIREBASE_SERVICE_ACCOUNT_MATCH_PARTY_FINDY`
- **権限管理**: Terraform/OpenTofuで14のIAM権限を管理

## 📊 モニタリング

### 実行状況確認
```bash
# GitHub Actions実行履歴
https://github.com/aiandrox/match-party/actions

# Firebase Consoleでのデプロイ状況確認
https://console.firebase.google.com/project/match-party-findy
```

### ログ確認
- **GitHub Actions**: 各ステップの詳細ログ
- **Firebase Console**: Functions・Hosting・Firestoreのデプロイログ

## 🚨 トラブルシューティング

### よくあるエラーと対処法

#### 1. テスト失敗
```bash
# ローカルでテスト実行
npm run test:ci
npm run lint

# 修正後、再度push
```

#### 2. Firestore権限エラー
```bash
# IAM権限確認
cd terraform
tofu plan

# 権限不足の場合
gcloud projects add-iam-policy-binding match-party-findy \
  --member="serviceAccount:github-action-xxx@match-party-findy.iam.gserviceaccount.com" \
  --role="roles/xxx"
```

#### 3. Functions デプロイエラー
```bash
# ローカルでビルド確認
cd functions
npm run build

# Node.js バージョン確認
# firebase.json: "runtime": "nodejs20"
```

## 🔒 セキュリティ

### 認証情報管理
- **GitHub Secrets**: サービスアカウントキー暗号化保存
- **最小権限原則**: 必要最小限のIAM権限のみ付与
- **セキュアな認証フロー**: Google Cloud Auth Action使用

### 権限一覧（Terraform管理）
- `roles/cloudfunctions.developer`
- `roles/cloudscheduler.admin`
- `roles/firebase.managementServiceAgent`
- `roles/firebaserules.admin`
- `roles/firebasehosting.admin`
- `roles/firebaseauth.admin`
- `roles/firebaseextensions.admin`
- `roles/datastore.indexAdmin`
- `roles/iam.serviceAccountUser`
- `roles/run.viewer`
- `roles/serviceusage.serviceUsageConsumer`
- `roles/serviceusage.apiKeysViewer`
- `roles/networkservices.serviceExtensionsViewer`
- `roles/firebaserules.firestoreServiceAgent`

## 📋 運用チェックリスト

### デプロイ前
- [ ] ローカルテスト実行・合格確認
- [ ] Lintエラー解決
- [ ] 機能動作確認

### デプロイ後
- [ ] CI/CD実行状況確認
- [ ] 本番サイト動作確認（https://match-party-findy.web.app/）
- [ ] Firebase Console監視

### 定期メンテナンス
- [ ] GitHub Actions実行履歴確認（週次）
- [ ] Firebase使用量監視（月次）
- [ ] セキュリティアップデート適用（随時）

## 🔄 手動デプロイ（緊急時）

```bash
# 全サービス手動デプロイ
firebase deploy

# 個別サービスデプロイ
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules,firestore:indexes

# インフラ管理
cd terraform
tofu apply
```

## 📈 パフォーマンス最適化

### CI/CD実行時間短縮
- **並列実行**: 可能な限り並列化実装済み
- **キャッシュ活用**: Node.js依存関係キャッシュ
- **段階的実行**: 失敗時の早期停止

### デプロイ効率化
- **差分デプロイ**: 変更ファイルのみ対象
- **ロールバック機能**: Firebase Hostingの履歴機能活用

この運用ガイドにより、安全で効率的なCI/CD運用を実現しています。