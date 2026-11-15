"""Build a local, self-contained review index from saved BUILD33 evidence."""
import csv
import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'reports/build33'
read = lambda name: json.loads((OUT / (name + '.json')).read_text())
alignment = read('alignment')
perf = read('performance')
movement = read('movement')
mesh = read('mesh-audit')
scenes = [
    ('gate', '정문 진입부와 순환 분기'),
    ('transition', '468202819 → 455015956 · 기존 15m/6m 접속'),
    ('lower', '아래 공대 구간'),
    ('engineering', '301·302동 주변 순환 구간'),
    ('return', '반대편 복귀 구간'),
    ('whole', '순환도로 전체 · 북쪽 위 정사영'),
    ('transition-ground', '연결 구간 지상 시점'),
]
mapping = []
with (OUT / 'road-id-mapping.csv').open('w', newline='') as f:
    w = csv.writer(f)
    w.writerow(['순서', '이전ID', '현재ID', '이전명목폭_m', '현재폭_m', '순환시작_m', '순환끝_m'])
    for item in alignment['mapping']:
        row = [item['order'] + 1, item['oldId'], item['currentId'], item['beforeWidth'], item['afterWidth'], *[round(s, 2) for s in item['chainage']]]
        w.writerow(row)
        mapping.append('| ' + ' | '.join(map(str, row)) + ' |')

performance_rows = []
for key, label in [('transition', '15m/6m 접속 상공'), ('ground', '같은 구간 지상'), ('engineering', '301·302동'), ('whole', '전체 전경')]:
    a, b = perf['before'][key], perf['after'][key]
    performance_rows.append(f"| {label} | {a['fps']} → {b['fps']} | {a['meanMs']} → {b['meanMs']} | {a['p95Ms']} → {b['p95Ms']} |")

report = '''# BUILD33 — 순환도로 15m / 왕복 4차선

지정된 21개 순환도로 ID와 정문 연결부를 수정했다. 순환 중심선 길이는 모델 기준 **5,178.07m**다. 기존 ID를 모두 현재 데이터에서 찾았으며 ID를 바꾸지 않았다. 건물 위치·윤곽·외형, 기존 다층 시설 데이터, 비대상 도로의 폭은 유지했다.

**이 결과는 사용자 요청에 따른 4차선 각색이며 실제 구간별 차로 수·도로 폭의 측량 재현이 아니다.**

## 폭과 차선

- 차도 15m = 차로 3.3m × 4 + 양쪽 가장자리 여유 0.9m × 2. 보도는 별도다.
- 중앙 이중 황색 실선: 선폭 0.11m, 중심에서 각각 0.16m. 기존 정문 색상 계열 유지.
- 흰 점선: 선폭 0.12m, 3m 선 / 4m 공백, 중심에서 ±3.3m.
- 흰 가장자리선: 선폭 0.12m, 중심에서 ±7.12m.
- 39개 교차·분기 구간에서 차선을 끊고, 도로 ID가 바뀌어도 누적 거리 기준 점선 위상을 유지한다. 폐합점은 정문 교차로의 차선 제외 구간 안에 있다.
- 교차로 입구는 연결 면으로 넓어질 수 있다. 직선·곡선 본선의 기본 차도 폭은 15m다.

이전 데이터는 468202819의 명목 폭만 15m였고 나머지 20개는 6m였다. 정문 도로에도 별도의 폭 프로파일로 10.5→15m가 적용된 짧은 구간이 있었다. 이번에는 명목 폭과 프로파일 모두 15m로 통일했다.

## 기존 형상 교체와 접합

- 기존 6m 띠 위에 도로 판을 얹지 않았다. 기존 지표면을 도로·접속 포장·기존 재질 영역으로 다시 분할해, 같은 높이의 면이 중복되지 않게 교체했다.
- 순환도로와 연결되는 68개 비대상 도로의 끝부분만 재접속했다. 이 도로들의 폭은 변경하지 않았다. 연결 좌표는 70곳이다.
- 도로 확장 범위 안의 수목 79개를 정리했다. 건물을 이동하거나 축소하지 않았다.
- 기존 건물·계단과 겹치던 곡선은 중심선을 완만하게 우회시켰다. 확인된 건물·계단 평면 관통은 0건이다. 최소 중심선 곡률 반경은 약 16.29m다.
- 본선 전체를 한 고도로 만들지 않고 기존 긴 고저차를 평활한 종단 프로파일로 연결했다. 최대 종단 경사는 약 6.18%, 프로파일 고도는 모델 기준 86.21~95.47m다. 실측 고도가 아니다.
- 도로 주변 기존 메시 정점의 최대 높이 변화는 약 0.47m였다. 렌더링 메시와 이동 계산에 같은 도로 높이 함수를 적용했다.
- 검게 보이던 가는 삼각형은 텍스처가 아니라 float32 좌표에서 뒤집히거나 면적이 0으로 무너진 삼각형 문제였다. 지표면 삼각형 방향 11,410개를 정리하고 붕괴 삼각형 10,554개를 제거했다. 렌더링 우선순위로 숨기지 않았다.

기존 중심선에서 새 중심선까지의 최근접 거리는 최대 9.25m다. 이는 동일 점끼리의 이동량이 아니다. 정문 순환 분기점은 약 13.95m 이동했으며, 진입부와 분기 경계를 함께 다시 연결했다. 기상관측소·대형구조실험동·위험물저장고 주변 및 공대 계단 인접부의 우회는 각색이다.

## 구간별 처리와 화면 확인

| 구간 | 구현 | 화면 | 보행 |
|---|---|---|---|
| 정문 진입·순환 분기 | 15m 통일, 기존 차선 중복 제거, 분기 재접속 | 같은 카메라 전후·지상 확인 | 진입부 양방향 통과 |
| 500동 옆~농생대·자연대 | 6→15m, 합류 경계·차선 교체 | 같은 카메라 전후·지상 확인 | 전체 순환 왕복에 포함 |
| 아래 공대 | 곡선·건물/계단 회피·접속 포장 | 같은 카메라 전후 확인 | 전체 순환 왕복에 포함 |
| 301·302동 주변 | 연속 15m, 차선·경사 접합 | 같은 카메라 전후·주행 시점 확인 | 전체 순환 왕복에 포함 |
| 반대편 복귀 | 폐합 경로·점선 위상·분기 연결 | 같은 카메라 전후·주행 시점 확인 | 전체 순환 왕복에 포함 |

대표 화면은 [비교 화면 모음](index.html)에 모두 있다. 각 전후 쌍은 `cameras.json`의 동일한 카메라와 고화질 설정을 사용했다. 화면 검토는 사진 측량 정확도 검증이 아니라, 현재 모델의 폭·접합·차선 가독성을 확인한 것이다.

## 검증 결과

- 폭·노면 면적 검사: 중심 및 좌우 ±7.48m의 8,004개 표본 모두 차도 안에 있다.
- 노면 삼각형 검사: 13,825개 표본에서 빈 곳 및 같은 높이 차도 삼각형의 중복 없음. 렌더링 노면과 이동 높이의 최대 차이 약 **6.65mm**. 이는 구현 내부 일치 검사이며 실측 정확도가 아니다.
- 중심선·4개 차로 각각 양방향, 정문 연결부, 연결 진입로를 포함한 이동 검사 **196/196 통과**.
- 실제 브라우저의 캐릭터 이동 컨트롤러로 전체 바깥 차로 순환 왕복 및 정문 연결부 왕복 **4/4 통과**. 자동 조향으로 검증했으며 점프·비행을 사용하지 않았다. 모든 차로의 양방향은 별도 이동 코드 검사로 확인했다.
- 기존 건축 동선: 56개 보행, 27개 점프/착지 검사, 3개 다층 바닥 선택 검사 통과. 3층 연결교·5층 옥상정원·아래 통로를 합치지 않았다.
- 기존 주 연결망의 12,541개 노드가 유지되고 순환 경로는 한 연결 성분이다. 기존부터 있던 외곽 분리 경로 52개 성분 전체를 새로 연결하는 작업은 하지 않았다.
- 일반 UI에서 닉네임·리오 시작, P 설정·Esc 닫기, 표준 화질, 점프, 걷기, 백학 비행, 공중에서 리오 변경 후 착지, 301동 검색, 전체 지도 전환을 조작했다.

## 성능

같은 IAB 데스크톱 브라우저, 1280×720 화면, 고화질 실제 렌더 2560×1440, MSAA 4 / FXAA / 그림자 2048·3단, 장면별 600프레임으로 비교했다.

| 화면 | 평균 FPS 전→후 | 평균 ms 전→후 | p95 ms 전→후 |
|---|---|---|---|
PERFORMANCE_ROWS

표준 화질 지상 장면은 1600×900, MSAA 1 / FXAA / 그림자 1024·2단에서 600프레임 평균 59.4FPS였다. 고화질 전후 표와 해상도가 다르므로 동일 조건 비교값으로 섞지 않는다.

차선은 160m 공간 셀별 **82개 메시**, 2개 재질로 병합했다. 점선 하나당 객체를 만들지 않으며 전체를 단일 메시로 묶지도 않는다. 지표면 상세화로 정점·삼각형과 원본 데이터가 늘었다(지면 바이너리 약 17MB→39.4MB). **전체 캠퍼스 전경은 수정 전부터 약 9FPS였고 현재도 9.1FPS여서 별도 LOD 개선이 필요하다.** 모바일 Safari 실기기는 미검증이다.

## 다음 버스 작업용 데이터

`dist/data/ring-lanes33.json`에 순환 순서, 진행 방향, 중심선 XYZ, 폭, 4개 차로 XYZ, 접속 분기와 ID 대응을 저장했다. 좌표는 x=동, y=높이, z=북, 1단위=1m다. 차로 중심은 ±1.65m/±4.95m이며 진행 방향의 오른쪽 차로를 사용한다.

움직이는 버스·정류장은 추가하지 않았다. 버스 차체 길이·축간 거리·조향 한계에 따른 swept-path 검증은 아직 하지 않았으므로 실제 버스 차체가 모든 커브 안에 든다고 보장하지 않는다.

## ID 대응표

순서는 정문 분기에서 500동·농생대 방향으로 출발하는 누적 거리 순이다. 모든 이전 ID가 현재도 존재한다. 468202819에는 아래 표의 순환 구간 외에 정문 진입부도 포함된다.

| 순서 | 이전 ID | 현재 ID | 이전 명목 폭 m | 현재 폭 m | 시작 m | 끝 m |
|---|---|---|---|---|---|---|
MAPPING_ROWS

[CSV](road-id-mapping.csv) · [상세 정렬/분기](alignment.json) · [이동](movement.json) · [브라우저 왕복](browser-walk.json) · [노면/높이](mesh-audit.json) · [건물/계단 간섭](geometry-audit.json) · [기존 동선](architecture-check.json) · [성능](performance.json)

## 출처·복구·재생성

이번 경로 기준은 사용자가 제공한 `new-chat/3nu-road-review/ring-road-ids.json`과 `ring-road.png`, 현재 BUILD32 도로 데이터다. 새 위성사진으로 실측 도로를 다시 조사한 작업은 아니다. 원본 입력은 `source-data/`에 보존했다. 타인의 지도·사진을 텍스처나 이 비교 페이지에 재배포하지 않았다. OSM 등 기존 출처 표시는 유지했다.

수정 전 소스·바이너리는 Git 커밋 `2a034d0836d2af1eabdaeb4263b405991d15798b`에 복구 가능하게 남아 있다. 사용자 변경 사항을 초기화하지 않았다. 현재 세션의 실행 가능한 비교본은 작업 폴더 `work/baseline33/dist`에 있다.

재생성 순서: `prepare-ring33.py` → `sample-ring33.cjs` → `compile-ring33.py` → `mesh-ring33.py` → `orient-ground33.py` → `grade-ring33.cjs` → `network-ring33.py` → `finalize-ring33.cjs`. 이어 `audit-ring33.py`, `audit-mesh33.py`, `audit-mesh-height33.cjs`, `verify-ring33.cjs`, `verify-architecture33.cjs`로 검증한다. Python은 Shapely 2·NumPy·mapbox-earcut가 필요하다. 메시는 원본 바닥을 재분할하므로 반복 실행해도 도로 판이 누적되지 않는다. `mesh-ring33.py`의 기준 바이너리는 위 기준 커밋의 `dist/data/ground.bin`, `ground-indices.bin`, `ground.json`을 `work/baseline33/dist/data`에 복원해 사용한다.

확인된 도로·계단·건물 관통 또는 노면 이동 차단은 남지 않았다. 다만 모든 수목/외벽을 현장과 대조한 결과는 아니며, 전체 전경 성능·모바일 실기기·버스 차체 회전 검증은 위 한계로 남긴다.
'''
report = report.replace('PERFORMANCE_ROWS', '\n'.join(performance_rows)).replace('MAPPING_ROWS', '\n'.join(mapping))
(OUT / 'REPORT.md').write_text(report)
cards = []
for key, label in scenes:
    cards.append(f'<section><h2>{html.escape(label)}</h2><div class="pair"><figure><figcaption>수정 전 · BUILD32</figcaption><a href="before-{key}.png"><img loading="lazy" src="before-{key}.png" alt="{html.escape(label)} 수정 전"></a></figure><figure><figcaption>수정 후 · BUILD33</figcaption><a href="after-{key}.png"><img loading="lazy" src="after-{key}.png" alt="{html.escape(label)} 수정 후"></a></figure></div></section>')
extras = [('walk-engineering', '순환도로 실제 캐릭터 왕복 중'), ('walk-complete', '전체 순환·정문 진입부 왕복 완료'), ('standard-transition-ground', '표준 화질 지상'), ('flight-standard', '기존 비행 동작'), ('landing-standard', '리오 전환 후 착지')]
for file, label in extras:
    cards.append(f'<section><h2>{label}</h2><a href="{file}.png"><img loading="lazy" src="{file}.png" alt="{label}"></a></section>')
page = '''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>3NU BUILD33 · 순환도로 비교</title><style>body{font:16px/1.7 system-ui,sans-serif;color:#172c42;background:#f3f5f7;margin:0;padding:24px}main{max-width:1540px;margin:auto}h1{margin:0}h2{font-size:20px}section{background:white;border:1px solid #dde2e8;border-radius:12px;padding:18px;margin:24px 0}.pair{display:grid;grid-template-columns:1fr 1fr;gap:14px}figure{margin:0}img{width:100%;height:auto;display:block}figcaption{font-weight:600;padding:8px 0}a{color:#172d8b}@media(max-width:700px){body{padding:12px}.pair{grid-template-columns:1fr}}</style><main><h1>3NU BUILD33 — 순환도로 15m / 왕복 4차선</h1><p>같은 카메라·고화질 설정의 전후 화면. 사진을 누르면 원본을 볼 수 있습니다.<br>지정 순환도로 21개 ID · 모델 경로 5.18km · 실제 도로와 다르게 각색한 결과입니다.</p><p><a href="REPORT.md">상세 변경·검증·한계 보고서</a> · <a href="road-id-mapping.csv">전체 ID 대응표</a> · <a href="performance.json">동일 조건 성능</a></p>''' + ''.join(cards) + '</main></html>'
(OUT / 'index.html').write_text(page)
print('Wrote REPORT.md, index.html, road-id-mapping.csv')
