"""Local comparison report. Only our rendered screenshots are included."""
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
out = root / 'reports/build29'
stats = {f'{phase}-{quality}': json.loads((out / f'performance-{phase}-{quality}.json').read_text())['render']
         for phase in ['before', 'after'] for quality in ['standard', 'high']}
items = [
    ('광장과 접근 계단', '겹치던 지상 포장·계단 바닥을 분리하고, 중간 평탄부를 하나의 윤곽으로 통합. 기존 두 식재 영역과 연결 보행면을 유지.', 'after-2-ground.png'),
    ('관정관 앞 계단 상단', '계단 상단과 옆 통로의 동일 높이 바닥을 합집합으로 통합. 옆으로 꺾이는 이동 공간과 난간 사이를 검증.', 'after-2-ground.png'),
    ('뒤쪽 상부 보행면·가까운 계단', '맞은편 건물 지붕의 중복 상판과 지면 높이 보정을 정리. 상부 바닥은 한 면으로 남기고 하부 야외 통로·연결교는 유지.', 'after-roof-reverse.png'),
    ('가까운 계단의 반대 방향', '사진 3과 같은 계단. 계단 내부의 지형 상면을 절제하고 실제 단·옆면을 가진 닫힌 메시로 교체. 가로지르는 면·하늘색 틈 정리.', 'after-4-ground.png'),
    ('뒤쪽 반대편 계단', '기존 하부 통로 영역과 사면 경계를 다시 나누고 계단 양끝에 접속. 조각난 은행 모양 사면을 연속 경사로 교체.', 'after-5-ground.png'),
    ('본관 반대편 큰 계단참', '연결되는 계단참을 하나의 바닥으로 통합. 낙차 쪽 난간과 보행 분기를 구분하고, 필요한 아래 공간은 그대로 보존.', 'after-6-ground.png'),
]
items[4] = (items[4][0], items[4][1].replace('은행 모양 사면', '식재 사면'), items[4][2])
perfrows = []
for quality, label in [('standard', '표준'), ('high', '고화질')]:
    b, a = stats['before-'+quality], stats['after-'+quality]
    perfrows.append(f"| {label} · {a['resolution']} | {b['meanMs']} → {a['meanMs']} ms | {b['p95Ms']} → {a['p95Ms']} ms | {b['fps']} → {a['fps']} |")
table = '\n'.join(perfrows)
md = f'''# BUILD29 — 중복 바닥 정리 / 밝은 유리 / 정적 하늘

대상: 이전 표시 사진 1–6의 중앙도서관·관정관·행정관·학생회관 연결부와 관정관 뒤쪽. 건물 외형·배치 및 범위 밖 지형 개량은 이번 작업에 포함하지 않았다.

[같은 카메라의 전후 비교 갤러리](reports/build29/index.html)

## 복구 지점

- 시작 커밋: `41a200b6dc558510d18aae8c201503fed9137038`
- 로컬 태그: `build28-before-cleanup29`
- 원본 실행본: 작업 루트 `work/build29-before/dist/`
- 비교 카메라: `BUILD28-CAMERAS.json`의 좌표를 그대로 재사용. 추가 지상·상부 반대 방향도 확인.

## 실제로 제거·통합한 것

- 기존 작성 데이터에서 경쟁하는 지상 높이 영역 **32쌍**, 같은 높이의 바닥 정의 겹침 **18쌍** 발견. 32쌍은 작성 정의의 중복이며, 모두 화면에 중복 렌더링되던 32개 면이라는 뜻은 아니다. 기존 지형 렌더러도 일부 영역을 잘라 사용하고 있었다.
- 지상 포장과 같은 높이를 이중으로 담당하던 도서관 바닥 **19개**를 제거. 지상 메시와 이동 높이가 같은 영역 정의를 사용한다.
- 전체 도서관/학생회관 보행면 정의 **95 → 67**, 대상 범위의 지상 높이 영역 **102 → 85**. 합집합 및 차집합으로 같은 용도·높이는 통합하고 소유 영역은 겹치지 않게 나눴다.
- 지상 바닥 아래에 중복으로 남던 기초 고체 **7개** 제거. 렌더 메시뿐 아니라 동일 원본에서 생성되는 충돌체도 제거했다.
- `precinct20 → rear23 → junction28`의 실행 시 누적 수정 경로를 제거하고, `precinct29`의 최종 명세를 직접 읽도록 변경. 학생회관의 중복 바닥/볼륨 재생성도 제거.
- 본관·맞은편 별개 건물·연결교의 구조체 상판은 바닥 마감과 겹치던 부분만 생략. 석재·목재 옥상 마감도 겹치지 않는 영역으로 분할. 건물 본체와 하부 벽체는 유지.
- 기존 계단 상자와 경사 덮개 조합을 실제 단을 가진 하나의 닫힌 메시로 교체. 지상 계단 내부의 지형 상면을 절제하고 측면을 접합. 높은 계단의 열린 아래 공간은 보존.
- 단 가장자리의 7cm 명암 띠는 별도 판이 아니라 원래 디딤판 삼각형을 분할한 정점 색이다. 깊이 우선순위·미세한 높이 띄우기로 겹침을 숨기지 않았다.

전체 제거 ID와 겹침 면적은 `BUILD29-CLEANUP.json`에 기록했다. 면적과 높이는 모델 단위이며 실측값이 아니다.

## 표시 지점별 상태

| 표시 | 상태 | 처리 |
|---|---|---|
'''
for i, (title, detail, _) in enumerate(items, 1):
    md += f'| 사진 {i} · {title} | 구현·화면 확인·연결 동선 검증 완료 | {detail} |\n'
md += f'''
3층 연결교와 맞은편 상부 보행면은 지역 기준 +7m, 5층 옥상정원은 +22m, 뒤쪽 낮은 통로는 +0m를 유지했다. 이는 기존 모델의 설계 높이이며 층 번호를 동일한 층고로 환산한 값 또는 공식 측량값이 아니다. 원래 지형 샘플 배열과 범위 밖 높이 영역을 유지하고 대상 구역의 최종 표면 정의만 정리했다.

## 창문·하늘

- 유리는 기존 재질 색의 차이를 남기면서 부드러운 청회색/연한 푸른색으로 조정. 불투명도 1, 발광 0, 중간 거칠기·절제된 하이라이트를 사용했다. 창문 배열과 창틀 형상은 유지.
- 모든 유리가 공유하는 96px 정적 환경 큐브를 추가. 건물의 실시간 반사나 장면 재렌더링은 없다.
- 단일 스카이돔의 파랑–밝은 지평선 그라데이션, 서로 다른 각도·폭·높이의 구름 6무리를 사용. 2048×1024 정적 구름 아틀라스는 최초 1회 생성하며 시간·이동·변형 애니메이션이 없다.
- 안개 밀도 `0.000095 → 0.000065`. 전체 노출과 기존 주광·그림자는 유지. 가까운 건물을 회색 안개로 덮지 않도록 조정.
- 정문·학생회관·하부 통로의 동일 시점과 상공 350m에서 수평 이음매·천정 방향을 확인. 구름은 미니어처에 맞춘 단순한 윤곽이며 사실적인 기상 렌더링은 아니다.

## 이동·형상 검사

- 실제 브라우저 렌더 루프의 산책 이동: **10개 동선 × 왕복 = 20/20**. 각 경로 시작점만 검사 UI로 배치하고 구간 이동은 실제 `world.move`를 사용. 점프·비행 없이 진행.
- 마지막 사면 수정 후 반대편 계단을 추가 왕복: **2/2**.
- 경계·꺾임·계단참·난간 및 30/60/120Hz 점프 착지: **43/43**.
- 실제 생성한 계단 메시를 위에서 레이 검사: **1,071개 표본**, 이동 단 높이와 최대 차이 **0.00000381m**. 실물 재현 오차가 아니라 렌더링/충돌 계산 간 수치 오차다.
- 지형 메시 **504,773개 정점**과 높이 정의 비교: 불일치 0, 최대 부동소수점 오차 **0.0000243m**.
- 대상 구역의 배타적인 지상 영역 겹침 0, 같은 높이의 렌더 보행면 겹침 0. 연결교 아래 통로와 옥상은 별개 층으로 검사.
- 브라우저에서 점프·착지, 백학 상승 후 리오로 전환·착지 확인. 설정 중 이동 입력 차단 및 P/Esc, 닉네임 유지 확인.
- 최대 등판 제한을 높이지 않았다. 제거한 바닥의 옛 충돌체를 따로 남기지 않았다.

## 같은 조건의 성능

같은 Mac의 Codex 내장 브라우저, 뷰포트 1280×720, `mark28-passage`, 매 측정 600 프레임. 표준은 MSAA 1 / 1024 그림자·2 cascade, 고화질은 MSAA 4 / 2048 그림자·3 cascade, 모두 FXAA. 평균 FPS는 표시 장치의 60Hz에 제한된다. 단일 측정 구간이므로 일반적인 속도 향상 비율로 확대 해석하지 않는다.

| 화질·내부 해상도 | 평균 프레임 전 → 후 | p95 전 → 후 | FPS 전 → 후 |
|---|---|---|---|
{table}

## 남은 한계

- 이 작업은 표시 구역의 구현 오류 정리이며 실제 캠퍼스의 치수·동선을 새로 실측 검증한 작업이 아니다. 높이·사면·계단 마감은 자연스러운 연결을 위한 모델 설계값이다.
- 모든 가능한 자유 이동 경로를 수학적으로 증명한 것은 아니다. 기록된 왕복 동선·가장자리·착지 표본과 사진 1–6 및 추가 지상 시점에서 확인했다.
- 주요 건물의 기존 형태 차이는 유지했다. 뒤쪽 상부의 경계 높이와 옹벽은 의도적인 단차로 남아 있다.
- 모바일 Safari 실기기는 미검증. 이번 성능 표는 위 데스크톱 환경에만 해당한다.
- 원래 제공된 사진을 새로 공개 복제하지 않았다. 비교 갤러리는 직접 렌더링한 전후 화면만 포함하며 배포 웹사이트의 `dist` 밖에 보관했다.

## 재생성·검사

`scripts/precinct29.py`는 복구 태그의 원본에서 최종 명세를 생성한다. 반복 실행해도 추가 보정이 누적되지 않는다. 이어서 `scripts/build-ground.py --precinct29`로 지형 바이너리를 재생성한다. 검사: `verify-precinct29.cjs`, `verify-precinct29-edges.cjs`, `verify-mesh29.cjs`, `verify-ownership29.py`, `verify-ground29.py`.
'''
(root/'BUILD29-REPORT.md').write_text(md)
css='''*{box-sizing:border-box}body{margin:0;background:#f4f5f6;color:#1e2b3c;font:16px/1.65 system-ui,sans-serif}main{max-width:1400px;margin:auto;padding:36px 24px}h1{font-size:28px}h2{font-size:22px;margin:0}section{background:white;border:1px solid #d7dee5;border-radius:12px;padding:20px;margin:24px 0}p{max-width:1000px}nav{display:flex;flex-wrap:wrap;gap:12px}a{color:#245d83}.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}figure{margin:0}figcaption{font-weight:700;margin:8px 0}img{display:block;width:100%;height:auto;border:1px solid #d7dee5}table{border-collapse:collapse;width:100%}td,th{text-align:left;padding:8px;border-bottom:1px solid #ddd}.badge{font-size:12px;background:#e4eee9;padding:4px 8px;border-radius:5px}details{margin-top:16px}small{color:#526171}@media(max-width:700px){.pair{grid-template-columns:1fr}main{padding:16px}section{padding:12px}}'''
html=f'<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>3NU BUILD29 비교</title><style>{css}</style><main><h1>3NU · BUILD29 비교 기록</h1><p>중복 바닥·높이 보정 정리, 계단 접합, 밝은 유리와 정적 구름. 왼쪽은 수정 전, 오른쪽은 같은 카메라의 수정 후입니다.</p><nav>'
html+=''.join(f'<a href="#photo{i}">사진 {i}</a>' for i in range(1,7))+'<a href="#visual">유리·하늘</a><a href="#performance">성능</a><a href="../../BUILD29-REPORT.md">전체 기록</a></nav>'
for i,(title,detail,ground) in enumerate(items,1):
    html+=f'<section id="photo{i}"><h2>사진 {i} · {title}</h2><span class="badge">구현 · 화면 · 연결 동선 확인</span><p>{detail}</p><div class="pair"><figure><figcaption>수정 전</figcaption><a href="before-{i}.png"><img loading="lazy" src="before-{i}.png"></a></figure><figure><figcaption>수정 후</figcaption><a href="after-{i}.png"><img loading="lazy" src="after-{i}.png"></a></figure></div><details><summary>지상 / 반대 방향 확인</summary><img loading="lazy" src="{ground}"></details></section>'
html+='<section id="visual"><h2>창문·하늘 · 같은 시점</h2><p>유리의 형태·배열과 장면 노출은 유지하고 재질과 정적 환경 반사, 하늘·안개를 조정했습니다.</p>'
for key,label in [('student','학생회관'),('passage','관정관 뒤 낮은 통로'),('gate','정문')]:
    html+=f'<h3>{label}</h3><div class="pair"><figure><figcaption>수정 전</figcaption><img loading="lazy" src="before-{key}.png"></figure><figure><figcaption>수정 후</figcaption><img loading="lazy" src="after-{key}.png"></figure></div>'
html+='<details><summary>350m 비행 높이 · 이음매와 천정 방향</summary><div class="pair"><img src="sky-seam.png"><img src="sky-zenith.png"></div></details></section><section id="performance"><h2>같은 조건의 성능</h2><p>동일 Mac·내장 브라우저·통로 카메라·600프레임. 모바일 Safari는 미검증입니다.</p><table><tr><th>화질</th><th>평균 ms 전 → 후</th><th>p95 ms 전 → 후</th><th>FPS 전 → 후</th></tr>'
for quality,label in [('standard','표준'),('high','고화질')]:
    b,a=stats['before-'+quality],stats['after-'+quality]
    html+=f'<tr><td>{label} {a["resolution"]}</td><td>{b["meanMs"]} → {a["meanMs"]}</td><td>{b["p95Ms"]} → {a["p95Ms"]}</td><td>{b["fps"]} → {a["fps"]}</td></tr>'
html+='</table><p>실제 렌더 루프 20/20 왕복, 마지막 사면 2/2 재검사. 계단 렌더 메시 1,071개 표본과 경계·점프 43/43 검사를 별도로 수행했습니다. 이 수치는 실물 정확도 평가가 아닙니다.</p></section><small>모든 이미지는 자체 모델 렌더링입니다. 실제 치수의 새 측정 없이 기존 모델의 설계 높이를 사용했습니다. 건물 배치·외형과 3층 연결교/5층 옥상정원의 별도 동선은 유지합니다.</small></main></html>'
(out/'index.html').write_text(html)
print('BUILD29-REPORT.md / reports/build29/index.html')
