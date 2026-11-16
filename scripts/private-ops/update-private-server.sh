#!/bin/bash
# One command for a reviewed, manifest-bearing release archive. Preserves the active private/public mode; never opens the firewall.
set -euo pipefail
if [ "$#" != 1 ] || [ ! -f "$1" ]; then
  echo 'Usage: update-private-server.sh /absolute/path/3nu-buildNNN.tar.gz' >&2; exit 2
fi
archive=$1
checksum=$(shasum -a 256 "$archive" | awk '{print $1}')
remote="/root/3nu-incoming/${checksum}.tar.gz"
ssh_args=(-o StrictHostKeyChecking=yes -o IdentitiesOnly=yes -i "$HOME/.ssh/3nu_digitalocean")
server=root@165.22.247.213
ssh "${ssh_args[@]}" "$server" 'install -d -m 700 /root/3nu-incoming'
scp "${ssh_args[@]}" "$archive" "$server:$remote.part"
ssh "${ssh_args[@]}" "$server" "mv '$remote.part' '$remote' && python3 /usr/local/lib/3nu-ops/deploy.py '$remote' '$checksum'"
echo 'Server update succeeded. Copying its pre-update backup to this Mac.'
if ! "$(cd "$(dirname "$0")" && pwd)/fetch-private-backup.sh"; then
  echo 'Server update SUCCEEDED, but the local backup copy FAILED. Retry fetch-private-backup.sh; do not redeploy just for this.' >&2
  exit 3
fi
