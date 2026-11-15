# coding: utf-8
"""BUILD11: surveyed identity, observed aerial arrangement, estimated detail dimensions.
Reproducible from BUILD10. Never rerun the old grade script after this refinement.
"""
import json,math,pathlib,zipfile,xml.etree.ElementTree as ET
import numpy as np
from shapely.geometry import Polygon,Point,LineString
from shapely.ops import unary_union
from shapely import make_valid
R=pathlib.Path(__file__).resolve().parents[1]
with zipfile.ZipFile(R/'data-sources/build11-input.zip') as z:N=json.loads(z.read('walk.json'));D=json.loads(z.read('campus.json'))
O=ET.parse(R/'dist/data/source.osm').getroot();ox,oz=D['origin'];nodes={n.get('id'):[(float(n.get('lon'))-ox)*111320*math.cos(math.radians(oz)),(float(n.get('lat'))-oz)*111320]for n in O.findall('node')};ways={w.get('id'):w for w in O.findall('way')}
def ring(id):return [nodes[n.get('ref')] for n in ways[id].findall('nd')][:-1]
n=N['terrain']['n'];x0,z0,x1,z1=N['bounds'];H=np.array(N['terrain']['values']).reshape(n,n)
def height(x,z):
 u=np.clip((x-x0)/(x1-x0)*(n-1),0,n-1.00001);v=np.clip((z-z0)/(z1-z0)*(n-1),0,n-1.00001);i=int(u);j=int(v);a=u-i;b=v-j
 return float(H[j,i]*(1-a-b)+H[j,i+1]*a+H[j+1,i]*b if a+b<=1 else H[j,i+1]*(1-b)+H[j+1,i]*(1-a)+H[j+1,i+1]*(a+b-1))
new=[];fac=[];fences=[];courts=[];grades=[]
def fence(p,h=3,gap=2.4):
 for i,a in enumerate(p):
  b=p[(i+1)%len(p)]
  if i==0:
   d=math.dist(a,b);t0=.5-gap/2/d;t1=.5+gap/2/d
   fences.extend([dict(a=a,b=[a[k]+(b[k]-a[k])*t0 for k in range(2)],h=h),dict(a=[a[k]+(b[k]-a[k])*t1 for k in range(2)],b=b,h=h)])
  else:fences.append(dict(a=a,b=b,h=h))
def grade(p):
 shape=Polygon(p);c=shape.centroid;y=height(c.x,c.y);pad=shape.buffer(5);grades.append((pad,y));return y
for id,count,kind in [('320671088',3,'clay'),('320671915',3,'clay'),('320671917',2,'clay'),('320671919',3,'courtGreen'),('320671921',3,'courtGreen'),('320667500',1,'clay'),('347802748',2,'clay')]:
 p=ring(id)
 if id=='320667500':p=[p[0],p[3],p[2],p[1]]
 y=grade(p);new.append(('courtApron' if kind=='courtGreen'else 'clay',Polygon(p)));fence(p)
 def at(u,v):return [(1-v)*((1-u)*p[0][k]+u*p[1][k])+v*((1-u)*p[3][k]+u*p[2][k])for k in range(2)]
 for j in range(count):
  center=at((j+.5)/count,.5);a=at((j+.5)/count,0);b=at((j+.5)/count,1);d=math.dist(a,b);axis=[(b[k]-a[k])/d for k in range(2)];side=[axis[1],-axis[0]]
  q=[[center[k]+axis[k]*v+side[k]*u for k in range(2)] for u,v in [(-5.485,-11.885),(5.485,-11.885),(5.485,11.885),(-5.485,11.885)]]
  courts.append(dict(id=id+'-'+str(j+1),center=center,axis=axis,side=side,kind=kind,elevation=y,outline=q));new.insert(0,(kind,Polygon(q)))
pall=unary_union([Polygon(ring(id))for id in ['320671088','320671915','320671917','320671919','320671921']]);fac.append(dict(id='headquarters-tennis',name='본부 테니스장 · 14면',kind='tennis',outer=list(pall.convex_hull.exterior.coords)[:-1],source='https://map.snu.ac.kr/web/facility_detail.action?lat_val=37.4656164774627&lon_val=126.954069913006&convinType=Y&inst_seq=235'))
fac.append(dict(id='engineering-tennis',name='공대 테니스장 · 3면',kind='tennis',outer=list(unary_union([Polygon(ring(id))for id in ['320667500','347802748']]).convex_hull.exterior.coords)[:-1],source='https://map.snu.ac.kr/web/facility_detail.action?lat_val=37.455807283707784&lon_val=126.94993926925866&convinType=Y&inst_seq=238'))
# Baseball: current aerial and official photograph show an all-dirt multi-use field.
# Do not invent turf, permanent bases or a diamond orientation that cannot be observed.
p=ring('386891065');by=grade(p);new.append(('baseballDirt',Polygon(p)));fence(p,4,3.5)
fac.append(dict(id='baseball-field',name='야구장 (보조운동장)',kind='baseball',outer=p,source='https://map.snu.ac.kr/web/facility_detail.action?lat_val=37.4671785022552&lon_val=126.951008395282&convinType=Y&inst_seq=233'))
baseball=dict(outer=p,elevation=by,bases=[],lines=[],status='Field/fence implemented; base positions and foul lines unconfirmed in current imagery, deliberately omitted')
# Two adjacent green basketball courts west of stadium, observed in the same Naver aerial view.
basketball=[]
for id in ['396371522','396371523']:
 p=ring(id);y=grade(p);new.append(('courtGreen',Polygon(p)));a=p[0];b=p[1];axis=np.array(b)-a;axis=axis/np.linalg.norm(axis);c=np.mean(p,axis=0);basketball.append(dict(id=id,center=c.tolist(),axis=axis.tolist(),side=[axis[1],-axis[0]],elevation=y,outer=p))
fac.append(dict(id='stadium-basketball',name='대운동장 옆 농구장 · 2면',kind='basketball',outer=list(unary_union([Polygon(q['outer'])for q in basketball]).convex_hull.exterior.coords)[:-1],source='https://map.naver.com/p/search/서울대학교%20종합운동장'))
# Lawn podium: plan based on retained registered lawn boundary and current aerial view.
u=np.array([70.02,68.01]);u=u/np.linalg.norm(u);v=np.array([u[1],-u[0]]);c=np.array([-127.345,180.36]);base=height(*c)
def pt(a,b):return (c+u*a+v*b).tolist()
def rect(a,b,w,h):return [pt(a,b),pt(a+w,b),pt(a+w,b+h),pt(a,b+h)]
lawn=dict(center=c.tolist(),u=u.tolist(),v=v.tolist(),base=base,rise=2.4,halfU=59,halfV=44,innerU=49,innerV=34,outer=rect(-59,-44,118,88),heightNote='2.4m podium rise and step details estimated from Sep2025 Naver street view; not surveyed',source='https://map.naver.com/p/search/서울대학교%20잔디광장')
new.append(('plaza',Polygon(lawn['outer']).buffer(5)))
# Remove ground material fragments under the podium. Deck itself is built as disjoint patches.
N['reviewFacilities']=[f for f in N['reviewFacilities']if f['id']!='main-lawn'];fac.append(dict(id='main-lawn',name='잔디광장 (행정관 앞)',kind='lawnPodium',outer=lawn['outer'],source=lawn['source']))
N['outdoor']=dict(version=11,lawn=lawn,courts=courts,fences=fences,baseball=baseball,basketball=basketball,notes=['Naver imagery viewed 2026-11-12; image capture date unknown except lawn street view Sep2025','Court colours observed, exact pigment and gate positions estimated','User lawn rendering is a design reference, current aerial and street view take precedence'])
# Facility surfaces are an exclusive partition, never overlays on old road/ground patches.
covered=Polygon();out=[]
def emit(k,p):
 for q in ([p]if p.geom_type=='Polygon'else getattr(p,'geoms',[])):
  if q.geom_type=='Polygon'and q.area>.005:out.append(dict(kind=k,outer=list(q.exterior.coords)[:-1],holes=[list(r.coords)[:-1]for r in q.interiors]))
for k,p in new:
 emit(k,p.difference(covered));covered=covered.union(p)
for s in N['surfaces']:emit(s['kind'],make_valid(Polygon(s['outer'],s['holes'])).difference(covered))
N['surfaces']=out
# Enforce perfectly planar sports surfaces and feather only outside the run-off margins.
for shape,y in grades:
 minx,minz,maxx,maxz=shape.buffer(30).bounds
 for j,z in enumerate(np.linspace(z0,z1,n)):
  if not minz<=z<=maxz:continue
  for i,x in enumerate(np.linspace(x0,x1,n)):
   if not minx<=x<=maxx:continue
   d=shape.distance(Point(x,z));t=max(0,min(1,1-d/30));t=t*t*(3-2*t);H[j,i]=H[j,i]*(1-t)+y*t
N['terrain']['values']=H.ravel().round(6).tolist()
N['trees']=[t for t in N['trees']if not covered.buffer(2).covers(Point(t[:2]))]
N['facilities']+=fac
for p in N['points']:p[2]=height(p[0],p[1])
D['buildings']=[b for b in D['buildings']if b['id']not in ['vw/243','vw/301']]
(R/'dist/data/campus.json').write_text(json.dumps(D,ensure_ascii=False,separators=(',',':')))
(R/'dist/data/walk.json').write_text(json.dumps(N,ensure_ascii=False,separators=(',',':')))
print('courts',len(courts),'new facilities',[(f['id'],f['kind'])for f in fac])
