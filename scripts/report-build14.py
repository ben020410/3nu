# coding:utf-8
import json,html
from pathlib import Path
r=Path('.').resolve();out=r.parent;c=json.loads((r/'dist/data/campus.json').read_text());status=json.loads((r/'BUILD14-122-STATUS.json').read_text())
verified={'436516340','436516339','436516341','700872151','456356713','167659979','193893586','439703635','251646340','386890466','179742150','179742155','179742153','297047750','424946985','238936704','167608115','439703636','vw/258','439707887','439707889','vw/71','official-56-1','official-303'}
for b in c['buildings']:
 if b['id']in verified and b.get('photoVerification14'):b['photoVerification14']['status']='partial-render-compared';b['photoVerification14']['comparisonCaveat']='Visible reference features compared in saved views; not full facade/height/plan certification.'
 if b['id']=='700872151':b['heightEvidence14']={'url':'https://www.snu.ac.kr/webdata/uploads/kor/file/2020/02/26th_vision_change.pdf','fact':'Official indexed excerpt gives B2 / 10 above-ground floors','access':'indexed excerpt; full PDF open failed','metres':'40.4m estimated; no official metric height confirmed'}
(r/'dist/data/campus.json').write_text(json.dumps(c,ensure_ascii=False,separators=(',',':')))
models=[{'id':b['id'],'name':b['name'],'number':b.get('officialNumber'),'model':b.get('reviewModel'),'height':b['h'],'photo':b.get('photoVerification14'),'plan':b.get('planVerification14'),'sources':b.get('identitySources14',[])}for b in c['buildings']if b['id']in verified]
(r/'BUILD14-MODEL-STATUS.json').write_text(json.dumps({'fullCampusCompleted':False,'models':models,'remaining':'89 original-cohort items without action; already matched campus buildings also not all visually checked'},ensure_ascii=False,indent=2))
p=out/'BUILD14-comparison.html';s=p.read_text();extra=[
('944동 삼성전자 연구소','samsung944','build14-reference-944-street.png','두 높은 매스와 낮은 연결부, 유리·테라코타 외벽. 2021-04 거리뷰와 위성사진 대조; 높이 40.4m 추정.'),
('944동 평면','samsung944-top','build14-reference-944.png','기존 외곽선을 유지하며 지붕 높이를 분리. 전체 외벽과 정확한 부분 높이는 미검증.'),
('945동 코웨이','coway945','build14-reference-945-photo.jpg','중복 모델 통합, 벽돌과 곡선 유리 띠, 수경시설 구현. 공식 사진 2026년 게시, 촬영 시기 불명.'),
('945동과 전면 공간','coway945-top','build14-reference-945.png','실제 지붕 윤곽 재작성, 어긋난 별도 윤곽 렌더·충돌 억제. 전면 포장면 추가.'),
('교수아파트 D·F동','apartments','build14-reference-apartments-2025-street.png','2025-08 거리뷰의 D동 5개 주거층, 발코니, 상부 다른 재료와 F동 유리면·지붕 단차 반영. 다른 7개 동은 외형 미완료.'),
('506동 저장고','warehouse506','build14-reference-506-photo.png','vw/71을 실제 낮은 콘크리트 창고로 교체. 창문 반복 제거, 지붕 가림막과 사다리. 반대편 외벽은 추정.'),
('506동 배치','warehouse506-top','build14-reference-506.png','지도 측정 300px=71.1m 사용. 102동 기준점과 500동을 대조했으나 지붕 원근과 수작업 오차 남음. 주변 두 작은 윤곽 미확인.')]
for title,key,ref,note in extra:
 if f'<h2>{title}</h2>'in s:continue
 sec=f'<section><h2>{title}</h2><p>{note}</p><div class="images">'
 for label,file in [('참고 자료',ref),('수정 전',f'build14-before-{key}.png'),('수정 후',f'build14-after-{key}.png')]:sec+=f'<figure><figcaption>{label}</figcaption><a href="{file}"><img loading="lazy" src="{file}"></a></figure>'
 s=s.replace('</html>',sec+'</div></section></html>')
p.write_text(s)
intro='''<h1>BUILD14 구현 결과와 남은 범위</h1><p><strong>전체 정밀 보정은 미완료이며 공개 배포하지 않았습니다.</strong> 정문과 24개 개별 모델을 수정·실행 비교했습니다. 모두 확인한 면에 한정한 부분 검증이며, 실측 도면에 맞춘 완성 모델은 아닙니다.</p>
<h2>실제 변경</h2><ul><li>정문 전체 높이·폭·두께·깊이 1.2배. 모델 높이 16.60→19.92m, 폭20.95→25.14m, 깊이2.14→2.568m. 캐릭터1.79m 유지, 높이비9.3→11.1배. 치수는 사진에 근거한 추정.</li><li>정문광장 경계와 인접도로15m, 문장·가로등·나무·볼라드 및 충돌 조정. 포장 면적3535m²는 모델 값이며 실측치 아님.</li><li>풍산마당 비대칭 지붕·뒤쪽 꼬리·곡면, 관람단과 잔디 경계. 56-1·303동 위치·윤곽·부분 높이 보정. 56-1과28동 관통 경로 제거.</li><li>12·13·28·65·71-1·310·330·331·500동 일부,944·945동,교수아파트D·F동,506동에 서로 다른 모델 적용.</li><li>331동과945동 중복,945동 옥상 윤곽의 잘못된 지상 모델을 렌더·충돌에서 제외하고 원본 기록 보존. 330/332 오매칭 정정. 506동 오배치 이름 제거.</li><li>28·331·945동 주변 포장면을 배타적 지면 분할에 반영. 도로 위에 면을 덧씌우지 않음.</li></ul>
<h2>122개 추적</h2><p>34개에 이름·구성·중복·모델 조치를 적용했습니다. 그중17개는 개별 모델/시설 형상 변경으로 집계됩니다. 중복 억제는 별도 조치입니다. 88개는 미해결이며, 전부 자료 접근이 차단된 것은 아닙니다. 전체 외형·배치 검증 완료로 집계한 항목은0개입니다.</p>
<h2>검증</h2><p>동일 카메라의 수정 전후 비교 화면과 실제 확인한 참고 이미지를 아래 비교 기록에 저장했습니다. 경로126개·모의 이동124,438m 실패0, 건물 충돌295건, 프레임 독립·대각선 정규화·길 밖 이동 검사 통과. 지면 메시와 이동 높이 최대 차이0.000027m, 배타적 지면 분할 검사 통과. 이는 공간적 유사성의 증거가 아닙니다.</p><p>브라우저에서 표준/고화질 전환과 비행 상승을 실행했습니다. 순간 FPS는 탭 전환에 따라 크게 변해 공정한 개선율을 제시하지 않습니다. 통제된 장시간 성능 비교와 모바일 Safari 실기기는 미검증입니다.</p>
<h2>남은 차이와 자료 문제</h2><ul><li>풍산마당: 실제 관람단 수·끝부분 불규칙 윤곽과 지붕 곡률 미측정. 공개 준공 사진과 위성사진은 확보했으나 치수 도면 없음.</li><li>56-1·303동: 다중 기준점의 정량 오차 계산 미완료. 지붕의 촬영 원근과 숨은 면 치수 불확실. 측량 오차 수치를 만들지 않음.</li><li>교수아파트 A·B·C·E·G·H·I, 기존 매칭 건물 다수: 아직 외관 보정 미완료. 접근 가능한 작업 잔여이며 차단으로 분류하지 않음.</li><li>18–19동 연결부,115·117·85-2 등 충돌 항목: 위치 후보와 공식 정보를 확보했지만 실제 구조·동일 시설 여부 추가 대조 필요.</li><li>332동: 공식 사진과 현재330동의 형태가 다름을 확인했으나 별도 금속 차고의 정확한 윤곽 미확정.</li><li>삼성944 자료 PDF 전체 열기 실패: 공식 검색 색인의 층수와 실제 거리뷰만 사용. 다른 보정 작업을 막지는 않음.</li><li>나머지88개: 공식 번호 없음, 부속시설 관계 미확정, 중복·시기 충돌, 외관 조사 미진행을 항목별로 분리. 무조건 삭제하거나 일반 건물로 새로 채우지 않음.</li></ul>
<p>다음 순서: 500동 부속 구조물/18–19연결부→115·117 등의 이름·위치 충돌→미술대·학군단→주거동 나머지와 북측 외곽. 기존122개뿐 아니라 기매칭 건물 외형도 계속 대상입니다.</p>
<p><a href="BUILD14-comparison.html">참고 / 수정 전 / 수정 후 비교 화면</a> · <a href="campus-walk/BUILD14-122-STATUS.json">122개 항목별 상태</a> · <a href="campus-walk/BUILD14-MODEL-STATUS.json">모델별 출처·높이·한계</a></p>'''
(out/'BUILD14-report.html').write_text('<!doctype html><html lang="ko"><meta charset="utf-8"><title>BUILD14 구현 기록</title><style>body{max-width:1000px;margin:40px auto;padding:24px;font:17px/1.7 system-ui;color:#24382d;background:#f5f6ef}h1{font-size:30px}h2{margin-top:32px}li{margin:10px 0}a{color:#276750}</style>'+intro+'</html>')
print('report and comparison updated; not published')
