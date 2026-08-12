#!/bin/sh
set -eu
umask 077

: "${DATABASE_HOST:?DATABASE_HOST is required}"
: "${DATABASE_PORT:=3306}"
: "${DATABASE_NAME:?DATABASE_NAME is required}"
: "${DATABASE_USER:?DATABASE_USER is required}"
: "${DATABASE_KEY:?DATABASE_KEY is required}"
: "${PROTOCOL_BACKUP_PASSPHRASE:?PROTOCOL_BACKUP_PASSPHRASE is required}"
: "${PROTOCOL_STORAGE_DIR:=/data/protocolos}"
: "${PROTOCOL_BACKUP_DIR:=/backups}"

case "$DATABASE_NAME" in (*[!A-Za-z0-9_]*) echo "Invalid database name" >&2; exit 2;; esac
if [ "${#PROTOCOL_BACKUP_PASSPHRASE}" -lt 20 ]; then
  echo "PROTOCOL_BACKUP_PASSPHRASE must have at least 20 characters" >&2
  exit 2
fi

mkdir -p "$PROTOCOL_BACKUP_DIR"
work_dir="$(mktemp -d)"
auth_file="$work_dir/client.cnf"
cleanup() { rm -rf "$work_dir"; }
trap cleanup EXIT INT TERM

cat > "$auth_file" <<EOF
[client]
host=$DATABASE_HOST
port=$DATABASE_PORT
user=$DATABASE_USER
password=$DATABASE_KEY
EOF
chmod 600 "$auth_file"

mariadb-dump --defaults-extra-file="$auth_file" \
  --single-transaction --quick --routines --events --triggers --hex-blob --no-tablespaces \
  --default-character-set=utf8mb4 "$DATABASE_NAME" > "$work_dir/database.sql"

mkdir -p "$work_dir/files"
if [ -d "$PROTOCOL_STORAGE_DIR" ]; then
  tar -C "$PROTOCOL_STORAGE_DIR" -cf "$work_dir/files/attachments.tar" .
else
  tar -C "$work_dir/files" -cf "$work_dir/files/attachments.tar" --files-from /dev/null
fi

rm -f "$auth_file"
created_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
attachment_files="$(find "$PROTOCOL_STORAGE_DIR" -type f 2>/dev/null | wc -l | tr -d ' ')"
printf 'format=1\ncreated_at=%s\ncontents=database-and-private-attachments\nattachment_files=%s\n' "$created_at" "$attachment_files" > "$work_dir/manifest.txt"
(cd "$work_dir" && sha256sum database.sql files/attachments.tar manifest.txt > SHA256SUMS)

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
name="protocol-$timestamp.backup"
bundle="$work_dir/bundle.tar"
tar -C "$work_dir" -cf "$bundle" database.sql files/attachments.tar manifest.txt SHA256SUMS
openssl enc -aes-256-cbc -salt -pbkdf2 -iter 200000 \
  -in "$bundle" -out "$PROTOCOL_BACKUP_DIR/$name.partial" \
  -pass env:PROTOCOL_BACKUP_PASSPHRASE
mv "$PROTOCOL_BACKUP_DIR/$name.partial" "$PROTOCOL_BACKUP_DIR/$name"
(cd "$PROTOCOL_BACKUP_DIR" && sha256sum "$name" > "$name.sha256")

printf '%s\n' "$PROTOCOL_BACKUP_DIR/$name"
