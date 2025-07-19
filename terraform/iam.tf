# GitHub Actions サービスアカウントの現在の権限を管理
resource "google_project_iam_member" "github_actions_roles" {
  for_each = toset([
    # Firebase Functions関連
    "roles/cloudfunctions.developer",
    "roles/iam.serviceAccountUser",
    
    # Firebase Firestore関連
    "roles/firebase.managementServiceAgent",
    "roles/firebaserules.admin",
    "roles/firebaserules.firestoreServiceAgent",
    "roles/datastore.indexAdmin",
    
    # Firebase Hosting関連
    "roles/firebasehosting.admin",
    
    # Firebase Auth関連
    "roles/firebaseauth.admin",
    
    # Firebase Extensions関連
    "roles/firebaseextensions.admin",
    
    # Cloud Scheduler関連（定期実行Function用）
    "roles/cloudscheduler.admin",
    
    # サービス使用権限
    "roles/serviceusage.serviceUsageConsumer",
    "roles/serviceusage.apiKeysViewer",
    
    # その他の必要な権限
    "roles/run.viewer",
    "roles/networkservices.serviceExtensionsViewer"
  ])
  
  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${var.github_actions_service_account_email}"
}

# 出力用：設定された権限の一覧
output "github_actions_roles" {
  description = "GitHub Actionsサービスアカウントに付与された権限"
  value = [
    for role in google_project_iam_member.github_actions_roles :
    role.role
  ]
}