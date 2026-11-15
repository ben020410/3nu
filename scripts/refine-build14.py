"""Gate scale/road/plaza correction; retain the BUILD13 baseline for reproducibility."""
import json,pathlib,math
from shapely.geometry import Polygon,LineString
from shapely.ops import unary_union
root=pathlib.Path(__file__).resolve().parents[1]
w=json.loads((root/'data-sources/build14-walk-before.json').read_text());g=w['gate'];g['modelScale']=1.2;g['height']=16.6*1.2;g['width']=20.95*1.2;g['depth']=2.14*1.2;g['dimensions']='BUILD14 photo/satellite proportional estimate; not surveyed. 1 unit = 1 metre.'
g['scaleEvidence14']={'satelliteScalePixels':84,'satelliteScaleMetres':20,'reference':'Naver satellite captured 2026-11-12','structureScale':1.2,'heightMeasured':False,'characterChanged':False}
r=next(r for r in w['roads'] if r['id']=='468202819');r['width']=15;r['widthSource']='BUILD14 Naver gate road visual width (~63px / 4.2px per metre); estimated, not surveyed'
road=LineString(r['p'][:9]).buffer(7.5,cap_style=2,join_style=1)
clip=Polygon([[-390,870],[-270,870],[-270,740],[-390,740]])
road=road.intersection(clip)
plaza=Polygon(g['plazaOutline']).buffer(3.2,join_style=2).intersection(clip).difference(road)
# Keep the wooded eastern boundary (white wall), expand road-facing paving to curb.
plaza=plaza.intersection(Polygon([[-390,870],[-298,870],[-293,745],[-390,745]]))
area=unary_union([road,plaza]);out=[]
def emit(poly,kind):
 if poly.is_empty:return
 if poly.geom_type=='Polygon':out.append({'kind':kind,'outer':list(poly.exterior.coords)[:-1],'holes':[list(q.coords)[:-1] for q in poly.interiors]})
 elif hasattr(poly,'geoms'):
  for q in poly.geoms:emit(q,kind)
for s in w['surfaces']:emit(Polygon(s['outer'],s.get('holes',[])).difference(area),s['kind'])
emit(road,'road');emit(plaza,'plaza');w['surfaces']=out;g['plazaOutline']=list(plaza.exterior.coords)[:-1] if plaza.geom_type=='Polygon' else g['plazaOutline'];g['plazaArea14']=plaza.area
# All newly paved ground uses the same broad level pad with smooth outer blend.
x0,z0,x1,z1=w['bounds'];n=w['terrain']['n'];h=w['terrain']['values'];gx,gz=g['center'];u=(gx-x0)/(x1-x0)*(n-1);v=(gz-z0)/(z1-z0)*(n-1);base=h[round(v)*n+round(u)]
from shapely.geometry import Point
for j in range(n):
 z=z0+(z1-z0)*j/(n-1)
 if not 720<z<890:continue
 for i in range(n):
  x=x0+(x1-x0)*i/(n-1)
  if not -410<x<-250:continue
  d=area.distance(Point(x,z));t=max(0,1-d/12);t=t*t*(3-2*t);h[j*n+i]=h[j*n+i]*(1-t)+base*t
(root/'dist/data/walk.json').write_text(json.dumps(w,ensure_ascii=False,separators=(',',':')))
