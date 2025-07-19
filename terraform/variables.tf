variable "project_id" {
  description = "Google Cloud project ID"
  type        = string
  default     = "match-party-findy"
}

variable "region" {
  description = "Default region"
  type        = string
  default     = "asia-northeast1"
}

variable "github_actions_service_account_email" {
  description = "GitHub Actions service account email"
  type        = string
  default     = "github-action-1017460688@match-party-findy.iam.gserviceaccount.com"
}