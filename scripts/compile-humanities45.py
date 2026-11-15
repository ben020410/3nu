"""BUILD45: replace only the humanities wedge, shared render/physical float32 triangles."""
from pathlib import Path
import gzip,json,math,subprocess,numpy as np,mapbox_earcut as E
from shapely.geometry import Polygon,Point,LineString,box
from shapely.ops import unary_union
from shapely.strtree import STRtree
R=Path(__file__).resolve().parents[1];O=R/'dist/data';S=R/'sources/humanities45';BASE='0e7c70bfa58b5d32833421d94e1cad00af11b435';source=lambda n:subprocess.check_output(['git','show',BASE+':dist/data/'+n],cwd=R)
D=json.loads((S/'bindings.json').read_text());F=D['frame'];origin=np.array(F['origin']);U=np.array(F['u']);V=np.array(F['v']);base=F['base'];world=lambda a,d:origin+U*a+V*d;local=lambda p:(np.array(p)-origin)@np.array([U,V]).T
meta=json.loads(source('ground.json'));P=np.frombuffer(source('ground.bin'),dtype='<f4');I=np.frombuffer(source('ground-indices.bin'),dtype='<u4');PR=np.frombuffer(gzip.decompress((S/'render-ground44.bin.gz').read_bytes()),dtype='<f4');old43=json.loads(source('finish43.json'));oldzone=Polygon(old43['zones'][1]['outer']);stair=D['stair']
# The only added ownership is the junction directly before the retained first stair.
extension=Polygon([world(a,d)for a,d in [(118.5,62),(128.5,62),(133,70),(118,73)]]);buildings=unary_union([Polygon(b['p'])for b in D['buildings']]);mask=unary_union([oldzone,extension]).difference(buildings)
def parts(g):
 if g.geom_type=='Polygon':
  if g.area>1e-8:yield g
 else:
  for q in getattr(g,'geoms',[]):yield from parts(q)
def tris(g):
 for p in parts(g):
  rings=[list(p.exterior.coords)[:-1]]+[list(h.coords)[:-1]for h in p.interiors];v=np.array([q for rr in rings for q in rr]);ix=E.triangulate_float64(v,np.cumsum([len(rr)for rr in rings],dtype=np.uint32))
  for k in range(0,len(ix),3):yield v[ix[k:k+3]]
def pack(p):return {'outer':list(p.exterior.coords)[:-1],'holes':[list(r.coords)[:-1]for r in p.interiors]}
pol=[];planes=[];reference=mask.buffer(4);roadAreas=[]
for c in meta['chunks']:
 pp=PR[c['offset']:c['offset']+c['count']*3].reshape(-1,3);idx=I[c['indexOffset']:c['indexOffset']+c['indexCount']]
 if not len(pp)or not box(pp[:,0].min(),pp[:,2].min(),pp[:,0].max(),pp[:,2].max()).intersects(reference):continue
 for t in pp[idx.reshape(-1,3)].astype(float):
  p=Polygon(t[:,[0,2]])
  if p.area<1e-8 or not p.intersects(reference):continue
  pol.append(p);planes.append(np.linalg.solve(np.c_[t[:,0],t[:,2],np.ones(3)],t[:,1]))
  if c['kind']=='road':roadAreas.append(p)
road=unary_union(roadAreas);mask=mask.difference(road);tree=STRtree(pol)
def old(x,z):
 p=Point(x,z);hits=[i for i in tree.query(p.buffer(1e-5))if pol[i].buffer(1e-5).covers(p)]
 if not hits:hits=[tree.nearest(p)]
 return float(np.mean([planes[i]@[x,z,1]for i in hits]))
def ease(x):x=np.clip(x,0,1);return x*x*(3-2*x)
# Curved route stays clear of the wall. A side spur preserves the existing search approach.
nodes=np.array([[111,139],[112,133],[126,128],[134,121],[141,109],[150,89],[152,82],[148,76],[138,71],[129,69],[123.5,67],[123.5,62]],float)
def curve(ps):
 q=np.vstack([ps[0],ps,ps[-1]]);out=[]
 for i in range(1,len(q)-2):
  p0,p1,p2,p3=q[i-1:i+3]
  for t in np.linspace(0,1,10,endpoint=False):out.append(.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t**3))
 return np.array(out+[ps[-1]])
route=curve(nodes);routeW=np.array([world(*p)for p in route]);line=LineString(routeW);anchor=np.array(D['anchor']['ad']);spur=LineString([world(144,102),world(*anchor)]);pad=Point(*world(*anchor)).buffer(3.6,resolution=20);landing=Polygon([world(a,d)for a,d in [(118.5,62),(128.5,62),(129,68.5),(126,73),(119,71)]])
stone=unary_union([line.buffer(2.05,resolution=16),spur.buffer(2.0,resolution=16),pad,landing,Polygon([world(a,d)for a,d in [(106,68),(118.5,62),(128.5,62),(165,68),(165,75),(151,77),(138,74),(120,76),(106,77)]])]).intersection(mask);green=mask.difference(stone)
# New independent longitudinal route grade: actual A edge, current approach anchor, retained first step.
ha=old(*world(111,137));hb=D['anchor']['model_binding_elevation'];hc=base+stair['lo'];lengths=np.r_[0,np.cumsum(np.linalg.norm(np.diff(routeW,axis=0),axis=1))];bS=line.project(Point(*world(144,102)));aS=line.project(Point(*world(111,137)));cS=line.project(Point(*world(123.5,67)))
def routeY(s):
 if s<=aS:return ha
 if s<=bS:return ha+(hb-ha)*float(ease((s-aS)/(bS-aS)))
 if s<=cS:return hb+(hc-hb)*float(ease((s-bS)/(cS-bS)))
 return hc
# Field is solved from retained external boundary + the new route, never seeded by old interior paving.
step=.65;aa=np.arange(106.6,165.61,step);dd=np.arange(61.5,138.51,step);HH=np.zeros((len(dd),len(aa)));free=np.zeros_like(HH,dtype=bool)
for j,d in enumerate(dd):
 for i,a in enumerate(aa):
  x,z=world(a,d);p=Point(x,z);dist=p.distance(mask.boundary)
  if not mask.contains(p)or dist<.9:HH[j,i]=old(x,z)
  elif stone.buffer(.05).contains(p):HH[j,i]=hb if p.distance(spur)<2 or p.distance(Point(*world(*anchor)))<3.6 else routeY(line.project(p))
  else:HH[j,i]=ha+(hc-ha)*(137-d)/75;free[j,i]=True
for iteration in range(5000):
 avg=(HH[:-2,1:-1]+HH[2:,1:-1]+HH[1:-1,:-2]+HH[1:-1,2:])*.25;delta=np.where(free[1:-1,1:-1],avg-HH[1:-1,1:-1],0);HH[1:-1,1:-1]+=delta
 if abs(delta).max()<1e-5:break
print('height field',iteration,flush=True)
def field(a,d):
 u=np.clip((a-aa[0])/step,0,len(aa)-1.00001);v=np.clip((d-dd[0])/step,0,len(dd)-1.00001);i=int(u);j=int(v);u-=i;v-=j;return HH[j,i]*(1-u)*(1-v)+HH[j,i+1]*u*(1-v)+HH[j+1,i]*(1-u)*v+HH[j+1,i+1]*u*v
cache={}
def height(x,z):
 key=(round(x,6),round(z,6))
 if key in cache:return cache[key]
 p=Point(x,z);a,d=local([x,z]);dist=p.distance(mask.boundary);h=field(a,d)
 if stone.covers(p):h=hb if p.distance(spur)<2.001 or p.distance(Point(*world(*anchor)))<3.601 else routeY(line.project(p))
 else:
  # Broad shallow planted rise, fades continuously to all walking edges.
  h+=.85*math.exp(-((a-124)/18)**2-((d-103)/26)**2)*float(ease(p.distance(stone)/5))*float(ease(dist/5))
 w=float(ease(dist/1.2));h=old(x,z)*(1-w)+h*w if w<1 else h;cache[key]=h;return h
out=[];ix=[];chunks=[];removed=0
# Keep all outside geometry and height formulas. Cut only the owning mask from every old partition.
def emit(g,fn,ps,ii):
 for tt in tris(g):
  vs=np.array([[x,fn(x,z),z]for x,z in tt],dtype='<f4');cr=np.cross(vs[1]-vs[0],vs[2]-vs[0]);
  if np.linalg.norm(cr)<1e-7:continue
  if cr[1]>0:vs=vs[[0,2,1]]
  o=len(ps)//3;ps.extend(vs.flatten());ii.extend([o,o+1,o+2])
for c in meta['chunks']:
 pp=P[c['offset']:c['offset']+c['count']*3].reshape(-1,3);idx=I[c['indexOffset']:c['indexOffset']+c['indexCount']];ps=[];ii=[]
 if not len(pp)or not box(pp[:,0].min(),pp[:,2].min(),pp[:,0].max(),pp[:,2].max()).intersects(mask):ps=pp.flatten().tolist();ii=idx.tolist()
 else:
  for t in pp[idx.reshape(-1,3)].astype(float):
   p=Polygon(t[:,[0,2]])
   if p.area<1e-8 or not p.intersects(mask)or p.intersection(mask).area<1e-7:o=len(ps)//3;ps.extend(t.flatten());ii.extend([o,o+1,o+2]);continue
   plane=np.linalg.solve(np.c_[t[:,0],t[:,2],np.ones(3)],t[:,1]);emit(p.difference(mask),lambda x,z:plane@[x,z,1],ps,ii);removed+=1
 q=dict(c);q.update(offset=len(out),count=len(ps)//3,indexOffset=len(ix),indexCount=len(ii));chunks.append(q);out+=ps;ix+=ii
physical=[];areas={}
for area,kind in [(stone,'finishStone45'),(green,'finishGrass45')]:
 ps=[];ii=[];xmin,zmin,xmax,zmax=area.bounds
 for x in np.arange(math.floor(xmin),xmax,1.0):
  for z in np.arange(math.floor(zmin),zmax,1.0):
   g=area.intersection(box(x,z,x+1,z+1))
   if g.area>1e-8:emit(g,height,ps,ii)
 pts,inv=np.unique(np.array(ps,dtype='<f4').reshape(-1,3),axis=0,return_inverse=True);ids=inv[np.array(ii)].reshape(-1,3);tt=pts[ids];cross=np.cross(tt[:,1]-tt[:,0],tt[:,2]-tt[:,0]);ids[cross[:,1]>0]=ids[cross[:,1]>0][:,[0,2,1]];ids=ids[np.linalg.norm(cross,axis=1)>1e-7];physical.extend(pts[ids].astype(float).tolist());ps=pts.flatten().tolist();ii=ids.flatten().tolist();chunks.append({'x':'humanities45','z':0,'kind':kind,'offset':len(out),'count':len(ps)//3,'indexOffset':len(ix),'indexCount':len(ii)});out+=ps;ix+=ii;areas[kind]=area.area
# Remove old BUILD43 walk triangles from exactly the same region, clipping boundary triangles.
kept=[]
for tt in old43['triangles']:
 t=np.array(tt);p=Polygon(t[:,[0,2]])
 if not p.intersects(mask):kept.append(tt);continue
 if p.area<1e-8:continue
 c1=np.linalg.solve(np.c_[t[:,0],t[:,2],np.ones(3)],t[:,1]);c3=np.linalg.solve(np.c_[t[:,0],t[:,2],np.ones(3)],t[:,3]);
 for q in tris(p.difference(mask)):kept.append([[float(x),float(c1@[x,z,1]),float(z),float(c3@[x,z,1])]for x,z in q])
old43['triangles']=kept;old43['zones']=[pack(p)for q in old43['zones']for p in parts(Polygon(q['outer'],q.get('holes',[])).difference(mask))]
# Sparse tree positions are chosen away from path crowns and all mouths.
trees=[]
for i,(a,d,h)in enumerate([(119,119,5.2),(128,111,6.2),(130,94,6.6),(120,85,4.9),(120,103,5.3)]):
 x,z=world(a,d);p=Point(x,z)
 if green.contains(p)and p.distance(stone)>3.4:trees.append({'id':f'humanities45-tree-{i}','x':float(x),'z':float(z),'y':height(x,z),'height':h,'radius':.2,'crown':h*.34})
boundary=[]
for q in parts(mask):
 ring=LineString(q.exterior.coords)
 for t in np.arange(0,ring.length,.8):
  p=ring.interpolate(t);boundary.append({'xz':[p.x,p.y],'modelY':old(p.x,p.y),'afterY':height(p.x,p.y),'trueY':None})
spec={'revision':'humanities45-r1','baselineCommit':BASE,'zones':[pack(p)for p in parts(mask)],'triangles':physical,'trees':trees,'frame':F,'route':routeW.tolist(),'routeAD':route.tolist(),'anchor':D['anchor'],'stair':{'id':stair['id'],'modelBindingY':hc,'trueY':None},'boundary':boundary,'areas':areas,'removedRenderTriangles':removed,'oldPhysicalTrianglesRemoved':len(json.loads(source('finish43.json'))['triangles'])-len(kept),'notes':['No visible door exists in current building1 renderer; existing search access point retained; no new door.','Interior harmonic field constrained only by retained boundary and independent new route heights, with shallow green rise.','True surveyed heights unknown.']}
np.array(out,dtype='<f4').tofile(O/'ground.bin');np.array(ix,dtype='<u4').tofile(O/'ground-indices.bin');meta.update(chunks=chunks,revision='BUILD45-humanities-repair',vertices=len(out)//3,triangles=len(ix)//3);(O/'ground.json').write_text(json.dumps(meta,separators=(',',':')));(O/'finish43.json').write_text(json.dumps(old43,separators=(',',':')));(O/'humanities45.json').write_text(json.dumps(spec,separators=(',',':')));print('compiled',areas,'trees',len(trees),'tris',len(physical),'removed',removed,flush=True)
