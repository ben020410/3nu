# 자료별 출처와 권한 검토

확인일 2026-11-15. 출처를 표시했다고 모든 자산의 사용 허가가 확보되는 것은 아니다. 아래는 파일과 현재 확인한 근거의 분류이며 법적 승인 문서가 아니다.

| 자료 | 현황·조치 | 근거 |
|---|---|---|
| OSM 계열 건물·도로 데이터 | 출처·ODbL 표시와 파생 데이터 제공 경로 유지. 앱 전체 코드의 라이선스와 분리 | https://www.openstreetmap.org/copyright |
| SMASH-SNU | 저장소 코드·그림·화면 디자인 재배포는 허용된 것으로 취급하지 않음. 별도 조건의 공간 데이터와 참고 자료를 분리. 현재 credits에 독립 구현 설명이 있으나 코드 전체 유사성 감사를 완료한 것은 아님 | https://github.com/Hong-Iron/SMASH-SNU/blob/main/LICENSE |
| 고도 데이터 | Skadi/Mapzen, USGS SRTM 출처 유지. 게임용 지형 수정은 실측 고도와 구분 | https://github.com/tilezen/joerd/blob/master/docs/attribution.md |
| Babylon.js / earcut | 배포 vendor 라이선스 파일 보존. 각각 Apache-2.0 / ISC로 로컬 파일 확인 | dist/vendor/BABYLON-LICENSE.md, EARCUT-LICENSE |
| 서울대 정장·기관 UI | 정문 바닥 및 301 표지 등에 공식 자산 사용 기록이 있음. 자유 재사용 자산으로 간주하지 않음. 현재 목적에 필요한 사용 조건·허가 확보 여부는 미확인 | https://www.snu.ac.kr/about/symbol/ui , https://identity.snu.ac.kr/ui/1 |
| 3NU 마크·캐릭터 이미지 | 프로젝트 제공/생성 자산으로 보관. 공식 UI·기존 캐릭터와의 관계 및 원본 제작 권한을 별도 확인해야 하며 자동 권리 보장을 하지 않음 | dist/assets, generated_images, 승인 시안 기록 |
| 외관 참고 사진·위성/지도 화면·PDF | 디자인 참고 원본은 비공개 보관. 업로드 준비본에 별도 시안 폴더·비공개 참고 원본은 포함하지 않음. 다만 기존 dist 안에 공개되어 있던 과거 빌드 갤러리·검증 화면은 실행본 보존을 위해 포함함. 사진 자체를 홍보물에 사용하려면 별도 권한 확인 | design-reviews 및 각 출처 기록 |

구체적으로 확인이 남은 배포 자산: assets/official-sha-symbol44.png, assets/snu-engineering-ui-original.png 및 3NU·캐릭터 원본의 출처/권한 기록. 기존 사이트 자산을 임의 제거하지 않았으며 허가 완료로 표시하지 않았다.

공개 credits.html은 BUILD11 중심 과거 구현 설명과 여러 후속 이력이 섞여 있다. 기록 보존용으로 유지하되 정식 출처 화면을 만들 때 현재 데이터·자산 출처와 과거 빌드 설명을 분리한다. 이후 타이틀/출처 화면 작업의 입력으로 사용한다.

GitHub 공개용 LICENSE를 임의로 MIT 등으로 지정하지 않는다. 권리 조건이 다른 데이터·라이브러리·공식 상징 자산을 단일 앱 라이선스로 덮지 않는다.
