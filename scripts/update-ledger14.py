# coding: utf-8
import json,collections
from pathlib import Path
root=Path('.')
a=json.loads((root/'BUILD14-audit-actions.json').read_text());c=json.loads((root/'dist/data/campus.json').read_text());by={b['id']:b for b in c['buildings']};extra={'436516341','vw/71','vw/197','vw/234','439707889','439707887','329398248','179742150','179742153','297047750','167608115','424946985','vw/278','vw/47','vw/258'}
rows=[]
for r in a['actions']+a['unresolved']:
 b=by[r['id']];action=r['id'] in {x['id']for x in a['actions']} or r['id']in extra
 geometry=bool(b.get('reviewModel') or b.get('utilityHeight14') or r['id']=='vw/187')
 row={'id':r['id'],'sourceName':r.get('sourceName'),'officialNumber':b.get('officialNumber'),'currentName':b.get('name'),'centroid': [sum(q[k]for q in b['p'])/len(b['p']) for k in range(2)],'identityOrClassificationActionApplied':action,'modelChanged':geometry,'photoObserved':bool(b.get('photoVerification14',{}).get('observed')),'planStatus':b.get('planVerification14',{}),'photoStatus':b.get('photoVerification14',{}),'status':'부분 완료' if action else '미완료','sourceEvidence':r.get('evidence',[]),'sources':b.get('identitySources14',[]),'reasonCategory':r.get('reasonCategory'),'remaining':r.get('reason','Exact footprint, hidden faces and height still require independent verification')}
 if b.get('suppressedDuplicate14'):row['actualAction']='위성 대조 후 중복 렌더·충돌 제거; 원본 행 보존, 대체 모델 '+b.get('supersededBy','')
 elif r['id']=='vw/187':row['actualAction']='건물벽을 높은 연결교로 교체; 지상 충돌 제거, 높이 미측정'
 elif b.get('utilityHeight14'):row['actualAction']='일반 창문건물을 낮은 시설물로 교체;4m높이는추정'
 elif geometry:row['actualAction']='별도 모델 또는 지붕 형상 구현; 사진/위성 비교 범위만 부분 검증'
 elif action:row['actualAction']='번호·이름·구성 관계 데이터 수정, 형상 유지'
 else:row['actualAction']='원형 보존, 임의 삭제/신규 이름 부여 없음'
 rows.append(row)
assert len(rows)==122 and len({r['id']for r in rows})==122
counts={'originalCohort':122,'classificationOrIdentityActionsApplied':sum(r['identityOrClassificationActionApplied']for r in rows),'notResolved':sum(not r['identityOrClassificationActionApplied']for r in rows),'modelChangedInCohort':sum(r['modelChanged']for r in rows),'fullyVerified':0}
(root/'BUILD14-122-STATUS.json').write_text(json.dumps({'counts':counts,'important':'Actions applied is NOT full geometry completion. Remaining records are a work backlog, not all access-blocked.','rows':rows},ensure_ascii=False,indent=2))
a['applied']=True;a['applicationNote']='Original 19 actions applied. This research file is the initial specification; current 122 cohort state is BUILD14-122-STATUS.json.'
(root/'BUILD14-audit-actions.json').write_text(json.dumps(a,ensure_ascii=False,indent=2))
print(counts)
