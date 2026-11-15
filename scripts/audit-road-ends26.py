"""Check all external road ends without inventing connections across buildings."""
import json,pathlib,shapely as S
from shapely.geometry import Point,LineString,Polygon
R=pathlib.Path(__file__).resolve().parents[1];N=json.loads((R/'dist/data/walk.json').read_text());D=json.loads((R/'dist/data/campus.json').read_text());lines=[LineString(r['p']) for r in N['roads']];tree=S.STRtree(lines);build=S.union_all([S.make_valid(Polygon(b['p'])) for b in D['buildings']]);paving=S.union_all([S.make_valid(Polygon(s['outer'],s.get('holes',[]))) for s in N['surfaces'] if s['kind'] not in ['road','grass','planting','water','soil']]);records=[]
for i,r in enumerate(N['roads']):
 for side,p in [('start',r['p'][0]),('end',r['p'][-1])]:
  q=Point(p);neighbors=[j for j in tree.query(q.buffer(4)) if j!=i and q.distance(lines[j])<=max(.5,N['roads'][j]['width']/2)];bd=q.distance(build);pd=q.distance(paving);closed=r['p'][0]==r['p'][-1]
  state='closed loop' if closed else 'connected corridor' if neighbors else 'building approach' if bd<12 else 'paved space' if pd<4 else 'unconfirmed endpoint retained'
  records.append({'id':r['id'],'side':side,'point':p,'classification':state,'buildingDistanceM':round(bd,2),'pavingDistanceM':round(pd,2),'note':'Geometric context, not confirmed purpose; unknown ends are not automatically linked or removed.'})
from collections import Counter
out={'summary':dict(Counter(r['classification'] for r in records)),'records':records};(R/'BUILD26-ROAD-ENDS.json').write_text(json.dumps(out,ensure_ascii=False,indent=2));print(out['summary'])
