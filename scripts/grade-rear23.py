# coding: utf-8
"""Local rear corridor correction. Heights are design estimates from VR relationships, not survey."""
from pathlib import Path
import json,gzip,numpy as np,shapely as S
from shapely.geometry import Polygon,LineString
from shapely.ops import unary_union
R=Path(__file__).resolve().parents[1];D=json.loads((R/'dist/data/campus.json').read_text());N=json.loads((R/'dist/data/walk.json').read_text());G=json.loads((R/'BUILD22-GEOMETRY.json').read_text());o,u,v,base=G['origin'],G['u'],G['v'],G['base']
p=lambda a,d:[o[i]+u[i]*a+v[i]*d for i in range(2)]
poly=lambda pts:Polygon([p(*q) for q in pts]);rect=lambda a,d,w,h:poly([[a,d],[a+w,d],[a+w,d+h],[a,d+h]])
B=json.load(gzip.open(R/'sources/build22-ground-baseline.json.gz','rt'));N['terrain']=B['terrain'];N['surfaces']=B['surfaces']
# Clear the erroneous terrain plateau under the whole lower corridor and both road junctions.
n=N['terrain']['n'];x0,z0,x1,z1=N['bounds'];X,Z=np.meshgrid(np.linspace(x0,x1,n),np.linspace(z0,z1,n));A=(X-o[0])*u[0]+(Z-o[1])*u[1];Q=(X-o[0])*v[0]+(Z-o[1])*v[1];H=np.array(N['terrain']['values']).reshape(n,n);points=S.points(X.ravel(),Z.ravel());cl=lambda x:np.clip(x,0,1);sm=lambda x:cl(x)**2*(3-2*cl(x))
zone=poly([[-65,-64],[-60,-12],[5,3],[23,-6],[124,-7],[160,0],[178,-9],[226,-48],[212,-61],[139,-35],[125,-76],[15,-76]])
dist=S.distance(points,zone).reshape(n,n);w=1-sm(dist/12);H=H*(1-w)+base*w
# Pharmacy ground stays higher, but no longer on a 20m spike. Keep the bank beside passage.
upper=rect(20,-76,104,34).union(LineString([p(-40.2,-64.2),p(12.6,-42.9),p(23,-43)]).buffer(3,cap_style=2,join_style=2))
dist=S.distance(points,upper).reshape(n,n);w=1-sm(dist/10);H=H*(1-w)+(base+7)*w
# Exact flat lower paved zones (same polygons in render partition and walking floor).
low=rect(-25,-32,49,19.5).union(rect(12.5,-26,126.5,18))
low=low.union(LineString([p(-65,-57),p(-48,-52.5),p(-34,-46.2),p(-15,-26),p(10.1,-22)]).buffer(6,join_style=2))
low=low.union(poly([[124,-29],[143,-30],[161,-20],[173,-12],[161,2],[142,-9],[124,-12.5]]))
# Follow the actual outgoing centerline around the north junction rather than an isolated slab.
low=low.union(LineString([p(153.5,-10.4),p(160.4,-12.1),p(218.5,-49.6)]).buffer(4,join_style=2))
# At exact surface boundaries blend the grid to the same datum; explicit polygons avoid coarse-grid hummocks.
dist=S.distance(points,low).reshape(n,n);w=1-sm(np.maximum(0,dist-4)/7);H=H*(1-w)+base*w
# Narrow stair footprints excavated below treads. Upper path remains +7m.
stairs=[LineString([p(12.6,-25),p(12.6,-43)]).buffer(2.5,cap_style=2),LineString([p(-45.1,-54.3),p(-40.2,-64.2)]).buffer(2.5,cap_style=2)]
# Exact plane fields permit the terrain under the steps to rise, never exceed treads.
patches=[{'id':'rear23-landing','kind':'path','shape':rect(9.5,-46,12,3.1),'groundY':base+7},{'id':'rear23-lower','kind':'rearPaving','shape':low,'groundY':base}, {'id':'rear23-upper','kind':'path','shape':upper,'groundY':base+7}]
for i,g in enumerate(stairs):
 # Ground remains beneath a real flight, no steep drivable road rendered over it.
 patches.insert(1,{'id':'rear23-stair-cut'+str(i),'kind':'steps','shape':g,'groundY':base-.08})
# Avoid changing building footprint collision or covering occupied building faces with paving.
obstacles=unary_union([Polygon(b['p']) for b in D['buildings'] if b.get('officialNumber') not in ['62','62-1','20']])
used=Polygon();result=[]
for q in patches:
 g=S.make_valid(q['shape']).difference(obstacles).difference(used);used=used.union(g)
 for h in ([g] if g.geom_type=='Polygon' else getattr(g,'geoms',[])):
  if h.geom_type=='Polygon' and h.area>.01:result.append({'id':q['id'],'kind':q['kind'],'outer':list(h.exterior.coords)[:-1],'holes':[list(r.coords)[:-1]for r in h.interiors],'groundY':q['groundY'],'source':'BUILD23 official VR Yangdu/third entrance + user Kakao roadview Aug 2026; metric heights estimated'})
for q in N['surfaces']:
 g=S.make_valid(Polygon(q['outer'],q.get('holes',[]))).difference(used)
 for h in ([g] if g.geom_type=='Polygon' else getattr(g,'geoms',[])):
  if h.geom_type=='Polygon' and h.area>.01:result.append({**q,'outer':list(h.exterior.coords)[:-1],'holes':[list(r.coords)[:-1]for r in h.interiors]})
N['surfaces']=result;N['designGround23']=[q for q in result if q.get('id','').startswith('rear23-')];N['terrain']['values']=H.ravel().tolist()
for b in D['buildings']:
 if b.get('officialNumber')=='20':b['siteDatum']=base+7;b['grading23']='Upper pharmacy walking datum +7m, inferred level difference, not surveyed'
N['rear23']={'base':base,'lower':0,'upper':7,'bridge':7,'roofGarden':22,'scope':'rear passage ends and pharmacy access; separate 3F bridge / 5F garden','mappedStairs':['167597860','167597853'],'uncertainty':'Widths, rise, retaining wall extent are estimated; no source imagery redistributed'}
for name,obj in [('walk',N),('campus',D)]: (R/f'dist/data/{name}.json').write_text(json.dumps(obj,ensure_ascii=False,separators=(',',':')))
print('rear patch area',round(used.area),'m2, exact ground polygons',len(N['designGround23']))
