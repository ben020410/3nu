from pathlib import Path
import json,numpy as np,shapely as S
from shapely.geometry import Polygon,LineString
R=Path(__file__).resolve().parents[1];N=json.loads((R/'dist/data/walk.json').read_text());base=N['rear23']['base'];r=next(r for r in N['roads'] if r['id']=='457001557');g=LineString(r['p'][5:]).buffer(4.2,cap_style=2,join_style=1)
# Existing stair excavation, not a fabricated road across the flight.
for q in N['designGround23']:
 if 'stair-cut' in q['id'] or 'lower' in q['id']:g=g.difference(Polygon(q['outer'],q.get('holes',[])))
patch=[]
for p in [g] if g.geom_type=='Polygon' else g.geoms:
 if p.geom_type=='Polygon':patch.append({'id':'upper-road25','kind':'road','outer':list(p.exterior.coords)[:-1],'holes':[list(h.coords)[:-1] for h in p.interiors],'groundY':base+7,'source':'existing upper pharmacy road; shared elevation with stair landing; design estimate'})
result=patch[:]
for q in N['surfaces']:
 h=Polygon(q['outer'],q.get('holes',[])).difference(g)
 for p in [h] if h.geom_type=='Polygon' else getattr(h,'geoms',[]):
  if p.geom_type=='Polygon' and p.area>.0001:result.append({**q,'outer':list(p.exterior.coords)[:-1],'holes':[list(r.coords)[:-1] for r in p.interiors]})
N['surfaces']=result;N['designGround23']=patch+N['designGround23']
(R/'dist/data/walk.json').write_text(json.dumps(N,ensure_ascii=False,separators=(',',':')))
