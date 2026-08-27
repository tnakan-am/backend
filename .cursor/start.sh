#!/usr/bin/env bash
# Per-boot runtime initialization for Cloud Agents. Idempotent: safe to re-run.
# Starts the local PostgreSQL cluster, ensures the app role/database exist, and
# seeds reference data. Returns once the database is ready to accept queries.
set -euo pipefail

cd "$(dirname "$0")/.."
REPO_ROOT="$(pwd)"

# shellcheck source=.cursor/use-node.sh
source "$REPO_ROOT/.cursor/use-node.sh"

DB_NAME=homemade
DB_USER=postgres
DB_PASS=postgres

# 1. Start the PostgreSQL cluster if it is not already accepting connections.
#    The version/cluster are detected so this is not tied to a specific release.
if ! pg_isready -h 127.0.0.1 -p 5432 -q; then
  read -r PG_VERSION PG_CLUSTER < <(pg_lsclusters -h | awk 'NR==1 {print $1, $2}')
  echo "Starting PostgreSQL ${PG_VERSION}/${PG_CLUSTER}..."
  sudo pg_ctlcluster "${PG_VERSION}" "${PG_CLUSTER}" start
  for _ in $(seq 1 30); do
    pg_isready -h 127.0.0.1 -p 5432 -q && break
    sleep 1
  done
fi

if ! pg_isready -h 127.0.0.1 -p 5432 -q; then
  echo "PostgreSQL failed to become ready" >&2
  exit 1
fi
echo "PostgreSQL is ready on port 5432"

# 2. Ensure the postgres role has the password the app connects with, and that
#    the application database exists. Both steps are no-ops when already set.
sudo -u postgres psql -v ON_ERROR_STOP=1 -c \
  "ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASS}';" >/dev/null
if ! sudo -u postgres psql -tAc \
  "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}';" | grep -q 1; then
  echo "Creating database ${DB_NAME}"
  sudo -u postgres createdb -O "${DB_USER}" "${DB_NAME}"
fi

# 3. Seed reference categories on first boot only (the seed also creates the
#    schema via TypeORM synchronize). Skip when categories already exist so we
#    never wipe data a developer added between boots.
CATEGORY_COUNT="$(sudo -u postgres psql -d "${DB_NAME}" -tAc \
  "SELECT COUNT(*) FROM categories;" 2>/dev/null || echo 0)"
if [ "${CATEGORY_COUNT}" = "0" ]; then
  echo "Seeding categories..."
  npm run seed:categories
else
  echo "Categories already seeded (${CATEGORY_COUNT} rows); skipping"
fi

echo "start.sh complete"
