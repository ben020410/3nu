# -*- coding: utf-8 -*-
"""Build the reproducible BUILD31 handoff; external reference images stay private."""
import json, pathlib, html, collections, shutil, math
R=pathlib.Path(__file__).resolve().parents[1]
O=R/'reports/build31'; P=R/'dist/reports/build31'
A=json.loads((R/'sources/landuse31.json').read_text())
D=json.loads((R/'dist/data/campus.json').read_text())
L=json.loads((O/'area-ledger.json').read_text())
Z={
 'science':('자연대 22–28·56·56-1동','부분 완료','26·27·28동 사이 넓은 포장과 세 식재 섬, 24동 중정, 56동 차량 공간, 56-1동 앞마당을 분리했습니다.','26동 일부 윤곽과 연결부가 실제 사진과 다릅니다. 수관 아래 경계는 추정이며 기존 얇은 보행로가 중정 안에 남습니다.'),
 'agriculture':('농생대 200·201·75-1동','부분 완료','동측 앞마당·차량 공간, 동 사이 포장과 식재, 75-1동 진입부 및 서측 숲을 구분했습니다.','기존 200동은 영상의 두 동과 다른 큰 꺾인 윤곽입니다. 건물을 유지하므로 그 윤곽과 충돌하는 실제 포장 범위는 제외했습니다. 농식광장의 정확한 시설명·전체 경계는 확정하지 않았습니다.'),
 'engineering':('공대 30–37동·붉은광장','부분 완료','31·32동 사이와 33·34·36·37동 사이를 넓은 포장·중정 식재·차량 구역으로 재분할했습니다. 붉은광장은 이름만으로 붉게 칠하지 않았습니다.','기존 32동·36동·37동 윤곽의 오차와 기존 길이 식재 경계와 충돌하는 부분이 있습니다. 골목 선형·폭과 이름이 가리키는 광장 전체 경계는 후속 확인이 필요합니다.'),
 'library':('관정관·약학관','부분 완료','약학관 전면 포장, 서비스·차량 구역, 동측 숲과 식재를 분리했습니다. 관정관 뒤 하부 통로·상부 보행면은 보존했습니다.','20동 기존 위치·윤곽 차이와 수목 아래 바닥이 불확실합니다. 일부 저층부의 기존 지면 접합은 이번 바닥 재분류로 정밀 보정한 것이 아닙니다.'),
 'beodeul':('버들골·풍산마당·교수회관','부분 완료','열린 잔디의 비대칭 윤곽, 양쪽 밀집 수목군, 교수회관 앞 포장·차량 공간과 공연장 접근 포장을 나눴습니다.','수목 아래 실제 지면 재료는 확인할 수 없어 숲 바닥으로 추정했습니다. 교수회관 기존 평면 차이와 공연장 세부 구조는 유지했습니다.'),
 'humanities':('인문대 1–5동·자하연','부분 완료','추가 위성사진으로 1·2동 사이 포장과 정원, 3·4동·5동 주변 중정, 자하연 북측 접근면을 반영했습니다.','아방궁의 수목 아래 세부 경계는 추정입니다. 자하연 수면·목재 데크는 유지했고 물가 전체를 새로 측량한 것은 아닙니다.'),
 'social':('사회대','부분 완료 · 아고라 자료 부족','추가 위성사진에 드러난 16동 동측 주차 공간, 남측 앞마당, 101동 동측 포장과 정원을 반영했습니다.','서측 공사 구역을 완공된 아고라로 간주하지 않았습니다. 그곳의 최신 완공 항공·지상 자료가 필요합니다.'),
 'upper':('301·302·303동','부분 완료 · 남측 자료 부족','직접 확인했던 BUILD30 위성사진을 사용해 303동 서측 주차장, 301동 차량 접근부, 302동 북측 앞마당과 주변 숲을 반영했습니다.','302동 남측은 참고 화면 밖이므로 변경하지 않았습니다. 데크·연결교·건물 접속부는 유지했으며 위아래 통행을 별도로 검사했습니다.'),
 'education':('사범대','부분 완료','추가 위성사진에 드러난 9–12동 내부 중정·식재, 13동 접근 포장, 동측 수목군을 반영했습니다.','나무 아래 가려진 포장 경계와 작은 진입 계단은 추정 또는 기존 상태 유지입니다. 확인되지 않은 별도 광장을 만들지 않았습니다.')
}
SRC={
 'user-naver-20261113':{'label':'사용자 제공 네이버 위성사진 2','url':'https://map.naver.com/p/','scope':'자연대·농생대·공대 30–37·약학관·버들골','viewed':True,'captureDate':'제공일 2026-11-13; 항공 촬영일 미확인','permission':'배치 판독만 사용; 사진을 배포본 텍스처나 공개 보고서에 넣지 않음'},
 'naver-humanities-20261113':{'label':'네이버지도 인문대 위성사진 직접 확인','url':'https://map.naver.com/p/','scope':'1–5동·자하연 접근면','viewed':True,'privateCapture':'work/build31-reference/naver-humanities.png'},
 'naver-education-20261113':{'label':'네이버지도 사범대 위성사진 직접 확인','url':'https://map.naver.com/p/','scope':'9–13동','viewed':True,'privateCapture':'work/build31-reference/naver-education.png'},
 'naver-social-20261113':{'label':'네이버지도 사회대 위성사진 직접 확인','url':'https://map.naver.com/p/','scope':'16동·101동; 서측 공사 구역은 미확정','viewed':True,'privateCapture':'work/build31-reference/naver-social.png'},
 'naver-engineering-build30':{'label':'BUILD30에서 직접 확인한 네이버 상부 공대 위성사진','url':'https://map.naver.com/p/','scope':'301·303동 및 302동 북측','viewed':True,'privateCapture':'work/build30-reference/naver-engineering.png; naver-301.png'},
 'official-map':{'label':'서울대 공식 캠퍼스맵','url':'https://map.snu.ac.kr/web/main.action','scope':'기존 공식 동 번호·명칭 대응; 바닥 실측 자료가 아님'},
 'official-walk':{'label':'서울대 산책 안내 PDF','url':'https://map.snu.ac.kr/api/upload/guide/SNU_Walk.pdf','scope':'파일 접근 확인. 이번 면 경계를 결정한 근거로 사용하지 않음','boundarySource':False}
}
for s in SRC.values():s.setdefault('captureDate','화면 확인 2026-11-13; 항공 촬영일 미확인');s.setdefault('permission','참고 관찰만 사용; 원본 이미지는 공개 배포하지 않음')
# Image landmarks are approximate roof/feature centres, not surveyed ground corners.
# They were used to cross-check an unchanged metre frame, never to rescale buildings.
controls={
 'science': [('28동',[1190,782],[-149.6,-149.6]),('56동',[1495,780],[-54.6,-142.6]),('31동 인접 기준',[1110,996],[-176.4,-217.7])],
 'agriculture':[('200동 남측 덩어리',[680,871],[-309.1,-149.9]),('201동',[685,1090],[-317,-233.5]),('75-1동',[675,1240],[-304,-285.4])],
 'engineering':[('31동',[1110,996],[-176.4,-217.7]),('33동',[1261,1284],[-133.3,-309.8]),('36동',[1534,1543],[-59.8,-387.7]),('37동',[1292,1467],[-105.4,-366.8])],
 'library':[('본관 62동',[1700,200],[4.4,28.7]),('관정관 62-1동',[1805,290],[38.3,-7.6]),('약학관 20동',[1862,415],[69,-49])],
 'beodeul':[('풍산마당 100동',[2640,549],[305.3,-70.9]),('교수회관 65동',[2220,749],[150.6,-122.7]),('교수회관 남측 주차 진입',[2400,931],None)],
 'humanities':[('1동',[140,480],[29.9,141.7]),('3동',[590,270],[139.8,197.9]),('5동',[730,320],[171.1,181]),('14동 인접 기준',[1110,190],[267,210])],
 'education':[('9동',[377,180],[255.2,143.7]),('10동',[566,135],[296.4,141.6]),('11동',[527,355],[285.7,91.8]),('12동',[380,450],[246.8,55.7])],
 'social':[('16동 북단',[575,30],[-75,582]),('16동 안쪽 꺾임',[525,475],[-88,475]),('16동 남단',[665,632],[-45,442]),('83동',[730,350],[-30.1,495.5]),('101동',[250,450],[-160.6,471.4])],
 'upper':[('303동 외곽 범위',[675,305],[-41,-965.8]),('301동 타워·저층부 기준',[845,335],[31,-1030.8]),('302동 북단',[850,590],[37.9,-1165.5])]
}
t=A['registration']['userImage']
def tx(p):x,y=p;return [t['a']*x-t['b']*y+t['c'],-(t['b']*x+t['a']*y+t['d'])]
records={}
for z,items in controls.items():
 records[z]=[]
 for name,p,m in items:
  q={'feature':name,'referencePixelApprox':p,'modelXZApprox':m,'anchorType':'roof/visible feature, not surveyed ground corner','role':'cross-check'}
  if z in ['science','agriculture','engineering','library','beodeul']:
   q['commonTransformXZ']=[round(v,2) for v in tx(p)]
   if m:q['visualAnchorResidualM']=round(math.dist(tx(p),m),1)
  records[z].append(q)
registration={'unit':'1 world unit = 1 metre','originLonLat':[126.952,37.459],'axes':'x east; z north; y up','formula':'x=(lon-lon0)*111320*cos(lat0); z=(lat-lat0)*111320','commonImageTransform':t,'imageDimensions':[3152,1636],'controls':records,'camera':'landuse31-reference: north-up orthographic, same crop plus margin; 1280×720; no perspective','caution':'Manual roof/feature points include roof parallax and existing footprint error. Residuals are alignment diagnostics, NOT measured positional accuracy. No individual building was moved or scaled. Additional captures use independent hand registration within the same metre frame; not cadastral boundaries.'}
(O/'reference-registration.json').write_text(json.dumps(registration,ensure_ascii=False,indent=2)+'\n')
(O/'sources.json').write_text(json.dumps(SRC,ensure_ascii=False,indent=2)+'\n')
roadTasks=[
 {'zone':z,'status':'다음 단계 도로 정비 필요','task':t} for z,t in [
 ('science','26–28동 중정 안의 기존 가는 보행로와 새 넓은 포장의 경계 통합; 56동 서비스 진입선 검토'),
 ('agriculture','200동 기존 윤곽 불일치 해결 후 앞마당 재조정; 201·75-1동 진입로 폭 전환'),
 ('engineering','32동 과대 윤곽 및 36·37동 평면 차이와 충돌하는 중정·녹지 경계; 기존 회색 띠 정리'),
 ('library','약학관 차량 진입부의 도로–포장 선형; 상부·하부 층 분리를 계속 보존'),
 ('beodeul','공연장 접근로와 교수회관 차량 공간의 폭·합류; 숲 속 미확인 길을 새로 만들지 않음'),
 ('humanities','1·2동 및 5동 앞 포장에 남은 기존 가는 보행로 표현 통합'),
 ('social','아고라 서측 공사 구역 최신 영상 확보 후 연결선 결정'),
 ('upper','302동 남측 추가 위성사진 확보; 데크 아래 지상 도로는 별도 유지'),
 ('education','수관 아래 출입구 연결선의 지상 사진 확인 후 정비')]]
(O/'next-road-stage.json').write_text(json.dumps(roadTasks,ensure_ascii=False,indent=2)+'\n')
status=[]
for z,(label,state,change,limit)in Z.items():
 areas=[a for a in L['areas']if a['zone']==z]
 status.append({'zone':z,'label':label,'status':state,'implemented':change,'remaining':limit,'areas':len(areas),'modelAreaM2':round(sum(a['effectiveArea']for a in areas),2),'visualReview':'north-up before/after plus ground before/after inspected','walkReview':'new representative route both directions; not every point of every polygon','roadStage':'deferred network redesign'})
(O/'zone-status.json').write_text(json.dumps(status,ensure_ascii=False,indent=2)+'\n')
# Own vector diagram shows authored boundaries and unchanged footprints, not a
# republished satellite image and not an independent accuracy claim.
colors={'plaza':'#d9d5ca','plazaBand':'#b8b6ad','parking':'#8d9296','lawn':'#a3c484','planting':'#65945f','wood':'#426d4e'}
bounds={'core':(-525,-436,980,552),'humanities':(-25,60,330,220),'social':(-225,370,320,255),'upper':(-185,-1240,350,355),'education':(190,0,210,190)}
for zone,(x0,z0,w,h) in bounds.items():
 def path(ps):return 'M'+' L'.join(f'{p[0]:.2f},{-p[1]:.2f}'for p in ps)+' Z'
 parts=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0} {-z0-h} {w} {h}"><rect x="{x0}" y="{-z0-h}" width="{w}" height="{h}" fill="#eef1e9"/>']
 for a in A['areas']:parts.append(f'<path d="{path(a["outer"])}" fill="{colors[a["kind"]]}" stroke="#ffffff" stroke-width=".4"/>')
 for b in D['buildings']:
  parts.append(f'<path d="{path(b["p"])}" fill="#f9f9f6" stroke="#6b7680" stroke-width=".6"/>')
  if b.get('officialNumber'):
   x=sum(p[0]for p in b['p'])/len(b['p']);z=sum(p[1]for p in b['p'])/len(b['p'])
   parts.append(f'<text x="{x:.2f}" y="{-z:.2f}" text-anchor="middle" font-size="5" fill="#24394a">{html.escape(b["officialNumber"])}</text>')
 parts.append(f'<text x="{x0+8}" y="{-z0-h+15}" font-size="8" fill="#20384c">N ↑ · 자체 제작 경계 판독도 · 실측 아님</text></svg>')
 (O/f'plan-{zone}.svg').write_text(''.join(parts))
def pair(key,caption):
 return '<div class="pair">'+''.join(f'<figure><a href="{key}-{s}.png"><img loading="lazy" src="{key}-{s}.png" alt="{html.escape(caption)} {ko}"></a><figcaption>{ko} · {html.escape(caption)}</figcaption></figure>'for s,ko in [('before','BUILD30 수정 전'),('after','BUILD31 수정 후')])+'</div>'
css='''*{box-sizing:border-box}body{margin:0;background:#f4f6f8;color:#253547;font:16px/1.7 system-ui,sans-serif}main{max-width:1600px;margin:auto;padding:32px 24px}h1{font-size:30px;line-height:1.3}h2{font-size:23px}h3{font-size:19px}section{padding:26px 0;border-top:1px solid #cfd8df}.intro{max-width:1080px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0}figure{margin:0;background:#fff;border:1px solid #d4dce2;border-radius:8px;overflow:hidden}img{width:100%;height:auto;display:block}figcaption{padding:8px 12px;font-size:14px}.limit{color:#66533b;background:#fff7e7;padding:12px 16px;border-radius:8px}.status{color:#80591e;font-weight:700}a{color:#284e86}table{width:100%;border-collapse:collapse;font-size:14px}th,td{border:1px solid #cfd8df;padding:10px;text-align:left;vertical-align:top}nav{display:flex;gap:12px;flex-wrap:wrap}code{font-size:13px}details{padding:12px;background:white;border-radius:8px;margin:12px 0}.scroller{overflow-x:auto}@media(max-width:700px){main{padding:20px 14px}.pair{grid-template-columns:1fr}h1{font-size:25px}}'''
body=['<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>3NU BUILD31 — 외부 공간 경계 보정</title><style>'+css+'</style><main>',
 '<h1>3NU BUILD31 · 건물 사이 공간을 면으로 구분</h1><div class="intro"><p>9개 구역에 79개의 포장·중정·차량 공간·식재·숲 경계를 정의하고 기존 바닥을 교체했습니다. 건물·도로망·건축적 높이 관계는 유지했습니다.</p><p class="limit">구현·대표 동선 검증은 9개 구역 모두 진행했습니다. 다만 경계는 영상 판독에 따른 추정이며, 기존 건물 윤곽 오차·수관 아래 가림·사진 밖 영역이 남아 있어 전체를 정밀 재현 완료로 보고하지 않습니다.</p></div>',
 '<nav><a href="../../index.html">3NU 플레이</a><a href="#status">구역별 상태</a><a href="#registration">정렬·근거</a><a href="#validation">이동·표면 검사</a><a href="#performance">동일 조건 성능</a></nav>',
 '<section><h2>첨부 위성사진 범위 · 북쪽이 위인 정사영</h2><p>하나의 축척과 방향을 사용했습니다. 사진 비율과 브라우저 비율 차이는 여백으로 처리했습니다. 이미지나 건물별 축척을 늘이거나 비틀지 않았습니다.</p>'+pair('landuse31-reference','첨부 사진 범위 + 여백')+'</section>',
 '<section id="status"><h2>구역별 상태</h2><div class="scroller"><table><tr><th>대상</th><th>실제 교체</th><th>정확도·후속 상태</th></tr>']
for s in status:body.append(f'<tr><td><a href="#{s["zone"]}">{s["label"]}</a></td><td>{s["areas"]}개 경계 · 상공/지상 비교 · 대표 동선 왕복</td><td>{s["status"]}</td></tr>')
body.append('</table></div><p>면 개수는 작성된 경계 개수입니다. 잘린 조각 수나 이름 연결 수를 완료 건물 수로 세지 않았습니다.</p></section>')
for z,(label,state,change,limit)in Z.items():
 body.append(f'<section id="{z}"><h2>{label}</h2><p class="status">{state}</p><p>{change}</p><p class="limit">{limit}</p>'+pair('landuse31-'+z,'동일 좌표·북향 상공')+pair('landuse31-ground-'+z,'동일 좌표·지상 공간')+'</section>')
body.append('<section id="registration"><h2>정렬과 참고 자료</h2><p>1 단위 = 1m, X 동쪽·Z 북쪽·Y 위쪽, 기준 경위도 126.952 / 37.459입니다. 첨부 영상은 공통 유사변환으로 정렬했고 추가 영상도 같은 모델 좌표계에서 대조했습니다. 아래 점들은 분산된 지붕·식별 시설의 수동 대응점입니다. 지상 모서리가 가려진 곳의 지붕 편차를 실측 오차로 해석하지 않았습니다.</p><p>농생대 200동의 덩어리 구성, 공대 32·36·37동, 약학관 20동·교수회관은 기존 모델과 영상의 차이가 남습니다. 바닥을 비틀어 맞추지 않고 기존 건물을 제외한 영역만 교체했습니다. <a href="reference-registration.json">기준점·좌표·진단 잔차</a></p><div class="scroller"><table><tr><th>구역</th><th>서로 떨어진 대응 기준</th></tr>')
for z,cs in records.items():body.append('<tr><td>'+Z[z][0]+'</td><td>'+', '.join(c['feature']for c in cs)+'</td></tr>')
body.append('</table></div><details><summary>자체 제작 경계 판독도와 출처</summary><p>아래 도식은 구현에 사용한 해석 경계입니다. 위성사진 원본이 아니며 독립적인 정확도 검증값도 아닙니다. 회백색=포장, 진회색=차량 공간, 연두색=잔디, 중간 초록=식재, 짙은 초록=수목군입니다.</p><img src="plan-core.svg" alt="자체 제작 바닥 경계 도식"><p><a href="plan-humanities.svg">인문대 도식</a> · <a href="plan-social.svg">사회대 도식</a> · <a href="plan-education.svg">사범대 도식</a> · <a href="plan-upper.svg">상부 공대 도식</a></p><ul>')
for s in SRC.values():body.append(f'<li><a href="{html.escape(s["url"],quote=True)}">{s["label"]}</a> — {s["scope"]}. {s["captureDate"]}</li>')
body.append('</ul><p>외부 이미지는 관찰 자료로만 사용했습니다. 공개 텍스처·보고서에는 원본 캡처를 포함하지 않았습니다. 지도 글자·차량·그림자를 바닥 무늬로 복제하지 않았습니다.</p></details></section>')
body.append(f'<section id="validation"><h2>기존 면 교체와 이동 검증</h2><p>기존 지면 {L["oldSurfacesReplacedOrSplit"]}개를 분할·교체하고, 수정 범위 밖 조각 {L["oldFragmentsRetained"]}개는 보존했습니다. 새 구획은 높이 경계에 맞춰 {L["newFragments"]}조각으로 컴파일했습니다. 같은 공간 위에 새 판을 얹지 않았습니다.</p><ul><li>도로·보행로·운동시설·수면, 건물 바닥 윤곽, 계단·데크 영역을 새 면에서 제외했습니다.</li><li>기존 높이 보정의 적용 순서와 값을 그대로 분할해 렌더링과 이동이 같은 높이를 참조합니다. 지면 높이·건물·도로망을 변경하지 않았습니다.</li><li>실제 겹침 검사: 새 면 상호 간, 도로, 건물, 건축 보행면과의 중복 면적 0.</li><li>512,115개 지면 정점과 이동 높이 차이 최대 0.000025m 미만. 이는 계산 일관성 검사이며 실제 측량 정확도가 아닙니다.</li><li>컴파일 재실행 결과 해시 동일. 면과 수목이 재생성 때 누적되지 않습니다.</li><li>브라우저에서 새 구역 18회 + 도서관 20회 + 공학관·데크 18회 = 56회 방향별 걷기 완료. 점프 없이 통과했습니다.</li><li>별도 이동 계산: 같은 56회 경로, 30/60/120fps에서 27개 점프 착지, 데크 위·아래 층 분리 검사 통과.</li><li>실제 UI에서 점프 착지, 백학 상승 후 리오로 바꿔 지상 복귀 확인. 닉네임·P 설정·미니맵 유지.</li></ul><p class="limit">검사는 선정한 대표 경로의 결과입니다. 캠퍼스의 모든 출입구나 79개 면의 모든 점을 걷기 검증했다고 주장하지 않습니다. 기존 지형의 모든 결함을 이번 작업에서 해결한 것도 아닙니다.</p><div class="pair"><figure><img loading="lazy" src="regression28-library-walk.png"><figcaption>기존 도서관 다층 동선 왕복</figcaption></figure><figure><img loading="lazy" src="regression30-deck-walk.png"><figcaption>공학관 데크 위·아래 회귀 검사</figcaption></figure></div><p><a href="browser-walks31.json">새 구역 걷기</a> · <a href="browser-regression28.json">도서관 회귀</a> · <a href="browser-regression30.json">공학관 회귀</a> · <a href="movement-check.json">이동 계산</a> · <a href="partition-check.json">겹침 검사</a> · <a href="ground-check.json">지면 검사</a> · <a href="reproducibility.json">재생성 검사</a> · <a href="interaction-check.json">조작 검사</a></p></section>')
body.append('<section id="performance"><h2>같은 조건의 성능</h2><p>동일 Mac·InAppBrowser, 1280×720, 장면별 동일 카메라, 실행 중인 3D 탭 1개. 수치는 아래 실제 수집 결과이며 모바일 Safari 실기기는 미검증입니다.</p><div class="scroller"><table><tr><th>빌드</th><th>장면</th><th>화질</th><th>샘플</th><th>평균 ms</th><th>P95 ms</th><th>FPS</th></tr>')
perf=json.loads((O/'performance.json').read_text())if (O/'performance.json').exists()else []
for p in perf:body.append(f'<tr><td>{p["build"]}</td><td>{p["camera"]}</td><td>{p["quality"]}</td><td>{p["samples"]}</td><td>{p["meanMs"]}</td><td>{p["p95Ms"]}</td><td>{p["fps"]}</td></tr>')
body.append('</table></div><p>고화질의 넓은 상공 화면은 지상 걷기와 성능이 다릅니다. 낮은 FPS가 측정된 조건은 숨기지 않고 남겼습니다. 형태 정확도 판정과 FPS는 별개입니다.</p></section>')
body.append('<section><h2>다음 도로·보행로 정비로 넘기는 항목</h2><ul>')
for t in roadTasks:body.append('<li>'+Z[t['zone']][0]+' — '+t['task']+'</li>')
body.append('</ul><p><a href="zone-status.json">구역별 상태</a> · <a href="area-ledger.json">모든 면의 유형·출처·높이 정책</a> · <a href="next-road-stage.json">도로 후속 목록</a> · <a href="cameras.json">동일 시점 좌표</a></p></section></main></html>')
(O/'index.html').write_text(''.join(body))
P.mkdir(parents=True,exist_ok=True)
for f in O.iterdir():
 if f.is_file()and f.suffix in ['.png','.svg','.json','.html'] and f.name not in ['walk-planning.json','walk-targets.json']:
  shutil.copy2(f,P/f.name)
print('Report written; private reference captures/source snapshots excluded.')
