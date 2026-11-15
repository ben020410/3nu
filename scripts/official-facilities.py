"""OSM footprints cross-checked against SNU facility detail photos, 2026-11-12.
Water level and local grading are estimates, not surveyed elevations.
"""
import json,math,pathlib,xml.etree.ElementTree as ET
import numpy as np
from shapely.geometry import Polygon,Point,LineString
from shapely.ops import unary_union
from shapely import make_valid
R=pathlib.Path(__file__).resolve().parents[1];N=json.loads((R/'dist/data/walk.json').read_text());D=json.loads((R/'dist/data/campus.json').read_text());O=ET.parse(R/'dist/data/source.osm').getroot();ox,oz=D['origin'];nodes={n.get('id'):((float(n.get('lon'))-ox)*111320*math.cos(math.radians(oz)),(float(n.get('lat'))-oz)*111320)for n in O.findall('node')};ways={w.get('id'):w for w in O.findall('way')}
def poly(id):return Polygon([nodes[n.get('ref')]for n in ways[id].findall('nd')])
pond=poly('383390147');stadium=poly('185936754');pitch=poly('383385116');
# Existing exact boundaries are retained; no guessed roads are connected.
fac=[dict(id='jahayon',name='자하연',kind='pond',outer=list(pond.exterior.coords)[:-1],source='https://map.snu.ac.kr/web/facility_detail.action?lat_val=37.4607006780578&lon_val=126.952103365166&convinType=Y&inst_seq=236',photo='https://map.snu.ac.kr/api/upload/default/F_BUILD_0000226.jpg'),dict(id='stadium',name='종합운동장 (대운동장)',kind='stadium',outer=list(stadium.exterior.coords)[:-1],pitch=list(pitch.exterior.coords)[:-1],source='https://map.snu.ac.kr/web/facility_detail.action?lat_val=37.464779176159&lon_val=126.95009153903&convinType=Y&inst_seq=234',photo='https://map.snu.ac.kr/api/upload/default/F_BUILD_0000224.jpg')]
new=[('water',pond),('bank',pond.buffer(1.2).difference(pond)),('track',stadium.difference(pitch)),('turf',pitch)]
# Grade field and pond; feather toward existing DEM, retain campus-wide relief.
n=N['terrain']['n'];x0,z0,x1,z1=N['bounds'];H=np.array(N['terrain']['values']).reshape(n,n);xs=np.linspace(x0,x1,n);zs=np.linspace(z0,z1,n)
for f,shape,feather in [(fac[0],pond.buffer(1.2),12),(fac[1],stadium,18)]:
 c=shape.centroid;i=round((c.x-x0)/(x1-x0)*(n-1));j=round((c.y-z0)/(z1-z0)*(n-1));y=float(H[j,i]);f['elevation']=y;f['heightNote']='OSM 윤곽 내부를 DEM 중심 고도로 평탄화; 표고·세부 사면은 추정';minx,minz,maxx,maxz=shape.buffer(feather+8).bounds
 for j,z in enumerate(zs):
  if z<minz or z>maxz:continue
  for i,x in enumerate(xs):
   if x<minx or x>maxx:continue
   dist=shape.distance(Point(x,z));t=max(0,min(1,1-dist/feather));t=t*t*(3-2*t);H[j,i]=H[j,i]*(1-t)+y*t
N['terrain']['values']=H.ravel().round(5).tolist();N['facilities']=fac
# Repartition instead of layering new surfaces over the terrain.
covered=unary_union([p for k,p in new]);out=[]
def emit(kind,p):
 for q in ([p]if p.geom_type=='Polygon'else getattr(p,'geoms',[])):
  if q.geom_type=='Polygon' and q.area>.005:out.append(dict(kind=kind,outer=list(q.exterior.coords)[:-1],holes=[list(h.coords)[:-1]for h in q.interiors]))
for s in N['surfaces']:emit(s['kind'],make_valid(Polygon(s['outer'],s['holes'])).difference(covered))
for k,p in new:emit(k,p)
N['surfaces']=out
# No random vegetation within the playing field or water.
N['trees']=[t for t in N['trees'] if not stadium.buffer(2).covers(Point(t[:2])) and not pond.buffer(1).covers(Point(t[:2]))]
for p in N['points']:
 u=np.clip((p[0]-x0)/(x1-x0)*(n-1),0,n-1.00001);v=np.clip((p[1]-z0)/(z1-z0)*(n-1),0,n-1.00001);i=int(u);j=int(v);a=u-i;b=v-j;p[2]=float(H[j,i]*(1-a-b)+H[j,i+1]*a+H[j+1,i]*b if a+b<=1 else H[j,i+1]*(1-b)+H[j+1,i]*(1-a)+H[j+1,i+1]*(a+b-1))
(R/'dist/data/walk.json').write_text(json.dumps(N,ensure_ascii=False,separators=(',',':')))
print([(f['name'],f['elevation'])for f in fac])
