# 3NU 저장 및 분류 규칙

현재 개발·확인·GitHub 작업본은 `01-current/main` 하나다. 아래 경로는 3NU 루트 기준이다.

| 종류 | 저장 위치 | 기준 |
|---|---|---|
| 실행 코드·현재 사용 자산 | `01-current/main/dist` | 실행에서 사용하는 파일만 유지 |
| 재생성에 필요한 입력 | `01-current/main/source-data` | 보고서가 아닌 소스. Git 버전 관리 유지 |
| 유지보수·검증 코드 | `01-current/main/scripts` | 보고서 출력은 저장소 외부로 지정 |
| 3NU 자체 로고·브랜드 | `02-design-and-resources/branding` | 학교·단과대·외부 서비스 로고는 넣지 않음 |
| 외부 상징·캠퍼스 참고 | `02-design-and-resources/campus-reference` | 출처·권리 문서와 함께 보관 |
| 건물 시안·참고 사진 | `02-design-and-resources/buildings/<장소>` | 장소가 먼저, 초안·최종본·revision은 그 아래 |
| 광장·조경·체육시설 | `02-design-and-resources/landscape-and-plazas/<장소>` | 경관·바닥·테니스장·폭포 포함 |
| 미니맵·구역·검색·길안내 | `02-design-and-resources/minimap-and-navigation/<기능>` | 관련 자료를 기능별로 모음 |
| 레이블·건물 목록 | `02-design-and-resources/labels-and-building-catalog` | 엑셀·판단표·승인 기록 |
| 도로·지형·지리 원본 | `02-design-and-resources/roads-and-terrain/<주제>` | 원본 입력과 시안 구분 |
| 빌드 보고서 | `03-history/build-reports/BUILD###` | 보고서·screenshots·checks를 같은 번호 아래 저장 |
| 옛 코드 전체본 | `03-history/build-snapshots` | 내부 구조와 원본 이력을 보존. 현 작업본으로 사용 금지 |
| 배포·배포용 압축본 | `03-history/release-packages/BUILD###` | 실제 기록으로 번호 확인 |
| 과거 구현 스크립트·중간 입력 | `03-history/implementation-work` | 결과 보고서와 분리 |
| 과거 사용한 전달 입력 | `03-history/implementation-inputs` | 구현 당시의 패키지 보관 |
| 단독 원시 검증 로그 | `03-history/validation-logs` | 빌드 보고서에 해당하는 새 로그는 보고서 폴더 checks 사용 |
| 미사용 확인된 자산 | `03-history/unused-assets/<주제>` | 참조·동적 로딩·출처 확인 후만 이동. 이름만 보고 삭제 금지 |
| 개발 도구 환경 | `03-history/environment-tools` | 과거 Python/Node 환경, 재설치가 필요할 수 있음 |
| 백업 | `04-backups` | 외부 장치 사본 별도 필요 |
| 분류·이동·출처 검토 관리 | `05-management` | 이동표, 보관 규칙, 권리 검토 등 |

브랜딩은 현재 3NU_logo.png 하나다. 공대 ENGINEERING 원본은 campus-reference/institution-marks, 그 가공 실험은 buildings/upper-engineering/sign-texture-studies에 보관한다.

새로운 자료를 early-날짜, build-번호라는 이름의 디자인 최상위 폴더로 만들지 않는다. 내용/장소/기능을 우선한다. 날짜·빌드·P/F/R 번호는 그 아래 버전 식별용이다. 서로 다른 장소가 함께 있는 검토 묶음은 buildings/area-reviews에서 실제 지역명이 붙은 P 묶음으로 보관한다. 패키지 내부 참고 사진·시안·메타데이터는 상대 링크를 유지하기 위해 한 묶음으로 유지한다.

main/reports/build85~90의 source-geometry.json은 도로/광장 재생성 입력이므로 source-data/terrain-layouts로 이동했다. repair85/compile.cjs는 입력을 여기서 읽고 출력은 THREENU_REPORTS_DIR/BUILD085/generated에 저장한다. 환경변수가 없으면 현재 통합 폴더의 03-history/build-reports를 사용한다.

main에 reports, outputs, screenshots, build-logs, 옛 배포 ZIP, 비교용 갤러리를 생성하지 않는다. 과거 스크립트를 재사용할 때에는 실행 전에 출력 경로를 외부 폴더로 바꾼다. 기존 역사 스크립트의 하드코딩 reports 경로를 그대로 실행하지 않는다. 작업 완료 시 node scripts/check-repository-layout.cjs로 실수로 생긴 출력 폴더를 확인한다. .gitignore는 커밋 유입을 막을 뿐 저장 자체를 차단하지 않는다.

빌드 보고서는 REPORT.html 또는 REPORT.md/REPORT.txt, screenshots/, checks/, 구현·검증·미확인 사항으로 구성한다. 배포하지 않았으면 로컬 완료라고 명시한다. 빌드1부터의 목록은 존재하는 원본을 연결하고 없는 보고서는 미확인으로 표시한다. 없는 보고서·배포 완료를 만들어내지 않는다. 옛 코드 스냅샷 속 보고서는 원본 보존용이며 중앙 보고서 모음에 열람용 사본을 모은다.

자료 이동은 경로표와 연결 확인을 남긴다. 파일명만으로 자동 삭제/중복 제거하지 않는다. 공개 배포는 사용자가 다시 지시할 때까지 중단한다.
