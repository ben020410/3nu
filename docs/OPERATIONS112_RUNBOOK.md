# 3NU 운영 설치·감시·백업 준비

2026-11-16 KST. **준비 문서이며 아래 설치/외부 생성 명령은 아직 실행하지 않았다.** 실제 서비스 적용은 별도 승인과 도메인·리전·수신자·외부 저장소 확정 뒤 진행한다. 기존 로컬8766·실제DB·계정은 건드리지 않는다.

## 1. 준비된 파일

- `server/deploy/3nu.service.example`: 부팅 시작, 오류 재시작5초,300초/시작5회 제한, SIGTERM 정상 종료, 최소 쓰기 경로.
- `3nu-db-backup.service.example`, `3nu-db-backup.timer.example`: KST매일03:20 +0~10분 분산, 부팅 후 누락분 실행,20분 제한.
- `3nu-failure@.service.example`: 로컬 journal 진단 기록. 외부 메일 발송 기능이 아니다.
- `production.env.example`, `backup.env.example`, `nginx.conf.example`: 값 없는 설치 예시. 비밀을 Git에 채워 넣지 않는다.
- `scripts/scheduled-backup112.cjs`: 일관 스냅샷→무결성·해시 검증→선택한 암호화 외부 저장소 전송→성공 기록.
- `scripts/backup-community107.cjs`: 수동 backup/verify/restore. restore는 새 경로만 허용.

systemd의 시작 횟수 제한은 초기 시작도 포함한다. 한도에 걸리면 문제 수정 후 `systemctl reset-failed 3nu`와 명시적 시작이 필요하다. 5분 뒤 무조건 자동 복귀한다고 가정하지 않는다. [systemd 공식 시작 제한 문서](https://www.freedesktop.org/software/systemd/man/latest/systemd.unit)

## 2. 실제 설치 전에 확정할 값

DigitalOcean Basic2GiB·공유1vCPU·50GiB SSD와 일간 VM백업을 기준으로 준비한다. 계정 생성은 사용자가 마쳤지만 이 작업은 로그인/계정 변경을 하지 않았다. 리전, 공개 도메인, SSH 접근자, 검증된 알림 이메일, TLS 발급 방식, 독립 백업 저장소·접근 자격·암호 복구 위치를 확정해야 한다. 2GiB 호스트에서300명 밀집과 순간 지연을 다시 계측한다. 임의로 유료 모니터링이나 저장소를 만들지 않는다.

## 3. Linux 설치 순서 — 승인 후에만 실행

Node24, Nginx, systemd, restic 설치 경로를 확인한다. 템플릿은 `/usr/bin/node`, `/usr/bin/restic`, `/usr/bin/logger`를 기준으로 하므로 실제 위치가 다르면 먼저 수정한다. `3nu` 전용 비로그인 사용자/그룹을 만든다. 코드 릴리스는 `/srv/3nu/releases/<release>`, 현재 링크는 `/srv/3nu/current`다. 작업 중인 로컬 main 전체를 무심코 업로드하지 말고 확정 소스와 잠금 파일만 전달한다.

```sh
sudo install -d -o root -g 3nu -m 0750 /etc/3nu
sudo install -d -o 3nu -g 3nu -m 0700 /var/lib/3nu/community /var/lib/3nu/backups /var/lib/3nu/ops /var/cache/3nu-restic
```

환경 파일은 `/etc/3nu/production.env`, `/etc/3nu/backup.env`에 root:3nu0640, restic 암호 파일도0640으로 설치한다. 복구용 암호 사본은 서버 밖 별도 비밀 저장소에 보존한다. 저장소 주소·클라우드 키·암호를 명령행 인수나 보고서에 넣지 않는다. 기존 서비스 데이터를 이관할 때는 일관 백업과 필수비밀을 함께 복원한다. 신규 서비스만 `setup-community107.cjs`로 새 자격을 만든다.

템플릿의 `.example` 접미사를 빼서 `/etc/systemd/system`에 설치한다. 실제 호스트·TLS 인증서를 채운 Nginx vhost는 공개 주소 하나로 장면·API·WS를 전달한다. 방화벽은 HTTPS와 제한된 운영 SSH만 열고8766을 외부에 노출하지 않는다. 20KB Nginx 본문 제한 안에서 API 자체의4KB/공지16KB 제한도 동작한다. Nginx 정적 우회로 관리자 CSP와 파일 경로 검사를 생략하지 않는다.

```sh
sudo nginx -t
sudo systemd-analyze verify /etc/systemd/system/3nu.service /etc/systemd/system/3nu-db-backup.service /etc/systemd/system/3nu-db-backup.timer /etc/systemd/system/3nu-failure@.service
systemd-analyze calendar '*-*-* 03:20:00 Asia/Seoul'
sudo systemctl daemon-reload
sudo systemctl enable --now 3nu.service
```

처음 서버 시작은 DB를 생성/스키마2로 연다. 백업 상태 게이트가 설정됐다면 첫 성공 백업 전 `/ready`는503이며 이것이 정상 초기 상태다. 외부 저장소와 암호를 구성하고 저장소 초기화를 별도 승인 후 수행한 다음 첫 백업을 수동 실행한다. `RESTIC_REPOSITORY`는 로컬 디스크 경로를 허용하지 않으며 S3/B2/GS/Azure/SFTP/HTTPS REST 형식만 허용한다. 형식만으로 다른 서버인지 보장되지는 않으므로 실제 저장 위치가 별도 장애 영역인지 확인한다. SFTP는 서버 키 검증과 ProtectHome 제약을 포함한 별도 SSH설정이 필요하다.

```sh
sudo systemctl start 3nu-db-backup.service
sudo systemctl status 3nu-db-backup.service
sudo systemctl enable --now 3nu-db-backup.timer
systemctl list-timers 3nu-db-backup.timer
```

아직 외부 저장소가 없으면 기본 `CAMPUS_BACKUP_REQUIRE_OFFSITE=true`로 첫 작업이 실패한다. 로컬 스냅샷은 남지만 성공으로 표시하지 않는다. 운영자가 임시 로컬 전용 모드를 명시적으로 승인한 경우에만 false를 쓰고, 외부 보관 미완료를 따로 기록한다. false는 암호화나 전체 서버 손실 대비를 제공하지 않는다.

## 4. 자원 이메일 알림 — DigitalOcean Monitoring

Monitoring은 무료 opt-in이며 CPU·메모리·디스크 등 자원 지표를 받으려면 metrics agent가 필요하다. Droplet 생성 시 Monitoring을 켜거나 공식 설치 절차를 따르고 Insights에 실제 데이터가 들어오는지 확인한다. [공식 빠른 시작](https://docs.digitalocean.com/products/monitoring/getting-started/quickstart/)

Control Panel → Monitoring → Create Resource Alert에서 이 Droplet만 선택하고 아래 초기안을 적용한다. 임계값은 이 프로젝트의 출발안이며 실제 정상 부하를 보고 조정한다.

| 이름 | 지표 | 초기 임계값/지속 | 조치 |
|---|---|---|---|
| 3NU CPU | CPU Utilization Percent | 80% 초과5분 | 동시 접속·백업 시간·이벤트루프/프로세스 확인 |
| 3NU Memory | Memory Utilization Percent | 80% 초과5분 | RSS/스왑/프로세스·OOM 확인 |
| 3NU Disk | Disk Utilization Percent | 75% 초과5분 | DB/WAL/백업·로그 증가 확인, 승인 없이 삭제 금지 |

Email에 계정의 검증된 수신자를 선택한다. 개인 계정에 임의의 별도 이메일을 넣을 수 있다고 가정하지 않는다. 팀 공유는 같은 팀의 검증된 구성원 등 실제 UI의 허용 범위를 확인한다. 생성 뒤 시험 알림을 수신하고 복구 알림도 확인해야 완료다. 설정 자체는 이번에 생성하지 않았다. [알림 설정](https://docs.digitalocean.com/products/monitoring/how-to/manage-resource-alerts/) · [수신자 등 제한](https://docs.digitalocean.com/products/monitoring/details/limits/)

자원 알림은 웹/API 가용성·게임 오류·순간 이동 지연 검사를 대신하지 않는다. 서버 전원이 꺼져 지표 전송이 끊긴 경우를 자원 임계치 알림만으로 탐지한다고 표현하지 않는다.

## 5. 외부 HTTPS 가용성 알림

동일 서버 안 cron/curl이 아니라 서버 밖 관측 서비스를 이용한다. DigitalOcean Uptime의 HTTPS 검사 한 개를 후보로 준비했다. 공식 문서는 월1개 무료 allowance와672시간 크레딧을 설명하므로 계정의 이미 사용 중인 검사와 실제 청구 화면을 확인하고 무료 범위가 확실하지 않으면 생성하지 않는다. 추가 유료 검사는 승인 없이 만들지 않는다. [Uptime 가격](https://docs.digitalocean.com/products/uptime/details/pricing/)

- 대상: 확정된 `https://도메인/ready` (중간 캐시 금지, 로그인 쿠키/토큰 불필요).
- 외부 관측 지역: Asia East 우선. HTTPS 연결 실패·인증서 만료·비정상 HTTP 상태를 확인한다.
- downtime 알림 초기안: 서비스가 허용하는 가장 가까운3분 지속 값. 이메일 수신자를 확인하고 장애/복구 모두 시험한다.
- 필요하면 같은 검사에 인증서 만료14일 전, 지연1000ms 지속5분 알림을 추가한다. 실제 UI에서 지원하는 값과 무료 범위를 확인한다.

[Uptime 기능/외부 관측과 이메일 알림](https://docs.digitalocean.com/products/uptime/details/features/). 실제 수신 확인 전 '알림 작동 완료'로 처리하지 않는다. Droplet뿐 아니라 공급자 전체 장애에 대비하려면 다른 공급자의 무료 외부 관측도 후보이나 이번에 가입/추가하지 않았다.

`CAMPUS_BACKUP_STATUS_FILE`을 켜면 `/ready`는 DB 조회와 함께 백업 상태를 확인한다. 최신 실패, 성공 후30시간 경과, 진행 상태20분 초과, 상태 파일 누락/손상은503이다. 운영 알림이므로 백업 실패만으로 게임을 강제 중단하지 않고 다른 API는 계속 제공한다. 재시작이나 데이터 복구를 자동 실행하지 않는다. 이 게이트를 load balancer의 무조건 퇴출 신호로 사용하지 않는다.

외부 검사에서503을 장애로 처리하는지 실제 서비스 설정에서 확인한다. staging의 백업 상태를 실패로 만든 시험, 프로세스 중지, 가능한 독립 staging VM 종료를 각각 구분해 테스트한다. 사용자 사용 중인 서버를 몰래 종료해서 시험하지 않는다. 이메일과 모니터링 계정은 3NU 서버가 내려가도 접근 가능해야 한다.

## 6. 두 종류의 백업

**VM 일간 백업:** 선택한 percentage 방식은 서버 요금의30%다. 일간7일 보관이 공식 가격표에 기재돼 있다. 실제 선택 화면에서 percentage daily인지 확인한다. VM 백업은 시스템 복구용이며 메모리·캐시를 포함하지 않는 crash-consistent 특성과 볼륨 제외 제한이 있다. 활발한 DB 쓰기에는 별도 애플리케이션 백업을 함께 쓴다. [가격](https://docs.digitalocean.com/products/backups/details/pricing/) · [보관](https://www.digitalocean.com/pricing/backups) · [한계](https://docs.digitalocean.com/products/backups/details/limits/)

**일관 DB+필수비밀 백업:** KST03:20~03:30에 읽기 트랜잭션으로 시점을 고정한 SQLite backup API로 `community.sqlite`를 만든다. 원본에 쓰기가 계속돼도 동일 시점 읽기를 사용한다. WAL 사용 중 읽기 트랜잭션은 checkpoint를 지연시킬 수 있으므로 작업시간/디스크 여유를 감시한다. `private.json`과 존재하는 관리자 암호 파일을 함께 복사하고 권한0600/디렉터리0700, integrity_check, foreign_key_check, SHA256 manifest를 검증한다. 자격 파일이 도중에 바뀌면 실패 처리한다. [SQLite 온라인 백업](https://www.sqlite.org/backup.html)

검증된 전용 스냅샷만 restic으로 외부 암호화 저장소에 보낸다. 종료코드와 snapshot ID 확인 후 성공 상태를 남기며, 외부 실패면 비밀을 로그에 출력하지 않고 실패 상태/비정상 종료를 남긴다. 이것은 원격 복원 성공을 뜻하지 않는다. restic 저장소 암호는 별도 서버 밖에 복구 가능하게 보관해야 한다. 로컬 스냅샷만 있는 상태를 전체 서버 손실 대비 완료라고 하지 않는다. VM 백업이 로컬 일관 스냅샷까지 포함하더라도 독립 계정/공급자 보관과 같은 보장으로 취급하지 않는다. [restic 백업](https://restic.readthedocs.io/en/stable/040_backup.html)

자동 삭제/forget/prune는 이번에 추가하지 않았다. 로컬 스냅샷과 외부 저장소가 계속 늘어나므로 디스크 알림과 보관 수량 정책 승인이 필요하다. 오래된 원시 방문 삭제 정책과 백업 보관 기간을 섞지 않는다. 잠금 `.backup-running`이 남으면 실제 실행 여부와 journal부터 확인하고, 프로세스가 없고 작업이 끝났음을 확인한 뒤 운영자가 잠금만 정리한다.

VM 백업 창이 선택 가능하다면 일관 백업 뒤 시간대로 맞추되 실제 UI시간대를 확인한다. KST03:20은 전날18:20UTC다. 백업은 즉시 무손실 복제가 아니며 일간 스케줄의 기본 복구 시점 목표는 최대 약24시간+실패기간, 복구 완료 시간은 리허설 전 미확정이다.

## 7. 복원 리허설

1. 원격 백업은 restic으로 **새 빈 복원 디렉터리**에 내려받는다. snapshotID를 명시하고 경로를 확인한다. 운영 경로에 직접 restore/--delete를 실행하지 않는다. [공식 복원 절차](https://restic.readthedocs.io/en/stable/050_restore.html)
2. 내려받은 스냅샷에서 `node scripts/backup-community107.cjs verify /absolute/snapshot`으로 manifest·DB·비밀 검증.
3. `node scripts/backup-community107.cjs restore /absolute/snapshot /absolute/new-runtime`으로 새 경로에 복원한다. 구형 백업에 manifest가 없으면 SQL/비밀 구조 검사만 가능하므로 해시 검증과 동일하게 표현하지 않는다.
4. 별도 포트의 `CAMPUS_DATA_DIR=/absolute/new-runtime` 서버에서 /ready, 관리자 로그인, 방명록·공지·피드백 행, 기존 소유자 접근을 확인한다. 운영 백업 gate는 시험 상태 파일을 별도로 사용하거나 검증용 인스턴스에서 생략한다.
5. 새 DB에 쓰기가 발생하면 원래 snapshot manifest와 달라지는 것이 정상이다. 원본 스냅샷은 읽기 전용 보관하고, 복원 runtime을 다시 백업할 때는 새 manifest를 만든다.
6. 실제 전환은 기존 서비스 백업/신규 쓰기 보존 계획→정상 종료→새 데이터 경로 전환→재시작→외부 확인 순서다. 복구 시점 이후 글을 무단으로 버리지 않는다.

현재 로컬에서는 온라인 쓰기와 백업, 무결성·권한·변조 감지, 새 경로 복원, 복원 후 쓰기/재백업까지 확인했다. VM전체 복원·원격 저장소 복원·실제 관리 자격 복원은 아직 수행하지 않았다.

## 8. 설치 후 검수표

- systemd-analyze verify / nginx -t 통과와Node24 경로 확인.
- enable상태와 실제 재부팅 후 자동 시작.
- staging 프로세스 오류 후5초 재시작, 반복 오류가300초/시작5회에서 차단되는지 확인.
- TLS/Host/프록시 실제IP와WS재접속 확인.
- 자원 이메일·외부 downtime/복구 이메일을 실제 수신.
- 첫 DB+필수비밀 백업, 타이머 다음 실행시각, 외부 snapshot 확인.
- 원격 복원→별도 포트 로그인/글 확인, VM백업으로 새 Droplet 복구 리허설.
- 수신자·리전·도메인·외부 저장소·비밀 복구 위치·보관기간·운영 담당 확정.

이 체크가 끝나기 전 운영 설치나 알림/백업 완전 작동으로 보고하지 않는다.
