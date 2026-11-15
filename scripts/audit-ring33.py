"""Audit authored carriageway occupancy separately from walking and screenshots."""
import json,pathlib,math
import shapely as S
from shapely.geometry import Polygon,LineString,Point
R=pathlib.Path(__file__).resolve().parents[1];O=R/'reports/build33'
N=json.loads((R/'dist/data/walk.json').read_text());B=json.loads((O/'source-data/walk.json').read_text());A=json.loads((O/'alignment.json').read_text());M=json.loads((O/'material-regions.json').read_text())
road=S.union_all([Polygon(q['outer'],q.get('holes',[]))for q in M['regions']if q['kind']=='road']);S.prepare(road)
missing=[];samples=0
for name,pp in [('ring',N['ring33']['route']),('approach',N['ring33']['approach'])]:
 line=LineString(pp)
 for i in range(math.ceil(line.length/2)+1):
  s=min(line.length,i*2);p=line.interpolate(s);a=line.interpolate(max(0,s-.25));b=line.interpolate(min(line.length,s+.25));dx,dz=b.x-a.x,b.y-a.y;length=math.hypot(dx,dz)
  for off in [-7.48,0,7.48]:
   q=Point(p.x-dz/length*off,p.y+dx/length*off);samples+=1
   if not road.covers(q):missing.append({'path':name,'chainage':s,'offset':off,'point':[q.x,q.y]})
# Every exclusive material part is assigned once: overlapping area would indicate
# a second slab, not harmless coincident boundaries.
polys=[Polygon(q['outer'],q.get('holes',[]))for q in M['regions']]
union=S.union_all(polys);overlap=sum(p.area for p in polys)-union.area
stable={k:N.get(k)==B.get(k)for k in ['library17','precinct29','landmarks30','landmarkCuts30','outdoor','groundProfiles32']}
out={'widthSamples':samples,'missingCarriagewaySamples':missing,'exclusivePartitionOverlapM2':overlap,'buildingsUnchanged':(R/'dist/data/campus.json').read_bytes()==(O/'source-data/campus.json').read_bytes(),'architecturalDataUnchanged':stable,'buildingOrStairIntersections':A['buildingClashes'],'changedRoadIds':[r['id']for r,b in zip(N['roads'],B['roads'])if r['p']!=b['p']or r['width']!=b['width']],'note':'15m is carriageway only; intersections may be locally wider, no off-ring width changes.'}
out['passed']=not missing and abs(overlap)<.05 and out['buildingsUnchanged'] and all(stable.values()) and not A['buildingClashes']
(O/'geometry-audit.json').write_text(json.dumps(out,ensure_ascii=False,indent=2));print(json.dumps(out,ensure_ascii=False,indent=2))
raise SystemExit(0 if out['passed']else 1)
