# Terraform Configuration for Match Party

このディレクトリには、Match PartyプロジェクトのGoogle Cloud IAM権限をTerraformで管理する設定が含まれています。

## 概要

GitHub Actions CI/CDパイプラインで必要なIAM権限を自動化・ファイル管理します。

## 管理対象

- GitHub Actionsサービスアカウントの権限
- Firebase関連サービスへのアクセス権限
- Cloud Functions、Firestore、Hosting等のデプロイ権限

## 使用方法

### 1. 初期化

```bash
cd terraform
terraform init
```

### 2. 設定確認

```bash
terraform plan
```

### 3. 適用

```bash
terraform apply
```

### 4. 破棄（必要時）

```bash
terraform destroy
```

## 設定される権限

- `roles/cloudfunctions.developer` - Firebase Functions管理
- `roles/cloudscheduler.admin` - 定期実行Function管理  
- `roles/firebase.managementServiceAgent` - Firebase管理
- `roles/firebaserules.admin` - Firestore Rules管理
- `roles/firebasehosting.admin` - Firebase Hosting管理
- `roles/firebaseauth.admin` - Firebase Auth管理
- `roles/firebaseextensions.admin` - Firebase Extensions管理
- `roles/datastore.indexAdmin` - Firestore Index管理
- その他、CI/CDに必要な権限

## 注意事項

- 初回実行前にGoogle Cloud認証を行ってください
- プロジェクトIDは `variables.tf` で設定されています
- 権限変更後は GitHub Actions を再実行してテストしてください