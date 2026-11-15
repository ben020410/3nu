from pathlib import Path
import json,numpy as np,shapely as S
from shapely.geometry import Polygon,LineString
R=Path(__file__).resolve().parents[1];N=json.loads((R/'dist/data/walk.json').read_text());G=json.loads((R/'BUILD22-GEOMETRY.json').read_text());o,u,v,base=G['origin'],G['u'],G['v'],G['base'];n=N['terrain']['n'];x0,z0,x1,z1=N['bounds'];X,Z=np.meshgrid(np.linspace(x0,x1,n),np.linspace(z0,z1,n));P=S.points(X.ravel(),Z.ravel());H=np.array(N['terrain']['values']).reshape(n,n)
for id in ['457001557','435329619','456540217','435329616']:
 r=next(r for r in N['roads'] if str(r['id'])==id);line=LineString(r['p']);distance=S.distance(P,line);proj=S.line_interpolate_point(line,S.line_locate_point(line,P));coords=S.get_coordinates(proj);A=(coords[:,0]-o[0])*u[0]+(coords[:,1]-o[1])*u[1];t=np.clip((A+105)/65,0,1);target=base+7*t*t*(3-2*t);blend=np.clip((distance-9)/35,0,1);w=1-blend*blend*(3-2*blend);H=H*(1-w.reshape(n,n))+target.reshape(n,n)*w.reshape(n,n)
# Shared lower movement corridor remains flat; side grade separation is intentional.
for q in N['designGround23']:
 if 'lower' in q['id']:
  m=S.covers(Polygon(q['outer'],q.get('holes',[])).buffer(2),P).reshape(n,n);H[m]=q['groundY']
# Do not cut a flat excavation through the stair's upper landing / road.
for collection in [N['designGround23'],N['surfaces']]:
 for q in collection:
  if 'stair-cut' not in q.get('id',''):continue
  if q['id'].endswith('0'):
   # last half metre belongs to the top landing, not the below-stair excavation
   shape=Polygon(q['outer'],q.get('holes',[]));top=[o[i]+u[i]*12.6+v[i]*-43 for i in range(2)];shape=shape.difference(S.Point(top).buffer(.55))
   if shape.geom_type=='Polygon':q['outer']=list(shape.exterior.coords)[:-1];q['holes']=[list(h.coords)[:-1] for h in shape.interiors]
N['terrain']['values']=H.ravel().tolist();(R/'dist/data/walk.json').write_text(json.dumps(N,ensure_ascii=False,separators=(',',':')))
