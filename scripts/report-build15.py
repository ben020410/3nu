# coding: utf-8
import json,pathlib,html
R=pathlib.Path(__file__).resolve().parents[1];out=R.parent
status=[
 ('이름·검색·지도','구현 완료 / 공식 명칭 일부 확인','공통 건물명(번호동) 표시, 단계·공사 설명 제거, 원본 이름/번호·검색 별칭 보존. 자하연·미술관·야구장 선택 이름표 실제 확인.','공식 상세 URL과 연결되지 않은 항목은 최신 명칭 미검증. 919A/D 같은 세부 식별자는 임의 숫자 번호로 합치지 않음.'),
 ('캐릭터·점프','구현·실행 확인','몸통·머리·얼굴·팔다리·보행 애니메이션 교체. 1.790m 유지. Space/버튼 점프, 비행 중 Space/E 상승 유지.','모바일 Safari 실기기 미검증.'),
 ('잔디광장','구조 구현 / 정밀 재현 부분 완료','막힌 단을 상부 잔디 슬래브·기둥·하부 주차 공간으로 교체. 주차 바닥은 지형 분할 재생성. 계단과 상하부 이동 높이 분리.','4.3m 높이·0.55m 슬래브·기둥 28개·주차 구획은 사진 기반 추정. 실제 기둥 간격/전체 주차 동선 도면 미확보.'),
 ('대형 스누베어','모델·축척 확인','앉은 자세, 흰 머리/손발, 파란 옷·학사모·태슬. 메시 전체 높이10.002m, 캐릭터의5.588배.','잔디광장 내 설치 위치는 탐험용 배치. 사진의 실제 설치 시기·정확한 위치, 상의 문장과 주름은 미재현.'),
 ('본관·관정관·계단·옥상정원','연결 구조 구현 / 정밀 외형 부분 완료','위성영상의 긴 지붕, 사진의 남서쪽 하부 날개, 본관 옥상정원·옥탑2개·식재대·양옆 계단·연결 바닥 반영.','본관22m·관정 상부 높이 등 수직 치수 추정. 계단 폭·110단·양옆 착석단 상세/필로티/창문 전면별 배열은 미검증·추가 작업.'),
 ('자하연','부분 완료','유지한 수면 윤곽 주변 3개 변에 목재 데크·널판 줄눈·기둥/밧줄 난간·수변 식물 추가. 데크 높이와 이동 높이 일치.','데크 구간과 폭은 첨부사진을 기존 윤곽에 적용한 추정. 전체 현황 측량, 모든 포장 경계와 수종·정확한 수목 위치 미확인.'),
 ('버들골·풍산마당','부분 보정','기존 위성 대조 좌표·관람단을 유지하며 비대칭 지붕/꼬리 연결을 곡선 보간으로 개선.','관람단 수·끝 윤곽·단 높이의 추가 정밀 검증은 미완료. 2번 미지정 계단 사진 적용하지 않음.'),
 ('야구장','현황 재확인 / 추가 표식 미완료','현재 열람한 네이버 위성영상에서 흙 경기면·외곽 펜스·인접 150동/동측 도로 확인. 기존 경기면 유지.','베이스·파울라인·내외야 경계는 영상에서 식별되지 않음. 이름만으로 임의 다이아몬드를 추가하지 않음. 홈플레이트 뒤에서 외야 방향 및 전체 항공사진 필요.'),
 ('정문광장','차기 참고 자료 확보','해안건축2850 상세와 실제 사진 확인·기록.','이번 버전은 정문 모델 변경 없음. 8,600㎡는 대지면적이며 광장 치수로 사용하지 않음.'),
 ('미대응88개','이번 우선순위에서 보류','기존 목록 유지. 주요 장소 작업을 이름 매칭 수 감소로 바꾸지 않음.','88개 전체 실측·외형 보정 완료 아님.')]
(R/'BUILD15-STATUS.json').write_text(json.dumps([dict(item=a,status=b,implemented=c,remaining=d) for a,b,c,d in status],ensure_ascii=False,indent=2))
css='body{font:16px/1.65 system-ui;margin:40px auto;padding:0 24px;max-width:1280px;color:#24453e;background:#f5f3e9}h1,h2{line-height:1.3}table{border-collapse:collapse;width:100%;background:white}td,th{padding:14px;border:1px solid #d7ded6;text-align:left;vertical-align:top}img{max-width:100%;display:block;background:#dfe6df}.pair{display:grid;grid-template-columns:1fr 1fr;gap:20px}.refs{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}figure{margin:12px 0}figcaption{font-size:14px}.note{padding:18px;background:#e8eddc}a{color:#235d83}@media(max-width:700px){.pair,.refs{grid-template-columns:1fr}}'
parts=['<!doctype html><meta charset="utf-8"><title>BUILD15 구현·비교 기록</title><style>'+css+'</style>','<h1>BUILD15 · 주요 공간과 캐릭터</h1><p>2026-11-12 · 기능 구현과 실제 외형 검증 상태를 구분했습니다. 미대응88개 전체 완료 보고가 아닙니다.</p>','<p><a href="https://gwanak-walk-first-prototype.ben020410.chatgpt.site/">관악 산책 열기</a></p><table><tr><th>항목</th><th>상태</th><th>반영</th><th>남은 차이·추정</th></tr>']
for row in status:parts.append('<tr>'+''.join('<td>'+html.escape(q)+'</td>' for q in row)+'</tr>')
parts.append('</table><h2>실행·검증</h2><p>점프 10/30/60/120 FPS 착지, 지붕/하부 주차장 높이 분리, 광장과 도서관 계단 이동 시험 통과. 기존 126개 경로·842,582 이동 스텝 통과. 기존 수평 이동·대각선 속도/건물 충돌·비행 회귀 검사 통과. 지형 메시 높이 오차 최대0.000027m(동일 데이터 간 계산 검증이며 실제 지형 오차가 아님).</p><p>브라우저에서 점프 상승과 원래 높이 착지, 비행 E상승, 자하연·미술관·야구장·스누베어 이름표, 통일 명칭 검색, 고화질 MSAA4/2048그림자/3캐스케이드 반영을 확인했습니다. 모바일 Safari는 미검증입니다.</p>')
for label,filename in [('동일 조건 수정 전','build15-performance-before.json'),('동일 조건 수정 후','build15-performance-after.json'),('스누베어 지상 고화질','build15-high-performance.json')]:
 p=out/filename
 if p.exists():
  try: d=json.loads(p.read_text());parts.append('<p>'+label+': '+html.escape(json.dumps(d.get('render',d),ensure_ascii=False))+'</p>')
  except:pass
parts.append('<p class="note">성능은 이 기기의 해당 장면 관측치입니다. 모든 캠퍼스/모바일 성능 보장이 아니며, 배경 탭과 로딩 상태의 영향이 있습니다.</p>')
for key,title in [('lawn','잔디광장 전체'),('parking15','기둥과 하부 주차 공간'),('library15','본관·관정관·옥상정원'),('library15-top','도서관 상부 배치'),('jahayon15','자하연 물가와 데크'),('pungsan','풍산마당 곡면')]:
 parts.append('<h2>'+title+'</h2><div class="pair"><figure><img src="build15-before-'+key+'.png"><figcaption>수정 전 · BUILD14</figcaption></figure><figure><img src="build15-after-'+key+'.png"><figcaption>수정 후 · BUILD15 · 동일 카메라 좌표</figcaption></figure></div>')
parts.append('<h2>캐릭터·스누베어·조작</h2><div class="pair"><figure><img src="build15-bear-character.png"><figcaption>캐릭터와 스누베어의 실제 메시 높이비5.59배</figcaption></figure><figure><img src="build15-jump.png"><figcaption>점프 버튼 실행 중 높이 변화</figcaption></figure></div><img src="build15-name-search.png">')
parts.append('<h2>실제로 확인한 자료</h2><div class="refs">')
for f,caption in [('lawn-user.png','첨부4: 주차장 위 잔디광장'),('bear-user.png','첨부1: 스누베어'),('pond-user.png','첨부3: 자하연'),('roofgarden.png','도서관 쉼터: 본관 옥상과 관정관'),('stairs.png','도서관 쉼터: 외부계단'),('gate-haeahn.jpg','해안건축: 다음 정문 작업 참고')]:parts.append('<figure><img src="campus-walk/data-sources/build15/'+f+'"><figcaption>'+caption+'</figcaption></figure>')
parts.append('</div><p>첨부2 넓은 계단 사진은 미지정 자료로 보관만 했습니다.</p><div class="pair"><figure><img src="build15-library-satellite.png"><figcaption>네이버 위성사진 · 관정관</figcaption></figure><figure><img src="build15-baseball-reference.png"><figcaption>네이버 위성사진 · 야구장(보조운동장)</figcaption></figure></div>')
for title,url in [('서울대 공식 캠퍼스맵','https://map.snu.ac.kr/web/main.action'),('총동창회 관정관 탐방','https://www.snua.or.kr/magazine?md=v&seqidx=9929'),('도서관 쉼터 사진','https://snumall.tistory.com/entry/서울대-도서관의-쉼터'),('공식 도서관 안내','https://en.snu.ac.kr/academics/students/library'),('AURIC 구조설계 서지(원문 미확보)','https://www.auric.or.kr/user/rdoc/DocCmag.aspx?dn=199601&returnVal=CMAG'),('해안건축 정문광장','https://m.haeahn.com/ko/project/detail.do?prjctSeq=2850'),('풍산마당 시공 사진','https://insite.withworks.kr/21')]:parts.append('<p><a href="'+html.escape(url)+'">'+title+'</a></p>')
parts.append('<p>상세 추적: <a href="campus-walk/BUILD15-STATUS.json">항목별 상태</a> · <a href="campus-walk/BUILD15-NAMES.json">명칭 원본/대응 기록</a> · <a href="campus-walk/BUILD15-REFERENCES.json">자료 확인 기록</a> · <a href="campus-walk/BUILD15-TEST.json">이동·점프 검사</a> · <a href="campus-walk/BUILD15-MESH-TEST.json">실제 메시 축척</a></p>')
(out/'BUILD15-report.html').write_text('\n'.join(parts));print(out/'BUILD15-report.html')
