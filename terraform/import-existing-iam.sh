#!/bin/bash

# 既存のIAM権限をTerraformにインポートするスクリプト
PROJECT_ID="match-party-findy"
SERVICE_ACCOUNT="github-action-1017460688@match-party-findy.iam.gserviceaccount.com"

ROLES=(
  "roles/cloudscheduler.admin"
  "roles/datastore.indexAdmin" 
  "roles/firebase.managementServiceAgent"
  "roles/firebaseauth.admin"
  "roles/firebaseextensions.admin"
  "roles/firebasehosting.admin"
  "roles/firebaserules.admin"
  "roles/firebaserules.firestoreServiceAgent"
  "roles/iam.serviceAccountUser"
  "roles/networkservices.serviceExtensionsViewer"
  "roles/run.viewer"
  "roles/serviceusage.apiKeysViewer"
  "roles/serviceusage.serviceUsageConsumer"
)

echo "Importing existing IAM roles to Terraform state..."

for role in "${ROLES[@]}"; do
  echo "Importing $role..."
  tofu import "google_project_iam_member.github_actions_roles[\"$role\"]" "$PROJECT_ID $role serviceAccount:$SERVICE_ACCOUNT"
done

echo "Import completed!"
echo "Run 'tofu plan' to verify all resources are in sync."