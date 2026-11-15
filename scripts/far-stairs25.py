from pathlib import Path
import json,numpy as np,shapely as S
from shapely.geometry import Polygon,LineString
R=Path(__file__).resolve().parents[1];N=json.loads((R/'dist/data/walk.json').read_text());base=N['rear23']['base'];r=next(r for r in N['roads'] if r['id']=='456540231');line=LineString(r['p']);leg=LineString(r['p'][1:]);g=leg.buffer(1.16,cap_style=2)
# Excavation beneath the separate physical treads: no road sheet on top of steps.
patch={'id':'far-stair-cut25','kind':'steps','outer':list(g.exterior.coords)[:-1],'holes':[],'groundY':base-.08,'source':'existing steps 456540231; elevations designed from lower/upper walking datums; not surveyed'}
result=[patch]
for q in N['surfaces']:
 h=Polygon(q['outer'],q.get('holes',[])).difference(g)
 for p in [h] if h.geom_type=='Polygon' else getattr(h,'geoms',[]):
  if p.geom_type=='Polygon' and p.area>.0001:result.append({**q,'outer':list(p.exterior.coords)[:-1],'holes':[list(t.coords)[:-1] for t in p.interiors]})
N['surfaces']=result;N['designGround23'].insert(0,patch)
n=N['terrain']['n'];x0,z0,x1,z1=N['bounds'];X,Z=np.meshgrid(np.linspace(x0,x1,n),np.linspace(z0,z1,n));P=S.points(X.ravel(),Z.ravel());H=np.array(N['terrain']['values']).reshape(n,n);dist=S.distance(P,line).reshape(n,n);along=S.line_locate_point(line,P).reshape(n,n);first=LineString(r['p'][:2]).length;target=base+7*np.clip((along-first)/leg.length,0,1)-.08;w=np.clip((10-dist)/7,0,1);w=w*w*(3-2*w)
# Keep exact fixed surfaces; terrain outside the stair is a supporting planted slope.
for q in N['designGround23'][1:]:
 mask=S.covers(Polygon(q['outer'],q.get('holes',[])),P).reshape(n,n);w[mask]=0
H=H*(1-w)+target*w;N['terrain']['values']=H.ravel().tolist();(R/'dist/data/walk.json').write_text(json.dumps(N,ensure_ascii=False,separators=(',',':')))
