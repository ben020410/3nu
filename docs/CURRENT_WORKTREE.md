# 현재 작업 트리

## 현재 공개 버전: BUILD123 / v1.0.4 (2026-11-17)

BUILD122/v1.0.3 실기기 재검증에서 사용자는 시작하기 후 로딩 끝에 ‘준비 중 화면이 다시 열렸어요’ 안내가 나타난다고 확인했다. 초기 타이틀 경량화와 별개로 캠퍼스 준비 단계의 중단이 남아 있다. 실제 iPhone 프로세스 종료 원인은 아직 확정하지 않았다.

Vercel 웹과 DigitalOcean 서버에 BUILD123/v1.0.4 배포를 완료했고 서버 필수 검사 42개, 공개 파일 해시와 준비 상태를 확인했다.

BUILD123은 모바일의 정적 건물·지형 파일을 주변 구역 단위로 불러오고 먼 구역의 CPU/GPU 모델을 해제한다. 원본 형상과 이동 경로 데이터는 유지하며, 필요한 구역이 준비되지 않으면 이동과 장면 표시를 잠시 기다린다. 다시 들어온 구역의 그림자·이름표·표시 거리·충돌 탐색 후보도 갱신한다. 전체 표시 거리 5단계에서는 전체 구역을 불러오므로 동일한 메모리 절감이 보장되지 않는다.

로컬 브라우저 측정과 구역 왕복 검증은 실제 iPhone 성공과 구분한다. 검증 기록은 저장소 밖 `03-history/build-reports/BUILD123`, 배포 기록은 `03-history/server-releases/BUILD123-20261117`에 보관한다. 2026-11-17 사용자가 iPhone 14 Pro Safari에서 v1.0.4 게임 입장 성공을 확인했다. 장시간 이용 안정성과 다른 기종의 결과는 별도 검증 범위다.

### 이전 공개 버전: BUILD122 / v1.0.3 (2026-11-17)

사용자는 BUILD121/v1.0.2에서도 iPhone14Pro Safari의 시작하기 전 첫 타이틀에서 재로딩이 발생한다고 확인했다. 데스크톱 WebKit 검사 통과를 실기기 해결로 간주하지 않는다. BUILD122는 초기 타이틀과 3D 실행 코드를 분리한다. 모바일에서는 시작하기 전 Babylon과 캠퍼스 런타임 스크립트를 요청하지 않으며, 시작 후 원래 의존 순서를 유지해 한 번만 로드한다. 타이틀의 선택·게시판·소개 기능과 기존 배경 네 장을 유지하고 모바일에서 한 장씩 표시하며 지속 확대 효과를 멈춘다.

Vercel 웹과 DigitalOcean 서버에 BUILD122/v1.0.3을 반영했다. 서버 검사 34개와 지연 로딩 검사 3개가 모두 통과했고, 공개 파일 해시와 서버 준비 상태를 확인했다. 우하단 버전 및 업데이트 내역은 v1.0.3이다. Vercel 배포 설정도 새 지연 로딩 태그에서 서버 연결 설정을 올바르게 삽입한다. 초기 JavaScript 요청량과 힙 감소는 브라우저 모의 측정이며 실제 iPhone 전체 메모리나 재시작 원인 확인은 아니다. 검증 및 배포 기록: 저장소 밖 03-history/build-reports/BUILD122 및 03-history/server-releases/BUILD122-20261117. 실제 기기 안정성은 사용자 재확인이 필요하다.

### 이전 공개 버전: BUILD121 / v1.0.2 (2026-11-17)

Vercel 웹과 DigitalOcean 서버에 BUILD121을 반영하고 서버33검사를 통과했다. 공개 핵심 파일과 v1.0.2 표기를 확인했다. BUILD120 공개 후 사용자가 iPhone14Pro의 타이틀 입력·키보드 표시·대기 중 재로딩을 보고했다. 실제 기기의 프로세스 종료 원인은 아직 확정하지 못했다. 모바일 초기 타이틀에서는 3D 엔진과 캠퍼스 데이터를 만들지 않고, 유효한 닉네임·캐릭터로 시작하기를 누른 뒤 로딩하여 바로 입장한다. 타이틀 복귀 중 숨긴 캔버스의 크기 재조정을 막고 플레이 중 연속 이벤트를 합친다. 모바일 압축 데이터 읽기는 순차 처리로 되돌려 로딩 중 할당을 겹치지 않는다. 로딩 시간 개선을 보장하지 않는다.

우하단 버전은 v1.0.2이며 배포 패키징에서 package.json.releaseVersion과 일치하는지 검사한다. 업데이트 내역에 2026.11.17 기록을 추가하고 이전 버전들을 보존했다. 로컬 macOS WebKit에서 타이틀125초 대기·입력·메뉴·화면 크기 전환 동안 엔진0/모델요청0, 시작 후 자동입장 및 연결을 확인했다. 실제 iPhone의 수정 후 안정성은 별도 재확인이 필요하다. 상세 검증·배포 결과는 저장소 밖 03-history/build-reports/BUILD121 및 03-history/server-releases/BUILD121-20261117에 기록한다.

### 이전 공개 버전: BUILD120 / v1.0.1 (2026-11-17)

GitHub 동기화와 Vercel 웹·DigitalOcean 서버 배포를 완료했다. 서버 검사32개 및 정적 자산 무결성 검사를 통과했고, 공개 웹의 핵심 파일 해시가 로컬 소스와 일치한다. 압축 파일을 최대 4개씩 미리 받고 순서대로 처리하며, 카메라·비행·닉네임 가림 검사에서 공간별 후보를 추려 원래 삼각형 검사를 수행한다. 디자인과 기능은 유지한다. 타이틀 게시판의 피드백 오른쪽에 업데이트 내역을 추가하고 상단 메뉴를 프로젝트 소개로 정리했다. v1.0 최초 배포 기록을 보존하고 v1.0.1에 2026.11.17 날짜를 표시한다.

동일 네트워크 모의 조건에서 로딩은 84.9초에서 56.2초로 감소했다. 표본 JS 힙 최고치는 478.2MB에서 622.6MB로 증가했으므로 메모리 개선 또는 실기기 안정성 향상을 주장하지 않는다. BUILD119의 실제 아이폰 시작 성공 확인과 BUILD120 검증은 구분한다. 상세는 [PERFORMANCE120.md](PERFORMANCE120.md), 배포 결과는 저장소 밖 03-history/server-releases/BUILD120-20261117에 기록한다.

### 이전 공개 버전: BUILD119 (2026-11-17)

모바일 초기 준비에서 건물·지형을 매번 계산하던 작업을 미리 생성한 압축 데이터 읽기로 바꿨다. 건물284개 그룹(메시1,208개)과 지형612개의 형상·재질·변환·선택 및 충돌 값은 기존 생성 방식과 독립 비교해 일치를 확인했다. 모바일 셔틀 안내판 텍스처를 줄이고 초기 생성 작업 사이에 브라우저가 응답할 시간을 둔다. 모바일 총 로딩 제한은300초, 요청30초·무진행45초 제한은 유지한다.

동일 시험 환경의 Chrome JS 힙 최대 표본은 약882MB에서705MB, 첫 프레임은 약647MB에서492MB였다. GPU·브라우저 전체 메모리나 실제 iPhone의 성공을 뜻하지 않는다. 정적 자산 약53.6MB가 추가되어 첫 다운로드가 늘어날 수 있다. 변경·재생성 절차와 한계는 [MOBILE119.md](MOBILE119.md)에 기록했다.

Vercel 웹과 DigitalOcean 서버 모두119를 적용했다. 서버29검사와 정적 데이터 무결성 검사, 독립 형상·재질 비교 및 macOS WebKit 모바일 프로필 검사를 통과했다. 사용자가 실제 iPhone Safari에서 정상 시작을 확인했다. 장시간 발열은 별도 확인이 필요하다. 배포 기록·백업·검증 화면은 저장소 밖에 보관한다.

### 이전 공개 버전: BUILD118 (2026-11-17)

BUILD118은 모바일 표준 화질을 30fps/DPR1/512 그림자로 조정하고, PC는 최대60fps로 제한한다. 지도·설정에서는15fps, 숨긴 탭에서는 렌더링을 중단한다. 모바일 지형의 동일 속성 정점을 공유하고 안전한16/32비트 인덱스를 사용해 형상·이동·충돌을 보존하면서 메모리를 줄였다. 표시거리 기본값3은 유지한다.

Vercel 클라이언트와 DigitalOcean 서버에 BUILD118을 적용했다. 서버 검사29개와 공개 주소의 macOS WebKit 모바일 프로필 검사(로딩, WebSocket, 가로·세로, 지도, 사진, 화질, 중단 후 재시도)를 통과했다. 실제 iPhone의 재로딩 해결 여부와 장시간 발열은 아직 미확인이다. 상세 변경은 [MOBILE118.md](MOBILE118.md), 로컬 배포 기록은 저장소 밖 `03-history/server-releases/BUILD118-20261116`에 있다.

### 이전 공개 버전: BUILD117 (2026-11-16)

공개 주소는 https://3nu.vercel.app/ 이다. Vercel은 정적 클라이언트와 동일 출처 API 중계를 제공하고, DigitalOcean의 Node.js 서버는 WebSocket과 SQLite 기반 방명록·게시판·통계를 처리한다. GitHub push와 서비스 배포는 별개다. 아래의 과거 빌드별 비공개·미검증 표기는 해당 빌드를 작성한 시점의 기록이다.

BUILD117은 완성된 초기 정점 데이터를 Float32Array로 보관하여 시험 환경의 초기 JS 메모리를 약 1.44GB에서 666MB로 줄였다. 모바일 초기화 중단 기록과 명시적 재시도, 초기 그래픽 컨텍스트 손실 안내를 추가했다. Chrome·macOS WebKit 모바일 프로필 검증 및 단위 검사 28개를 통과했다. 실제 iPhone의 메모리 부족 여부와 최종 동작은 별도 확인이 필요하다.

현재 게임 화면을 사용한 1200×630 공유 이미지는 `dist/og-preview-117.png`이며, 카카오 서버의 미리보기 캐시 초기화는 별도 작업이다. 로컬 보고서와 배포 묶음은 저장소 밖 `03-history/build-reports/BUILD117` 및 `03-history/server-releases/BUILD117-20261116`에 보관한다. 운영 비밀, 관리자 인증 자료, 실제 사용자 DB와 백업은 Git에 포함하지 않는다.

BUILD91의 정적 앱은 `dist/index.html`에서 시작한다. 별도의 번들 컴파일은 필요하지 않다.
저장소 루트에서 `python3 -m http.server 8765 --directory dist`를 실행하고 `http://localhost:8765`를 연다.

## 유지하는 자료

- 현재 앱 코드, 캐릭터·표지 자산, 지도·건물·지형 데이터
- 의존 라이브러리와 라이선스, 원출처·권한 문서
- 후속 수정과 검증에 쓰는 생성·검증 스크립트
- 최근 도로·광장 작업의 `source-data/terrain-layouts/build85`~`build90/source-geometry.json`
- 복구·보관·제작자 표시 기준

파일명의 숫자는 구현이 도입된 버전이다. 예를 들어 `photo-masses27.js`는 현재 앱에서도 로드된다.
번호가 오래됐다는 이유로 코드나 형상 입력을 제거하지 않는다.

## 현재 트리에서 제거한 자료

- `dist/build27`, `dist/gallery`, `dist/reports`: 과거 비교 이미지·갤러리·보고서 358개
- 사용되지 않는 `dist/build.json`, `dist/data/release35.json`, `dist/region-labels.js`
- 현재 코드에서 참조하지 않는 과거 보고서·비교 시점 전용 스크립트 12개

총 373개 파일, 25,674,499바이트를 제거했다. 로컬 원본·백업과 이전 GitHub 커밋에는 남아 있다.
현재 앱과 유지보수 코드에서 삭제 대상 참조가 없는지 확인했고, 남긴 실행 파일의 내용은 변경하지 않았다.

## 후속 작업

현재 모델을 수정하고 정적 앱을 제공하는 작업은 이 저장소에서 진행할 수 있다.
과거 최초 생성 과정을 모두 재현하는 저장소는 아니다. 일부 과거 생성 스크립트는 별도 보관된 승인 입력·이전 지형 자료·Python 라이브러리를 요구한다.
해당 스크립트를 다시 실행할 때 필요한 입력을 먼저 복구한다. 예전 지형 재생성을 일반적인 앱 빌드 절차로 실행하지 않는다.

GitHub 저장소, 원래 Sites 작업 폴더, 공개 배포는 자동으로 동기화되지 않는다.
후속 변경은 한 작업본에서 진행한 뒤 검토한 변경을 반영한다. 과거 캡처·보고서를 `dist`에 다시 복사하지 않는다.
실행 중 생긴 새 캡처·성능 로그는 로컬 검토 폴더에 보관한다.

자료 저장 위치와 새 보고서 작성 규칙은 [STORAGE_POLICY.md](STORAGE_POLICY.md)를 따른다. 보고서와 검수 이미지는 저장소 밖에서 관리한다.

## BUILD094 로컬 후보 (2026-11-15)

BUILD092 지도 변경과 BUILD093 성능 변경 위에 승인된 미니맵·검색·보행/비행 길안내를 적용했다. 공개 배포와 GitHub 반영은 하지 않았다. 실제 화면·이동·미확인 사항은 [BUILD094 보고서](../../../03-history/build-reports/BUILD094/REPORT.html)에 기록한다.

`flight-navigation94.js`는 기존 도착 앵커와 현재 정적 충돌 메시의 경로 구간 삼각형, 지형을 사용해 상승·수평·하강 경로를 계획한다. 세계 좌표 기하 및 같은 출발/도착 계획을 캐시하고 자동 이동 프레임에서는 전수 메시 검사를 하지 않는다. 안전한 수직 통과가 불가능하면 이유를 표시하고 자동 비행을 막는다. 건물 형상이나 충돌을 변경할 때에는 정적 계획 캐시도 새로 생성해야 한다.

`navigation94.css`는 승인 HUD의 반응형 스타일이다. 검색 시설 유형 UI는 제거했지만 내부 분류·장소 ID·별칭 및 지도 18구역은 유지한다. 미승인 캡슐·건물 소개 패널은 포함하지 않는다.

## BUILD097 로컬 작업본 (2026-11-16)

BUILD095 지도·안내 캡슐·건물 소개와 BUILD096 웅크리기를 유지한 채, `leisure97.js/css`의 조작 방법·설정·사진·잔디 빈백 30개 착석을 추가했다. `sky29.js`는 기존 구름 아틀라스 대신 공유 형상의 얇은 직각 구름을 사용한다. 공개 배포/GitHub 반영은 하지 않았다.

리오 공중 수평 이동의 지면 단차 오인을 분리했다. 점프 중력 20은 유지하고 launch=7.2×sqrt(1.2)로 최고 높이를 1.296→1.5552로 변경했다. 백학 비행 속도는 그대로다. 빈백은 레이블/검색/지도 대상으로 등록하지 않는다. 배치 입력은 `dist/data/beanbags97.json`, 실제 높이와 안전 후보는 현재 장면에서 검사한다.

설정의 사용자 시점은 walk 고정이고 개발용 리뷰 카메라는 유지한다. 속도는 .5~3.0의 6단계, 거리 6~65는 양 끝 포함 10단계다. 사진은 로컬 PNG/기기 공유만 지원하며 서버에 올리지 않는다. 출처 원문 `dist/credits.html`은 보존하며 타이틀에서 연다.

보고서와 실제 화면: `../../../03-history/build-reports/BUILD097/REPORT.html`. 실제 모바일 공유 시트는 미확인이다. 기존 경로의 잔디 내부 일부 앵커 연결 없음 및 행정관 비행 하강 안전 거절은 유지하며 이번 범위에서 그래프를 변경하지 않았다.

## BUILD098 로컬 작업본 (2026-11-16)

BUILD097을 기준으로 조작 방법 아이콘과 사진 결과의 다시 찍기를 제거하고, 캐릭터 표시를 백학/리오로 바꿨다. 사진 X 닫기·공유·저장과 기존 지도·안내·소개·상호작용은 유지한다. 공개 배포/GitHub 반영은 하지 않았다.

`dist/view-distance98.js`는 물리·검색·상태와 분리된 렌더링 후보 관리다. 128 단위 공간 셀, 건물/시설 전체 묶음과 기존 숲의 줄기+수관 묶음을 사용한다. 표시 거리 180/320/550/900/전체(6000), 기본2단계. 진입100/유지180의 여유와 이동 예측, 250ms/8단위 갱신 조건을 사용한다. `3nu.viewDistance`로 저장하며 카메라/FOV/화질을 변경하지 않는다.

지면·도로·캐릭터·길안내·빈백·신규 동적 메시는 상주한다. 표시 제한을 collision 또는 시뮬레이션 중지 신호로 사용하지 않는다. 버스/멀티플레이어 추가 시 이 분리를 유지한다. 원본 자산을 모두 로딩하고 수목 인스턴스 CPU 배열도 유지하므로 초기 로딩·메모리 절감을 주장하지 않는다.

실제 화면, 097 대비 단계별 측정, 기능·좁은 화면 검증과 미확인 사항: `../../../03-history/build-reports/BUILD098/REPORT.html`. 실제 모바일 기기 및 네이티브 공유 시트는 미확인이다.

## BUILD099 로컬 작업본 (2026-11-16)

조작방법 접기와 설정 순서·공통 기본값, ID별 건물 표시 및 공간 파티션을 적용했다. 거리60/110/180/450/전체6000, 기본2. 원본 충돌은 유지하고 먼 지형은 렌더링 전용이다. 실제 검증·성능·제약은 `../../../03-history/build-reports/BUILD099/REPORT.html`. 공개 배포/GitHub 반영 없음.

## BUILD100 로컬 작업본 (2026-11-16)

BUILD099 위에 승인 r3 순환셔틀6대·14정류장, ETA·대기·F탑승·예약/취소/하차·정류장 지도를 연결했다. 순환 시간647.834초, 속도9.722222장면단위/초·정차8초. 물리 충돌 없이 통과하며 화면 밖에서도 시간표가 진행된다. S06만 기존 구조 간섭으로 표주형, 나머지 확정 위치 유지. 건물 레이블/검색에는 등록하지 않는다.

차량 상태는 shuttle-simulation100.js의 순수 시간표, 시각·입력 연결은 shuttle100.js다. 렌더 표시/물리/길찾기와 분리했다. 실제 서버 동기화는 없음. 공개 배포/GitHub 반영 없음. 보고서와 실제 캡처: `../../../03-history/build-reports/BUILD100/REPORT.html`.

## BUILD101 로컬 작업본 (2026-11-16)

명시적 ‘버스 대기하기’ 선택은 해당 정류장에서의 일회 자동 탑승 권한이다. 기존 ‘자동 탑승 금지’는 이 경우에 한해 대체한다. 단순 접근/안내 열기는 미탑승, 취소/8단위 이탈/지상 조건 상실/타이틀 복귀 시 취소한다. 모달 중 탑승은 보류하며 닫은 후 현재 정차 조건을 재확인한다. 탑승 시 대기 소모. 수동F앞문 탑승 유지.

속도19.4444444444·각 정차4초, cycle323.916816초·6대 배차53.986136초. 버튼 세로 패딩 축소, 정류장 지도 하단 선택창 제거 및 원 선택→여백 이름 표시. 실제 변경 범위 검증과 화면: `../../../03-history/build-reports/BUILD101/REPORT.html`. 공개 배포/GitHub 반영 없음. NPC/추가 상호작용/사진 꾸미기는 미구현 논의 범위로 유지.

## BUILD102 로컬 작업본
표시 거리 기본3(180), 기존 유효 저장값 보존. 데스크톱 버스 대기/탑승/예약/정차 카드와 목록 및 부모 스크롤 제거, 내용 높이 자동. 1280×800·1920×1080 검증. 보고서 ../../../03-history/build-reports/BUILD102/REPORT.html. 공개 배포 없음.


## BUILD103 로컬 작업본 (2026-11-16)
승인 생활 고양이6종·가상180명/표시24명/세밀동작10명, 기존 보행면에서 구운 안전 경로·22명 대화·4명 정류장 옆 대기·기존 벤치2석을 연결했다. NPC 상태와 렌더를 분리하고 레이블·지도·검색·물리 충돌을 추가하지 않았다. 데이터는 dist/data/campus-life103.json, 재생성 소스는 source-data/campus-life103-baker.js.

10개 F 상호작용과 손 소품·기존 종 동작, 버스/빈백/사진/설정 입력 우선순위를 연결했다. 지상 거리·높이 검사 및 종료 정리 유지. 사진창은4프레임·장소/날짜/로고·30자 문구·원본복원. 원본 캔버스 보존, 같은 PNG를 미리보기/저장/공유에 사용하며 닫을 때 자원 해제. 설명봇·NPC 버스 승하차·네트워크 구현 없음.

최종 실제 화면·성능·검증·미확인 사항: ../../../03-history/build-reports/BUILD103/REPORT.html. 표시거리 기본3 유지. 전체표시 비행은 기존 무거움이 남고 실제 모바일 공유 시트 미확인. 공개 배포/GitHub push 없음. 사용자 별도 시작 전 후속 성능/로딩·보안/자산·백업 묶음 착수 금지.


## BUILD104 로컬 작업본 (2026-11-16)
BUILD103 위에서 초기 지형·건물 생성 순서를 유지하며12ms 예산 후 scheduler.yield(미지원 시 setTimeout)로 작업을 분산했다. 렌더 전 재질 dirty 통지를 잠시 묶고 실제 렌더 파이프라인 생성 전에 해제한다. 동일한 일반 지붕 재질만 공유(총 재질1340→1301), 같은 색처리값 재설정 통지 생략. 기본 표시거리3·객체/텍스처 수·NPC·상호작용·사진·버스·길안내 보존.

최대 초기 연속 작업4469→503ms. 첫 프레임5.751→5.698초로 총로딩 개선은 미확인, 이동은60FPS 상한 부근이며 개선 주장 없음. 원본 건물·지형2,081개 버퍼/색상 대조 동일. 실제 모바일·원격 로딩·확정 메모리 절감은 미확인. 보고서 ../../../03-history/build-reports/BUILD104/REPORT.html. 공개 배포/GitHub push 없음. 후속 작업 없이 완료 대기.


## BUILD105 로컬 작업본 (2026-11-16)
승인 r5 타이틀: 실제 기존 배경4장·2D 캐릭터·메뉴·v0.0,10초/1.2초 슬라이드, 환영 문구 넓은 명도 보정. title105.js/css는 실제 완료8단계와 첫 렌더 readiness를 연결하며 타이머 진행률을 쓰지 않는다. 준비 이후 타이틀에서는3D 렌더/시뮬레이션을 쉬고 기존 scene을 재사용한다. 메뉴 서버 없음은 빈 공지/미연결 피드백으로 명시. 상세 credits.html 보존. 최초/실패재시도/메뉴/캐릭터/버스/사진/재진입/390px 확인. 보고서 ../../../03-history/build-reports/BUILD105/REPORT.html. 공개 배포/GitHub push 없음. 다음 승인 멀티플레이어는 별도 빌드.


## BUILD106 로컬 작업본 (2026-11-16)
ws8.23.0 단일 로컬 Node서버를 추가. 무작위 접속ID/60초 재접속·33자리 서버 선점·버스 공통시각·10Hz 원격 캐릭터 상태. 개인 카메라/설정/지도/길안내 및 NPC로컬 상태 보존. 기본127.0.0.1:8766,20개접속. 서버 미실행 시 혼자 탐방. 데이터 source-data/multiplayer106-anchors.json은 실제 런타임 접점; 변경 시 baker로 재생성. 기존 건물·지형·충돌 변경 없음. 3컨텍스트/동시자리/실제버스/강제단절/재시작/30초freeze/20가상연결/19원격렌더 확인. 보고서 ../../../03-history/build-reports/BUILD106/REPORT.html, 실행 docs/LOCAL_MULTIPLAYER.md. 공개 배포/GitHub push 없음. 다음 승인 방명록·통계/타이틀보완은 별도BUILD107.


## BUILD107 로컬 작업본 (2026-11-16)
정문 포장 가장자리(-299,807)에 방명록 시설·F 안내를 추가했다. 이전 건물/지형/도로/이동 그래프와 레이블은 보존하며 새 안내판의 작은 충돌만 명시 등록한다. Node24 내장SQLite, HttpOnly 작성권한, 관리자 인증/CSRF, 60초/5개24시간·정규화 중복·idempotency 및 네트워크 보조 제한을 서버에서 적용한다. DB/비밀은 main 밖 05-management/local-runtime/development에 보관한다. 기본 실행 npm start, 첫 설정 npm run setup:local, 문서 docs/LOCAL_COMMUNITY.md.

방문은 브라우저별30분 세션·활성 탭 합집합·KST 시작일 집계, 기간별 DISTINCT 고유/재방문·탐험시작·평균활성·누적 및 관리자CSV. HeadlessChrome/인증된 개발 제외, 시험DB분리. 복구 시 DB와 private.json을 새폴더로 복원하며 기존 데이터 덮어쓰기 금지. 관리자 자격은 별도 비공개 파일로만 전달한다.

로딩 부제·짧은 상세페이지 전체배경·가이드4열·실제고양이6종 투명 정적 이미지 적용. 신규 API/동시요청/재시작/백업복구와 두 브라우저 UI/390px/타이틀재진입 확인. 성능은 동일 정문1280×800 표준/거리3에서10660.15FPS→10760.08FPS, 드로콜191→196. 성능 개선이나 메모리 절감을 주장하지 않는다. 보고서 ../../../03-history/build-reports/BUILD107/REPORT.html. 공개 배포·GitHub push 없음. 다음 승인 모바일 대응은 BUILD108로 분리한다.


## 진행 제약 정정 (2026-11-16)
사용자가 사용량 중단 기준을 명시적으로 해제하고 계속 진행하도록 승인했다. 이전 주간 잔여72% 중단 기준은 더 이상 적용하지 않는다. 모바일108·방명록109·후속3채널 구현은 로컬에서 계속 진행한다. 공개 사이트 배포는 금지한다. GitHub README·소개이미지만의 push는 전략 담당 채팅이 별도 승인받아 담당하며, 제품 코드 push 권한으로 확대하지 않는다.

## BUILD108–111 local completion (2026-11-16)

BUILD108 touch controls, responsive UI, bus/navigation/photo/building info; BUILD109 two shared guestbook facilities; BUILD110 three 100-person logical channels with server-side near-peer transmission; BUILD111 explicit production ingress and backup/restore preparation. Public deployment and product GitHub push were not performed. The separate README commit is 3f6a2b3.

Usage-budget stopping criteria were revoked by the user; they do not apply. Reports/checks/screenshots are in ../../03-history/build-reports/BUILD108 through BUILD111, never in main. Current local entry: npm start (Node 24+) at http://127.0.0.1:8766. Operational examples have not been installed on an external host. Physical mobile/Safari and public-server load remain unverified.

## BUILD112 local follow-up (2026-11-16)

Security hardening, admin-only notice editing, private feedback, explicitly disabled retention proposal/CLI and shared-campus correction are implemented locally. Default topology is one 300-capacity campus, near-peer cap24; old channel preferences migrate. BUILD110's three-channel default did not match the user's single-space choice and is superseded in new BUILD112 instances. Existing 8766 process and real runtime data remain untouched. Schema2 is additive and tested only on disposable data; real migration requires a later backed-up restart. See SECURITY_RETENTION112.md and external BUILD112/REPORT.html for measured results and limitations. No public deployment, purchase or product push.

### BUILD112 operations preparation addendum

Prepared systemd bounded restart/boot templates, daily KST consistent SQLite+secret backup job and optional encrypted remote export, failure/freshness readiness gate, Nginx ingress and monitoring/restore runbook. OPERATIONS111 is updated to current shared-campus/schema2/DigitalOcean baseline. Local isolated tests passed; systemd/nginx/restic are unavailable on this Mac, so Linux activation, real remote backup restore and email delivery remain unverified. No account changes, external service creation, actual runtime reads/restarts, purchases or public deployment. See OPERATIONS112_RUNBOOK.md and external BUILD112/OPERATIONS.html.
