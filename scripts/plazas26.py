"""Join library ground plazas and low approach stairs into the height field.
Raised roof/bridge floors are intentionally excluded; no building positions change.
"""
from pathlib import Path
import json,numpy as np,shapely as S
from shapely.geometry import Polygon,LineString
R=Path(__file__).resolve().parents[1];N=json.loads((R/'dist/data/walk.json').read_text());D=json.loads((R/'dist/data/campus.json').read_text());L=json.loads((R/'BUILD26-LIBRARY-SPEC.json').read_text())
n=N['terrain']['n'];x0,z0,x1,z1=N['bounds'];X,Z=np.meshgrid(np.linspace(x0,x1,n),np.linspace(z0,z1,n));P=S.points(X.ravel(),Z.ravel());H=np.array(N['terrain']['values']).reshape(n,n);old=H.copy();wh=np.zeros_like(H);ww=np.zeros_like(H);polys=[]
for q in L['surfaces']:
 if not(q['id'] in ['front-court','opposite-court','main-front-court'] or q['id'].startswith(('right-approach-','main-front-49-','main-front-82-'))):continue
 g=Polygon(q['p']);dist=S.distance(P,g).reshape(n,n);w=np.clip(1-dist/10,0,1);w=w*w*(3-2*w);target=np.full_like(H,L['base']+q['lo']-.08)
 if q['from']:
  a,b=np.array(q['from']),np.array(q['to']);v=b-a;t=np.clip(((X-a[0])*v[0]+(Z-a[1])*v[1])/np.dot(v,v),0,1);target+=t*(q['hi']-q['lo'])
 ww+=w;wh+=w*target;polys.append(g)
# Weighted overlap is one terrain edit, not stacked offsets. Keep building edges
# and existing multilevel rear-corridor patches untouched.
field=np.where(ww>0,wh/np.maximum(ww,1e-12),H);blend=np.minimum(ww,1);H=H*(1-blend)+field*blend
for b in D['buildings']:
 if b.get('officialNumber') in ['62','62-1']:continue
 mask=S.covers(Polygon(b['p']).buffer(1.5),P).reshape(n,n);H[mask]=old[mask]
for q in N.get('designGround23',[]):
 mask=S.covers(Polygon(q['outer']),P).reshape(n,n);H[mask]=old[mask]
N['terrain']['values']=H.ravel().tolist()
# Paving is part of the partitioned terrain, not another floating slab.
g=S.union_all(polys).convex_hull.buffer(1,join_style=2)
foot=S.union_all([S.make_valid(Polygon(b['p'])).buffer(.15) for b in D['buildings']]);g=g.difference(foot)
for i,p in enumerate([g] if g.geom_type=='Polygon' else g.geoms):
 if p.geom_type=='Polygon':N['surfaces'].append({'id':'plaza26-'+str(i),'kind':'plaza','outer':list(p.exterior.coords)[:-1],'holes':[list(r.coords)[:-1] for r in p.interiors],'source':'continuous terrain paving between existing library approach floors; design adaptation'})
(R/'dist/data/walk.json').write_text(json.dumps(N,separators=(',',':')))
print('changed terrain vertices',int(np.sum(abs(H-old)>.01)),'max metres',float(abs(H-old).max()))
