#!/bin/bash
# User approved 2026-11-16: private DB + credentials to own Mac, owner-only permissions.
set -euo pipefail
umask 077
ssh_args=(-o StrictHostKeyChecking=yes -o IdentitiesOnly=yes -i "$HOME/.ssh/3nu_digitalocean")
server=root@165.22.247.213
backup_dir=${THREENU_BACKUP_DIR:-/Users/semin-na/Documents/Projects/3NU/04-backups/server-private}
mkdir -p "$backup_dir"
chmod 700 "$backup_dir"
info=$(ssh "${ssh_args[@]}" "$server" 'python3 -' <<'PY'
import hashlib,json,pathlib,re,tarfile
s=json.loads(pathlib.Path('/var/lib/3nu/ops/backup-status.json').read_text())
if not s.get('ok'):raise SystemExit('Latest backup did not succeed')
name=s['localSnapshot']
if not re.fullmatch('[a-zA-Z0-9-]+',name):raise SystemExit('Invalid snapshot name')
src=pathlib.Path('/var/lib/3nu/backups')/name
out=pathlib.Path('/root/3nu-incoming')/('backup-'+name+'.tar.gz')
out.parent.mkdir(mode=0o700,exist_ok=True)
if not out.exists():
 with tarfile.open(out,'w:gz') as t:
  for f in src.iterdir():
   if f.is_file():t.add(f,arcname=name+'/'+f.name)
 out.chmod(0o600)
with out.open('rb') as f:d=hashlib.file_digest(f,'sha256').hexdigest()
print(out.name,d)
PY
)
read -r filename checksum <<< "$info"
[[ "$filename" =~ ^backup-[a-zA-Z0-9-]+\.tar\.gz$ ]] && [[ "$checksum" =~ ^[a-f0-9]{64}$ ]]
if [ -e "$backup_dir/$filename" ]; then
  actual=$(shasum -a 256 "$backup_dir/$filename" | awk '{print $1}')
  [ "$actual" = "$checksum" ] || { echo 'Existing local backup hash mismatch' >&2; exit 1; }
else
  partial=$(mktemp "$backup_dir/.transfer.XXXXXX")
  trap 'rm -f "$partial"' EXIT
  scp "${ssh_args[@]}" "$server:/root/3nu-incoming/$filename" "$partial"
  actual=$(shasum -a 256 "$partial" | awk '{print $1}')
  [ "$actual" = "$checksum" ] || { echo 'Transferred backup hash mismatch' >&2; exit 1; }
  chmod 600 "$partial"
  mv "$partial" "$backup_dir/$filename"
  trap - EXIT
fi
printf 'Private backup copied and verified: %s\n' "$backup_dir/$filename"
