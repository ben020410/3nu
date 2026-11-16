# 3NU 작업 규칙

- 현재 작업 폴더는 이 저장소 하나다. `docs/STORAGE_POLICY.md`의 저장 경로와 분류 규칙을 따른다.
- 보고서·캡처·원시 로그·배포 묶음은 저장소 밖 `../../03-history/build-reports/BUILD###` 등 해당 분류로 저장한다. `main/reports`, `dist/reports`, `outputs`를 만들지 않는다.
- 재생성에 필요한 입력은 `source-data`에 유지한다. 코드가 쓰는 자산을 단순히 오래됐다는 이유로 지우지 않는다.
- 디자인 자료는 `../../02-design-and-resources` 안에서 주제별로 저장한다. branding은 3NU 자체 브랜딩만 포함한다.
- 과거 스크립트를 실행하기 전에 입력 의존성과 출력 경로를 확인한다. 경로가 reports를 가리키면 외부 경로로 수정한 뒤 실행한다.
- 완료 전 `node scripts/check-repository-layout.cjs`로 출력물 유입을 확인한다. 필요한 기능 검증만 하고 반복하지 않는다.
- 사용자와 공유하는 작업본이다. 다른 작업의 변경을 덮어쓰거나 커밋에 섞지 않는다.
- 사용자 재지시 전 공개 배포하지 않는다.

- 2026-11-16 사용자 요청으로 홍보영상·홍보물은 프로젝트 최상위 `06-promotion`에 별도 보관한다. 일반 제품 시안은 기존 `02-design-and-resources`를 사용한다.
