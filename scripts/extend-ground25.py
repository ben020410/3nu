from pathlib import Path
import json,numpy as np,shapely as S
from shapely.geometry import box,LineString
from shapely.ops import unary_union
R=Path(__file__).resolve().parents[1];N=json.loads((R/'dist/data/walk.json').read_text());old=N['bounds'];x0,z0,x1,z1=old;n=N['terrain']['n'];dx=(x1-x0)/(n-1);dz=(z1-z0)/(n-1);pad=20;H=np.array(N['terrain']['values']).reshape(n,n);N['terrain']['n']=n+pad*2;N['terrain']['values']=np.pad(H,pad,mode='edge').ravel().tolist();N['bounds']=[x0-pad*dx,z0-pad*dz,x1+pad*dx,z1+pad*dz];outside=box(*N['bounds']).difference(box(*old));used=box(*old)
for r in N['roads']:
 g=LineString(r['p']).buffer(r.get('width',3)/2,cap_style=2,join_style=1).intersection(outside).difference(used)
 if g.is_empty:continue
 used=used.union(g)
 for p in [g] if g.geom_type=='Polygon' else getattr(g,'geoms',[]):
  if p.geom_type=='Polygon':N['surfaces'].append({'kind':'steps' if r.get('kind')=='steps' else 'path' if r.get('kind') in ['footway','pedestrian','path'] else 'road','outer':list(p.exterior.coords)[:-1],'holes':[list(h.coords)[:-1] for h in p.interiors],'source':'existing road geometry continued beyond previous terrain mesh clip; no new road'})
N['grading25']['coverageExtension']={'oldBounds':old,'newBounds':N['bounds'],'method':'20 existing-resolution edge rows; estimated edge-continuation, not new elevation measurements'};(R/'dist/data/walk.json').write_text(json.dumps(N,ensure_ascii=False,separators=(',',':')))
print(N['bounds'],N['terrain']['n'])
