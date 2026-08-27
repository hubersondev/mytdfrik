#!/usr/bin/env bash
# ============================================================================
#  Sauvegarde de la base PostgreSQL de production (dump compressé + rotation)
# ----------------------------------------------------------------------------
#      ./scripts/backup-db.sh                    # dump dans ./backups
#      BACKUP_DIR=/var/backups/mytdfrik ./scripts/backup-db.sh
#      RETENTION_DAYS=30 ./scripts/backup-db.sh
#
#  Planification quotidienne (crontab -e) — 3 h du matin :
#      0 3 * * * cd /opt/mytdfrik && BACKUP_DIR=/var/backups/mytdfrik \
#                ./scripts/backup-db.sh >> /var/log/mytdfrik-backup.log 2>&1
# ============================================================================
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

ENV_FILE="docker/.env.prod"
BACKUP_DIR="${BACKUP_DIR:-$REPO_ROOT/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
CONTAINER="mytdfrik-postgres-prod"

[ -f "$ENV_FILE" ] || { echo "$ENV_FILE introuvable." >&2; exit 1; }

# shellcheck disable=SC1090
POSTGRES_USER="$(grep -E '^POSTGRES_USER=' "$ENV_FILE" | cut -d= -f2-)"
POSTGRES_DB="$(grep -E '^POSTGRES_DB=' "$ENV_FILE" | cut -d= -f2-)"

docker ps --format '{{.Names}}' | grep -qx "$CONTAINER" \
  || { echo "Conteneur $CONTAINER non démarré." >&2; exit 1; }

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
TARGET="$BACKUP_DIR/mytdfrik-$STAMP.sql.gz"

echo "==> Sauvegarde de $POSTGRES_DB vers $TARGET"
docker exec "$CONTAINER" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --clean --if-exists \
  | gzip -9 > "$TARGET"

# Un dump vide signale un échec silencieux du pipe.
[ -s "$TARGET" ] || { echo "Dump vide — sauvegarde annulée." >&2; rm -f "$TARGET"; exit 1; }

echo "==> Sauvegarde terminée ($(du -h "$TARGET" | cut -f1))"

echo "==> Purge des sauvegardes de plus de $RETENTION_DAYS jours"
find "$BACKUP_DIR" -name 'mytdfrik-*.sql.gz' -mtime +"$RETENTION_DAYS" -delete

# Restauration :
#   gunzip -c backups/mytdfrik-XXXX.sql.gz \
#     | docker exec -i mytdfrik-postgres-prod psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
