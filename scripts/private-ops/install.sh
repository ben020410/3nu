#!/bin/bash
set -euo pipefail
umask 077
install -d -o root -g root -m 755 /usr/local/lib/3nu-ops
install -m 644 /root/3nu-ops-upload/deploy.py /root/3nu-ops-upload/heartbeat.py /root/3nu-ops-upload/runtime_mode.py /usr/local/lib/3nu-ops/
getent passwd 3nu-build >/dev/null || useradd --system --user-group --home-dir /var/cache/3nu-build --shell /usr/sbin/nologin 3nu-build
install -d -o 3nu-build -g 3nu-build -m 700 /var/cache/3nu-build
install -d -o 3nu -g 3nu -m 700 /var/lib/3nu/ops /var/lib/3nu/backups /var/cache/3nu-restic
[ ! -e /etc/3nu/backup.env ]
cat > /etc/3nu/backup.env <<'ENV'
CAMPUS_DATA_DIR=/var/lib/3nu/community
CAMPUS_BACKUP_ROOT=/var/lib/3nu/backups
CAMPUS_BACKUP_STATUS_FILE=/var/lib/3nu/ops/backup-status.json
# Explicitly server-local until an independent storage account is connected.
CAMPUS_BACKUP_REQUIRE_OFFSITE=false
RESTIC_BIN=/usr/bin/restic
RESTIC_CACHE_DIR=/var/cache/3nu-restic
ENV
chown root:3nu /etc/3nu/backup.env
chmod 640 /etc/3nu/backup.env
if [ ! -e /etc/3nu/heartbeat.json ]; then
  printf '{"ping_url":""}\n' > /etc/3nu/heartbeat.json
  chown root:3nu /etc/3nu/heartbeat.json
  chmod 640 /etc/3nu/heartbeat.json
fi
for name in 3nu-db-backup.service 3nu-db-backup.timer 3nu-failure@.service; do
 install -m 644 "/srv/3nu/current/server/deploy/$name.example" "/etc/systemd/system/$name"
done
cat > /etc/systemd/system/3nu-health.service <<'UNIT'
[Unit]
Description=3NU private readiness, backup age and disk check
OnFailure=3nu-failure@%n.service
[Service]
Type=oneshot
User=3nu
Group=3nu
ExecStart=/usr/bin/python3 /usr/local/lib/3nu-ops/heartbeat.py
TimeoutStartSec=25
UMask=0077
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/3nu/ops
UNIT
cat > /etc/systemd/system/3nu-health.timer <<'UNIT'
[Unit]
Description=3NU private health heartbeat each minute
[Timer]
OnBootSec=1min
OnUnitActiveSec=1min
AccuracySec=5s
Unit=3nu-health.service
[Install]
WantedBy=timers.target
UNIT
install -d -m 755 /etc/systemd/system/3nu.service.d
cat > /etc/systemd/system/3nu.service.d/failure.conf <<'UNIT'
[Unit]
OnFailure=3nu-failure@%n.service
UNIT
chmod 644 /etc/systemd/system/3nu-health.{service,timer} /etc/systemd/system/3nu.service.d/failure.conf
systemd-analyze verify /etc/systemd/system/3nu-db-backup.service /etc/systemd/system/3nu-db-backup.timer /etc/systemd/system/3nu-health.service /etc/systemd/system/3nu-health.timer
systemctl daemon-reload
systemctl start 3nu-db-backup.service
systemctl enable --now 3nu-db-backup.timer 3nu-health.timer
systemctl start 3nu-health.service
systemctl list-timers --all '3nu-*' --no-pager
cat /var/lib/3nu/ops/backup-status.json /var/lib/3nu/ops/health-status.json
