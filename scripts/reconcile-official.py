"""Match official records to OSM/PDF identity first, geometry second. Never move by marker alone."""
import json,re,math,pathlib,xml.etree.ElementTree as ET,urllib.parse as U
from shapely.geometry import Polygon,Point
R=pathlib.Path(__file__).resolve().parents[1];W=R/'data-sources/official-map-2026-11-12';D=json.loads((R/'dist/data/campus.json').read_text());P=json.loads((R/'dist/data/places.json').read_text());records=json.loads((W/'official-rows.json').read_text());rows=list({a['detail']:a for a in records if a.get('detail') and '&inst_seq='in a['detail']}.values());photo={a['detail']:a for a in json.loads((W/'official-photo-records.json').read_text())};osm=ET.parse(R/'dist/data/source.osm').getroot();refs={w.get('id'):{t.get('k'):t.get('v')for t in w.findall('tag')}.get('ref')for w in osm.findall('way')};byplace={p['id']:p for p in P};shapes={b['id']:Polygon(b['p'])for b in D['buildings']};ox,oz=D['origin'];ledger=[];claimed=set()
for a in rows:
 q=U.parse_qs(U.urlparse(a['detail']).query);lon=float(q['lon_val'][0]);lat=float(q['lat_val'][0]);x=(lon-ox)*111320*math.cos(math.radians(oz));z=(lat-oz)*111320;m=re.search(r'\((\d+(?:-\d+)?)동\)$',a['name']);num=m.group(1)if m else '';name=re.sub(r'\(\d+(?:-\d+)?동\)$','',a['name']);name=re.sub(r'^관악 \d+(?:-\d+)?동\[(.*)\]$',r'\1',name);candidates=[b for b in D['buildings'] if num and (byplace.get(b['id'],{}).get('number')==num or refs.get(b['id'])==num or b['name']==num or b.get('officialNumber')==num)]
 method='number';
 manual={'15-1':['relation/6808893'],'135':['439703626'],'311':['430163191'],'143':['434754623'],'120':['439704950'],'127-1':['vw/225'],'919':['456300256','482425584']}
 if not candidates and num in manual:candidates=[b for b in D['buildings']if b['id']in manual[num]];method='nearby marker + name/number identity review'

 if not candidates:
  candidates=[b for b in D['buildings'] if shapes[b['id']].covers(Point(x,z))];method='official marker within footprint'
 # Avoid interpreting a facility marker or an obsolete building label as a measured shape.
 if not num:candidates=[];method='facility'
 matches=[]
 for b in candidates:
  dist=shapes[b['id']].distance(Point(x,z));matches.append({'id':b['id'],'previousName':b['name'],'markerDistanceToFootprintM':round(dist,2),'method':method});
  if (method in ['number','nearby marker + name/number identity review'] and dist<35 or method=='official marker within footprint' and len(candidates)==1 and b['id'] not in claimed):
   b['name']=name;b['officialNumber']=num;b['officialDetail']=a['detail'];b['officialPhoto']=photo.get(a['detail'],{}).get('photo');claimed.add(b['id'])
   if b['id'] in byplace:byplace[b['id']]['name']=name;byplace[b['id']]['sources']=list(set(byplace[b['id']].get('sources',[])+[a['detail']]));byplace[b['id']]['verification']='공식 웹 상세 번호·명칭 대응; 외형 검증은 작업 목록 참조'
  else:method+=' / location-or-identity-pending'
 ph=photo.get(a['detail'],{});ledger.append(dict(officialId=q['inst_seq'][0],number=num,name=name,detail=a['detail'],marker=[lon,lat],photo=ph.get('photo'),photoStatus='captured-not-yet-reviewed'if ph.get('id') else 'not-available-or-pending',matches=matches,modelStatus='existing-profile-needs-official-review'if any(b.get('id') in ['347806720','892896238','179742154'] for b in candidates)else 'pending-photo-geometry-review',uncertainty='사진 촬영일·정확한 높이·가려진 면 미확인'))
for b in D['buildings']:
 if b['id']not in claimed:ledger.append(dict(name=b['name'],number=byplace.get(b['id'],{}).get('number')or refs.get(b['id'])or'',matches=[{'id':b['id']}],modelStatus='unmatched-retained-not-deleted',uncertainty='공식 검색 상세와 대응 미확정; 실존 OSM 윤곽을 미검색만으로 삭제하지 않음'))
(R/'dist/data/campus.json').write_text(json.dumps(D,ensure_ascii=False,separators=(',',':')));(R/'dist/data/places.json').write_text(json.dumps(P,ensure_ascii=False,separators=(',',':')));(R/'BUILD-08-OFFICIAL-AUDIT.json').write_text(json.dumps(ledger,ensure_ascii=False,indent=2));print({'officialRecords':len(rows),'modelsMatched':len(claimed),'modelCount':len(D['buildings']),'pendingUnmatched':len(D['buildings'])-len(claimed)})
