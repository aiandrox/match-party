# Vertex AI API有効化
resource "google_project_service" "vertex_ai" {
  project = var.project_id
  service = "aiplatform.googleapis.com"
  
  disable_dependent_services = false
  disable_on_destroy         = false
}

# ファシリテーション機能用Service Account
resource "google_service_account" "facilitation_service" {
  account_id   = "match-party-facilitation"
  display_name = "Match Party Facilitation Service"
  description  = "Service account for Gemini-powered facilitation features"
  project      = var.project_id
}

# Service AccountにVertex AI User権限を付与
resource "google_project_iam_member" "facilitation_vertex_ai_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.facilitation_service.email}"
}

# Service Account Key生成（ローカル開発用）
resource "google_service_account_key" "facilitation_service_key" {
  service_account_id = google_service_account.facilitation_service.name
  public_key_type    = "TYPE_X509_PEM_FILE"
}

# 出力: Service Account情報
output "facilitation_service_account_email" {
  description = "ファシリテーション機能用Service Accountのメールアドレス"
  value       = google_service_account.facilitation_service.email
}

output "facilitation_service_account_key" {
  description = "Service AccountのプライベートキーJSON（base64エンコード済み）"
  value       = google_service_account_key.facilitation_service_key.private_key
  sensitive   = true
}

# Firebase FunctionsにもVertex AI権限を追加（将来的にファシリテーション機能をFunctionsに移行する場合）
resource "google_project_iam_member" "github_actions_vertex_ai" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${var.github_actions_service_account_email}"
}