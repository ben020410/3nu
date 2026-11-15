# -*- coding: utf-8 -*-
"""Publish only own screenshots and compact QA evidence, never source references."""
import json, pathlib, shutil, html, hashlib, subprocess

R=pathlib.Path(__file__).resolve().parents[1]
P=R/'reports/build32'
def read(name): return json.loads((P/name).read_text())
policy=read('road-policy.json'); walks=read('final-road-walks.json')
browser=read('walking/browser-bidirectional.json'); plan=read('browser-route-plan.json')
perf=read('performance-comparison.json')['measurements']
before=read('before-road-walks.json')['summary']
baseline='5284d1ba264f25ad70110a1f08f8dcd81671dfe7'
preserved=[]
for file in ['dist/data/campus.json','sources/landuse31.json','dist/library17.js','dist/student22.js','dist/landmarks30.js','dist/style.css','dist/character.js','dist/player-state.js']:
    data=(R/file).read_bytes(); old=subprocess.check_output(['git','show',baseline+':'+file],cwd=R)
    preserved.append(dict(file=file,unchanged=data==old,sha256=hashlib.sha256(data).hexdigest()))
assert all(p['unchanged'] for p in preserved)
(P/'preserved-assets.json').write_text(json.dumps(preserved,ensure_ascii=False,indent=2))

css='''*{box-sizing:border-box}body{margin:0;color:#24384a;background:#f5f7f9;font:16px/1.7 system-ui,sans-serif}main{max-width:1500px;padding:32px 24px;margin:auto}h1{font-size:32px;line-height:1.3}h2{font-size:24px}h3{font-size:19px}section{padding:28px 0;border-top:1px solid #d8e0e6}.intro{max-width:1000px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0}figure{margin:0;border:1px solid #d1dbe3;border-radius:8px;overflow:hidden;background:white}figure img{display:block;width:100%;height:auto}figcaption{padding:7px 12px;font-size:14px}a{color:#195785}table{border-collapse:collapse;width:100%;font-size:14px}td,th{padding:9px;border:1px solid #d2dce3;text-align:left;vertical-align:top}th{background:#e9eff4}.scroller{overflow-x:auto}.note{padding:12px 16px;background:#fff4dc;border-radius:8px}.good{color:#22664b}nav{display:flex;flex-wrap:wrap;gap:14px}details{padding:12px 16px;background:white;border:1px solid #dae1e6;border-radius:8px;margin:12px 0}summary{cursor:pointer;font-weight:650}code{font-size:13px}@media(max-width:700px){main{padding:20px 12px}.pair{grid-template-columns:1fr}h1{font-size:26px}}'''
def fig(src,caption): return f'<figure><a href="{src}"><img loading="lazy" src="{src}" alt="{html.escape(caption)}"></a><figcaption>{caption}</figcaption></figure>'
def pair(camera,label):
    return '<div class="pair">'+fig('before/'+camera+'.jpg','BUILD31 · '+label)+fig('after/'+camera+'.jpg','BUILD32 · '+label)+'</div>'
zones=[
 ('science','자연대 22–28·56·56-1동','넓은 중정 포장 안을 가르던 얇은 길을 해당 포장 재질에 통합했습니다. 밖으로 나가는 보행로는 분리된 경계와 3.2m 폭으로 정리했습니다.'),
 ('agriculture','농생대 200·201·75-1동','앞마당 안의 중복 띠를 제거하고 기존 차량 진입부와 보행로 합류를 연속된 바닥 경계로 재생성했습니다.'),
 ('engineering','공대 30–37동·붉은광장','중정·광장 안의 가는 띠와 도로 끝 포장 중복을 정리했습니다. 기존 건물 윤곽과 붉은광장 경계를 보존했습니다.'),
 ('library','중앙도서관·관정관·약학관','옛 경로가 계단·기둥을 가로지르던 곳을 현재 계단과 평탄부에 다시 연결했습니다. 양두석홀 뒤 통로, 양쪽 계단, 3층 연결교와 5층 정원은 별도 층으로 유지했습니다.'),
 ('beodeul','버들골·풍산마당·교수회관','시설 앞 포장과 접근로의 합류를 정리했습니다. 숲길 폭을 일괄 확대하지 않고 열린 공간의 보행로만 조정했습니다.'),
 ('humanities','인문대·자하연','중정 포장 안의 얇은 띠를 통합하고 기존 계단·연못 경계를 침범하지 않게 길의 외곽을 잘랐습니다.'),
 ('social','사회대·규장각 주변','기존 앞마당을 보존하고 도로·보행로의 합류 외곽과 접속 폭을 정돈했습니다. 자료가 없는 공사 구역의 새 길은 만들지 않았습니다.'),
 ('education','사범대','건물 접근로와 포장면의 경계를 통합하고 열린 공간 보행로 폭을 정리했습니다. 수관 아래의 미확인 연결선을 임의로 추가하지 않았습니다.'),
 ('upper','301·302·303동과 연결 데크','지상 접근 경로와 데크 경로를 별개로 유지했습니다. 지상 도로의 중복 포장과 통행을 막는 수목을 정리하고 데크 위·아래를 각각 왕복했습니다.'),
]
zone_status=[]
for zone in plan['zones']:
    q=policy['zoneGrid400m'][zone]; x,z=map(int,zone.split(',')); routes=[r for r in browser['results'] if r['zone']=='도로 구역 '+zone]
    assert len(routes)==2 and all(r['passed'] for r in routes)
    zone_status.append(dict(zone=zone,bounds=[x*400,z*400,(x+1)*400,(z+1)*400],roadRecords=q['roads'],walkwayRecords=q['walkways'],widthEdits=q['widthEdits'],geometry='공통 경계 재생성·겹침 제거',screens=['zone25-'+zone,'ground25-'+zone],browserDirections=2,browserPassed=2,offlineDirections=walks['zones'][zone]['roads'],status='구현·화면·대표 왕복 확인',limit='외곽 끝의 실제 목적지는 추가 자료 필요' if zone in ['2,2','0,3','0,-4'] else '기존 건물·지표 구획 보존'))
(P/'zone-status.json').write_text(json.dumps(zone_status,ensure_ascii=False,indent=2))

body=f'''<h1>3NU BUILD32 · 캠퍼스 도로와 보행로 정돈</h1><div class="intro"><p>BUILD31의 건물과 79개 외부 공간 원본 구획을 유지하면서, 전 도로 데이터의 경계·합류·높이·이동 연결을 정리했습니다. 한 구역의 시범 수정으로 끝내지 않고 27개 공간 구역을 상공과 지상에서 확인했습니다.</p><p><b>897개 도로 레코드의 양방향 이동 계산 + 브라우저에서 55개 대표 동선의 110회 방향별 걷기.</b> 두 검증은 별개이며, 모든 길의 모든 지점을 직접 걸었다는 뜻은 아닙니다.</p><p class="note">PDF는 도로의 경로·연결·분기를 판단하는 자료입니다. 아래 폭과 높이 조정은 기존 모델을 바탕으로 한 설계값이며 실측 치수가 아닙니다. 외곽 일부 길 끝의 실제 용도는 확인되지 않아 그대로 보존했습니다.</p></div><nav><a href="../../index.html">3NU 플레이</a><a href="#changes">수정 내용</a><a href="#regions">주요 구역 비교</a><a href="#grid">전체 27구역</a><a href="#walk">이동 검증</a><a href="#performance">성능·남은 문제</a></nav>'''
body+='<section><h2>같은 카메라의 중심부 상공 비교</h2><p>동일한 월드 좌표·투영·화질·1280×720 화면을 사용했습니다. 사진을 늘이거나 건물을 옮겨 맞추지 않았습니다.</p>'+pair('landuse31-core','중심부 정사영')+'</section>'
body+='''<section id="changes"><h2>무엇을 바꿨나</h2><ul><li>기존 도로·보행로 포장 1,076개를 교체하고, 차도·보도·중정 포장이 같은 높이에서 겹치지 않도록 지형 삼각형을 분할했습니다. 더 높은 덮개 판이나 렌더링 우선순위로 숨기지 않았습니다.</li><li>412개 열린 공간 보행로 레코드의 폭을 2.4m에서 3.2m로 조정했습니다. 숲길과 건축 계단의 폭은 별도 기준을 유지했습니다.</li><li>폭이 다른 같은 방향 차도가 만나는 3개 접속부에 약 20m 전환 구간을 적용했습니다. 작은 길이 큰 도로의 폭을 그대로 물려받는 문제를 피했습니다.</li><li>기존 계단과 어긋난 도로 레코드, 건물·기둥을 관통하던 짧은 연결을 재배치했습니다. 옛 분기점이 실제 존재했던 12곳만 짧은 연결로 복구했습니다.</li><li>정문 접근부의 약 0.47m 모델상 끝점 틈을 정리했습니다. 가까운 끝점들을 무조건 연결하지 않았습니다.</li><li>옛 높이 보정 경계를 가로질러 급변하던 3개 도로에 연속적인 종단 높이와 완만한 측면 전환을 적용했습니다. 최대 국소 높이 조정은 약 1.97m이며 큰 언덕은 유지했습니다.</li><li>새 보행면과 겹치던 수목 25개만 제거하고 식재 구획 자체는 유지했습니다. 길 그래프에서 사용하지 않는 점을 검색 도착점으로 선택하지 않도록 수정했습니다.</li></ul><div class="scroller"><table><tr><th>종류</th><th>폭 정책 · 모델 단위 m</th><th>근거·예외</th></tr><tr><td>큰길</td><td>15.5</td><td>기존 넓은 기준 구간 유지</td></tr><tr><td>보조 차도</td><td>10</td><td>기존 분류·경계 유지</td></tr><tr><td>건물 진입로</td><td>일반 6</td><td>기존 넓은 진입부는 보존, 합류에서 점진적 전환</td></tr><tr><td>광장 접근</td><td>5</td><td>차도와 보행면 구분</td></tr><tr><td>열린 공간 보행로</td><td>3.2</td><td>건물·시설 경계를 제외하고 생성</td></tr><tr><td>중정·숲길</td><td>중정 별도 길 2.8 / 숲길 기존 2–2.4</td><td>이미 포장된 중정 내부는 동일 포장에 통합</td></tr><tr><td>계단·데크</td><td>기존 전용 모델</td><td>높이별 보행면·충돌 유지</td></tr></table></div><p><a href="road-policy.json">폭·접속부 기록</a> · <a href="route-actions.json">경로 수정 목록</a> · <a href="junction-attachments.json">기존 분기점 복구 근거</a> · <a href="preserved-assets.json">BUILD31 보존 파일 해시</a></p></section>'''
body+='<section id="regions"><h2>주요 구역별 같은 시점 비교</h2><p>각 구역은 경계 재생성 → 상공·지상 확인 → 대표 동선 왕복을 진행했습니다. 기존 건물 윤곽의 실제 자료 대비 오차는 이번 작업에서 변경하지 않았습니다.</p>'
for key,title,desc in zones:
    body+=f'<details open><summary>{title}</summary><p>{desc}</p>'+pair('landuse31-'+key,'북쪽이 위인 상공')+'</details>'
for key,title,desc in [('apartments-top','기숙사·외곽 주거 구역','기존 진입로와 보행 경계 재생성, 외곽 구역 왕복 확인.'),('coway945-top','북동 외곽','건물 접근부의 폭·접속 경계 확인. 지도에 세부 용도가 없는 길 끝은 유지.'),('gate-plan','정문·진입부','정문 시설을 보존하고 기존 접속 끝점의 작은 틈을 수정.'),('baseball-top','운동시설 구역','경기면·펜스를 유지하며 주변 도로·보행로 경계를 정돈.')]:
    body+=f'<details><summary>{title}</summary><p>{desc}</p>'+pair(key,title)+'</details>'
body+='</section><section id="grid"><h2>전체 도로 데이터 · 27개 공간 구역</h2><p>월드 x는 동쪽, z는 북쪽, 단위는 m입니다. 400m 격자는 도로 시작점을 기준으로 배정하며 실제 단과대학 경계를 뜻하지 않습니다. 각 구역의 같은 시점 상공·지상 화면을 모두 남겼습니다.</p><div class="scroller"><table><tr><th>구역</th><th>차도 / 보행 레코드</th><th>폭 조정</th><th>화면 / 브라우저 왕복</th><th>상태</th></tr>'
for s in zone_status:
    body+=f'<tr><td><a href="#zone-{s["zone"]}">{s["zone"]}</a></td><td>{s["roadRecords"]} / {s["walkwayRecords"]}</td><td>{s["widthEdits"]}</td><td>상공·지상 / 2방향 통과</td><td>{s["status"]}</td></tr>'
body+='</table></div>'
for s in zone_status:
    body+=f'<details id="zone-{s["zone"]}"><summary>구역 {s["zone"]} · 수정 전후 상공 / 지상</summary><p>월드 범위 {s["bounds"]}. {s["geometry"]}. 폭 수정 {s["widthEdits"]}개, 이동 계산 {s["offlineDirections"]}방향 통과. {s["limit"]}.</p>'+pair(s['screens'][0],'구역 상공')+pair(s['screens'][1],'구역 지상')+'</details>'
body+='</section>'
body+=f'''<section id="walk"><h2>이동·높이·기능 검증</h2><div class="scroller"><table><tr><th>검사</th><th>BUILD31</th><th>BUILD32</th></tr><tr><td>전 도로 레코드 양방향 계산</td><td>{before['tests']}방향 중 막힘 {before['blocked']}, 높이 단절 {before['heightBreak']}</td><td>1,794방향 통과 / 막힘 0 / 높이 단절 0</td></tr><tr><td>브라우저 렌더링 중 실제 이동 루프</td><td>수정 전 화면 보존</td><td>55개 대표 동선 × 양방향 = 110회 통과</td></tr><tr><td>기존 계단·다층 동선 회귀</td><td>기준 높이·구조 보존</td><td>56방향 통과 / 예기치 않은 높이 변경 0</td></tr><tr><td>렌더링 메시와 이동 높이 비교</td><td>별도 결과 사용 안 함</td><td>지상 103,945점, 최대 차이 9.15cm / 12cm 초과 0</td></tr><tr><td>점프·층 분리</td><td>조작 기준 유지</td><td>30·60·120fps 점프 27경우 및 층 분리 3지점 통과</td></tr></table></div><p>화면 표면 검사는 도로 중심과 폭의 ±35% 지점을 2m 간격으로 비교했습니다. 건축 모델이 담당하는 248점은 지형 메시 검사에서 제외하고 별도 계단·다층 동선 검사로 확인했습니다. 이 수치는 모델 내부 일관성이며 실제 측량 오차가 아닙니다.</p><p>브라우저에서는 렌더링 중 기존 이동 함수·충돌을 사용하는 자동 걷기로 확인했습니다. 도서관 계단, 연결교 아래·위, 공학관 데크, 각 지표 구획의 접근로를 포함합니다. 키 입력으로 점프 후 착지, 백학 상승 후 리오의 안전한 지상 복귀, P 설정 중 이동 차단, 닉네임 유지와 도서관 검색·경로 표시도 확인했습니다. 등판 제한은 높이지 않았습니다.</p>'''
body+='<div class="pair">'+fig('walking/library-stairs.jpg','도서관 계단 · 브라우저 왕복 확인')+fig('walking/zone-central.jpg','대표 도로 · 브라우저 왕복 확인')+'</div>'
body+='<p><a href="walking/browser-bidirectional.json">110회 브라우저 이동 결과</a> · <a href="final-road-walks.json">전체 도로 계산</a> · <a href="architecture-check.json">건축 동선·점프</a> · <a href="mesh-height-check.json">표면 높이</a> · <a href="ui-regression.json">UI 조작</a></p></section>'
body+='<section id="performance"><h2>동일 조건 성능과 남은 한계</h2><p>동일 Mac·Codex InApp Chromium, 1280×720, 각 시점의 동일 카메라, 3D 탭 1개로 비교했습니다. 프레임 간격의 표본 수가 다르므로 작은 수치 차이를 성능 향상으로 단정하지 않습니다.</p><div class="scroller"><table><tr><th>빌드 / 시점</th><th>화질</th><th>표본 수</th><th>평균 / P95 ms</th><th>FPS</th></tr>'
for key in ['beforeStandard','afterStandard','beforeHigh','afterHigh','beforeStandardGround','afterStandardGround','beforeHighGround','afterHighGround']:
    q=perf[key]['render'];b='31'if key.startswith('before')else'32';cam='지상'if key.endswith('Ground')else'넓은 정사영 상공'
    body+=f'<tr><td>BUILD{b} / {cam}</td><td>{q["quality"]}</td><td>{q["samples"]}</td><td>{q["meanMs"]} / {q["p95Ms"]}</td><td>{q["fps"]}</td></tr>'
body+='''</table></div><p class="note">지상 대표 장면은 양 버전 모두 60 FPS였지만 넓은 상공 정사영은 양 버전 모두 약 5–6 FPS입니다. 상공의 렌더링 부담은 남아 있으며 전체 캠퍼스의 모든 시점이 원활하다고 보고하지 않습니다. 모바일 Safari 실기기 성능은 미검증입니다.</p><ul><li>외곽 2,2 / 0,3 / 0,-4 구역 일부 길 끝의 실제 목적지는 PDF만으로 판단하기 어렵습니다. 임의로 삭제하거나 새로운 길로 연결하지 않았습니다.</li><li>도로 그래프는 기존과 같은 52개 연결 성분을 유지합니다. 외부 경계·시설별 분리까지 모두 하나의 망으로 합치지 않았으며, 모든 두 장소 사이의 자동 경로 생성을 보장하지 않습니다.</li><li>기존 농생대·자연대 등 건물 윤곽의 실제 자료 대비 차이, 사진에 가린 외부 공간 경계는 BUILD31의 남은 항목입니다. 이번 도로 정비가 그 정확도 검증을 대신하지 않습니다.</li><li>계단·연결교·옥상은 서로 다른 높이로 보존했습니다. 브라우저 걷기는 대표 경로, 수치 검사는 도로 데이터 중심입니다. 전체 자유 이동면의 모든 점을 검사한 결과는 아닙니다.</li></ul><p><a href="performance-comparison.json">성능 원자료</a> · <a href="zone-status.json">구역별 기록</a> · <a href="graph-components.json">경로 그래프 구조</a></p></section>'''
body+='''<section><h2>자료와 재현 방법</h2><p>사용자 제공 <b>Gwanak_Campusmap_kor.pdf</b>를 직접 확인해 외곽 순환길, 농생대 서측 큰길, 내부 분기, 동측·고지대·기숙사 연결을 대조했습니다. 지도 선의 굵기나 건물 그림은 치수 기준으로 사용하지 않았습니다. BUILD31 도로·건물 좌표와 지표 구획은 원본 스냅샷으로 보존했습니다.</p><p><a href="https://map.snu.ac.kr/web/main.action">서울대 공식 캠퍼스맵</a> · <a href="../../credits.html">공개 공간 데이터·출처 및 저작권</a></p><p>이 보고서의 비교 화면은 자체 구현 화면입니다. 첨부 지도·외부 사진을 서비스 텍스처나 공개 비교 이미지로 재배포하지 않았습니다. 소스 저장소의 <code>scripts/rebuild-roads32.sh</code>와 <code>reports/build32/source-data</code>로 같은 도로 데이터를 다시 만들 수 있으며, 덮개 면을 추가하는 방식으로 누적되지 않습니다.</p></section>'''
doc='<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>3NU BUILD32 · 도로·보행로 정비</title><style>'+css+'</style><main>'+body+'</main></html>'
(P/'index.html').write_text(doc)
# Compact own-render comparison for the final chat; not a manipulated reference.
panel='<h1>3NU BUILD32 · 같은 시점 수정 전후</h1><p>왼쪽 BUILD31 / 오른쪽 BUILD32 · 건물과 외부 공간 구획 유지</p>'
panel+=pair('landuse31-science','자연대 중정·접근로')+pair('landuse31-library','도서관·약학관 연결')
(P/'comparison.html').write_text('<!doctype html><html lang="ko"><meta charset="utf-8"><style>'+css+'main{padding:16px;max-width:1400px}h1{font-size:24px;margin:4px 0}p{margin:4px 0}</style><main>'+panel+'</main></html>')
target=R/'dist/reports/build32';target.mkdir(parents=True,exist_ok=True)
for n in ['index.html','comparison.html','zone-status.json','road-policy.json','route-actions.json','junction-attachments.json','preserved-assets.json','final-road-walks.json','architecture-check.json','mesh-height-check.json','ui-regression.json','performance-comparison.json','graph-components.json']:
    shutil.copy2(P/n,target/n)
for d in ['before','after','walking']: shutil.copytree(P/d,target/d,dirs_exist_ok=True)
print('report published locally',len(zone_status),'zones,',len(browser['results']),'browser directions')
