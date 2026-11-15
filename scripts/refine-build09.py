# coding: utf-8
"""Deterministic refinement from the retained BUILD08 input, never repeatedly smooth output.
Photo/plan traces are estimates, not cadastral surveys. Metres: X east, Z north.
"""
import json,pathlib,zipfile,math
import numpy as np
from shapely.geometry import Polygon,Point,LineString,box
from shapely.ops import unary_union
from shapely import make_valid
R=pathlib.Path(__file__).resolve().parents[1]
with zipfile.ZipFile(R/'data-sources/build09-input.zip')as z:
 D,N,P,S=[json.loads(z.read(f))for f in ['campus.json','walk.json','places.json','official-profiles.json']]
report={'basis':'Naver satellite viewed 2026-11-12; SNU official identity/photos; OSM boundaries retained where not traced','estimates':[]}
def add_building(id,number,name,points,h,style,source):
 b=dict(id=id,name=name,p=points,h=h,levels=round(h/3.8),officialNumber=number,officialDetail=source,reviewModel=style,source='BUILD09 photo/plan trace; not surveyed',placementUncertaintyM=8)
 D['buildings'].append(b);P.append(dict(id=id,number=number,name=name,zone='',category='교육·연구',description='공식 명칭 및 위성·외관 사진 기반 모델. 치수와 미확인 면은 추정입니다.',aliases=[number+'동',name],verification='공식 명칭 / 수동 윤곽 추정',sources=[source]));return b
# 56-1: official marker + satellite roof outline. Approximate plan, checked against neighbours.
b56=add_building('official-56-1','56-1','김철수물리관',[[-57,-76],[-19,-89],[-26,-109],[-64,-96]],23.4,'physics','https://map.snu.ac.kr/web/facility_detail.action?lat_val=37.458209&lon_val=126.951594&convinType=Y&inst_seq=259')
# 303: trace at 30m/63px, north-up, using adjacent 301 footprint for registration.
# Roof displacement in oblique satellite acquisition creates ~8m uncertainty.
trace303=[[493,455],[578,432],[592,458],[587,480],[605,552],[515,583],[491,518]]
ring303=[[round(20.625+(x-680)*30/63,3),round(-948.328-(y-475)*30/63,3)]for x,y in trace303]
replaced=['vw/204','vw/205','vw/241','vw/86'];D['buildings']=[b for b in D['buildings']if b['id']not in replaced]
b303=add_building('official-303','303','해동첨단공학관',ring303,30,'haedong','https://eng.snu.ac.kr/about/support-facilities/haedong-advanced-engineering-center')
report['replacedOldFootprints']=replaced;report['newBuildings']=[b56,b303];report['estimates']+=['56-1 trace ±8m, height23.4m estimated','303 trace ±8m; seven floors confirmed, central atrium30m design reference, wings estimated','Roof outlines are not surveyed ground footprints']
for b in D['buildings']:
 if b['id']=='193893586':b['reviewModel']='pungsan';b['h']=9;b['collisionPolygons']=[list(Polygon(b['p']).intersection(box(307,-70,340,-40)).exterior.coords)[:-1]];b['landmarkOnly']=False
 if b['id']=='167609409':b['reviewModel']='administration09'
 if b['id']=='434754623':b['reviewModel']='pharmacy143';b['h']=25.4
P.append(dict(id='193893586',number='100',name='버들골 풍산마당',zone='',category='문화·야외',description='곡면 지붕과 공연 마당. 치수는 사진 비율 추정입니다.',aliases=['버들골','풍산마당'],verification='공식 사진 대조',sources=['https://map.snu.ac.kr/web/facility_detail.action?lat_val=37.4584786551623&lon_val=126.955227154786&convinType=Y&inst_seq=112']))
# Explicit surfaces; all receive disjoint partitions, never another overlay above old ground.
surfaces=[(s['kind'],make_valid(Polygon(s['outer'],s['holes'])))for s in N['surfaces']]
extras=[]
for l in N['lands']:
 p=make_valid(Polygon(l['rings'][0],l['rings'][1:]));c=p.centroid
 if l['kind']=='wood':extras.append(('wood',p))
 elif l['kind']=='park':extras.append(('lawn'if(-190<c.x<-50 and 100<c.y<260)or(260<c.x<450 and -150<c.y<70)else 'planting',p))
 elif l['kind']=='construction':extras.append(('soil',p))
 # Do not turn all sports fields into turf or all parks into lawn without evidence.
mainLawn=next(p for k,p in extras if k=='lawn'and p.centroid.x<0)
N['reviewFacilities']=[dict(id='main-lawn',name='잔디광장 (행정관 앞)',kind='lawn',outer=list(mainLawn.exterior.coords)[:-1],source='https://eng.snu.ac.kr/communication/notice/notice?bbsidx=8493&md=v')]
# Pungsan outdoor apron and terraced audience area fit the existing official/OSM facility ring.
bp=next(b for b in D['buildings']if b['id']=='193893586');pp=Polygon(bp['p']);extras.insert(0,('plaza',pp.buffer(5)))
# New 303 terrace / parking are traced from the visible paved site, not invented buildings.
p303=Polygon(ring303);terrace=p303.buffer(5,join_style=2);parking=Polygon([[-120,-949],[-74,-938],[-66,-999],[-119,-1016],[-126,-1000]])
extras.insert(0,('parking',parking));extras.insert(0,('plaza',terrace));extras.insert(0,('plaza',Polygon(b56['p']).buffer(3)))
# Main gate cross section: four traffic lanes in supplied photo/satellite, 15.5m estimate.
buildingMasks=unary_union([Polygon(b['p'])for b in D['buildings']if not b.get('landmarkOnly') and b.get('reviewModel')!='pungsan'])
widen=[]
for r in N['roads']:
 if r['kind'] not in ['primary','secondary']:continue
 if not any(-390<x<-280 and 690<z<920 for x,z in r['p']):continue
 old=r['width'];r['width']=max(old,15.5);r['widthSource']='BUILD09 gate 4-lane photo section, estimated 15.5m, not survey'
 g=LineString(r['p']).buffer(r['width']/2,cap_style=1,join_style=1).intersection(box(-410,680,-265,940)).difference(buildingMasks.buffer(.8));widen.append(g)
if widen:
 newRoad=unary_union(widen);surfaces=[(k,p.difference(newRoad))for k,p in surfaces];surfaces.insert(0,('road',newRoad));report['gateRoadWidthM']=15.5

# Remove obsolete walkway slivers crossing new structures. Do not invent nearby joins.
obstacles=unary_union([Polygon(b['p'])for b in [b56,b303]])
surfaces=[(k,p.difference(obstacles))for k,p in surfaces]
priority=surfaces+extras;seen=Polygon();out=[]
def emit(k,p):
 if p.is_empty:return
 if p.geom_type=='Polygon':
  if p.area>.02:out.append(dict(kind=k,outer=list(p.exterior.coords)[:-1],holes=[list(h.coords)[:-1]for h in p.interiors]))
 elif hasattr(p,'geoms'):
  for q in p.geoms:emit(k,q)
for k,p in priority:
 p=make_valid(p);g=p.difference(seen);emit(k,g);seen=unary_union([seen,p])
N['surfaces']=out
# Real height smoothing: restrained 6–9m filter removes local DEM/pad steps, not mountain relief.
n=N['terrain']['n'];x0,z0,x1,z1=N['bounds'];H=np.array(N['terrain']['values']).reshape(n,n);before=H.copy();weights=np.exp(-np.arange(-3,4)**2/(2*1.8**2));weights/=weights.sum()
for axis in (0,1):H=np.apply_along_axis(lambda a:np.convolve(np.pad(a,(3,3),mode='edge'),weights,mode='valid'),axis,H)
H=before+np.clip(H-before,-4,4)
xs=np.linspace(x0,x1,n);zs=np.linspace(z0,z1,n);X,Z=np.meshgrid(xs,zs)
def sample(a,x,z):
 i=np.clip((x-x0)/(x1-x0)*(n-1),0,n-1.000001);j=np.clip((z-z0)/(z1-z0)*(n-1),0,n-1.000001);ix=int(i);iz=int(j);u=i-ix;v=j-iz
 return a[iz,ix]*(1-u)*(1-v)+a[iz,ix+1]*u*(1-v)+a[iz+1,ix]*(1-u)*v+a[iz+1,ix+1]*u*v
padRecords=[]
def pad(poly,target,feather,flat=0):
 global H
 shape=poly.buffer(flat);minx,minz,maxx,maxz=shape.buffer(feather).bounds
 for j in np.where((zs>=minz)&(zs<=maxz))[0]:
  for i in np.where((xs>=minx)&(xs<=maxx))[0]:
   d=shape.distance(Point(xs[i],zs[j]));t=max(0,1-d/feather);t=t*t*(3-2*t);H[j,i]=H[j,i]*(1-t)+target*t
for b in D['buildings']:
 p=Polygon(b['p']);c=p.centroid;vals=[sample(before,x,z)for x,z in b['p']];span=max(vals)-min(vals)
 # Preserve deliberate high-slope multilevel sites; smooth their surroundings instead.
 if b.get('reviewModel')in ['physics','haedong','administration09','pharmacy143'] or (span<8 and p.area<5000 and not b.get('landmarkOnly')):
  target=sample(before,c.x,c.y);pad(p,target,24,2);padRecords.append(dict(id=b['id'],datum=target,source='existing DEM centre; estimated graded site',originalRange=span))
for f in N['facilities']:
 pad(Polygon(f['outer']),f['elevation'],18,1.3)
pad(mainLawn,sample(before,mainLawn.centroid.x,mainLawn.centroid.y),20,0)
# Final small pass smooths transitions between graded sites, not just their normals.
kernel=np.array([1,4,6,4,1],dtype=float)/16
for axis in (0,1):H=np.apply_along_axis(lambda a:np.convolve(np.pad(a,(2,2),mode='edge'),kernel,mode='valid'),axis,H)
for f in N['facilities']:pad(Polygon(f['outer']),f['elevation'],24,1.3)
N['terrain']['values']=H.ravel().round(5).tolist()
for p in N['points']:p[2]=round(sample(H,p[0],p[1]),5)
oldEdges=len(N['edges']);N['edges']=[e for e in N['edges']if not LineString([N['points'][e[0]][:2],N['points'][e[1]][:2]]).intersects(obstacles.buffer(.6))]
adj={}
for a,b,*_ in N['edges']: adj.setdefault(a,[]).append(b);adj.setdefault(b,[]).append(a)
valid={N['spawn']};queue=[N['spawn']]
for a in queue:
 for b in adj.get(a,[]):
  if b not in valid:valid.add(b);queue.append(b)
for b in [b56,b303]:
 c=Polygon(b['p']).centroid;N['anchors'][b['id']]=min(valid,key=lambda i:math.hypot(N['points'][i][0]-c.x,N['points'][i][1]-c.y))
N['trees']=[t for t in N['trees']if not obstacles.buffer(5).covers(Point(t[:2])) and not parking.covers(Point(t[:2]))]
report['terrain']={'maxChangeM':float(np.max(abs(H-before))),'rmsChangeM':float(np.sqrt(np.mean((H-before)**2))),'beforeRoughness':float(np.mean(abs(before[1:-1,1:-1]*4-before[:-2,1:-1]-before[2:,1:-1]-before[1:-1,:-2]-before[1:-1,2:]))),'afterRoughness':float(np.mean(abs(H[1:-1,1:-1]*4-H[:-2,1:-1]-H[2:,1:-1]-H[1:-1,:-2]-H[1:-1,2:]))),'pads':padRecords}
report['removedCrossingGraphEdges']=oldEdges-len(N['edges']);N['build09']='ground geometry and movement use the same corrected field'
for file,obj in [('campus.json',D),('walk.json',N),('places.json',P),('official-profiles.json',S)]: (R/'dist/data'/file).write_text(json.dumps(obj,ensure_ascii=False,separators=(',',':')))
(R/'BUILD-09-DATA-REPORT.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print({k:v for k,v in report.items()if k not in ['newBuildings','terrain']});print({k:v for k,v in report['terrain'].items()if k!='pads'})
