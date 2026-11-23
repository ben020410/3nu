# 로컬 캠퍼스 서버 · BUILD106

공개 배포나 외부 서비스 없이 단일 캠퍼스를 실행한다. 기본 주소는 `127.0.0.1:8766`이다. 타이틀에서 닉네임/캐릭터를 고르고 시작하면 자동 접속한다. 닉네임은 식별자가 아니며 같은 이름을 허용한다.

## 실행과 종료

현재 통합 서버(BUILD107)는 Node.js 24 이상을 사용한다. 최초에는 `npm run setup:local`로 main 밖 비공개 저장소를 준비한다. 자세한 내용은 [LOCAL_COMMUNITY.md](LOCAL_COMMUNITY.md)를 참고한다.

Node.js 24 이상과 npm을 설치한 환경:

```sh
cd "$PROJECT_ROOT"
npm ci --ignore-scripts
npm start
```

현재 Mac에 이미 설치된 Codex Node 런타임과 의존성을 사용하는 실행:

```sh
cd "$PROJECT_ROOT"
/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node server/local107.cjs
```

`http://127.0.0.1:8766/`를 독립 브라우저/탭에서 연다. 종료는 서버 터미널에서 Ctrl+C. 포트 변경은 `PORT=8770 node server/local107.cjs`. 기본 로컬 바인딩을 유지한다. `HOST` 및 `CAMPUS_ORIGINS`는 명시적 개발 설정이며 외부 공개를 자동 구성하지 않는다. 다른 주소의 개발 클라이언트는 `window.CAMPUS_MULTIPLAYER_URL` 설정으로 연결할 수 있다.

정적 혼자 탐방은 그대로 지원한다:

```sh
python3 -m http.server 8765 --bind 127.0.0.1 --directory dist
```

이 경우 서버 연결 불가를 짧게 표시하며 혼자 탐방한다. 기본 멀티 서버는 같은 출처의 `/multiplayer` WebSocket을 사용한다. 버전 고정은 package-lock.json(ws 8.23.0, MIT). npm 설치 스크립트나 외부 계정/키를 요구하지 않는다.

## 상태와 권한

서버가 무작위 접속 ID, 재접속 자격, 33개 단일 자리 선점, 버스 공통 시각을 관리한다. 재접속 자격은 메모리에만 유지하고 공개 상태/닉네임/로그에 넣지 않는다. 새 탭은 독립 세션이다. 비정상 단절 시 즉시 자리와 공개 아바타를 회수하고 ID 재접속은 60초 허용한다. 복귀 시 자리/탑승 상태를 정리해 오프라인 상태로 공통 점유를 덮어쓰지 않는다. 타이틀 복귀는 정상 퇴장이다. 서버 재시작은 새 세션이다.

버스 노선·속도·정차·대기 UI는 기존 코드 공유. 시간표는 서버 기준 단조 시각을 2초마다 왕복 보정한다. 탑승자는 bus index와 버스 내부 상대 좌표로 표시한다. 정류장 근접/정차 조건 및 하차 위치를 서버도 검사한다. 로컬 카메라·지도·길안내·NPC는 동기화하지 않는다. 원격 캐릭터는 비충돌이며 110ms 보간, 10Hz 전송, 최대30Hz 자세 갱신, 표시거리 적용. 서버 관심 범위는800단위이고 최대20접속이다. 동적 상태는 표시 여부와 분리된다.

서버 입력은 2KB,40메시지/초 제한. 닉네임·캐릭터·동작·유한 좌표·맵 범위·이동속도(75단위/초+네트워크 여유) 검증, 타인 ID 직접 지정 불가. 클라이언트 전체 물리검증/강력한 부정행위 방어/계정 인증은 구현 범위가 아니다. 공개 운영용 TLS/프록시·대규모 부하·실제 모바일은 별도 검증이 필요하다.

## 검증/재생성

```sh
node --test scripts/multiplayer106.test.cjs
```

런타임에서 검증한 자리·노선 입력은 `source-data/multiplayer106-anchors.json`이다. 지형/빈백/버스 노선을 변경하면 로컬 앱을 실행한 뒤 Playwright가 있는 환경에서 `node scripts/bake-multiplayer106.cjs`로 재생성한다. `PLAYWRIGHT_MODULE`, `CHROME_PATH`, `CAMPUS_URL`로 로컬 도구 경로를 지정할 수 있다. 임의로 좌표를 재추정하지 않는다.

보고서: `../../../03-history/build-reports/BUILD106/REPORT.html`. 20개 가상 연결/19개 원격 모델 렌더링 확인을 실제 기기20대 검증으로 해석하지 않는다.

## BUILD110/111 local update

- 01/02/03 are three logical channels in one Node process, 100 connections per channel. First join chooses the least occupied; resume/last-channel requests preserve that channel and never silently redirect from a full one.
- Server-side 128-unit spatial grid, 180 enter / 220 exit distance, 24 nearest peers maximum, 200ms interest refresh and 100ms state snapshots. Channel populations include all connected peers, not only visible peers.
- Compact protocol 110 sends identity on enter/change; changed poses are quantized to .02 scene units and .01 radian. Legacy full snapshots remain for compatibility tests. Scene units are not measured meters.
- Seats and snapshots are isolated per channel. Switching validates capacity synchronously and commits once. Failed switch keeps membership; seated/riding users must stand/alight first, and waiting users cancel waiting before switching. Client clears old avatars only after success. Guestbooks, moderation and visit accounting remain shared.
- Every server restart clears transient sessions/seats; DB remains. Reconnect uses jittered exponential delay. Channel preference persists locally. Connection authentication remains anonymous; this is not account identity.
- Current occupancy is a real connection count. It is not a unique-human visitor count. Channel switching does not create a new community visit.
- Latest load evidence and limitations: `03-history/build-reports/BUILD110`, outside main. Deployment and proxy/backup examples: `docs/OPERATIONS111.md`.

## BUILD112 정정

현재 기본값은 사용자 확정 방식인 **공용 캠퍼스 하나·최대 300명, 가까운 최대 24명 표시**다. 위 BUILD110/111의 3채널 내용은 이전 구현 기록이다. 이전 02/03 선호값은 새 서버에서 공용 공간으로 대응한다. 현재 보안·공지·피드백·보관 정책은 [SECURITY_RETENTION112.md](SECURITY_RETENTION112.md)를 참고한다. 실행 중인 기존 서버는 이 작업에서 재시작하지 않았다. 위 명령의 `$PROJECT_ROOT`는 이 main 체크아웃의 절대 경로다.


## BUILD125 로컬 꾸미기 전달

새 클라이언트 hello protocol125는 기존 압축 위치 전송을 그대로 쓰며 선택 소품(none/scarf/cap), 고정5색과 cat 플레이어를 전달한다. 값은 서버 허용 목록으로 검증한다. 110 및 구형 접속자는 기존 메시지 형태를 유지하고 cat을 rio로 받으며 style을 받지 않는다. 구형 화면에서 신규 고양이가 오리로 보이는 호환 처리를 사용한다. 브라우저 저장에는 종류와 소품만 보관하고 이름은 기존대로 매 입장 입력한다. 실제 NPC 상태 및 공용 물리/좌석 상태는 꾸미기와 분리한다.
