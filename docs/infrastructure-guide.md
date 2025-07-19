# インフラストラクチャ管理ガイド

Terraform/OpenTofuによるインフラストラクチャ・アズ・コード（IaC）運用ガイド

**最終更新**: 2025-07-19
**対象**: インフラエンジニア・DevOps担当者

## 🏗️ IaC基盤概要

### Infrastructure as Code採用
- **ツール**: OpenTofu（Terraform互換）
- **管理対象**: GitHub Actions IAM権限（14権限）
- **方針**: 宣言的インフラ管理、履歴追跡、コードレビュー

### アーキテクチャ図
```
┌─────────────────────┐
│   Frontend (Next.js) │ ← Hosting
├─────────────────────┤  
│   Backend (Functions)│ ← Cloud Functions v2
├─────────────────────┤
│   Database (Firestore)│ ← Rules & Indexes
├─────────────────────┤
│   Infrastructure    │ ← Terraform/OpenTofu ✨
├─────────────────────┤
│   CI/CD (GitHub)    │ ← GitHub Actions
└─────────────────────┘
```

## 📁 ディレクトリ構成

```
terraform/
├── main.tf              # Provider設定
├── variables.tf         # 変数定義
├── iam.tf              # IAM権限管理 ✨
├── .gitignore          # Terraform状態ファイル除外
├── README.md           # 使用方法
├── import-existing-iam.sh  # 既存権限インポート
├── terraform.tfstate   # 状態ファイル（Git除外）
└── terraform.tfstate.backup
```

## 🔧 セットアップ

### 1. 必要ツールのインストール
```bash
# OpenTofuインストール
brew install opentofu

# Google Cloud CLI認証
gcloud auth login
gcloud config set project match-party-findy
```

### 2. Terraform初期化
```bash
cd terraform
tofu init
```

### 3. 現在の状態確認
```bash
tofu plan
```

## 🎯 管理対象リソース

### IAM権限（14権限を管理）

| 権限 | 用途 | 重要度 |
|------|------|--------|
| `roles/cloudfunctions.developer` | Functions管理 | 高 |
| `roles/cloudscheduler.admin` | 定期実行Function | 高 |
| `roles/firebase.managementServiceAgent` | Firebase管理 | 高 |
| `roles/firebaserules.admin` | Firestore Rules | 高 |
| `roles/firebasehosting.admin` | Hosting管理 | 高 |
| `roles/firebaseauth.admin` | Auth管理 | 中 |
| `roles/firebaseextensions.admin` | Extensions管理 | 中 |
| `roles/datastore.indexAdmin` | Firestore Index | 中 |
| `roles/iam.serviceAccountUser` | サービスアカウント | 高 |
| `roles/run.viewer` | Cloud Run参照 | 低 |
| `roles/serviceusage.serviceUsageConsumer` | API使用 | 中 |
| `roles/serviceusage.apiKeysViewer` | APIキー参照 | 低 |
| `roles/networkservices.serviceExtensionsViewer` | ネットワーク | 低 |
| `roles/firebaserules.firestoreServiceAgent` | Firestore Agent | 中 |

### 対象サービスアカウント
- **GitHub Actions**: `github-action-1017460688@match-party-findy.iam.gserviceaccount.com`

## 🚀 運用コマンド

### 日常運用
```bash
# 変更確認
tofu plan

# 変更適用
tofu apply

# 状態確認
tofu show

# リソース一覧
tofu state list
```

### 権限管理
```bash
# 新しい権限追加
# 1. iam.tfのfor_eachセットに追加
# 2. tofu planで確認
# 3. tofu applyで適用

# 権限削除
# 1. iam.tfから削除
# 2. tofu planで確認
# 3. tofu applyで削除実行
```

### トラブルシューティング
```bash
# 状態の修復
tofu refresh

# 特定リソースの再作成
tofu taint 'google_project_iam_member.github_actions_roles["roles/xxx"]'
tofu apply

# 状態ファイルの確認
tofu state show 'google_project_iam_member.github_actions_roles["roles/xxx"]'
```

## 🔒 セキュリティ

### 最小権限の原則
- CI/CDに必要最小限の権限のみ付与
- 定期的な権限レビュー実施
- 不要権限の迅速な削除

### 状態ファイル管理
- **ローカル管理**: 現在terraform.tfstateをローカル保存
- **セキュリティ**: .gitignoreで秘密情報を除外
- **バックアップ**: terraform.tfstate.backupで履歴保持

### アクセス制御
- Google Cloud CLI認証必須
- プロジェクトOwner権限が必要
- 本番環境への変更は慎重に実施

## 📊 監視・運用

### 変更管理
- **コードレビュー**: iam.tf変更時はPRベースレビュー
- **履歴追跡**: Git履歴で権限変更を追跡
- **ロールバック**: Git履歴からの迅速な復旧

### 定期メンテナンス
```bash
# 月次：不要権限チェック
tofu plan | grep "will be destroyed"

# 四半期：権限レビュー
gcloud projects get-iam-policy match-party-findy \
  --flatten="bindings[].members" \
  --filter="bindings.members:github-action-*"
```

## 🔄 災害復旧

### 権限復旧手順
```bash
# 1. Git履歴から設定確認
git log --oneline terraform/iam.tf

# 2. 緊急時手動復旧
./terraform/import-existing-iam.sh

# 3. 状態同期
tofu refresh
tofu plan
```

### バックアップ戦略
- **設定ファイル**: Git履歴で完全バックアップ
- **状態ファイル**: ローカル + 手動バックアップ
- **権限情報**: gcloudコマンドでエクスポート可能

## 📈 将来拡張

### 管理対象拡張候補
- [ ] Firestore Rules・Indexesの管理
- [ ] Cloud Monitoring設定
- [ ] Cloud Logging設定
- [ ] Secret Manager設定
- [ ] 環境別設定（dev/staging/prod）

### ベストプラクティス導入
- [ ] Remote State（Cloud Storage）への移行
- [ ] Terraform Cloud導入検討
- [ ] 環境分離（workspace活用）
- [ ] モジュール化

## 💡 OpenTofu採用理由

### Terraformからの移行
- **ライセンス問題**: HashiCorp BUSL回避
- **OSS継続**: コミュニティ主導開発
- **互換性**: Terraform設定をそのまま利用可能
- **将来性**: ベンダーロックイン回避

### 技術的メリット
- **機能**: Terraformと完全互換
- **パフォーマンス**: 同等以上の性能
- **コミュニティ**: アクティブな開発
- **サポート**: エンタープライズサポート利用可能

このインフラ管理により、安全で再現可能なインフラ運用を実現しています。