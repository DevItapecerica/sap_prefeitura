#!/bin/sh
set -eu
umask 077

: "${DATABASE_HOST:?DATABASE_HOST is required}"
: "${DATABASE_PORT:=3306}"
: "${DATABASE_NAME:?DATABASE_NAME is required}"
: "${DATABASE_ROOT_PASSWORD:?DATABASE_ROOT_PASSWORD is required}"
: "${PROTOCOL_BACKUP_PASSPHRASE:?PROTOCOL_BACKUP_PASSPHRASE is required}"
: "${PROTOCOL_BACKUP_DIR:=/backups}"
: "${BACKUP_PATH:?BACKUP_PATH is required}"

case "$DATABASE_NAME" in (*[!A-Za-z0-9_]*) echo "Invalid database name" >&2; exit 2;; esac
case "$BACKUP_PATH" in ("$PROTOCOL_BACKUP_DIR"/protocol-*.backup) ;; (*) echo "BACKUP_PATH must point to a protocol backup" >&2; exit 2;; esac
[ -f "$BACKUP_PATH" ] || { echo "Backup not found" >&2; exit 2; }
[ -f "$BACKUP_PATH.sha256" ] || { echo "Backup checksum not found" >&2; exit 2; }
if [ "${#PROTOCOL_BACKUP_PASSPHRASE}" -lt 20 ]; then echo "Invalid backup passphrase" >&2; exit 2; fi

work_dir="$(mktemp -d)"
auth_file="$work_dir/root.cnf"
suffix="$(date -u +%H%M%S)_$$"
restore_db="${DATABASE_NAME}_restore_${suffix}"
restore_db="$(printf '%s' "$restore_db" | cut -c1-63)"
created_database=false
cleanup() {
  if [ "$created_database" = true ]; then
    mariadb --defaults-extra-file="$auth_file" -e "DROP DATABASE IF EXISTS \`$restore_db\`" >/dev/null 2>&1 || true
  fi
  rm -rf "$work_dir"
}
trap cleanup EXIT INT TERM

cat > "$auth_file" <<EOF
[client]
host=$DATABASE_HOST
port=$DATABASE_PORT
user=root
password=$DATABASE_ROOT_PASSWORD
EOF
chmod 600 "$auth_file"

(cd "$PROTOCOL_BACKUP_DIR" && sha256sum -c "$(basename "$BACKUP_PATH").sha256")
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 \
  -in "$BACKUP_PATH" -out "$work_dir/bundle.tar" \
  -pass env:PROTOCOL_BACKUP_PASSPHRASE

if tar -tf "$work_dir/bundle.tar" | grep -Eq '(^/|(^|/)\.\.(/|$))'; then
  echo "Unsafe path found in backup" >&2
  exit 3
fi
tar -C "$work_dir" -xf "$work_dir/bundle.tar"
(cd "$work_dir" && sha256sum -c SHA256SUMS)
if tar -tf "$work_dir/files/attachments.tar" | grep -Eq '(^/|(^|/)\.\.(/|$))'; then
  echo "Unsafe attachment path found in backup" >&2
  exit 3
fi
mkdir "$work_dir/restored-files"
tar -C "$work_dir/restored-files" -xf "$work_dir/files/attachments.tar"
expected_attachment_files="$(sed -n 's/^attachment_files=//p' "$work_dir/manifest.txt")"
case "$expected_attachment_files" in (''|*[!0-9]*) echo "Invalid attachment count in manifest" >&2; exit 3;; esac
restored_attachment_files="$(find "$work_dir/restored-files" -type f | wc -l | tr -d ' ')"
[ "$expected_attachment_files" = "$restored_attachment_files" ] || { echo "Attachment count mismatch" >&2; exit 4; }

mariadb --defaults-extra-file="$auth_file" -e "CREATE DATABASE \`$restore_db\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
created_database=true
mariadb --defaults-extra-file="$auth_file" "$restore_db" < "$work_dir/database.sql"

source_tables="$(mariadb --defaults-extra-file="$auth_file" --batch --skip-column-names -e "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='$DATABASE_NAME'")"
restored_tables="$(mariadb --defaults-extra-file="$auth_file" --batch --skip-column-names -e "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='$restore_db'")"
[ "$source_tables" = "$restored_tables" ] || { echo "Table count mismatch" >&2; exit 4; }

for table in protocol_services protocol_forms protocol_counters protocols protocol_movements protocol_requirements protocol_attachments protocol_access_codes protocol_role_permissions protocol_notifications protocol_privacy_requests SequelizeMeta; do
  source_count="$(mariadb --defaults-extra-file="$auth_file" --batch --skip-column-names "$DATABASE_NAME" -e "SELECT COUNT(*) FROM \`$table\`")"
  restored_count="$(mariadb --defaults-extra-file="$auth_file" --batch --skip-column-names "$restore_db" -e "SELECT COUNT(*) FROM \`$table\`")"
  [ "$source_count" = "$restored_count" ] || { echo "Row count mismatch in $table" >&2; exit 4; }
done

printf 'restore verification succeeded: database=%s tables=%s attachments=%s\n' "$restore_db" "$restored_tables" "$restored_attachment_files"
