from pathlib import Path
import json,math
from shapely.geometry import Polygon,LineString
from shapely.ops import unary_union
R=Path(__file__).resolve().parents[1];N=json.loads((R/'dist/data/walk.json').read_text());D=json.loads((R/'dist/data/campus.json').read_text())
r=next(q for q in N['roads']if q['id']=='167985255')
p=[[-177.816,18.535],[-171.1,37.248],[-164.52,55],[-153.913,83.612],[-131.513,91.294]];width=[6,6,5.3,6.5,8]
# Continuous miter boundaries, with measured cross-section and estimated junction flare.
norm=[]
for a,b in zip(p,p[1:]):
 dx,dz=b[0]-a[0],b[1]-a[1];l=math.hypot(dx,dz);norm.append([-dz/l,dx/l])
left=[];right=[]
for i,q in enumerate(p):
 if i==0:n=norm[0]
 elif i==len(p)-1:n=norm[-1]
 else:
  a,b=norm[i-1],norm[i];den=1+a[0]*b[0]+a[1]*b[1];n=[(a[0]+b[0])/den,(a[1]+b[1])/den]
 left.append([q[j]+n[j]*width[i]/2 for j in range(2)]);right.append([q[j]-n[j]*width[i]/2 for j in range(2)])
road=Polygon(left+right[::-1]);old=LineString(p).buffer(3,cap_style=2,join_style=2);buildings=unary_union([Polygon(b['p'])for b in D['buildings']]);road=road.difference(buildings.buffer(.15));patch=road.union(old);shoulder=old.difference(road).difference(buildings.buffer(.15))
out=[]
def push(g,attr):
 for q in ([g]if g.geom_type=='Polygon'else getattr(g,'geoms',[])):
  if q.geom_type=='Polygon'and q.area>.001:out.append({**attr,'outer':list(q.exterior.coords)[:-1],'holes':[list(h.coords)[:-1]for h in q.interiors]})
for q in N['surfaces']:push(Polygon(q['outer'],q.get('holes',[])).difference(patch),q)
push(road,{'kind':'road','source':'BUILD22 variable boundary: one 5.3 m Naver cross-section; junction widths estimated','id':'student-service-road22'})
push(shoulder,{'kind':'path','source':'BUILD22 residual paved shoulder, not an independently surveyed sidewalk','id':'student-service-shoulder22'})
N['surfaces']=out;r['widthProfile22']={'points':p,'widths':width,'leftBoundary':left,'rightBoundary':right,'measuredSection':2,'source':'Naver distance tool 2026-11-13 at pixel (500,300)-(521,308): 5.3m, approximate +/-1m; other widths estimated'}
(R/'dist/data/walk.json').write_text(json.dumps(N,ensure_ascii=False,separators=(',',':')));print('variable road area',round(road.area,2),'m2; no overlaps with building footprints')
