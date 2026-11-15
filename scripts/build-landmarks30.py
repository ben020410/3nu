"""Five individually authored landmarks. All dimensions other than cited heights are model estimates.
Only target precinct ground is rebuilt; roofs/bridges are separate physical layers.
Run against a clean BUILD29 data baseline (idempotent via the stored source snapshot).
"""
import json,math,pathlib,subprocess
import shapely
from shapely.geometry import Polygon,LineString,Point,box
R=pathlib.Path(__file__).resolve().parents[1]
base=R/'reports/build30/source-data';base.mkdir(exist_ok=True)
for name in ['walk.json','campus.json']:
 if not (base/name).exists():(base/name).write_bytes((R/'dist/data'/name).read_bytes())
D=json.loads((base/'campus.json').read_text());N=json.loads((base/'walk.json').read_text())
S={'base':0,'version':30,'buildings':{},'volumes':[],'surfaces':[],'rails':[],'details':[],'routes':[],'groundSolids':[],'removed':[],'scopes':[]}
eng=95.47306874492949
ID={'301':'228476658','302':'482207537','303':'official-303','103':'238935852','73':'vw/215'}
def rect(x,z,w,d):return [[x,z],[x+w,z],[x+w,z+d],[x,z+d]]
def trans(o,u):return lambda a,d:[o[0]+u[0]*a-u[1]*d,o[1]+u[1]*a+u[0]*d]
def polyrect(f,a,d,w,h):return [f(a,d),f(a+w,d),f(a+w,d+h),f(a,d+h)]
def vol(id,name,p,lo,hi,mat='stone',facade=None,**kw):
 v=dict(id=name,building=id,p=p,lo=lo,hi=hi,material=mat,**kw)
 if facade:v['facade']=facade
 S['volumes'].append(v);return v

def floor(id,name,p,y,**kw):
 s=dict(id=name,building=id,p=p,lo=y,**kw);S['surfaces'].append(s);return s

def slab(id,name,p,y,depth=.48,mat='paving',**kw):
 vol(id,name,p,y-depth,y,mat,**kw);return floor(id,name,p,y)

def stair(id,name,a,b,w,lo,hi,steps=None):
 dx=b[0]-a[0];dz=b[1]-a[1];L=math.hypot(dx,dz);nx=-dz/L*w/2;nz=dx/L*w/2
 p=[[a[0]+nx,a[1]+nz],[a[0]-nx,a[1]-nz],[b[0]-nx,b[1]-nz],[b[0]+nx,b[1]+nz]]
 s=floor(id,name,p,lo,hi=hi,steps=steps or math.ceil((hi-lo)/.17),**{'from':a,'to':b,'foundation29':lo-.45,'material':'paving'})
 for side in [-1,1]:S['rails'].append(dict(building=id,a=[a[0]+nx*side,lo,a[1]+nz*side],b=[b[0]+nx*side,hi,b[1]+nz*side]))
 return s

def rail(id,a,b,y):S['rails'].append(dict(building=id,a=[a[0],y,a[1]],b=[b[0],y,b[1]]))
def detail(id,kind,**kw):S['details'].append(dict(building=id,kind=kind,**kw))
def route(name,pts,lo,hi=None):S['routes'].append(dict(road=name,coords=pts,startFeet=lo,endFeet=lo if hi is None else hi))
def windows(rows,spacing=3.4,style='punched',**kw):return dict(rows=rows,spacing=spacing,style=style,**kw)
def bspec(no,level):
 b=next(b for b in D['buildings'] if b['id']==ID[no]);S['buildings'][b['id']]=dict(number=no,name=b.get('name',no),base=level,sourceOutline=b['p'],note='Reference-interpreted exterior; unmeasured dimensions are estimates.')
 return b
# 301: the 2023 aerial establishes a long low barrel-roof wing towards 300, tower at its other end.
b=bspec('301',eng);id=ID['301']
vol(id,'301-south-tower',rect(20,-1084,38,40),eng,eng+68.7,'blueGlass',windows(15,2.1,'curtain',rowHeight=4.3))
vol(id,'301-long-low-wing',rect(19,-1044,34,82),eng,eng+18.8,'concrete',windows(4,4.2,'ribbon'))
vol(id,'301-east-service-return',rect(53,-1042,5,39),eng,eng+14,'stone',windows(3,4,'punched'))
# deep vertical slots on the tower's west face, without importing an unidentified historic roof truss.
for z in [-1072,-1057]:
 vol(id,'301-recess-'+str(z),rect(19.91,z, .12,2.0),eng+4,eng+66.6,'darkGlass')
 detail(id,'louvres',a=[19.7,eng+4,z],b=[19.7,eng+66,z+2],count=32)
detail(id,'barrel',x=36,z0=-1043,z1=-959,r=8,base=eng+18.8)
detail(id,'canopy',p=rect(19,-962,34,14),back=eng+18.8,front=eng+9.2)
# Entrance is behind glazing, reached on the shared deck; no whole-footprint invisible collision.
slab(id,'301-entry-terrace',rect(20,-959,32,10),eng+4.8)
vol(id,'301-entry-wall',rect(21,-963,30,.28),eng+4.8,eng+11,'blueGlass')
for x in [20,51]:vol(id,'301-entry-side'+str(x),rect(x,-959,.65,10),eng,eng+4.4,'concrete')
# West tower entrance: visible in the 2023 inspection photograph. Kept
# separate from the north low-wing canopy and the elevated deck entrance.
detail(id,'canopy',p=[[20,-1074],[20,-1056],[12,-1056],[12,-1074]],back=eng+8.1,front=eng+5.5)
slab(id,'301-tower-doorstep',rect(12,-1074,8,18),eng+1.2,.32)
stair(id,'301-tower-entry',[8,-1065],[12,-1065],8,eng,eng+1.2)
for z in [-1073.6,-1056.4]:vol(id,'301-porch-post-'+str(z),rect(12.2,z,.25,.25),eng+1.2,eng+5.5,'frame')
vol(id,'301-door-frame',rect(19.78,-1068,.18,6),eng+1.2,eng+4.6,'darkGlass',windows(1,1.5,'curtain'))
route('301 타워 정면 출입구',[[6,-1065],[8,-1065],[12,-1065],[19,-1065]],eng,eng+1.2)
S['buildings'][id]['heightEvidence']='68.7m inferred as 258m roof elevation minus 189.3m site elevation in SNU 2009 Guinness article (bbsidx=75736); the same article states 73.4m including basement. Not a surveyed above-ground dimension. Other part heights are estimates.'
# 302: low banded north wing + tall south glass volume, central red X on the west face.
b=bspec('302',eng);id=ID['302']
vol(id,'302-banded-north-wing',rect(18,-1172,40,62),eng+4.8,eng+29.2,'stone',windows(6,3,'ribbon',band=1.2))
vol(id,'302-low-recessed-floor',rect(24,-1171,33,60),eng,eng+4.8,'blueGlass',windows(1,3.2,'curtain'))
for z in range(-1169,-1111,8):vol(id,'302-col-'+str(z),rect(18.5,z,.9,.9),eng,eng+4.8,'concrete')
vol(id,'302-south-glass-tower',rect(21,-1213,40,29),eng,eng+39.7,'blueGlass',windows(10,2.0,'curtain'))
vol(id,'302-recessed-link',rect(31,-1184,17,12),eng+1,eng+23,'darkGlass',windows(5,2.6,'curtain'))
# Sculptural X inset at an intentional opaque-frame opening.
vol(id,'302-x-recess',rect(17.78,-1145,.18,8),eng+7,eng+28,'darkGlass')
detail(id,'brace',x=17.45,z=-1145,w=8,lo=eng+18.6,hi=eng+27.8)
# A front terrace at the open lower level and two distinct access flights.
slab(id,'302-front-terrace',rect(13,-1168,5,53),eng+2.4,.35)
stair(id,'302-west-access',[5,-1132],[13,-1132],5.8,eng,eng+2.4)
slab(id,'302-door-landing',rect(13,-1135,11,6),eng+2.4,.35)
stair(id,'302-north-access',[15.5,-1103],[15.5,-1115],5,eng,eng+2.4)
# 303: stone wings around a deeply glazed courtyard, open ground/entry and timber diagonal frame.
b=bspec('303',eng);id=ID['303']
pn=[[-67.946,-940.471],[-44.137,-940.471],[-26.518,-931.423],[-19.375,-943.566],[-38.185,-952.852],[-53.899,-954.042],[-67.47,-954.042]]
ps=[[-51.518,-978.566],[-15.327,-978.566],[-15.327,-991.185],[-36.994,-991.899],[-57.708,-1000.471],[-62.232,-989.518]]
pa=[[-56.518,-953.804],[-28.661,-947.376],[-22.946,-978.566],[-51.518,-985.471]]
# The exterior photograph with 301 on the left has the taller southern wing
# on its left and the lower northern wing on its right.
vol(id,'303-north-stone-wing',pn,eng+8.6,eng+24,'ivory',windows(4,3.1,'haedong',sill=1.1))
vol(id,'303-south-stone-wing',ps,eng+8.6,eng+28,'ivory',windows(5,3.4,'haedong',sill=1.1))
# Distinct smaller recessed cores and columns keep the colonnade genuinely open.
for name,p in [('north',pn),('south',ps)]:
 core=Polygon(p).buffer(-2)
 vol(id,'303-'+name+'-lower-core',list(core.exterior.coords)[:-1],eng-.3,eng+8.6,'darkGlass',windows(2,2.6,'curtain'))
 for k in range(0,len(p),2):vol(id,'303-'+name+'-pier-'+str(k),rect(p[k][0]-.3,p[k][1]-.3,.6,.6),eng,eng+8.6,'stone')
# glazed enclosure is an actual thin wall, with a central door clearance at deck level.
for i in [1,3]:
 a=pa[i];c=pa[(i+1)%4]
 detail(id,'atrium-wall',a=a,b=c,lo=eng+4.8,hi=eng+24,door=(i==1),roofA=eng+(24 if i==1 else 28),roofB=eng+(28 if i==1 else 24))
 length=math.dist(a,c);ta=.56-2.2/length;tb=.56+2.2/length
 at=lambda t:[a[0]+(c[0]-a[0])*t,a[1]+(c[1]-a[1])*t]
 sections=[(0,ta,eng+4.8),(tb,1,eng+4.8),(ta,tb,eng+8.2)] if i==1 else [(0,1,eng+4.8)]
 for j,(t0,t1,lo) in enumerate(sections):
  p=LineString([at(t0),at(t1)]).buffer(.09,cap_style=2)
  vol(id,'303-atrium-wall-'+str(i)+'-'+str(j),list(p.exterior.coords)[:-1],lo,eng+27,'atrium',hidden=True)
# rear atrium wall makes the volume deep rather than a flat front picture.
detail(id,'atrium-roof',p=pa,lo=eng+24,hi=eng+28,northLow=True)
slab(id,'303-atrium-floor',pa,eng+4.8,.5,'paving')
for lev in [eng+12.4,eng+20.1]:
 pp=[[-51,-956],[-47.5,-955],[-43,-981],[-46.5,-982]]
 vol(id,'303-interior-crosswalk'+str(lev),pp,lev-.4,lev,'timber')
for z in [-958,-968,-978]:
 detail(id,'timber-v',x=-27+(z+948)*.18,z=z,lo=eng+5,hi=eng+26)
# Deck: angular piazza + narrow branches; lower road remains at ground datum.
id=ID['303'];deck=eng+4.8
parts=[Polygon([[-27,-981],[-14,-986],[12,-975],[22,-960],[30,-953],[25,-945],[8,-951],[-10,-949],[-27,-952]]),Polygon(rect(-25,-944,7,22)),Polygon([[-20,-947],[-5,-942],[17,-935],[24,-936],[24,-942],[-5,-950]]),Polygon(rect(19,-956,31,7))]
# 312 branch is separate from 300 access: clear gaps under bridges, not earth.
parts.append(Polygon([[-25,-954],[-18,-954],[-18,-923],[-25,-923]]))
deckPoly=shapely.union_all(parts)
for i,p in enumerate(getattr(deckPoly,'geoms',[deckPoly])):
 slab(id,'engineering-deck-'+str(i),list(p.exterior.coords)[:-1],deck,.55,holes=[list(r.coords)[:-1]for r in p.interiors])
# Structural supports are away from x=-3..3 road corridor.
for x,z in [(-14,-968),(10,-967),(-21,-931),(17,-942),(31,-951)]:vol(id,'deck-pier-'+str(x)+str(z),rect(x-.45,z-.45,.9,.9),eng,deck-.55,'stone')
for k,(a,b0) in enumerate([([-17,-968],[12,-968]),([-21,-941],[-21,-926]),([14,-951],[33,-951])]):
 beam=LineString([a,b0]).buffer(.325,cap_style=2)
 vol(id,'deck-beam-'+str(k),list(beam.exterior.coords)[:-1],deck-1.2,deck-.55,'stone')
# Guard only edges not serving entries/stairs. Explicit openings avoid invisible blocked portals.
for a,b0 in [([-27,-981],[-14,-986]),([-14,-986],[12,-975]),([8,-951],[-10,-949]),([-25,-943],[-25,-922]),([-18,-922],[-18,-938])]:rail(id,a,b0,deck)
stair(id,'deck-main-flight',[7,-1001],[7,-986],7.2,eng,eng+2.4)
slab(id,'deck-main-rest',rect(3.4,-986,7.2,5),eng+2.4,.4)
stair(id,'deck-upper-flight',[7,-981],[7,-969],7.2,eng+2.4,deck)
# Ground to 300/312 is via steps, not a fabricated same-level building entry.
stair(id,'deck-300-flight',[27,-932],[17,-937],5,eng,deck)
slab(id,'deck-300-head',rect(14.5,-940,5,6),deck,.4)
slab(id,'deck-312-head',rect(-30,-928,12,5.5),deck,.55)
stair(id,'deck-312-flight',[-47,-925],[-29,-925],5,eng,deck)
# 302 remains connected to the deck through the existing eastern footway and a stair; no invented long skybridge.
route('303 데크 지상→중간참→301 진입',[[7,-1003],[7,-986],[7,-981],[7,-970],[16,-963],[27,-952],[33,-952]],eng,deck)
route('303 데크→중정 입구',[[18,-962],[0,-965],[-18,-965],[-31,-965],[-43,-965]],deck)
route('데크 아래 도로 왕복',[[-2,-1003],[-2,-985],[-2,-967],[-1,-953],[9,-944]],eng)
route('300 접속 계단',[[29,-931],[27,-932],[17,-937],[14,-941],[7,-945]],eng,deck)
route('312 접속 계단',[[-49,-925],[-47,-925],[-29,-925],[-21.5,-925],[-21.5,-954],[-16,-954]],eng,deck)
route('301→302 지상 연결',[[8,-1003],[8,-1050],[8,-1103],[2,-1124],[2,-1132],[5,-1132],[13,-1132],[21,-1132]],eng,eng+2.4)
# Kyujanggak: load-bearing cylindrical colonnade, recessed screen, broad deep-eaved hip roof.
b=bspec('103',89.034246);y=b['siteDatum'];id=ID['103'];F=trans([-157,364],[.734,-.679]);P=lambda a,d,w,h:polyrect(F,a,d,w,h)
vol(id,'103-stone-plinth',P(-20,-27,50,32),y-.6,y+2.5,'darkStone',windows(1,6,'small'))
vol(id,'103-recessed-screen',P(-17,-19,42,17),y+2.5,y+7.8,'screen')
vol(id,'103-glazed-upper',P(-19,-25,48,30),y+7.8,y+12.8,'bronzeGlass',windows(2,3.8,'curtain'))
vol(id,'103-low-rear-wing',P(-36,6,66,18),y,y+6,'stone',windows(1,4,'ribbon'))
vol(id,'103-west-pylon',P(-24,-26,4.8,32),y,y+14,'darkStone')
for a in [-15,-5,5,15,25]:
 q=F(a,-24);detail(id,'cylinder',p=q,lo=y+2.5,hi=y+7.8,r=.75);vol(id,'103-column-'+str(a),rect(q[0]-.65,q[1]-.65,1.3,1.3),y+2.5,y+7.8,'concrete',hidden=True)
slab(id,'103-front-gallery',P(-19,-27,48,7.5),y+2.5,.35)
detail(id,'korean-roof',origin=[-157,364],u=[.734,-.679],a=-22,d=-28,w=54,depth=36,y=y+12.8,rise=4.2)
stair(id,'103-entry-stair',F(31,-34),F(31,-23),5.6,y,y+2.5)
slab(id,'103-entry-landing',P(28.2,-23,5.6,7),y+2.5,.35)
route('규장각 출입 계단',[F(31,-36),F(31,-34),F(31,-23),F(31,-20),F(28,-20)],y,y+2.5)
# Culture hall: latest 2025 official rendering, NOT an as-built reconstruction.
b=bspec('73',N['outdoor']['lawn']['base']+N['outdoor']['lawn']['rise']);y=S['buildings'][ID['73']]['base'];id=ID['73'];F=trans([-74,275],[.697,-.717]);P=lambda a,d,w,h:polyrect(F,a,d,w,h)
S['buildings'][id]['note']='2025 SNU groundbreaking rendering interpreted as a future finished scheme. Not current built appearance.'
# Twin faceted performance volumes recessed behind inhabited terraces.
for name,aa,dd,w,h,top in [('concert',-38,4,37,24,21),('stage',-37,29,28,18,27)]:
 p=[F(aa+3,dd),F(aa+w-3,dd),F(aa+w,dd+5),F(aa+w-2,dd+h-3),F(aa+w-8,dd+h),F(aa+4,dd+h),F(aa,dd+h-5)]
 vol(id,'73-'+name,p,y,y+top,'ivory',taper=.90)
 detail(id,'hall-roof',p=p,y=y+top)
# Offset glass pavilions / shallow planted roofs retain distinct porch depths.
for k,(a,d,w,h,level) in enumerate([(-43,-26,20,17,2.8),(-20,-23,21,18,2.8),(-16,-7,21,10,5.6),(23,26,19,14,8.4),(44,-5,17,18,5.6)]):
 vol(id,'73-pavilion-'+str(k),P(a,d,w,h),y,y+level+4,'lightGlass',windows(max(2,round((level+4)/2.8)),2.6,'curtain'))
 slab(id,'73-canopy-'+str(k),P(a-2,d-2,w+4,h+4),y+level+4.4,.4,'ivory')
 detail(id,'roof-garden',p=P(a+1,d+1,w-2,h-2),y=y+level+4.4)
# Three generous parallel terraces connected by separate step flights.
for k,(a,d,w,h,level) in enumerate([(-43,-34,65,8,2.8),(-18,-5,40,8,5.6),(7,19,43,7,8.4)]):
 slab(id,'73-terrace-'+str(k),P(a,d,w,h),y+level,level,'ivory',facade=windows(max(1,k+1),3.8,'ribbon'))
 for aa in [a,a+w]:rail(id,F(aa,d),F(aa,d+h),y+level)
# A real edge landing bridges the lawn's existing parking-deck edge. It has
# its own soffit, rather than raising terrain through the parking structure.
slab(id,'73-lawn-arrival',P(2,-61,22,12),y,.4)
stair(id,'73-public-lower-stairs',F(13,-49),F(13,-34),22,y,y+2.8)
stair(id,'73-public-middle-stairs',F(13,-26),F(13,-5),16,y+2.8,y+5.6)
stair(id,'73-public-upper-stairs',F(35,3),F(35,19),16,y+5.6,y+8.4)
# The middle-to-upper approach landing joins the corresponding pavilion level.
slab(id,'73-middle-link',P(19,-5,22,8),y+5.6,5.6,'ivory',facade=windows(2,3.8,'ribbon'))
# Ground-level apron connects to existing paths; do not erase the raised lawn structure.
route('문화관 하부 광장→테라스', [F(13,-63),F(13,-59),F(13,-49),F(13,-34),F(13,-29),F(13,-26),F(13,-5),F(13,-2),F(35,-2),F(35,3),F(35,19),F(35,22)],y,y+8.4)
# Carve the climbing portion out of every elevated slab, so stairs never hit its soffit.
# Lower terrace slabs are actual occupied building volumes; deck slabs retain air below.
stairs=[q for q in S['surfaces'] if q.get('from')]
replaced=[];newvol=[];newfloor=[]
for v in S['volumes']:
 fs=next((f for f in S['surfaces'] if not f.get('from') and f['id']==v['id']),None)
 if not fs:newvol.append(v);continue
 shape=Polygon(v['p'],v.get('holes',[]))
 for q in stairs:
  if q['hi']<=v['hi']+.02 and q['hi']>v['lo']+.1:
   shape=shape.difference(Polygon(q['p']))
 geoms=[shape] if shape.geom_type=='Polygon' else [p for p in getattr(shape,'geoms',[]) if p.geom_type=='Polygon']
 for j,p in enumerate(geoms):
  if p.area<.001:continue
  patch=dict(p=list(p.exterior.coords)[:-1],holes=[list(r.coords)[:-1] for r in p.interiors])
  newvol.append({**v,**patch,'id':v['id']+'-part'+str(j)})
  newfloor.append({**fs,**patch,'id':fs['id']+'-part'+str(j)})
S['volumes']=newvol;S['surfaces']=stairs+newfloor
# Partition coplanar solid tops. Deeper plinths retain their load-bearing volume;
# thin terraces/deck pieces are trimmed at the shared boundary, never lifted.
owned={};clean=[];overlaps=[]
for v in sorted(S['volumes'],key=lambda q:q['hi']-q['lo'],reverse=True):
 if v.get('hidden'):clean.append(v);continue
 key=round(v['hi'],5);shape=Polygon(v['p'],v.get('holes',[]));prior=owned.get(key)
 if prior is not None:
  cut=shape.intersection(prior).area
  if cut>.00001:overlaps.append(dict(id=v['id'],removedTopOverlapM2=round(cut,5)))
  shape=shape.difference(prior)
 if shape.is_empty:continue
 owned[key]=shape if prior is None else prior.union(shape)
 geoms=[shape] if shape.geom_type=='Polygon' else [p for p in getattr(shape,'geoms',[]) if p.geom_type=='Polygon']
 for j,p in enumerate(geoms):
  if p.area>.00001:clean.append({**v,'id':v['id']+'-owned'+str(j),'p':list(p.exterior.coords)[:-1],'holes':[list(r.coords)[:-1]for r in p.interiors]})
S['volumes']=clean
# Walking faces have no renderer of their own: merge the same-height floor
# records once, even where building ownership changes across an entrance.
flatGroups={}
for f in S['surfaces']:
 if not f.get('from'):flatGroups.setdefault(round(f['lo'],5),[]).append(f)
flat=[]
for key,items in flatGroups.items():
 shape=shapely.union_all([Polygon(f['p'],f.get('holes',[])) for f in items])
 for j,p in enumerate([shape] if shape.geom_type=='Polygon' else shape.geoms):
  flat.append({**items[0],'id':'merged-floor-'+str(key)+'-'+str(j),'sources':[q['id']for q in items],'p':list(p.exterior.coords)[:-1],'holes':[list(r.coords)[:-1]for r in p.interiors]})
S['surfaces']=stairs+flat
S['coplanarCleanup']=overlaps
# Consolidate ground: replace intersecting legacy surfaces within bounded work polygons, keeping road network paths.
scopes=[('engineering',box(-76,-1223,70,-896),eng),('kyujanggak',Polygon(bspec('103',89.034246)['p']).buffer(9),89.034246),('culture',Polygon([trans([-74,275],[.697,-.717])(a,d)for a,d in [(-53,-55),(66,-55),(66,51),(-53,51)]]),y)]
# Existing raised lawn/parking is a separate structural floor, never filled with earth.
l=N['outdoor']['lawn'];LF=lambda a,d:[l['center'][0]+l['u'][0]*a+l['v'][0]*d,l['center'][1]+l['u'][1]*a+l['v'][1]*d]
lawnShape=Polygon([LF(a,d)for a,d in [(-59,-44),(59,-44),(59,64),(-59,64)]])
scopes=[(name,p.difference(lawnShape) if name=='culture' else p,h) for name,p,h in scopes]

roadAreas=shapely.union_all([LineString(r['p']).buffer(r['width']/2,cap_style=2,join_style=2) for r in N['roads'] if r['category']=='road'])
pathAreas=shapely.union_all([LineString(r['p']).buffer(max(2,r['width']/2),cap_style=2,join_style=2) for r in N['roads'] if r['category']!='road'])
oldSurfaces=N['surfaces'];new=[]
def pieces(g):return [g]if g.geom_type=='Polygon'else[p for p in getattr(g,'geoms',[])if p.geom_type=='Polygon']
for name,scope,y in scopes:
 S['scopes'].append(dict(id=name,outer=list(scope.exterior.coords)[:-1],groundY=y))
 # Reuse road/path boundaries, remove duplicates inside this scope via a single exclusive ground compiler.
 removed=0;clipped=[]
 for s in oldSurfaces:
  shape=Polygon(s['outer'],s.get('holes',[]))
  if not shape.is_valid:shape=shapely.make_valid(shape)
  if not shape.intersects(scope):clipped.append(s);continue
  removed+=1
  for p in pieces(shape.difference(scope)):
   if p.area>.01:clipped.append({**s,'outer':list(p.exterior.coords)[:-1],'holes':[list(r.coords)[:-1]for r in p.interiors]})
 oldSurfaces=clipped
 S['removed'].append(dict(scope=name,clippedLegacySurfaces=removed,reason='exclusive replacement of the work area; legacy road and floor material polygons removed here'))
 road=roadAreas.intersection(scope)
 for i,p in enumerate(pieces(road)):new.append(dict(id='landmark30-'+name+'-road-'+str(i),kind='road',outer=list(p.exterior.coords)[:-1],holes=[list(r.coords)[:-1]for r in p.interiors],groundY=y))
 # Aprons follow the actual authored footprints and access paths. Areas beyond
 # these remain planted; a rectangular work scope must never become a plaza.
 ids=([ID[n] for n in ['301','302','303']] if name=='engineering' else [ID['103' if name=='kyujanggak' else '73']])
 footprints=shapely.union_all([Polygon(v['p']) for v in S['volumes'] if v['building'] in ids and not v.get('hidden')])
 access=shapely.union_all([LineString(r['coords']).buffer(3,join_style=2) for r in S['routes'] if (name=='engineering' and r['road'][0:2] in ['30','31','데크']) or (name=='kyujanggak' and r['road'].startswith('규장각')) or (name=='culture' and r['road'].startswith('문화관'))])
 paving=shapely.union_all([footprints.buffer(4,join_style=2),access,pathAreas.intersection(scope)]).intersection(scope).difference(road)
 if name=='culture':
  # The design has a connected paved forecourt, not residual grass slivers
  # between its terrace buildings. A consolidated apron replaces that partition.
  paving=footprints.convex_hull.buffer(4,join_style=2).union(access).union(pathAreas.intersection(scope)).intersection(scope).difference(road)
 for i,p in enumerate(pieces(paving)):new.append(dict(id='landmark30-'+name+'-apron-'+str(i),kind='plaza',outer=list(p.exterior.coords)[:-1],holes=[list(r.coords)[:-1]for r in p.interiors],groundY=y))
 for i,p in enumerate(pieces(scope.difference(road.union(paving)))):new.append(dict(id='landmark30-'+name+'-landscape-'+str(i),kind='grass',outer=list(p.exterior.coords)[:-1],holes=[list(r.coords)[:-1]for r in p.interiors],groundY=y))
 # Actual terrain is graded too, including all footprint edges. Smooth outer blend over 20 m.
 n=N['terrain']['n'];x0,z0,x1,z1=N['bounds']
 for j in range(n):
  z=z0+(z1-z0)*j/(n-1)
  if z<scope.bounds[1]-20 or z>scope.bounds[3]+20:continue
  for i in range(n):
   x=x0+(x1-x0)*i/(n-1)
   if x<scope.bounds[0]-20 or x>scope.bounds[2]+20:continue
   dist=scope.distance(Point(x,z));t=max(0,1-dist/20);t=t*t*(3-2*t)
   ix=j*n+i;N['terrain']['values'][ix]=N['terrain']['values'][ix]*(1-t)+y*t
N['surfaces']=new+oldSurfaces
# Retained legacy trees must not grow through the replacement buildings/deck.
# Include crown clearance; do not change planting outside the work scopes.
treeClearance=shapely.union_all([Polygon(v['p'],v.get('holes',[])) for v in S['volumes'] if not v.get('hidden')]+[Polygon(q['p']) for q in stairs]).buffer(4.5)
beforeTrees=N.get('trees',[])
N['trees']=[t for t in beforeTrees if not treeClearance.covers(Point(t[0],t[1]))]
S['removed'].append(dict(scope='landmark structures',trees=len(beforeTrees)-len(N['trees']),reason='legacy crowns intersected replacement structure or stair clearance'))
# Purposeful planting islands, explicitly partitioned rather than stacked on top of paving.
plantings=[('engineering',rect(-65,-1020,40,12),eng),('engineering',rect(-66,-1060,25,28),eng),('engineering',rect(-55,-1202,30,18),eng)]
for name,p,y in plantings:N['surfaces'].insert(0,dict(id='landmark30-planting-'+str(len(N['surfaces'])),kind='planting',outer=p,holes=[],groundY=y))
N['landmarks30']=S
# Floor top cutouts eliminate exact duplicate terrain at stair starts and independent ground slabs.
N['landmarkCuts30']=[]
for q in S['surfaces']:
 if q.get('from') and q['foundation29'] <= S['buildings'][q['building']]['base']+.01:N['landmarkCuts30'].append(dict(outer=q['p']))
(R/'dist/data/walk.json').write_text(json.dumps(N,separators=(',',':')))
(R/'dist/data/landmarks30.json').write_text(json.dumps(S,ensure_ascii=False,indent=2))
(R/'reports/build30/spec-summary.json').write_text(json.dumps({'buildings':S['buildings'],'removed':S['removed'],'levels':{'engineeringGround':eng,'deck':deck},'routes':S['routes']},ensure_ascii=False,indent=2))
print('wrote',len(S['volumes']),'volumes',len(S['surfaces']),'walking surfaces',len(S['routes']),'routes')

(R/'dist/data/qa30-routes.json').write_text(json.dumps([{**q,'zone':'BUILD30'} for q in S['routes']],ensure_ascii=False))
