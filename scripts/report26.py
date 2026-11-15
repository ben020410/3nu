from pathlib import Path
import json,html
R=Path(__file__).resolve().parents[1];Q=R/'reports/build26';audit=json.loads((R/'BUILD26-FINAL-AUDIT.json').read_text());walk=json.loads((R/'BUILD26-WALK.json').read_text());ends=json.loads((R/'BUILD26-ROAD-ENDS.json').read_text());states=[]
for key,z in audit['zones'].items():
 tests=walk['zones'].get(key,{})
 states.append({'zone':key,'landmarks':' / '.join(b.get('name','') for b in z['buildings'][:2] if b.get('name') and '미등록' not in b['name']) or '외곽·경계 구역','buildingCount':len(z['buildings']),'roadCount':len(z['roads']),'surfaceChange':'공통 도로 합집합·분할 메시 적용' if z['roads'] else '도로 없음; 기존 지형 유지','aerial':'after-zones/zone25-'+key+'.png','ground':('ground-zones/ground25-'+key+'.png') if (Q/('ground-zones/ground25-'+key+'.png')).exists() else None,'walk':tests,'visualStatus':'구역 대표 시점 확인; 모든 외벽·샛길을 개별 확인한 것은 아님'})
(R/'BUILD26-ZONES.json').write_text(json.dumps(states,ensure_ascii=False,indent=2))
parts=['<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>3NU BUILD26 비교 기록</title><style>body{font:16px/1.6 system-ui;max-width:1280px;margin:40px auto;padding:0 20px;background:#fafaf8;color:#162943}img{max-width:100%}.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #ddd;text-align:left;padding:8px}h2{margin-top:40px}@media(max-width:700px){.pair{grid-template-columns:1fr}}</style><h1>3NU BUILD26 — 계단·광장·도로 연결</h1><p>로컬 구현·검증 결과. 공개 배포는 소스 서버 HTTP 400으로 완료하지 못했습니다.</p><p>첨부 화면과 유사한 검증 카메라를 새로 정의하고 수정 전후 같은 좌표로 촬영했습니다. 사용자가 촬영한 원래 카메라 좌표를 복원한 것은 아닙니다. 사진 5의 정확한 도로 ID와 27개 끝점의 실제 목적지는 미확정입니다.</p>']
for key,title in [('right','관정관 진입 계단: 6m → 10m'),('left','반대편 계단: 5m → 8m, 3개 구간과 넓은 계단참'),('plaza','광장 내부의 자투리 녹지와 연결 포장')]:
 parts.append(f'<h2>{title}</h2><div class="pair"><figure><figcaption>수정 전</figcaption><img src="{key}-before.png"></figure><figure><figcaption>수정 후</figcaption><img src="{key}-after.png"></figure></div>')
parts.append('<h2>계단 하단·중간·상단</h2>')
for k in ['low','mid','top']:parts.append(f'<img src="stairs-{k}.png" loading="lazy">')
parts.append('<h2>검증 범위</h2><p>885개 외부 도로·보행로의 양방향 1,770건 통과. 미구현 실내 통과 선분 1개(2방향)는 외부 길 목록에서 제외하고 원본을 기록했습니다. 기존 1,772건과 분모가 다릅니다. 18개 진입로 수정, 도서관 13개 동선 및 폭 검사, 브라우저 실제 왕복 48방향과 별도 70방향 구역 검사 기록을 보존했습니다.</p><p>자동 검사는 형태 재현 완료의 근거가 아닙니다. 상공 30구역·지상 27구역 대표 화면을 함께 점검했습니다. 27개 미확정 끝점과 사진 5의 도로 대응, 모든 개별 출입구까지의 전수 시각 검증은 미완료입니다.</p><h2>구역별 기록</h2><table><tr><th>구역</th><th>건물 / 길</th><th>상공</th><th>지상</th><th>자동 왕복</th></tr>')
for z in states:
 parts.append(f'<tr><td>{z["zone"]}<br>{html.escape(z["landmarks"])}</td><td>{z["buildingCount"]} / {z["roadCount"]}</td><td><a href="{z["aerial"]}">화면</a></td><td>'+ (f'<a href="{z["ground"]}">화면</a>' if z['ground'] else '도로 없음')+f'</td><td>{z["walk"].get("passed",0)} 통과</td></tr>')
parts.append('</table><h2>전체 화면</h2><img src="campus-after.png"><h2>지상 시점 모음</h2><img src="ground-contact.jpg"><h2>보존한 구조</h2><p>건물 위치·외형, 잔디광장의 위·아래 바닥, 학생회관 필로티, 3층 연결교와 5층 옥상정원의 별도 동선을 유지했습니다. 새 계단 폭과 높이 연결은 모델을 위한 설계값이며 실측값이 아닙니다.</p></html>')
(Q/'index.html').write_text(''.join(parts))
