# 비공개 서버 운영 도구

2026-11-16 설치. IP 165.22.247.213, systemd 3nu.service, 루프백 127.0.0.1:8766. 공개 배포/방화벽 변경 없음.

## 한 명령 업데이트

검토 완료된 RELEASE-MANIFEST.json 포함 압축본을 인자로 전달한다. 현재 작업 폴더나 GitHub HEAD를 무조건 배포하지 않는다.

```bash
/Users/semin-na/Documents/Projects/3NU/01-current/main/scripts/private-ops/update-private-server.sh /absolute/path/3nu-buildNNN.tar.gz
```

SSH 키 암호 입력은 필요할 수 있다. 원본 키 ~/.ssh/3nu_digitalocean과 기존 known_hosts를 사용한다. 서버 루트 SSH로 운영 작업을 수행하지만 앱은 3nu, 후보 설치/테스트는 별도 3nu-build 계정으로 실행한다.

절차: 전송 SHA256 → 안전한 압축 해제/파일별 매니페스트 검증 → npm ci --ignore-scripts → 후보 테스트 → 운영 데이터 백업 → current 링크 교체 → 서비스 재시작/빌드 번호까지 확인 → 맥에 백업 사본 저장.

새 코드가 정상 실행되지 않으면 이전 코드 링크로 복귀하고 재시작한다. 운영 DB는 자동 복원하지 않는다. community107.cjs가 달라지는 업데이트는 데이터/마이그레이션 검토를 위해 중단한다. 스키마 변경은 별도 승인된 전환 절차로 처리해야 한다. 강제 OS 종료/전원 손실 도중 실행의 자동 복구까지 보장하지 않는다. 후보 테스트는 실제 서버 자원을 사용하므로 공개 운영 이후에는 별도 검증 머신으로 이전 권장.

현재 BUILD112와 동일한 압축본으로 실제 전송·테스트21개·사전백업·전환·정상응답을 검증했다. 자동화 단위 테스트10개에는 경로 탈출/링크/추가 파일/비밀 파일 차단 및 실패 시 이전 코드 복귀 모의 검증이 포함된다. 실제 실패 빌드를 운영 서비스에 적용한 시험은 하지 않았다.

## 데이터와 백업

운영 DB: /var/lib/3nu/community
코드: /srv/3nu/releases, /srv/3nu/current
일일 백업: /var/lib/3nu/backups
백업 상태: /var/lib/3nu/ops/backup-status.json

3nu-db-backup.timer: 한국시간 매일03:20 + 최대10분 지연. SQLite 온라인 백업 API, 인증 자료, 파일 체크섬. 별도 경로 복원 및 재검증 통과. 자동 삭제/보존기한 정책은 아직 적용하지 않았다.

현재 CAMPUS_BACKUP_REQUIRE_OFFSITE=false를 명시해 서버 내 백업을 운영한다. 매일 자동 외부 저장소 전송은 아직 미연결이다. 서버 디스크 상실에 대한 독립 보호로 간주하지 않는다. DigitalOcean 일간 백업의 계정 설정/복원은 별도 확인이 필요하다.

2026-11-16 사용자는 DB와 관리자 인증 자료를 포함하는 백업의 맥 저장 및 이후 업데이트 때 같은 저장을 명시적으로 허용했다. 맥 위치는 프로젝트/04-backups/server-private, 디렉터리0700/파일0600. 압축 자체는 암호화되지 않는다. Git 저장소 밖이며 업로드하지 않는다. fetch-private-backup.sh는 최신 성공 백업을 다운로드하고 SHA256을 비교한다. 업데이트 후 사본 전송 실패는 종료코드3으로 표시하며 서버 업데이트 성공과 구분한다.

## 감시/이메일

3nu-health.timer: 매분 /ready, 백업30시간 경과/실패, 디스크 여유15% 미만 확인. 결과 /var/lib/3nu/ops/health-status.json. 오류는 journald에 기록. 앱 실패 제한 초과와 백업 실패는 3nu-failure@.service로 기록.

Healthchecks.io 감시 항목: Period1분, Grace5분, 이메일 integration. Ping URL은 /etc/3nu/heartbeat.json(root:3nu0640)에만 보관한다. 서버/네트워크가 꺼지면 정상 신호가 끊겨 외부에서 감지한다. 공개 HTTP 포트를 열 필요 없다. URL 연결 전 emailMonitoringConfigured=false이며 실제 이메일 전송을 보장하지 않는다. 연결 후 실제 수신 테스트가 필요하다.

URL 입력(화면에 표시하지 않음):
ssh -t -i ~/.ssh/3nu_digitalocean root@165.22.247.213 'python3 /usr/local/lib/3nu-ops/configure-heartbeat.py'

## 운영 명령(서버)

systemctl status 3nu --no-pager
systemctl list-timers --all '3nu-*'
systemctl start 3nu-db-backup.service
systemctl start 3nu-health.service
journalctl -u 3nu -u 3nu-db-backup -u 3nu-health --since '1 hour ago'

공개 운영 전에는 preview.env를 그대로 공개하지 말고 별도 HTTPS/origin/proxy 설정 및 이메일/외부 백업 확인을 마친다.

## 2026-11-16 17:45 KST 연결 확인

사용자가 제공한 Ping URL을 서버 비공개 설정에 저장했다. 실제 HTTP 전송이 성공했고 health-status의 healthy/emailMonitoringConfigured/heartbeatSent가 모두 true였다. URL은 문서와 Git에 기록하지 않았다. 감시 및 백업 타이머 enabled 확인. Healthchecks 계정의 Period/Grace 및 이메일 integration 설정, 실제 수신 여부는 아직 직접 확인하지 못했다.

## BUILD113 비공개 반영

2026-11-16 메인 완료본 반영. 서버22검사 통과, DB스키마2 유지 및 구/신 데이터 처리 호환성 검증 후 정확한 전환해시 조합을 root전용 reviewed-transitions.json에 등록. 다른 persistence 변경은 계속 중단한다. 테스트 이메일은 사용자 수신 확인. 자세한 적용 기록은 03-history/server-releases/BUILD113-20261116/PRIVATE-DEPLOYMENT.md에 보관.


## BUILD115 공개 준비 갱신

현재 앱 비공개 BUILD115. runtime_mode.py를 통해 실행 중인 서비스의 공개/비공개 환경을 검증하고 업데이트 모드를 보존한다. 공개 HTTPS 환경에서는 인증서 유효기간24시간 미만과 Nginx /ready 이상도 감시한다. 운영 도구13검사 통과. 실제 공개 전환은 별도 activate-public.py의 --publish 인자로 수행하며 아직 실행하지 않았다. 상세는 PUBLIC_LAUNCH_PREPARATION115.md. 이메일 테스트는 사용자 수신 확인, 최근 정상 heartbeat 전송 확인. 서버 일일 백업·업데이트 시 맥 사본은 작동하지만 매일 외부 사본은 아직 없다.
