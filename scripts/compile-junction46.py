from pathlib import Path
import json,math,gzip,subprocess,numpy as np,mapbox_earcut as E
from shapely.geometry import Polygon,Point,LineString,box
from shapely.ops import unary_union
from shapely.strtree import STRtree
R=Path(__file__).resolve().parents[1];W=R/'sources/junction46';O=R/'dist/data';BASE='00772dd4f196ff17c488d17ad276c23b752081e9';src=lambda n:subprocess.check_output(['git','show',BASE+':dist/data/'+n],cwd=R)
D=json.load(open(W/'bindings.json'));F=D['frame'];origin=np.array(F['origin']);U=np.array(F['u']);V=np.array(F['v']);base=F['base'];world=lambda a,d:origin+U*a+V*d;local=lambda p:(np.array(p)-origin)@np.array([U,V]).T
poly=lambda ps:Polygon([world(*p)for p in ps]);rect=lambda a,d,b,e:poly([(a,d),(b,d),(b,e),(a,e)])
buildings=unary_union([Polygon(b['p'])for b in D['buildings']]);one=Polygon(next(b for b in D['buildings']if b['id']=='167984624')['p']);protected=unary_union([Polygon(q['p'])for q in D['surfaces']if q.get('steps') or q.get('finish39')]);rawzones=[rect(123,114,153,144),rect(132,58,172,88)];zones=[p.difference(buildings).difference(protected)for p in rawzones];mask=unary_union(zones);meta=json.loads(src('ground.json'));P=np.frombuffer(src('ground.bin'),dtype='<f4');I=np.frombuffer(src('ground-indices.bin'),dtype='<u4');PR=np.frombuffer(gzip.decompress((W/'render45.bin.gz').read_bytes()),dtype='<f4');s45=json.loads(src('humanities45.json'));s43=json.loads(src('finish43.json'))
def parts(g):
 if g.geom_type=='Polygon':
  if g.area>1e-9:yield g
 else:
  for p in getattr(g,'geoms',[]):yield from parts(p)
def tris(g):
 for p in parts(g):
  rr=[list(p.exterior.coords)[:-1]]+[list(q.coords)[:-1]for q in p.interiors];v=np.array([q for ring in rr for q in ring]);ix=E.triangulate_float64(v,np.cumsum([len(r)for r in rr],dtype=np.uint32))
  for i in range(0,len(ix),3):yield v[ix[i:i+3]]
def pack(p):return {'outer':list(p.exterior.coords)[:-1],'holes':[list(q.coords)[:-1]for q in p.interiors]}
pol=[];plane=[];kinds=[];refs=mask.buffer(5)
for c in meta['chunks']:
 pp=PR[c['offset']:c['offset']+c['count']*3].reshape(-1,3);idx=I[c['indexOffset']:c['indexOffset']+c['indexCount']]
 if not len(pp)or not box(pp[:,0].min(),pp[:,2].min(),pp[:,0].max(),pp[:,2].max()).intersects(refs):continue
 for t in pp[idx.reshape(-1,3)].astype(float):
  p=Polygon(t[:,[0,2]])
  if p.area<1e-8 or not p.intersects(refs):continue
  pol.append(p);plane.append(np.linalg.solve(np.c_[t[:,0],t[:,2],np.ones(3)],t[:,1]));kinds.append(c['kind'])
tree=STRtree(pol)
def old(x,z):
 p=Point(x,z);ids=[j for j in tree.query(p.buffer(1e-5))if pol[j].buffer(1e-5).covers(p)]
 if not ids:ids=[tree.nearest(p)]
 return float(np.mean([plane[j]@[x,z,1]for j in ids]))
# Keep the curved BUILD45 material contours. Only the grey footpath terminal joins paving.
green=unary_union([p for p,k in zip(pol,kinds)if k.lower()in ['grass','lawn','planting','finishgrass43','finishgrass45','acrolawn39','acrograss43']]).intersection(mask);stone=mask.difference(green);road=unary_union([p for p,k in zip(pol,kinds)if k=='road']).intersection(mask).difference(rect(132,65,172,88));stone=stone.difference(road)
planter=rect(143.2,64,146.8,70);planterY=base+4.45
# The original facade datum/foundation remain unchanged, only external soil is relaxed.
fields=[]
for zi,(zone,raw)in enumerate(zip(zones,rawzones)):
 coords=np.array([local(p)for p in raw.exterior.coords]);a0,d0=coords.min(axis=0)-1;a1,d1=coords.max(axis=0)+1;step=.5;aa=np.arange(a0,a1+.01,step);dd=np.arange(d0,d1+.01,step);hh=np.zeros((len(dd),len(aa)));free=np.zeros_like(hh,dtype=bool)
 for j,d in enumerate(dd):
  for i,a in enumerate(aa):
   x,z=world(a,d);p=Point(x,z);hh[j,i]=old(x,z)
   if raw.contains(p)and p.distance(raw.boundary)>.6 and p.distance(protected)>.5:
    if zi==0 and p.distance(one)<.7:hh[j,i]=float(np.interp(d,[114,129,144],[92.2,91.55,92.3]))
    elif zi==1 and planter.buffer(.15).covers(p):hh[j,i]=planterY
    elif not buildings.contains(p):free[j,i]=True
 for it in range(5500):
  avg=(hh[:-2,1:-1]+hh[2:,1:-1]+hh[1:-1,:-2]+hh[1:-1,2:])*.25;delta=np.where(free[1:-1,1:-1],avg-hh[1:-1,1:-1],0);hh[1:-1,1:-1]+=delta
  if abs(delta).max()<1e-6:break
 fields.append((aa,dd,hh));print('field',zi,it,flush=True)
def ease(t):t=np.clip(t,0,1);return t*t*(3-2*t)
cache={}
def height(x,z):
 key=(round(x,6),round(z,6))
 if key in cache:return cache[key]
 p=Point(x,z);zi=0 if rawzones[0].buffer(.0001).covers(p)else 1;aa,dd,hh=fields[zi];a,d=local([x,z]);u=np.clip((a-aa[0])/.5,0,len(aa)-1.00001);v=np.clip((d-dd[0])/.5,0,len(dd)-1.00001);i=int(u);j=int(v);u-=i;v-=j;h=hh[j,i]*(1-u)*(1-v)+hh[j,i+1]*u*(1-v)+hh[j+1,i]*(1-u)*v+hh[j+1,i+1]*u*v
 if zi==1 and planter.buffer(.15).covers(p):h=planterY
 w=float(ease(p.distance(rawzones[zi].boundary)/1.0))*float(ease(p.distance(protected)/.7));h=old(x,z)*(1-w)+h*w;cache[key]=h;return h
out=[];outix=[];chunks=[];cutcount=0;restphys=[];newphys=[];frozen={}
def emit(g,fn,ps,ii,physics=None):
 for tt in tris(g):
  vs=np.array([[x,fn(x,z),z]for x,z in tt],dtype='<f4');cr=np.cross(vs[1]-vs[0],vs[2]-vs[0]);
  if np.linalg.norm(cr)<1e-7:continue
  if cr[1]>0:vs=vs[[0,2,1]]
  n=len(ps)//3;ps.extend(vs.flatten());ii.extend([n,n+1,n+2]);
  if physics is not None:physics.append(vs.astype(float).tolist())
def append(c,ps,ii):
 q=dict(c);q.update(offset=len(out),count=len(ps)//3,indexOffset=len(outix),indexCount=len(ii));chunks.append(q);out.extend(ps);outix.extend(ii)
# Unaffected triangles keep raw source + existing runtime behavior. Cut fragments use the
# already-rendered affine plane, marked baked46: nonlinear grading cannot reopen the seam.
for c in meta['chunks']:
 pp=P[c['offset']:c['offset']+c['count']*3].reshape(-1,3);pr=PR[c['offset']:c['offset']+c['count']*3].reshape(-1,3);idx=I[c['indexOffset']:c['indexOffset']+c['indexCount']];ps=[];ii=[]
 if not len(pp)or not box(pp[:,0].min(),pp[:,2].min(),pp[:,0].max(),pp[:,2].max()).intersects(mask):append(c,pp.flatten().tolist(),idx.tolist());continue
 for ids in idx.reshape(-1,3):
  t=pp[ids].astype(float);tr=pr[ids].astype(float);p=Polygon(tr[:,[0,2]])
  if p.area<1e-8 or p.intersection(mask).area<1e-7:n=len(ps)//3;ps.extend(tr.flatten());ii.extend([n,n+1,n+2]);continue
  cutcount+=1;eq=np.linalg.solve(np.c_[tr[:,0],tr[:,2],np.ones(3)],tr[:,1]);fp,fi=frozen.setdefault(c['kind'],([],[]));emit(p.difference(mask),lambda x,z:eq@[x,z,1],fp,fi,restphys)
 append({**c,'baked46':True},ps,ii)

for area,kind in [(stone,'finishStone45'),(green,'finishGrass45'),(road,'road')]:
 ps=[];ii=[];xmin,zmin,xmax,zmax=area.bounds
 for x in np.arange(math.floor(xmin),xmax,.65):
  for z in np.arange(math.floor(zmin),zmax,.65):
   g=area.intersection(box(x,z,x+.65,z+.65))
   if g.area>1e-8:
    if g.distance(mask.boundary)<1e-6:
     # Conform new seam vertices to every retained old triangle break.
     for k in tree.query(g):
      fragment=g.intersection(pol[k])
      if fragment.area>1e-8:emit(fragment,height,ps,ii,newphys)
    else:emit(g,height,ps,ii,newphys)
 append({'kind':kind,'x':'junction46','z':0,'baked46':True},ps,ii)
# Both sides share every boundary vertex, including old affine breaks and the fine grid.
nodes={}
for t in newphys:
 for v in t:
  if mask.boundary.distance(Point(v[0],v[2]))<.0001:nodes[(round(v[0],5),round(v[2],5))]=(v[0],v[2])
nodepoints=[Point(*p)for p in nodes.values()];ntree=STRtree(nodepoints);restphys=[]
for kind,(fps,fii)in frozen.items():
 ps=[];ii=[];arr=np.array(fps).reshape(-1,3)
 for ids in np.array(fii).reshape(-1,3):
  t=arr[ids];ring=[]
  for j in range(3):
   a=t[j];b=t[(j+1)%3];av=a[[0,2]];bv=b[[0,2]];edge=LineString([av,bv]);vv=bv-av;length=vv@vv;points=[(0,a)]
   if length>1e-10 and mask.boundary.distance(Point(*av))<.0001 and mask.boundary.distance(Point(*bv))<.0001:
    for k in ntree.query(edge.buffer(.0001)):
     q=np.array(nodepoints[k].coords[0]);fraction=(q-av)@vv/length
     if .00001<fraction<.99999 and edge.distance(nodepoints[k])<.0001:points.append((fraction,np.array([q[0],height(*q),q[1]])))
   for _,v in sorted(points,key=lambda p:p[0]):
    if mask.boundary.distance(Point(v[0],v[2]))<.0001:v=np.array([v[0],height(v[0],v[2]),v[2]])
    ring.append(v)
  center=t.mean(axis=0)
  for j in range(len(ring)):
   vs=np.array([center,ring[j],ring[(j+1)%len(ring)]],dtype='<f4')
   if Polygon(vs[:,[0,2]]).area<1e-8:continue
   if np.cross(vs[1]-vs[0],vs[2]-vs[0])[1]>0:vs=vs[[0,2,1]]
   n=len(ps)//3;ps.extend(vs.flatten());ii.extend([n,n+1,n+2]);restphys.append(vs.astype(float).tolist())
 append({'kind':kind,'x':'junction46-edge','z':0,'baked46':True},ps,ii)
physicalMask=unary_union([mask]+[Polygon(np.array(t)[:,[0,2]])for t in restphys])
# Replace both prior physical owners, keeping exterior triangles in their original planes.
def clipphysical(triangles,cols):
 kept=[]
 for tt in triangles:
  t=np.array(tt);p=Polygon(t[:,[0,2]])
  if p.area<1e-8:continue
  if p.intersection(physicalMask).area<1e-7:kept.append(tt);continue
  eqs=[np.linalg.solve(np.c_[t[:,0],t[:,2],np.ones(3)],t[:,c])for c in cols]
  for q in tris(p.difference(physicalMask)):
   kept.append([[float(x),float(eqs[0]@[x,z,1]),float(z)]+([float(eqs[1]@[x,z,1])]if len(eqs)>1 else [])for x,z in q])
 return kept
s45['triangles']=clipphysical(s45['triangles'],[1])+newphys
# Rest fragments near old non-owned ground also need exact physical sampling.
oldownership=unary_union([Polygon(q['outer'],q.get('holes',[]))for q in s45['zones']+s43['zones']]);outside=[]
for tt in restphys:
 t=np.array(tt);p=Polygon(t[:,[0,2]])
 if p.area<1e-8:continue
 eq=np.linalg.solve(np.c_[t[:,0],t[:,2],np.ones(3)],t[:,1]);ps=[];ii=[];emit(p.difference(buildings),lambda x,z:eq@[x,z,1],ps,ii,outside)
s45['triangles']+=outside;s45['zones']=[pack(p)for p in parts(unary_union([Polygon(q['outer'],q.get('holes',[]))for q in s45['zones']]+zones))];s45['revision']='junction46-r1';s45['retiredGradeZones']=[pack(p)for p in rawzones]+json.loads(src('humanities45.json'))['zones'];s45['fixedFoundation46']={'id':'167984624','base':87.95926319928778};s45['junction46']={'baseline':BASE,'zones':[pack(z)for z in zones],'cutTriangles':cutcount,'newTriangles':len(newphys),'frozenOutsideTriangles':len(restphys),'physicalOutsideTriangles':len(outside),'planter':{'ad':[145,67],'baseY':planterY},'note':'Only two local seams. Materials/paths retained; obsolete grade closures retired independently of current terrain owner.'}
s43['triangles']=clipphysical(s43['triangles'],[1,3]);s43['zones']=[pack(p)for q in s43['zones']for p in parts(Polygon(q['outer'],q.get('holes',[])).difference(mask))]
# Exact boundary model heights, without using the damaged interior as datum.
bound=[]
for zi,raw in enumerate(rawzones):
 ring=LineString(raw.exterior.coords)
 for t in np.arange(0,ring.length,.7):
  p=ring.interpolate(t)
  if not buildings.contains(p):bound.append({'zone':zi,'xz':[p.x,p.y],'before':old(p.x,p.y),'after':height(p.x,p.y)})
s45['junction46']['boundary']=bound
np.array(out,dtype='<f4').tofile(O/'ground.bin');np.array(outix,dtype='<u4').tofile(O/'ground-indices.bin');meta.update(chunks=chunks,revision='BUILD46-local-junction-repair',vertices=len(out)//3,triangles=len(outix)//3);(O/'ground.json').write_text(json.dumps(meta,separators=(',',':')));(O/'humanities45.json').write_text(json.dumps(s45,separators=(',',':')));(O/'finish43.json').write_text(json.dumps(s43,separators=(',',':')));print('done',cutcount,len(newphys),len(outside),flush=True)

import runpy
runpy.run_path(str(R/'scripts/weld-junction46.py'))
