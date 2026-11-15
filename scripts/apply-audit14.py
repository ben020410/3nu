#!/usr/bin/env python3
"""Apply evidence-only BUILD14 metadata and explicit bridge semantics.
Default is dry run. --root supports a disposable validation fixture.
No footprint/center/height changes; renderer integration for semanticType14
utility types is intentionally separate and must not be reported complete.
"""
import argparse,json,pathlib
p=argparse.ArgumentParser();p.add_argument('--apply',action='store_true');p.add_argument('--root',type=pathlib.Path,default=pathlib.Path(__file__).resolve().parents[1]);args=p.parse_args();root=args.root
spec=json.loads((root/'BUILD14-audit-actions.json').read_text());campuspath=root/'dist/data/campus.json';placespath=root/'dist/data/places.json'
campus=json.loads(campuspath.read_text());places=json.loads(placespath.read_text());by={b['id']:b for b in campus['buildings']};pb={b['id']:b for b in places}
assert len(spec['actions'])==19 and len(spec['unresolved'])==103
assert len({a['id'] for a in spec['actions']+spec['unresolved']})==122
protected=('p','holes','center','h','siteDatum','siteBlock');before={k:{x:by[k].get(x) for x in protected} for k in by};changed=[]
for a in spec['actions']:
 b=by[a['id']];patch=a['patch'];assert not set(protected)&set(patch)
 if any(b.get(k)!=v for k,v in patch.items()): changed.append(a['id'])
 b.update(patch)
 if a.get('placePatch'):
  dest=pb.get(a['id'])
  if dest is None:
   dest={'id':a['id'],'zone':'','category':'건물','description':'공식 명칭·번호 대응. 외형과 높이는 별도 검증 중입니다.','aliases':[],'sources':[]};places.append(dest);pb[a['id']]=dest
  dest.update(a['placePatch']);dest['verification']='BUILD14 공식 번호·명칭 대응; 외형·높이 사진 검증 미완료'
  dest['sources']=list(dict.fromkeys(dest.get('sources',[])+patch.get('identitySources14',[])))
assert before=={k:{x:by[k].get(x) for x in protected} for k in by}
if args.apply:
 campuspath.write_text(json.dumps(campus,ensure_ascii=False,separators=(',',':'))+'\n');placespath.write_text(json.dumps(places,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'mode':'apply' if args.apply else 'dry-run','buildingsChanged':len(changed),'ids':changed,'protectedGeometryUnchanged':True,'remainingUnresolved':103,'utilityRendererIntegrationRequired':['605434649','1138174384'],'photoGeometryValidated':0},ensure_ascii=False))
