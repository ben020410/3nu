"""R2 pond-only replacement. Fixed BUILD46 input; never reruns other facility generators."""
from pathlib import Path
import json,math,random,subprocess,gzip
import numpy as np,mapbox_earcut as ear
from shapely.geometry import Polygon,Point,LineString,box
from shapely.ops import unary_union
R=Path(__file__).resolve().parents[1];W=R/'sources/jahayeon47';BASE='9950c323b608107e36f95298d39d92b6adf5d06a'
def original(name):return subprocess.check_output(['git','show',BASE+':'+name],cwd=R)
# Geometry primitives only; the BUILD44 entry point is deliberately excluded.
exec(original('scripts/compile-landmark44.py').decode().split('# BUILD44: authored geometry')[0].replace("R=Path(__file__).resolve().parents[1];W=R/'sources/landmark44'",''))
J=json.loads((W/'layout-ratios.json').read_text());old=json.loads(original('dist/data/landmark44.json'));models=[]
samples=json.loads(gzip.decompress((W/'terrain-samples.json.gz').read_bytes()));heights={(round(x*4),round(z*4)):h for x,z,h in samples}
def ground(x,z):
 u=x*4;v=z*4;i=math.floor(u);j=math.floor(v);a=u-i;b=v-j
 return (1-a)*(1-b)*heights[i,j]+a*(1-b)*heights[i+1,j]+(1-a)*b*heights[i,j+1]+a*b*heights[i+1,j+1]
rng=random.Random(47)
def rock(m,x,z,h,rx,rz,ry,mat,angular=False):
 n=7 if angular else 9;rings=[];angle=rng.random()*math.tau
 for j in range(5):
  lat=-math.pi/2+math.pi*j/4
  rings.append([[x+rx*math.cos(lat)*math.cos(i*math.tau/n+angle)*(1+rng.uniform(-.13,.13)),z+rz*math.cos(lat)*math.sin(i*math.tau/n+angle)*(1+rng.uniform(-.13,.13)),h+ry*math.sin(lat)]for i in range(n)])
 for j in range(4):
  for i in range(n):m.face([rings[j][i],rings[j][(i+1)%n],rings[j+1][(i+1)%n],rings[j+1][i]],mat)
def tube(m,points,radius,mat,sides=6):
 rings=[]
 for i,p in enumerate(points):
  t=np.array(points[min(i+1,len(points)-1)])-points[max(0,i-1)];t=t/np.linalg.norm(t);ref=np.array([0,0,1]) if abs(t[2])<.9 else np.array([1,0,0]);a=np.cross(t,ref);a=a/np.linalg.norm(a);b=np.cross(t,a)
  rings.append([np.array(p)+radius*(math.cos(k*math.tau/sides)*a+math.sin(k*math.tau/sides)*b) for k in range(sides)])
 for i in range(len(rings)-1):
  for k in range(sides):m.face([rings[i][k],rings[i][(k+1)%sides],rings[i+1][(k+1)%sides],rings[i+1][k]],mat)
# F-R2: world coordinates, terrain-derived footing. Full old set is replaced below.
f=J['elements']['F'];n=f['frontNormalWorldXZ'];o=f['centerWorldXZ'];datum=ground(*o);m=Model('memorial','jahayon',o,[-n[1],n[0]],[-n[0],-n[1]],datum)
plinth=box(-1.69,-1.06,1.69,1.06);cs=coords(plinth);footings=[]
for q in cs:
 p=m.pt(*q,0);footings.append(ground(p[0],p[2])-datum)
top=max(.254,max(footings)+.13);lift=top-.254
m.plane(plinth,lambda x,z:(x,z,top),'granite')
for i,(a,b) in enumerate(zip(cs,cs[1:]+cs[:1])):m.face([[*a,footings[i]-.06],[*b,footings[(i+1)%4]-.06],[*b,top],[*a,top]],'granite')
m.volume(plinth,min(footings)-.06,top)
# Rounded, bevelled body with a real flat mounting face for the three panels.
outline=[[-1.48,-.48],[-1.23,-.8],[1.23,-.8],[1.48,-.48],[1.43,.4],[1.05,.76],[-1.05,.76],[-1.43,.4]]
rings=[[[x*k,z*k,h+lift]for x,z in outline]for k,h in [(.79,.28),(1,.43),(1,1.23),(.66,1.55)]]
for lower,upper in zip(rings,rings[1:]):
 for j in range(8):m.face([lower[j],lower[(j+1)%8],upper[(j+1)%8],upper[j]],'granite')
m.face(rings[-1],'granite');m.volume(box(-1.45,-.8,1.45,.8),.25+lift,1.6+lift)
for i in range(3):m.cube(-1.205+i*.81,-.84,.46+lift,.77,.06,.73,'bronze' if i==0 else 'panelStone')
m.slab(box(-.26,-.22,.26,.22),1.48+lift,1.58+lift,'bronze')
for x in [-.1,.1]:m.cube(x-.055,-.08,1.58+lift,.11,.18,.22,'bronze')
for j in range(10):
 a=j*math.tau/10;b=(j+1)*math.tau/10;m.face([[.24*math.cos(a),.18*math.sin(a),1.75+lift],[.24*math.cos(b),.18*math.sin(b),1.75+lift],[.15*math.cos(b),.11*math.sin(b),2.2+lift],[.15*math.cos(a),.11*math.sin(a),2.2+lift]],'bronze')
rock(m,0,0,2.31+lift,.10,.10,.13,'bronze');m.cube(-.15,-.12,2.4+lift,.3,.24,.055,'bronze');m.beam([-.15,0,2.15+lift],[-.22,-.13,1.91+lift],.1,'bronze');m.beam([.15,0,2.15+lift],[.2,-.17,1.99+lift],.1,'bronze');m.finish()
# Only expand B1 landward. Existing road/plaza surfaces are not regraded.
deckPolys=[J['elements'][k]['polygonWorldXZ'] for k in ['B1','B2']];extension=Polygon(deckPolys[0]).difference(Polygon(old['deckPolygons'][0]));assert extension.intersection(Polygon(J['baseline']['originalOuterWorldXZ'])).area<1e-7
meta=json.loads(original('dist/data/ground.json'));raw=np.frombuffer(original('dist/data/ground.bin'),dtype='<f4');render=np.frombuffer(gzip.decompress((W/'render46.bin.gz').read_bytes()),dtype='<f4');indices=np.frombuffer(original('dist/data/ground-indices.bin'),dtype='<u4');outP=[];outI=[];po=io=0;changed=[];extraTriangles=[];cutArea=0
exbounds=extension.bounds
for ci,c in enumerate(meta['chunks']):
 p=raw[c['offset']:c['offset']+c['count']*3].reshape(-1,3);rp=render[c['offset']:c['offset']+c['count']*3].reshape(-1,3);ix=indices[c['indexOffset']:c['indexOffset']+c['indexCount']].reshape(-1,3)
 bbox=box(float(p[:,0].min()),float(p[:,2].min()),float(p[:,0].max()),float(p[:,2].max()))
 touched=False
 if bbox.intersects(extension):
  nparts=[];nix=[];lookup={}
  def emit(tri):
   ids=[]
   for v in tri:
    v=tuple(float(q)for q in np.float32(v));k=v
    if k not in lookup:lookup[k]=len(nparts);nparts.append(v)
    ids.append(lookup[k])
   nix.append(ids)
  for ids in ix:
   t=rp[ids];xz=t[:,[0,2]];poly=Polygon(xz)
   if not poly.is_valid or poly.area<1e-9 or not poly.intersects(extension):emit(t);continue
   overlap=poly.intersection(extension)
   if overlap.area<1e-9:emit(t);continue
   assert c['kind'] not in ['road','pondWater44','water'],c['kind']
   touched=True;cutArea+=overlap.area
   # Both sides of the partition use the identical original rendered triangle plane.
   A=np.array([[v[0],v[2],1] for v in t]);coef=np.linalg.solve(A,t[:,1])
   def triangles(shape):
    for part in polys(shape):
     if part.area<1e-10:continue
     rings=[list(part.exterior.coords)[:-1]]+[list(q.coords)[:-1]for q in part.interiors];vs=np.array([q for r in rings for q in r],dtype=np.float64);ii=ear.triangulate_float64(vs,np.cumsum([len(r)for r in rings],dtype=np.uint32))
     for k in range(0,len(ii),3):yield [[float(x),float(coef@[x,z,1]),float(z)]for x,z in vs[ii[k:k+3]]]
   for tri in triangles(poly.difference(extension)):emit(tri)
   extraTriangles.extend(list(triangles(overlap)))
  if touched:
   p=np.array(nparts,dtype='<f4');ix=np.array(nix,dtype='<u4');c['baked46']=True;c['partition47']='B1 landward extension';changed.append({'chunk':ci,'kind':c['kind']})
 c.update(offset=po,count=len(p),indexOffset=io,indexCount=ix.size);outP.append(p.reshape(-1));outI.append(ix.reshape(-1));po+=p.size;io+=ix.size
assert abs(cutArea-extension.area)<.002,(cutArea,extension.area)
P=np.concatenate(outP).astype('<f4');I=np.concatenate(outI).astype('<u4');meta.update(bytes=P.nbytes+I.nbytes,vertices=len(P)//3,triangles=len(I)//3,revision='junction46-r1+jahayeon47-r2',jahayeon47={'extensionArea':extension.area,'removedGroundArea':cutArea,'changedChunks':changed,'boundaryHeights':'unchanged original rendered triangle planes'})
(R/'dist/data/ground.bin').write_bytes(P.tobytes());(R/'dist/data/ground-indices.bin').write_bytes(I.tobytes());(R/'dist/data/ground.json').write_text(json.dumps(meta,separators=(',',':')))
# Keep old deck samples, then append the exact extension surface. No overlapping underlying ground.
deckTriangles=old['deckTriangles']+extraTriangles
m=Model('pond','jahayon',[0,0],[1,0],[0,1],0)
for t in deckTriangles:m.face([[p[0],p[2],p[1]]for p in t],'pond47timber')
def deckY(x,z):
 for t in deckTriangles:
  a,b,c=t;d=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2])
  if abs(d)<1e-10:continue
  u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/d;v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/d
  if min(u,v,1-u-v)>-.0001:return u*a[1]+v*b[1]+(1-u-v)*c[1]
 return ground(x,z)
# Texture coordinates follow each deck's longitudinal board direction, no separate slat meshes.
g=m.groups['pond47timber'];g['uvs']=[]
for x,y,z in np.array(g['positions']).reshape(-1,3):g['uvs'] += [x*.609+z*.793,-x*.793+z*.609]
for key,poly in zip(['B1','B2'],deckPolys):
 cs=poly
 for a,b in zip(cs,cs[1:]+cs[:1]):
  count=max(1,math.ceil(math.dist(a,b)/.4))
  for i in range(count):
   p=[a[k]+(b[k]-a[k])*i/count for k in range(2)];q=[a[k]+(b[k]-a[k])*(i+1)/count for k in range(2)];yp=deckY(*p);yq=deckY(*q);m.face([[*p,yp-.18],[*q,yq-.18],[*q,yq],[*p,yp]],'timberEdge')
 water=J['elements'][key]['waterEdgeWorldXZ']
 # The retained deck sits above water: close its exposed shore abutment below the thin timber edge.
 for a,b in zip(water,water[1:]):
  count=max(1,math.ceil(math.dist(a,b)/.4))
  for i in range(count):
   p=[a[k]+(b[k]-a[k])*i/count for k in range(2)];q=[a[k]+(b[k]-a[k])*(i+1)/count for k in range(2)];yp=deckY(*p);yq=deckY(*q)
   m.face([[*p,88.50926319928778],[*q,88.50926319928778],[*q,yq-.18],[*p,yp-.18]],'rock2')
 for edge,(a,b) in enumerate(zip(water,water[1:])):
  count=math.ceil(math.dist(a,b)/2.5)
  for i in range(count):
   p=[a[k]+(b[k]-a[k])*i/count for k in range(2)];q=[a[k]+(b[k]-a[k])*(i+1)/count for k in range(2)];yp=deckY(*p);yq=deckY(*q)
   for r,y in [(p,yp)]+([(q,yq)] if i==count-1 else []):tube(m,[[*r,y],[*r,y+.95]],.085,'timberEdge',8)
   for H in [.48,.9]:tube(m,[[p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t,yp+(yq-yp)*t+H-.16*4*t*(1-t)]for t in np.linspace(0,1,9)],.0175,'rope',5)
   m.solids.append({'id':f'{key}-rope47-{edge}-{i}','p':m.polyworld(LineString([p,q]).buffer(.045)),'lo':min(yp,yq),'hi':max(yp,yq)+1,'hidden':True,'landmark44':True,'rail37':{'a':p,'b':q,'y0':yp,'y1':yq}})
pond=Polygon(J['baseline']['originalOuterWorldXZ']);bank=coords(pond);B=88.65926319928778;decks=unary_union([Polygon(p)for p in deckPolys]);plantCount=0;stoneCount=0
# Irregular supporting masonry on high ground; broad, low shoreline stones elsewhere.
for e,(a,b) in enumerate(zip(bank,bank[1:]+bank[:1])):
 length=math.dist(a,b);dx=(b[0]-a[0])/length;dz=(b[1]-a[1])/length;nx=dz;nz=-dx
 if pond.contains(Point((a[0]+b[0])/2+nx*.2,(a[1]+b[1])/2+nz*.2)):nx=-nx;nz=-nz
 # Close the real soil cut behind the masonry; stones are not used to hide an open terrain edge.
 for k in range(math.ceil(length/.4)):
  t0=k/math.ceil(length/.4);t1=(k+1)/math.ceil(length/.4);p=[a[j]+(b[j]-a[j])*t0 for j in range(2)];q=[a[j]+(b[j]-a[j])*t1 for j in range(2)]
  if Point((p[0]+q[0])/2,(p[1]+q[1])/2).distance(decks)<.12:continue
  y0=ground(p[0]+nx*.05,p[1]+nz*.05);y1=ground(q[0]+nx*.05,q[1]+nz*.05)
  if max(y0,y1)>B+.18:m.face([[*p,B-.15],[*q,B-.15],[*q,y1],[*p,y0]],'rock2')
 s=.15
 while s<length:
  x=a[0]+dx*s;z=a[1]+dz*s;rx=rng.uniform(.42,.72);rz=rng.uniform(.32,.52);s+=rx*1.5
  if Point(x,z).distance(decks)<.65:continue
  yy=ground(x+nx*.3,z+nz*.3);height=max(.25,yy-B+.2);rows=max(1,math.ceil(height/.56));rowH=height/rows
  for row in range(rows):
   xx=x+dx*rng.uniform(-.15,.15);zz=z+dz*rng.uniform(-.15,.15);rock(m,xx,zz,B+rowH*(row+.48)-.04,rx,rz,rowH*.61,'rock'+str(rng.randrange(3)),height>1);stoneCount+=1
  # Sparse plants on the dry top of supporting bank, not on access openings.
  if e in [1,2,3] and rng.random()<.36:
   xx=x+nx*.85;zz=z+nz*.85
   if Point(xx,zz).distance(decks)>1 and math.hypot(xx-o[0],zz-o[1])>3.5:
    gy=ground(xx,zz);rock(m,xx,zz,gy+.24,.48,.4,.32,'pond47low');plantCount+=1
# Layered planting confined to the rear/left dry banks; the front lawn stays open.
trees=[(23.8,195.8,5.3),(30.8,184.8,6.7),(29.9,175.4,5.8),(25.2,164.7,6.6),(14.8,165.0,4.7),(7.0,171.0,5.7)]
for ti,(x,z,h) in enumerate(trees):
 yy=ground(x,z);tube(m,[[x,z,yy],[x+.12,z-.08,yy+h*.65]],.13 if ti%2 else .17,'bark',7);m.volume(Point(x,z).buffer(.20),yy,yy+h*.65)
 for j in range(5):
  a=j*2.4+ti;r=.7+j%3*.5;y=yy+h*.57+(j%3)*.6;xx=x+math.cos(a)*r;zz=z+math.sin(a)*r;tube(m,[[x+.08,z,yy+h*.35],[xx,zz,y]],.065,'bark',5)
  rock(m,xx,zz,y+.35,1.55 if ti%2 else 1.85,1.25,.68 if ti%2 else .52,'pond47leaf'+str(j%2))
for x,z in [(26.6,191.9),(28.5,188),(31.5,179),(27.6,169),(21.5,164),(11,168.6),(4.5,174.0)]:
 for j in range(4):
  xx=x+math.sin(j*2.4)*.65;zz=z+math.cos(j*2.4)*.65;yy=ground(xx,zz);rock(m,xx,zz,yy+.37,.7,.58,.49,'pond47low' if j%2 else 'pond47leaf1');plantCount+=1
# Continuous low jets meet a subtle foam centre and broken ripple arcs; two existing centres only.
for x,z in J['elements']['D']['centersWorldXZ']:
 for j in range(18):
  a=j*math.tau/18;radius=1.65+.22*math.sin(j*2.4);h=.65+.22*(j%3)/2
  tube(m,[[x+math.cos(a)*radius*t,z+math.sin(a)*radius*t,B+.035+h*4*t*(1-t)]for t in np.linspace(0,1,13)],.021,'pond47spray',5)
 for j in range(9):
  a=j*2.4;r=.12+.035*j;rock(m,x+math.cos(a)*r,z+math.sin(a)*r,B+.035,.08,.055,.028,'pond47foam')
 for rad in [1.75,2.25,2.8]:
  for j in range(5):
   start=j*math.tau/5+.1*rad;tube(m,[[x+rad*math.cos(a),z+rad*math.sin(a),B+.012]for a in np.linspace(start,start+.75,9)],.009,'ripple',4)
m.finish()
old['models']=[next(q for q in models if q['number']==m['number'])if m['number'] in ['pond','memorial']else m for m in old['models']];old.update(revision='jahayeon47-r2',pond=J,deckTriangles=deckTriangles,deckPolygons=deckPolys)
old['audit47']={'baselineCommit':BASE,'memorial':{'worldXZ':o,'terrainDatum':datum,'cornerTerrain':[datum+h for h in footings],'plinthTop':datum+top,'oldWorldXZRetired':J['supersedes']['oldFWorldXZ'],'panels':3,'standingFigures':1},'deckDepthRatio':.168,'waterEdgePreserved':True,'extensionArea':extension.area,'groundCutArea':cutArea,'stoneCount':stoneCount,'treeCount':len(trees),'lowPlantCount':plantCount,'fountainCenters':J['elements']['D']['centersWorldXZ'],'unchanged':['pond outer','water height','roads','plazas','BUILD46 junctions','other facility models']}
(R/'dist/data/landmark44.json').write_text(json.dumps(old,separators=(',',':')))
print(json.dumps(old['audit47'],indent=2));print([(m['number'],sum(len(g['indices'])//3 for g in m['groups'].values()))for m in models])
