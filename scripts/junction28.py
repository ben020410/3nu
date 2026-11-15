"""Local junction replacements. All dimensions are design values, not surveyed.
One owner per visible surface; the same polygons/levels drive geometry and walking.
Reproducible from the preserved BUILD27 baseline, not cumulative height patches.
"""
import json,math,pathlib,subprocess
import shapely as S
from shapely.geometry import Polygon,LineString,Point,box
from shapely.ops import transform,split
R=pathlib.Path(__file__).resolve().parents[1]; B=R/'../../work/build28-before/dist'
baseline=(B/'data/walk.json').read_text() if (B/'data/walk.json').exists() else subprocess.check_output(['git','show','build27-before-junction28:dist/data/walk.json'],cwd=R,text=True)
N=json.loads(baseline); D=json.loads((R/'dist/data/campus.json').read_text()); L=json.loads((R/'BUILD28-BEFORE-SPEC.json').read_text()); base=L['base'];u=L['u'];v=L['v'];o=L['origin']
def wp(a,d):return [o[0]+u[0]*a+v[0]*d,o[1]+u[1]*a+v[1]*d]
def lp(x,z):return [(x-o[0])*u[0]+(z-o[1])*u[1],(x-o[0])*v[0]+(z-o[1])*v[1]]
def world(g):return transform(lambda a,d:(o[0]+u[0]*a+v[0]*d,o[1]+u[1]*a+v[1]*d),g)
def local(g):return transform(lambda x,z:((x-o[0])*u[0]+(z-o[1])*u[1],(x-o[0])*v[0]+(z-o[1])*v[1]),g)
def polys(g):return [g] if g.geom_type=='Polygon' else [p for p in getattr(g,'geoms',[]) if p.geom_type=='Polygon']
def geo(q):return S.make_valid(Polygon(q['outer'],q.get('holes',[])))
def packed(g):return {'outer':[list(p) for p in g.exterior.coords][:-1],'holes':[[list(p) for p in r.coords][:-1]for r in g.interiors]}
patches=[]; surfaces=[];rails=[];routes={};beds=[];walls=[]
def patch(id,g,h,kind='plaza'):
 pieces=polys(g)
 if isinstance(h,list) and len(h)>2:
  for prev,node,nxt in zip(h,h[1:],h[2:]):
   dx,dz=nxt[0]-prev[0],nxt[1]-prev[1];ll=math.hypot(dx,dz);nx,nz=-dz/ll,dx/ll
   cutter=LineString([(node[0]-nx*500,node[1]-nz*500),(node[0]+nx*500,node[1]+nz*500)])
   pieces=[p for q in pieces for p in polys(split(q,cutter))]
 for i,q in enumerate(pieces):
  if q.area<.01:continue
  p={'id':id+'-'+str(i),'kind':kind,**packed(world(q)),'source':'BUILD28 marked-junction design; not a measured dimension'}
  if isinstance(h,list):p['heightProfile']=[[*wp(a,d),base+y]for a,d,y in h]
  elif h is not None:p['groundY']=base+h
  patches.append(p)
def flat(id,g,h,railEdges=()):
 for i,q in enumerate(polys(g)):
  surfaces.append(dict(id=id+'-'+str(i),p=[wp(*p)for p in list(q.exterior.coords)[:-1]],lo=h,hi=h,steps=0,from_=None,to=None,width=0,junction28=True))
 for a,b in railEdges:rails.append({'a':wp(*a),'b':wp(*b),'y':h})
def route(id,nodes):
 routes[id]=nodes
 for i,(a,b)in enumerate(zip(nodes,nodes[1:]),1):
  x,z,y,w=a; X,Z,Y,W=b;dx=X-x;dz=Z-z;length=math.hypot(dx,dz);nx=-dz/length; nz=dx/length;w=min(w,W)
  g=Polygon([(x+nx*w/2,z+nz*w/2),(X+nx*w/2,Z+nz*w/2),(X-nx*w/2,Z-nz*w/2),(x-nx*w/2,z-nz*w/2)])
  surfaces.append(dict(id=id+'-'+str(i),p=[wp(*p)for p in list(g.exterior.coords)[:-1]],lo=y,hi=Y,steps=math.ceil(abs(Y-y)/.18) if abs(Y-y)>.01 else 0,from_=wp(x,z),to=wp(X,Z),width=w,junction28=True))
  if id in ['right-approach','pharmacy-near23','far-stair25']:
   # A real sloping earth bed, below the tread shell. Never an upper-ground road crossing a stair.
   beds.append((g,[[x,z,y-.3],[X,Z,Y-.3]]))
  if abs(Y-y)<.01:
   for side in [-1,1]:
    endZ=27 if id=='left-roof' and i==4 and side==-1 else Z+nz*w/2*side
    rails.append({'a':wp(x+nx*w/2*side,z+nz*w/2*side),'b':wp(X+nx*w/2*side,endZ),'y':y})
route('right-approach',[[6,112,0,18],[6,98,1.6,18],[6,88,1.6,18],[6,73,4.45,18]])
# Remove the old narrow zigzag. A 10m flight opens into a single 7m deep turning terrace.
route('right-third',[[7,63,4.45,10],[7,49,8.5,10],[7,41,8.5,10],[7,27,13,10]])
mainWall=local(Polygon(next(q['p'] for q in L['volumes'] if q['id']=='main-body')))
flat('turn28-third',Polygon([(2,27),(24,27),(24,-8),(12.5,-8),(12.5,20),(2,20)]).difference(mainWall),13,
 [((2,20),(12.5,20)),((12.5,20),(12.5,-8)),((2,27),(2,20)),((12,27),(18.7,27))])
routes['right-third'] += [[7,23.5,13,10],[17,23.5,13,7],[17,10,13,7]]
route('left-roof',[[123.5,62,4.45,10],[123.5,49,9.9,10],[123.5,41,9.9,10],[123.5,29,15.7,10],[123.5,22,15.7,10]])
# The final turn is shared by the landing and upper flight with no overlap.
flat('turn28-roof',box(118.5,17,128.5,22),15.7,[((118.5,17),(128.5,17)),((128.5,17),(128.5,22))])
route('left-roof-final',[[118.5,22,15.7,10],[106,22,22,10],[102,22,22,10]])
routes['left-roof'] += [[123.5,22,15.7,10],[118.5,22,15.7,10],[106,22,22,10],[102,22,22,10]]
route('pharmacy-near23',[[12.6,-24,0,8],[12.6,-32,3.4,8],[12.6,-37,3.4,8],[12.6,-45,7,8]])
flat('near28-upper',box(8.6,-49,24,-45),7,[((8.6,-49),(8.6,-45))]); routes['pharmacy-near23'] += [[12.6,-47,7,8],[21,-47,7,4]]
route('far-stair25',[[128.8,-21,0,6],[128.8,-29,3.5,6],[128.8,-34,3.5,6],[128.8,-42,7,6]])
flat('far28-upper',box(124,-46,131.8,-42),7);routes['far-stair25'] += [[128.8,-44,7,6],[122,-44,7,4]]
# Build flat landings from polygons rather than overlapping rectangular strips.
# Architecture remains independent above the rear corridor.
rear=box(-29,-51,153,-12.5)
# Lower courtyard is a broad continuous grade; upper ground is separate at the back of the annex.
patch('lower28-rear',box(-29,-26,153,-12.5).difference(S.union_all([box(-5,-45,24,-24),box(124,-42,145,-21)])),0,'rearPaving')
patch('under28-annex',box(24,-42,124,-26),0,'rearPaving')
patch('upper28-ribbon',box(24,-46,124,-42),7,'rearPaving')
patch('near28-upper-ground',box(8.6,-49,24,-45),7,'rearPaving')
patch('far28-upper-ground',box(124,-46,131.8,-42),7,'rearPaving')
# Banks at either end: match stair grade rather than the old road projected over a cliff.
patch('near28-bank',box(-5,-45,24,-24),[[12.6,-24,0],[12.6,-32,3.4],[12.6,-37,3.4],[12.6,-45,7]],'planting')
patch('far28-bank',box(124,-42,145,-21),[[128.8,-21,0],[128.8,-29,3.5],[128.8,-34,3.5],[128.8,-42,7]],'planting')
# Reorder the stair beds before their surrounding bank. The edge skirt meets this same grade.
for i,(g,h)in enumerate(beds):
 if g.centroid.y<0:patch('stair28-bed-'+str(i),g,h,'steps')
# Scope-limited cut of old ground definitions, including duplicated BUILD26 cuts.
replacement=S.union_all([world(box(-5,-45,24,-24)),world(box(124,-46,145,-21)),world(box(24,-46,124,-26)),world(box(8.6,-49,24,-45))])
# Front apron: exact continuous paving outline and two deliberate planting islands.
front=Polygon([(-27,78),(25,76),(25,88),(119,88),(140,88),(145,104),(137,135),(116,137),(25,137),(-18,131),(-27,113)])
student=local(Polygon(next(b['p'] for b in D['buildings']if b['id']=='167607356')))
front=front.difference(student.buffer(.03))
west=Polygon([(19,112),(27,112),(30,118),(27,129),(19,129),(17,122)])
east=Polygon([(121,111),(135,108),(135,127),(128,134),(121,134)])
# Main stair medians remain intentional; no needle gaps or scattered triangles.
median=box(61.5,89,69.5,122)
plant=S.union_all([west,east,median]);replacement=S.union_all([replacement,world(front)])
patch('court28-paving',front.difference(plant),0,'plaza');patch('court28-west-garden',west,0,'planting');patch('court28-east-garden',east,0,'planting');patch('court28-median',median,0,'planting')
# Existing front stairs and plazas retain their architectural heights; terrain bed follows.
for q in L['surfaces']:
 if q['id'].startswith('main-front-') and q.get('from'):
  p=local(Polygon(q['p']));a=lp(*q['from']);b=lp(*q['to']);patch('main28-bed-'+q['id'],p,[[*a,q['lo']-.3],[*b,q['hi']-.3]],'steps')
# Smooth side terraces, not full-height monolithic foundation blocks.
for id,g,h in [('right',box(-18,18,22,73),4.45),('left',box(119,14.1,139,62),4.45),('main',box(35,74,100,88),2.2)]:
 patch('court28-'+id,g,h if id=='left' else h-.3,'plaza')
for i,(g,h)in enumerate(beds):
 if g.centroid.y>0:patch('approach28-bed-'+str(i),g,h,'steps')
# Upper/lower structural court slabs: remove terrain from the slab faces (not a raised overlay).
# They need grade support but terrain isn't also drawn on the same plane.
# Most local stairs are rendered as tread+soffit over the following bed, 0.3m below each flight.
patches.sort(key=lambda q:0 if 'bed-'in q['id'] else 1)
kept=[]
for q in N['surfaces']:
 g=geo(q);g=g.difference(replacement)
 for p in polys(g):
  if p.area>.001:kept.append({**q,**packed(p)})
N['surfaces']=patches+kept
# Stale designGround23 faces used fixed flat elevations for now-sloped stair beds.
# Remove only faces in this junction; build explicit skirts from the new shared definitions below.
N['designGround23']=[q for q in N.get('designGround23',[]) if not geo(q).intersects(replacement)]
# Stair edge infill: close sides between the tread underside and graded earth, without giant vertical walls.
for q in surfaces:
 q['from']=q.pop('from_');
 if q['id'].startswith(('near28-upper','far28-upper')):q['groundOwned28']=True
 if q['steps'] and q['id'].startswith(('pharmacy-near23','far-stair25','right-approach')):q['earthSupported28']=True
# One visible owner for annex roof and bridge: volume owns top, floor entry is collision-only.
N['junction28']={'surfaces':surfaces,'routes':routes,'rails':rails,'replacementPrefixes':['right-approach-','right-third-','left-roof-','pharmacy-near23-','far-stair25-'], 'removedSurfaces':['third-entry-landing','pharmacy-landing23'], 'roofOwnedByVolume':['annex20-roof','annex20-bridge'], 'description':'local architectural connection corrections; 3F bridge and 5F roof remain separate'}
# Close actual designed grade boundaries, not overlaying horizontal plates.
# A partitioned heightfield has vertical sides at intentional terrace/bank changes.
# The previous generator emitted only tops, exposing sky through those edges.
from shapely.strtree import STRtree
height_q=[q for q in N['surfaces'] if q.get('groundY') is not None or q.get('heightProfile')]
height_g=[geo(q) for q in height_q]; ht=STRtree(height_g)
def ground(x,z):
 pt=Point(x,z)
 for ix in sorted(ht.query(pt,predicate='intersects')):
  q=height_q[ix]
  if not q.get('heightProfile'):return q['groundY']
  nearest=None
  for a,b in zip(q['heightProfile'],q['heightProfile'][1:]):
   dx,dz=b[0]-a[0],b[1]-a[1];t=max(0,min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz or 1)));dd=(x-a[0]-t*dx)**2+(z-a[1]-t*dz)**2
   if nearest is None or dd<nearest[0]:nearest=(dd,a[2]+t*(b[2]-a[2]))
  return nearest[1]
 n=N['terrain']['n'];H=N['terrain']['values'];x0,z0,x1,z1=N['bounds'];u=max(0,min(n-1.00001,(x-x0)/(x1-x0)*(n-1)));v=max(0,min(n-1.00001,(z-z0)/(z1-z0)*(n-1)));i,j=int(u),int(v);a,b=u-i,v-j;A=H[j*n+i];B=H[j*n+i+1];C=H[(j+1)*n+i];D=H[(j+1)*n+i+1]
 return A+a*(B-A)+b*(C-A) if a+b<=1 else D+(1-a)*(C-D)+(1-b)*(B-D)
faces=[];seen=set();zone=S.union_all([geo(q)for q in patches]).buffer(.1)
solid=[(Polygon(q['p']).buffer(.05),q) for q in L['volumes']+L.get('groundSolids',[]) if q['id']!='retaining-near23']
# Include clipped neighboring polygon boundaries, too; topology determines the seam.
for g in height_g:
 if not g.intersects(zone):continue
 for ring in [g.exterior,*g.interiors]:
  coords=list(ring.coords)
  for a,b in zip(coords,coords[1:]):
   dx,dz=b[0]-a[0],b[1]-a[1];length=math.hypot(dx,dz)
   if length<.001:continue
   nx,nz=-dz/length,dx/length;count=math.ceil(length/.8)
   for k in range(count):
    p=[a[0]+dx*k/count,a[1]+dz*k/count];r=[a[0]+dx*(k+1)/count,a[1]+dz*(k+1)/count];m=Point((p[0]+r[0])/2,(p[1]+r[1])/2)
    if not zone.intersects(m):continue
    key=tuple(sorted((tuple(round(c,3)for c in p),tuple(round(c,3)for c in r))))
    if key in seen:continue
    seen.add(key)
    # Probe inside each edge interval, not exactly at three-way corners.
    # Corner probes previously sampled the wrong adjoining terrace and emitted thin vertical fins.
    inward=.002
    samples=[[p[0]+dx/length*inward,p[1]+dz/length*inward],[r[0]-dx/length*inward,r[1]-dz/length*inward]]
    ys=[[ground(q[0]+nx*sign*.025,q[1]+nz*sign*.025)for q in samples]for sign in[-1,1]]
    if max(abs(ys[0][i]-ys[1][i])for i in[0,1])<.055:continue
    lo,hi=min(*ys[0],*ys[1]),max(*ys[0],*ys[1])
    if any(g.intersects(m) and base+q['lo']<=lo+.05 and base+q['hi']>=hi-.05 for g,q in solid):continue
    faces.extend([p[0],ys[0][0],p[1],r[0],ys[0][1],r[1],r[0],ys[1][1],r[1],p[0],ys[0][0],p[1],r[0],ys[1][1],r[1],p[0],ys[1][0],p[1]])
N['junction28']['gradeFaces']=faces

# Ground-owned landing tops are emitted by the terrain mesh; stair treads by the dedicated model.
(R/'dist/data/walk.json').write_text(json.dumps(N,ensure_ascii=False,separators=(',',':')))
qa=[]
for id,nodes in routes.items():
 if id=='left-roof-final':continue
 qa.append({'zone':'표시28','road':id,'coords':[wp(a,d)for a,d,y,w in nodes],'startFeet':base+nodes[0][2],'endFeet':base+nodes[-1][2]})
for id,nodes in {
 'roof28-upper-ribbon':[[41,-44,7],[60,-44,7],[100,-44,7],[122,-44,7]],
 'bridge28-lower-passage':[[0,-20,0],[40,-20,0],[58,-20,0],[100,-20,0],[145,-20,0]],
 'bridge28-upper':[[58,-13,7],[58,-25,7],[58,-40,7],[58,-44,7]],
 'front28-apron':[[25,134,0],[35,130,0],[105,130,0],[118,123,0]],
 'front28-garden-side':[[29,131,0],[29,116,0],[29,93,0]],
}.items():qa.append({'zone':'접속28','road':id,'coords':[wp(a,d)for a,d,y in nodes],'startFeet':base+nodes[0][2],'endFeet':base+nodes[-1][2]})
(R/'dist/data/qa28-routes.json').write_text(json.dumps(qa,ensure_ascii=False,indent=2))
(R/'BUILD28-JUNCTIONS.json').write_text(json.dumps({'base':base,'patches':len(patches),'routes':{k:v for k,v in routes.items()},'removedStaleGroundFaces':len(json.loads((B/'data/walk.json').read_text()).get('designGround23',[]))-len(N['designGround23']),'scope':'red marks only','dimensions':'design estimates, not survey'},ensure_ascii=False,indent=2))
print('patches',len(patches),'surfaces',len(surfaces),'walking routes',len(qa))
