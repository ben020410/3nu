# BUILD116 · Vercel 공개 전 준비

2026-11-16 최초 준비 기록. 이후 집에서 재개하여 BUILD116 서버 반영과 Vercel 계정/프로젝트 연결을 완료했다. 최신 상태는 `../../../03-history/server-releases/BUILD116-20261116/PREPUBLIC-READY-20261116.md`를 우선한다. 공개 배포·방화벽 개방·GitHub push는 하지 않았다.

## 구조

브라우저의 게임 파일은 Vercel 정적 배포, /api/*는 Vercel Node 함수 → 기존 DigitalOcean HTTPS 서버, 멀티플레이는 브라우저 → DigitalOcean WSS 직결이다. 실제 DB/방명록/통계/멀티플레이 상태는 기존 서버에만 둔다. API 쿠키는 Vercel 주소의 host-only Secure/HttpOnly/SameSite=Strict 쿠키다. CORS 전체 허용이나 크로스 사이트 쿠키로 우회하지 않는다.

주소 https://3nu.vercel.app 는 semin12 팀의 3nu 프로젝트에 verified 상태로 배정되었다. 아래의 최초 준비 단계 설명은 진행 당시 기록이다. 이름 입력만으로 예약되었다고 간주하지 않는다. 실제 계정에서 할당 여부를 확인하고, 다른 주소가 나오면 아래 설정 양쪽을 함께 바꾼다. origin에는 끝 /를 쓰지 않는다.

## 저장된 코드

- vercel.json: Other, dist, Node 24, 싱가포르 함수, API rewrite, Git 자동 배포 false, 관리자 페이지 보안 헤더.
- api/gateway.js / server/vercel-gateway116.cjs: 서버 간 비밀키 인증, Vercel이 제공한 방문자 IP 전달, API 경로 제한, 8초 제한, POST 자동 재시도 금지, 응답/쿠키 캐시 금지. 비밀키를 브라우저에 넣지 않는다.
- scripts/vercel-build116.cjs: 공유 메타 주소와 WSS 주소를 배포 시 생성. CAMPUS_RELEASE_APPROVED=116 없으면 빌드 실패. 로컬 main/dist에 직접 실행하지 않는다. 불변 frontend-source 복사본에서만 빌드한다.
- server/request-policy111.cjs: 기존 HTTPS IP origin 보호 유지. 선택한 브라우저 origin과 서버 간 키가 설정된 경우에만 API 중계/정확한 Origin의 WSS 허용. 설정이 없으면 BUILD115와 같은 인입 정책.
- scripts/vercel116.test.cjs: 실제 격리 HTTP API/DB/WS 및 정책·실패 처리 검사. TLS/Vercel 실제 플랫폼 검증과 구분한다.
- scripts/package-vercel116.py: 최신 작업본을 불변 backend/frontend 소스와 체크섬으로 저장. 기존 백업과 과거 빌드는 보존한다.

## 계정/서버에 넣을 설정

Vercel Production 전용:

- CAMPUS_BROWSER_ORIGIN=https://3nu.vercel.app
- CAMPUS_UPSTREAM_ORIGIN=https://165.22.247.213
- CAMPUS_EDGE_PROXY_SECRET=개인 설정 파일의 무작위 64자리 값
- CAMPUS_RELEASE_APPROVED=116: **공개 지시와 비공개 서버 검증 이후에만** 추가

DigitalOcean의 별도 검증용 production 서비스에 먼저 적용:

- CAMPUS_PUBLIC_ORIGIN=https://165.22.247.213 (기존 유지)
- CAMPUS_BROWSER_ORIGIN=https://3nu.vercel.app
- CAMPUS_EDGE_PROXY_SECRET=Vercel과 동일한 비밀키
- HOST=127.0.0.1, CAMPUS_TRUST_PROXY=127.0.0.1 유지

비밀키는 프로젝트 밖 관리 경로 05-management/local-runtime/vercel116의 소유자 전용 파일에 저장한다. Git, 패키지, HTML, 브라우저 코드, 채팅에 출력하지 않는다. Vercel 미리보기 도메인은 자동 허용하지 않는다.

## 집에서 재개

1. 맥 터미널: ssh-add -t 2h ~/.ssh/3nu_digitalocean (키 암호는 본인만 입력).
2. 준비된 3nu-build116.tar.gz를 기존 update-private-server.sh로 비공개 서버에 반영. 스크립트는 방화벽을 열지 않으며, 백업/맥 사본/27검사/현재 모드 보존을 수행한다.
3. prepublic의 분리 DB/별도 서비스에서 위 browser origin/secret을 적용하고 실제 Nginx HTTPS·WSS·쿠키·API를 검증. 운영 DB는 시험에 사용하지 않는다.
4. Vercel 계정 로그인/CLI 연결과 실제 3nu.vercel.app 할당 가능 여부 확인. 사용자는 아직 앞서 안내한 New Project 설정을 입력하지 않았다. 구형 GitHub main을 그대로 Deploy하지 않는다. 저장된 frontend-source를 검토한 뒤 업로드하거나, 동등한 최신 코드 전체를 Git에 반영한다. 자동 배포는 꺼둔다.
5. 공개 지시 후에만 RELEASE_APPROVED 설정 및 Vercel 배포/서버 443 개방. activate-public.py는 이제 Vercel 환경파일 추가 및 설정 일치 검증을 포함한다. `--check 116`는 통과했고 `--publish`는 아직 실행하지 않았다. 실제 공개 전환과 복구 성공까지 검증된 것으로 간주하지 않는다.
6. 외부 PC·실제 휴대폰에서 멀티플레이 2인, 방명록 작성/내 글 수정·삭제, 관리자 로그인, 사진 공유 확인. Vercel 함수의 rewrite query/Host/IP 헤더, Set-Cookie 전달을 실제 배포에서 확인한다.

## 현재 한계

- 재개 후 SSH 인증을 확인해 BUILD116 비공개 반영 및 실제 TLS/WSS 11개 검사를 완료했다.
- Vercel 계정·프로젝트 연결 및 주소 배정·환경변수 저장은 완료했다. 배포는 0건으로 실제 클라우드 함수 실행 검증은 미완료다.
- 프런트엔드 배포를 추가했으므로 기존 서버 한 명령 업데이트만으로 양쪽 버전이 함께 갱신되지는 않는다. 첫 Vercel 연결 후 통합 업데이트 명령의 버전 일치/복구 검증이 필요하다.
- 도배 방지와 관리자 인증을 유지한다. 무제한 트래픽/300명 실사용 성능을 보장하는 검사는 아니다. Vercel 무료 한도는 별도 서비스 한도에 따른다.

## 공식 참고

- https://vercel.com/docs/functions/runtimes/node-js
- https://vercel.com/docs/headers/request-headers
- https://vercel.com/docs/routing/rewrites
- https://vercel.com/docs/project-configuration/git-configuration
