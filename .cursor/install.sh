#!/usr/bin/env bash
# Repository bootstrap for Cloud Agents. Idempotent: safe to re-run.
# Self-contained: installs the system dependencies (PostgreSQL) so the
# environment is reproducible from the default base image without a snapshot.
set -euo pipefail

cd "$(dirname "$0")/.."
REPO_ROOT="$(pwd)"

# shellcheck source=.cursor/use-node.sh
source "$REPO_ROOT/.cursor/use-node.sh"
echo "Using Node $(node -v) / npm $(npm -v)"

# Install PostgreSQL once (the app's only system dependency). Skipped when the
# server binaries are already present, so re-runs are cheap.
if ! command -v pg_ctlcluster >/dev/null 2>&1; then
  echo "Installing PostgreSQL..."
  sudo apt-get update -y
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    postgresql postgresql-contrib
fi

# Install dependencies from the committed lockfile.
npm ci

# Create a local development .env from the template on first run only, so that
# manual edits are preserved on subsequent installs. Points the API at the
# local PostgreSQL cluster prepared by start.sh (host localhost, port 5432).
if [ ! -f "$REPO_ROOT/.env" ]; then
  echo "Creating .env for local development"
  cat > "$REPO_ROOT/.env" <<'EOF'
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=homemade

JWT_SECRET=local-development-secret-not-for-production

CORS_ORIGIN=http://localhost:4200
FRONTEND_URL=http://localhost:4200

SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@tnakan.local

UPLOADS_DIR=uploads
UPLOADS_PUBLIC_URL=http://localhost:3000/uploads
EOF
fi

echo "install.sh complete"
